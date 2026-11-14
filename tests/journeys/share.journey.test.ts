import { type Level, writeContent } from '@automataframework/framework/headless'
import { afterEach, describe, expect, test } from 'vitest'
import { type AccessFile, writeAccess } from '#src/features/access/access.ts'
import { WORDS } from '#src/features/words/words.ts'
import { fixtureFiles, LEVEL_PATH } from '../fixtures/game/read.ts'
import {
  dragByTouch,
  type JourneyPage,
  openGame,
  openPage,
  pressSave,
  type SIZES,
  setupJourneys,
  signIn,
  thingNamed,
} from '../fixtures/journey.ts'

setupJourneys()

const windows: JourneyPage[] = []
afterEach(async () => {
  // Close every window first: a window left open by a failing test would carry its problems into the next one.
  const found: string[][] = []
  for (const j of windows) {
    found.push(await j.problems())
    await j.close()
  }
  windows.length = 0
  expect(found.flat()).toEqual([])
})
type Size = keyof typeof SIZES
type Person = Parameters<typeof openPage>[1]
const window_ = async (size: Size, person: Person, keep = false): Promise<JourneyPage> => {
  const j = await openPage(size, person, keep)
  windows.push(j)
  return j
}
const repoOf = (j: JourneyPage) => j.fake.repos.get('grandma/crate-game')!
const ACCESS = 'automata.access.toml'
const level1 = JSON.parse(fixtureFiles[LEVEL_PATH] ?? '') as Level
const moved = writeContent('level', {
  ...level1,
  things: level1.things.map((t) => ({ ...t, x: 8.5 })),
} as never)
const text = (j: JourneyPage, words: string) => j.page.getByText(words, { exact: false }).first().waitFor()
const accessOf = (j: JourneyPage) => repoOf(j).branches.get('main')?.get(ACCESS)
const file = (over: Partial<AccessFile>): string =>
  writeAccess({ format: 1, everyone: 'look', people: [], ...over })

/** Grandma signs in and opens the Share screen. */
async function shareScreen(size: Size = 'ipadUpright', keep = false): Promise<JourneyPage> {
  const g = await window_(size, 'grandma', keep)
  await signIn(g.page)
  await openGame(g.page)
  await g.page.getByRole('link', { name: WORDS.share }).click()
  await g.page.getByRole('heading', { level: 1, name: WORDS.shareTitle('grandma/crate-game') }).waitFor()
  return g
}
const level = (j: JourneyPage, words: string) => j.page.getByRole('radio', { name: new RegExp(`^${words}`) })
async function addPerson(j: JourneyPage, name: string, as?: string): Promise<void> {
  await j.page.locator('#share-name').fill(name)
  if (as !== undefined) await j.page.getByRole('combobox', { name: WORDS.addName }).selectOption(as)
  await j.page.getByRole('button', { name: WORDS.addPerson, exact: true }).click()
}
const saveSharing = (j: JourneyPage) => j.page.getByRole('button', { name: WORDS.saveSharing })

describe.each(['ipadUpright', 'phone'] as const)('at %s', (size) => {
  test('the whole point: grandma shares, grandpa approves, kid suggests, and none of them opens GitHub', async () => {
    const grandma = await shareScreen(size)
    await level(grandma, WORDS.levelSuggest).check()
    await addPerson(grandma, 'grandpa', 'approve')
    await saveSharing(grandma).click()
    await text(grandma, WORDS.sharingSaved)
    const link = await grandma.page.locator('#share-link').inputValue()

    const kid = await window_(size, 'kid', true)
    await kid.page.goto(link)
    await signIn(kid.page)
    await kid.page.getByRole('link', { name: 'level-1' }).click()
    await thingNamed(kid.page, 'crate-1').waitFor()
    await dragByTouch(kid.page, 'crate-1', { dx: 2, dy: 0 })
    await pressSave(kid.page).click()
    await text(kid, WORDS.savedSuggestion)

    const grandpa = await window_(size, 'grandpa', true)
    await grandpa.page.goto(link)
    await signIn(grandpa.page)
    await text(grandpa, WORDS.waitingRow(1))
    await grandpa.page.getByRole('link', { name: /waiting/ }).click()
    await grandpa.page.locator('a.row').first().click()
    await grandpa.page.getByRole('button', { name: WORDS.approve, exact: true }).click()
    await text(grandpa, WORDS.approved)

    await grandma.page.goto(`${grandma.site}/#/game/grandma/crate-game`)
    await grandma.page.reload()
    await grandma.page.getByRole('link', { name: 'level-1' }).click()
    await thingNamed(grandma.page, 'crate-1').waitFor()
    expect(await thingNamed(grandma.page, 'crate-1').getAttribute('data-x')).toBe('8.5')

    const repo = repoOf(grandma)
    expect(accessOf(grandma)).toBe(
      file({ everyone: 'suggest', people: [{ github: 'grandpa', level: 'approve' }] }),
    )
    expect(repo.branches.get('main')?.get(LEVEL_PATH)).toBe(moved)
    // Every request went to the page's own address or to GitHub's sign-in page (the pretend one is on port 4801).
    for (const j of windows) {
      for (const request of j.requests) {
        expect(
          request.includes(j.site) || request.includes('127.0.0.1:4801') || request.includes('data:'),
        ).toBe(true)
      }
    }
  })
})

test("only an Owner sees Share; anyone else who opens the Share address lands on the game's page", async () => {
  const g = await window_('ipadUpright', 'grandpa')
  repoOf(g).put('main', ACCESS, file({ people: [{ github: 'grandpa', level: 'approve' }] }))
  await signIn(g.page)
  await openGame(g.page)
  await g.page.getByRole('heading', { level: 1, name: 'Crate Game' }).waitFor()
  expect(await g.page.getByRole('link', { name: WORDS.share }).count()).toBe(0)
  await g.page.goto(`${g.site}/#/game/grandma/crate-game/share`)
  await g.page.getByRole('heading', { level: 1, name: 'Crate Game' }).waitFor()
  expect(g.page.url()).toMatch(/#\/game\/grandma\/crate-game$/)
})

test('changing grandpa from Approve to Look, and saving: his next visit says he can look', async () => {
  const g = await shareScreen()
  repoOf(g).put(
    'main',
    ACCESS,
    file({ everyone: 'nothing', people: [{ github: 'grandpa', level: 'approve' }] }),
  )
  await g.page.reload()
  await g.page.getByRole('combobox', { name: 'grandpa' }).selectOption('look')
  await saveSharing(g).click()
  await text(g, WORDS.sharingSaved)
  const grandpa = await window_('ipadUpright', 'grandpa', true)
  await signIn(grandpa.page)
  await openGame(grandpa.page)
  await text(grandpa, WORDS.youAre('look'))
})

test('removing grandpa, and saving: he gets what "anyone" gets', async () => {
  const g = await shareScreen()
  repoOf(g).put(
    'main',
    ACCESS,
    file({ everyone: 'suggest', people: [{ github: 'grandpa', level: 'approve' }] }),
  )
  await g.page.reload()
  await g.page.getByRole('button', { name: WORDS.remove('grandpa') }).click()
  await saveSharing(g).click()
  await text(g, WORDS.sharingSaved)
  const grandpa = await window_('ipadUpright', 'grandpa', true)
  await signIn(grandpa.page)
  await openGame(grandpa.page)
  await text(grandpa, WORDS.youAre('suggest'))
})

test('setting "anyone" to "Can\'t get in": a stranger with the link is told to ask the owner', async () => {
  const g = await shareScreen()
  await level(g, WORDS.everyoneNothing).check()
  await saveSharing(g).click()
  await text(g, WORDS.sharingSaved)
  const link = await g.page.locator('#share-link').inputValue()
  const stranger = await window_('ipadUpright', 'stranger', true)
  await stranger.page.goto(link)
  await signIn(stranger.page)
  await text(stranger, WORDS.cantFindGame)
})

test('a name with a typo: the screen names it, nothing is saved, and the rest of the list is still there', async () => {
  const g = await shareScreen()
  await addPerson(g, 'kid')
  await addPerson(g, 'grandpaa')
  await saveSharing(g).click()
  await text(g, WORDS.nameUnknown('grandpaa'))
  expect(accessOf(g)).toBeUndefined()
  await g.page.getByText('kid', { exact: true }).waitFor()
})

test('a name already on the list, and a name that cannot be a GitHub name, are caught before saving', async () => {
  const g = await shareScreen()
  await addPerson(g, 'kid')
  await addPerson(g, 'KID')
  await text(g, WORDS.nameTwice('KID'))
  await addPerson(g, '-no- good')
  await text(g, WORDS.nameBad)
  expect(g.requests.filter((r) => r.includes('POST') && r.includes('/api/sharing'))).toEqual([])
})

test('two Owners at once: the second is shown the newest list and nothing is lost silently', async () => {
  const first = await shareScreen('ipadUpright')
  const second = await shareScreen('ipadUpright', true)
  await addPerson(first, 'kid')
  await saveSharing(first).click()
  await text(first, WORDS.sharingSaved)
  await addPerson(second, 'stranger')
  await saveSharing(second).click()
  await text(second, WORDS.sharingChanged)
  expect(accessOf(first)).toBe(file({ people: [{ github: 'kid', level: 'suggest' }] }))
  await second.page.getByText('kid', { exact: true }).waitFor()
})

test('a damaged sharing file: the screen says so, and saving mends it', async () => {
  const g = await window_('ipadUpright', 'grandma')
  repoOf(g).put('main', ACCESS, 'format = [')
  await signIn(g.page)
  await openGame(g.page)
  await g.page.getByRole('link', { name: WORDS.share }).click()
  await text(g, WORDS.sharingBroken)
  await saveSharing(g).click()
  await text(g, WORDS.sharingSaved)
  expect(accessOf(g)?.startsWith('format = 1')).toBe(true)
})

test('leaving with unsaved sharing asks first', async () => {
  const g = await shareScreen()
  await addPerson(g, 'kid')
  await text(g, WORDS.sharingDirty)
  await g.page.getByRole('button', { name: WORDS.back, exact: true }).click()
  await text(g, WORDS.leaveAsk)
  await g.page.getByRole('button', { name: WORDS.leaveNo }).click()
  await g.page.getByText('kid', { exact: true }).waitFor()
  await g.page.getByRole('button', { name: WORDS.back, exact: true }).click()
  await g.page.getByRole('button', { name: WORDS.leaveYes }).click()
  await g.page.getByRole('heading', { level: 1, name: 'Crate Game' }).waitFor()
  expect(accessOf(g)).toBeUndefined()
})

test("Copy the link puts the game's address on the clipboard", async () => {
  // Only Chromium lets a test read the clipboard.
  if ((process.env.ENGINE ?? 'chromium') !== 'chromium') return
  const g = await shareScreen()
  await g.page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: g.site })
  await g.page.getByRole('button', { name: WORDS.copyLink }).click()
  await text(g, WORDS.linkCopied)
  const link = await g.page.locator('#share-link').inputValue()
  expect(await g.page.evaluate(() => navigator.clipboard.readText())).toBe(link)
})

test('every level picker and every Remove is at least 44 px, on a phone too', async () => {
  const g = await shareScreen('phone')
  await addPerson(g, 'kid')
  const controls = g.page.locator('select, .person button, form button')
  for (const control of await controls.all()) {
    expect((await control.boundingBox())?.height).toBeGreaterThanOrEqual(44)
  }
})
