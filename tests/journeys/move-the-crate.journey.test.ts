import { type Level, writeContent } from '@automataframework/framework/headless'
import { afterEach, describe, expect, test } from 'vitest'
import { writeAccess } from '#src/features/access/access.ts'
import { WORDS } from '#src/features/words/words.ts'
import { fixtureFiles, LEVEL_PATH } from '../fixtures/game/read.ts'
import {
  dragByTouch,
  type JourneyPage,
  openLevel,
  middleOf,
  openPage,
  pictureColourAt,
  pictureColourUnder,
  pressSave,
  SIZES,
  setupJourneys,
  signIn,
  statusLine,
  thingNamed,
} from '../fixtures/journey.ts'

setupJourneys()

let journey: JourneyPage | undefined
afterEach(async () => {
  const found = (await journey?.problems()) ?? []
  await journey?.close()
  journey = undefined
  expect(found).toEqual([])
})
const open = async (...args: Parameters<typeof openPage>): Promise<JourneyPage> => {
  journey = await openPage(...args)
  return journey
}
const GAME = 'grandma/crate-game'
const repoOf = (j: JourneyPage) => j.fake.repos.get(GAME)!
const level1 = JSON.parse(fixtureFiles[LEVEL_PATH] ?? '') as Level
const crateAt = (x: number): Level => ({
  ...level1,
  things: level1.things.map((t) => (t.id === 'crate-1' ? { ...t, x } : t)),
})
/** The framework's sky and the crate fixture's colour: what the picture must show where a thing is and is not. */
const SKY = '#9fd3f0'
const CRATE = '#c9a227'
const says = (j: JourneyPage, words: string) =>
  expect.poll(async () => (await statusLine(j.page).textContent())?.trim()).toBe(words)

describe.each(Object.keys(SIZES) as (keyof typeof SIZES)[])('at %s', (size) => {
  test('the owner drags the crate and saves: it is in the game, written as the framework writes it', async () => {
    const j = await open(size)
    await signIn(j.page)
    await openLevel(j.page)
    const before = await middleOf(j.page, 'crate-1')
    expect(await pictureColourAt(j.page, before)).toBe(CRATE)
    await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
    await says(j, WORDS.statusDirty)
    // What the person sees: the crate is drawn at its new place and the place it left is sky again. The buttons moving
    // proves nothing about the picture (the first build moved the buttons and never redrew).
    await expect.poll(() => pictureColourUnder(j.page, 'crate-1')).toBe(CRATE)
    await expect.poll(() => pictureColourAt(j.page, before)).toBe(SKY)
    await pressSave(j.page).click()
    await says(j, WORDS.savedDirect)

    const repo = repoOf(j)
    expect(repo.commits).toEqual([
      expect.objectContaining({
        branch: 'main',
        path: LEVEL_PATH,
        message: 'Move crate-1 in level-1',
        author: 'grandma',
      }),
    ])
    expect(repo.commits[0]?.text).toBe(writeContent('level', crateAt(8.5) as never))
    expect([...(repo.branches.get('main')?.keys() ?? [])].sort()).toEqual(Object.keys(fixtureFiles).sort())
    expect(repo.pulls).toEqual([])

    await j.page.reload()
    await expect.poll(() => thingNamed(j.page, 'crate-1').getAttribute('data-x')).toBe('8.5')
  })
})

describe('someone who may only suggest', () => {
  const asKid = async (): Promise<JourneyPage> => {
    const j = await open('ipadUpright', 'kid')
    repoOf(j).put('main', 'automata.access.toml', writeAccess({ format: 1, everyone: 'suggest', people: [] }))
    await signIn(j.page)
    await openLevel(j.page)
    return j
  }

  test('does the same: it waits for approval, and main is untouched', async () => {
    const j = await asKid()
    await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
    await pressSave(j.page).click()
    await says(j, WORDS.savedSuggestion)
    const repo = repoOf(j)
    expect(repo.commits.map((c) => [c.branch, c.author])).toEqual([['automata/kid', 'kid']])
    expect(repo.pulls.filter((p) => p.state === 'open')).toHaveLength(1)
    expect(repo.branches.get('main')?.get(LEVEL_PATH)).toBe(fixtureFiles[LEVEL_PATH])

    await j.page.reload()
    await expect.poll(() => thingNamed(j.page, 'crate-1').getAttribute('data-x')).toBe('8.5')
    await j.page.getByText(WORDS.mineWaiting).waitFor()
  })

  test('a second change by kid adds to the same waiting change', async () => {
    const j = await asKid()
    await dragByTouch(j.page, 'crate-1', { dx: 1, dy: 0 })
    await pressSave(j.page).click()
    await says(j, WORDS.savedSuggestion)
    await dragByTouch(j.page, 'crate-1', { dx: 1, dy: 0 })
    await says(j, WORDS.statusDirty)
    await pressSave(j.page).click()
    await says(j, WORDS.savedSuggestion)
    expect(repoOf(j).commits).toHaveLength(2)
    expect(repoOf(j).pulls.filter((p) => p.state === 'open')).toHaveLength(1)
  })
})

test('the same, moving with the arrow buttons instead of a finger', async () => {
  const j = await open('phone')
  await signIn(j.page)
  await openLevel(j.page)
  await thingNamed(j.page, 'crate-1').tap()
  for (let step = 0; step < 4; step += 1) await j.page.getByRole('button', { name: WORDS.moveRight }).tap()
  await says(j, WORDS.statusDirty)
  await pressSave(j.page).tap()
  await says(j, WORDS.savedDirect)
  expect(repoOf(j).commits[0]?.text).toBe(writeContent('level', crateAt(8.5) as never))
})

test('the same, with the keyboard only, from the welcome screen to Saved', async () => {
  const j = await open('ipadUpright')
  await j.page.goto(`${j.site}/#/`)
  await j.page.getByRole('button', { name: WORDS.signIn }).focus()
  await j.page.keyboard.press('Enter')
  await j.page.getByRole('link', { name: 'crate-game' }).focus()
  await j.page.keyboard.press('Enter')
  await j.page.getByRole('link', { name: 'level-1' }).focus()
  await j.page.keyboard.press('Enter')
  await thingNamed(j.page, 'crate-1').focus()
  for (let step = 0; step < 4; step += 1) await j.page.keyboard.press('ArrowRight')
  await says(j, WORDS.statusDirty)
  await pressSave(j.page).focus()
  await j.page.keyboard.press('Enter')
  await says(j, WORDS.savedDirect)
  expect(repoOf(j).commits[0]?.text).toBe(writeContent('level', crateAt(8.5) as never))
})

test('pressing Save twice quickly makes one commit', async () => {
  const j = await open('ipadUpright')
  await signIn(j.page)
  await openLevel(j.page)
  await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
  await pressSave(j.page).dblclick()
  await says(j, WORDS.savedDirect)
  expect(repoOf(j).commits).toHaveLength(1)
})

test("the whole journey made no request to any address but the page's own", async () => {
  const j = await open('ipadUpright')
  await signIn(j.page)
  await openLevel(j.page)
  await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
  await pressSave(j.page).click()
  await says(j, WORDS.savedDirect)
  // Signing in goes to GitHub's own page (the pretend one) and back; everything the page itself asked for is its own.
  const own = j.requests.filter((r) => !r.includes(`127.0.0.1:4801`) && !r.startsWith('GET data:'))
  for (const request of own) expect(request).toContain(j.site)
})
