import { readFile } from 'node:fs/promises'
import { type Level, writeContent } from '@automataframework/framework/headless'
import { afterEach, describe, expect, test } from 'vitest'
import { WORDS } from '#src/features/words/words.ts'
import { fixtureFiles, LEVEL_PATH } from '../fixtures/game/read.ts'
import {
  dragByTouch,
  gameMenuRows,
  type JourneyPage,
  levelPut,
  menuWords,
  openPage,
  pressPut,
  putThemIn,
  putWords,
  type SIZES,
  setupJourneys,
  signIn,
  teamWords,
  thingNamed,
} from '../fixtures/journey.ts'
import { type Site, startSite } from '../fixtures/serve.ts'

setupJourneys()

let journey: JourneyPage | undefined
afterEach(async () => {
  const found = (await journey?.problems()) ?? []
  await journey?.close()
  journey = undefined
  expect(found).toEqual([])
})
type Size = keyof typeof SIZES
const open = async (
  size: Size = 'ipadUpright',
  ...rest: [Parameters<typeof openPage>[1]?]
): Promise<JourneyPage> => {
  journey = await openPage(size, ...rest)
  return journey
}
const level1 = JSON.parse(fixtureFiles[LEVEL_PATH] ?? '') as Level
const moved = writeContent('level', {
  ...level1,
  things: level1.things.map((t) => ({ ...t, x: 8.5 })),
} as never)
const text = (j: JourneyPage, words: string) => j.page.getByText(words, { exact: false }).first().waitFor()
const crateX = (j: JourneyPage) => expect.poll(() => thingNamed(j.page, 'crate-1').getAttribute('data-x'))
const GAME = '#/game/grandma/crate-game'
// Everything but reading: the App asks GitHub for a token to read with, and that is a POST that writes nothing.
const wrote = (j: JourneyPage) =>
  j.fake.log.filter((r) => r.method !== 'GET' && !/access_tokens|login\/oauth/.test(r.path))

describe.each(['ipadUpright', 'phone'] as const)('at %s', (size) => {
  test('a visitor tries the example game: Welcome, Try it now, the level, a drag, and a copy on the device', async () => {
    const j = await open(size)
    await j.page.getByRole('button', { name: WORDS.tryIt }).click()
    await text(j, WORDS.visitorCan)
    await thingNamed(j.page, 'crate-1').waitFor()
    await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
    await pressPut(j.page)
    const download = j.page.waitForEvent('download')
    await j.page.getByRole('button', { name: menuWords.keepCopy('level-1') }).click()
    const file = await download
    expect(file.suggestedFilename()).toBe('level-1.json')
    const path = await file.path()
    expect(await readFile(path, 'utf8')).toBe(moved)
    await text(j, 'level-1.json')
    expect(wrote(j)).toEqual([])
    expect(j.fake.repos.get('grandma/crate-game')?.commits).toEqual([])
  })
})

test('Copy this level puts the level text where it can be pasted (the clipboard in Chromium, a selected box elsewhere)', async () => {
  const j = await open()
  await j.page.goto(`${j.site}/${GAME}/level/level-1`)
  await thingNamed(j.page, 'crate-1').waitFor()
  await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
  const chromium = (process.env.ENGINE ?? 'chromium') === 'chromium'
  if (chromium)
    await j.page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: j.site })
  await pressPut(j.page)
  await j.page.getByRole('button', { name: putWords.keepText }).click()
  if (chromium) {
    await text(j, 'Copied. Paste it')
    expect(await j.page.evaluate(() => navigator.clipboard.readText())).toBe(moved)
  } else {
    // The other engines either let the page write to the clipboard (Firefox does, with no way to read it back here) and
    // it says "copied", or refuse, and the page shows the text instead, ready to copy. Either is a person able to paste.
    const box = j.page.locator('textarea.box')
    await box.or(j.page.getByText('Copied. Paste it', { exact: false }).first()).waitFor()
    if ((await box.count()) > 0) expect(await box.inputValue()).toBe(moved)
  }
})
test('a "Change this game" link opens the game with no Welcome and no sign-in screen', async () => {
  const j = await open()
  await j.page.goto(`${j.site}/${GAME}`)
  await j.page.locator('[data-bar]').waitFor()
  expect(await j.page.getByRole('heading', { level: 1, name: WORDS.appName }).count()).toBe(0)
})

test('the visitor reloads: the crate is still where they put it, and the screen says so', async () => {
  const j = await open()
  await j.page.goto(`${j.site}/${GAME}/level/level-1`)
  await thingNamed(j.page, 'crate-1').waitFor()
  await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
  await j.page.reload()
  await text(j, WORDS.draftBack)
  await crateX(j).toBe('8.5')
})

test('the visitor keeps a copy, signs in, and saves: the game holds exactly the copy they kept', async () => {
  const j = await open()
  await j.page.goto(`${j.site}/${GAME}/level/level-1`)
  await thingNamed(j.page, 'crate-1').waitFor()
  await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
  await pressPut(j.page)
  const download = j.page.waitForEvent('download')
  await j.page.getByRole('button', { name: menuWords.keepCopy('level-1') }).click()
  const kept = await readFile(await (await download).path(), 'utf8')
  // The sheet that gave the copy offers the way in; the changes are still on the device when the person comes back.
  await j.page.getByRole('dialog').getByRole('button', { name: menuWords.signIn }).click()
  await j.page.waitForFunction(
    () => location.search === '' && localStorage.getItem('af.tokens') !== null,
    undefined,
    {
      timeout: 30_000,
    },
  )
  await text(j, WORDS.draftBack)
  await putThemIn(j.page)
  expect(levelPut(j.fake.repos.get('grandma/crate-game'), LEVEL_PATH)).toBe(kept)
})
test("a visitor never sees the waiting changes, the Share button, or anyone's name", async () => {
  const j = await open('ipadUpright', 'grandma')
  await j.page.goto(`${j.site}/${GAME}`)
  await j.page.locator('[data-bar]').waitFor()
  // The game's menu has no row for the sharing or the waiting changes either.
  const rows = (await gameMenuRows(j.page)).join('\n')
  expect(rows).not.toContain(menuWords.whoCanChange)
  expect(rows).not.toMatch(/waiting/i)
  const page = await j.page.locator('body').innerText()
  expect(page).not.toContain(menuWords.whoCanChange)
  expect(page).not.toContain(WORDS.waitingTitle)
  expect(page).not.toMatch(/grandma|grandpa|kid|stranger/i)
  expect(j.requests.filter((r) => /\/api\/(waiting|sharing|games)/.test(r))).toEqual([])
})

test('a visitor who opens the Share address is asked to sign in, and lands on Share after', async () => {
  const j = await open()
  await j.page.goto(`${j.site}/${GAME}/share`)
  await j.page.getByRole('heading', { level: 1, name: WORDS.appName }).waitFor()
  await signIn(j.page)
  await j.page.getByRole('heading', { name: teamWords.peopleTitle }).waitFor()
})

test('Welcome with a sample game: Try it now is the one primary, at least 48 px; Sign in is plain, at least 44 px', async () => {
  const j = await open()
  const tryIt = await j.page.getByRole('button', { name: WORDS.tryIt }).boundingBox()
  const sign = await j.page.getByRole('button', { name: WORDS.signIn }).boundingBox()
  expect(tryIt?.height).toBeGreaterThanOrEqual(48)
  expect(sign?.height).toBeGreaterThanOrEqual(44)
})

describe('on a site with no sample game', () => {
  test('Welcome has one primary Button, Sign in, and no Try it', async () => {
    const j = await open()
    let plain: Site | undefined
    try {
      plain = await startSite(4802, { ...j.fake.env, DEMO_GAME: 'grandma/crate-game' }, 'dist-plain')
      await j.page.goto(plain.url)
      await j.page.getByRole('heading', { level: 1, name: WORDS.appName }).waitFor()
      expect(await j.page.getByRole('button', { name: WORDS.tryIt }).count()).toBe(0)
      expect(
        (await j.page.getByRole('button', { name: WORDS.signIn }).boundingBox())?.height,
      ).toBeGreaterThanOrEqual(48)
    } finally {
      await plain?.close()
    }
  })
})

test("the whole visit made no request to any address but the page's own", async () => {
  const j = await open()
  await j.page.getByRole('button', { name: WORDS.tryIt }).click()
  await thingNamed(j.page, 'crate-1').waitFor()
  await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
  for (const request of j.requests.filter((r) => !r.includes(' data:'))) expect(request).toContain(j.site)
})
