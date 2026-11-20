import type { Level } from '@automataframework/framework/headless'
import { afterEach, expect, test } from 'vitest'
import { writeAccess } from '#src/features/access/access.ts'
import { wordsIn } from '#src/features/words/words.ts'
import { fixtureFiles, LEVEL_PATH } from '../fixtures/game/read.ts'
import {
  dragByTouch,
  type JourneyPage,
  openLevel,
  openPage,
  pressPut,
  putSheet,
  setupJourneys,
  signIn,
  thingNamed,
} from '../fixtures/journey.ts'

setupJourneys()

const W = wordsIn('en').whose
const said = (row: unknown, ...parts: (string | number)[]): string =>
  typeof row === 'function' ? (row as (...p: (string | number)[]) => string)(...parts) : String(row)
const windows: JourneyPage[] = []
afterEach(async () => {
  const found: string[][] = []
  for (const j of windows) {
    found.push(await j.problems())
    await j.close()
  }
  windows.length = 0
  expect(found.flat()).toEqual([])
})
const level1 = JSON.parse(fixtureFiles[LEVEL_PATH] ?? '') as Level
const levelOf = (j: JourneyPage): Level =>
  JSON.parse(j.fake.repos.get('grandma/crate-game')?.branches.get('main')?.get(LEVEL_PATH) ?? '') as Level
const crateX = (level: Level): number | undefined => level.things.find((t) => t.id === 'crate-1')?.x
const startX = (level: Level): number | undefined => level.starts[0]?.x

/** Two Owners, each in their own window, both looking at Level 1 as it was. */
async function twoOwners(): Promise<{ first: JourneyPage; second: JourneyPage }> {
  const first = await openPage('ipadSideways', 'grandma')
  windows.push(first)
  first.fake.repos
    .get('grandma/crate-game')
    ?.put(
      'main',
      'automata.access.toml',
      writeAccess({ format: 1, everyone: 'look', people: [{ github: 'grandpa', level: 'owner' }] }),
    )
  await signIn(first.page)
  await openLevel(first.page)
  const second = await openPage('ipadSideways', 'grandpa', true)
  windows.push(second)
  await signIn(second.page)
  await openLevel(second.page)
  return { first, second }
}

/** The second person moves the crate two tiles and puts it in first; the first moves the crate one tile and the start. */
async function aClash(): Promise<{ first: JourneyPage; second: JourneyPage }> {
  const { first, second } = await twoOwners()
  await dragByTouch(second.page, 'crate-1', { dx: 2, dy: 0 })
  await pressPut(second.page)
  await putSheet(second.page)
    .getByRole('button', { name: /^Put them in/ })
    .click()
  await putSheet(second.page).getByRole('heading', { name: 'In the game', exact: true }).waitFor()

  await dragByTouch(first.page, 'crate-1', { dx: 1, dy: 0 })
  await dragByTouch(first.page, 'start-1', { dx: 1, dy: 0 })
  await pressPut(first.page)
  await putSheet(first.page)
    .getByRole('button', { name: /^Put them in/ })
    .click()
  return { first, second }
}

for (const keep of ['mine', 'theirs'] as const) {
  test(`both moved the crate: asked only about the crate, keeping ${keep}, and the start goes in unasked`, async () => {
    const { first } = await aClash()
    const sheet = putSheet(first.page)
    // One question, about the crate, in words; nothing is put in until it is answered.
    await sheet.getByText(said(W.clashMoved, 'Crate 1', 'grandpa')).waitFor()
    expect(await sheet.getByText(/^You (moved|changed)/).count()).toBe(1)
    expect(await sheet.getByRole('button', { name: /^Put them in/ }).isDisabled()).toBe(true)
    expect(crateX(levelOf(first))).toBe((crateX(level1) ?? 0) + 2)

    await sheet
      .getByRole('button', { name: keep === 'mine' ? said(W.keepMine) : said(W.keepTheirs, 'grandpa') })
      .click()
    await sheet.getByRole('button', { name: /^Put them in/ }).click()
    await sheet.getByRole('heading', { name: 'In the game', exact: true }).waitFor()

    const result = levelOf(first)
    expect(crateX(result)).toBe((crateX(level1) ?? 0) + (keep === 'mine' ? 1 : 2))
    expect(startX(result)).toBe((startX(level1) ?? 0) + 1)
    await thingNamed(first.page, 'crate-1').waitFor()
  })
}

test('a clash is shown with both places, one picture each, named', async () => {
  const { first } = await aClash()
  const sheet = putSheet(first.page)
  await sheet.getByText(said(W.yours)).first().waitFor()
  await sheet.getByText(said(W.theirs, 'grandpa')).first().waitFor()
  expect(await sheet.locator('[data-marked]').count()).toBeGreaterThanOrEqual(2)
})
