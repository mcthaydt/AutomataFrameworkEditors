// Putting the changes in the game, on the links game with its map: a level made, a level moved on the map and a thing moved
// on a level are three files, and one press of the sheet's button makes one commit of them all.
import type { Page } from 'playwright'
import { afterEach, describe, expect, test } from 'vitest'
import {
  type JourneyPage,
  openGame,
  openPage,
  putButton,
  putSheet,
  putWords,
  type SIZES,
  setupJourneys,
  signIn,
} from '../fixtures/journey.ts'

setupJourneys()

let journey: JourneyPage | undefined
afterEach(async () => {
  const found = (await journey?.problems()) ?? []
  await journey?.close()
  journey = undefined
  expect(found).toEqual([])
})

const SIZES_TO_TRY = [
  'computer',
  'ipadSideways',
  'ipadUpright',
  'phone',
  'phoneSideways',
] as const satisfies readonly (keyof typeof SIZES)[]

async function openMap(page: Page, size: (typeof SIZES_TO_TRY)[number]): Promise<void> {
  await signIn(page)
  await openGame(page, 'links-game')
  await page.locator('[data-thing="exit"]').waitFor()
  // On an upright phone the bar has no room for the Map button: the part menu has the row.
  if (size === 'phone') {
    await page.locator('button.part').click()
    await page.getByRole('menuitem', { name: /^Map/ }).click()
  } else {
    await page.getByRole('button', { name: 'Map', exact: true }).click()
  }
  await page.locator('[data-level]').first().waitFor()
}

describe.each(SIZES_TO_TRY)('at %s', (size) => {
  test('a level made, a level moved: one press, one commit of the three files', async () => {
    journey = await openPage(size)
    const { page, fake } = journey
    await openMap(page, size)
    await page.getByRole('button', { name: 'New level' }).click()
    await page.getByText('A new level, ready to play').waitFor()
    await page.getByRole('button', { name: 'Got it' }).click()
    await page.locator('[data-level]').nth(3).waitFor()

    await putButton(page).click()
    const sheet = putSheet(page)
    await sheet.getByRole('heading', { name: /^Put \d+ changes? in the game/ }).waitFor()
    await sheet.getByRole('button', { name: /^Put them in/ }).click()
    await sheet.getByRole('heading', { name: putWords.doneTitle, exact: true }).waitFor()

    const repo = fake.repos.get('grandma/links-game')!
    expect(repo.commits).toHaveLength(1)
    const paths = (repo.commits[0]?.files ?? []).map((f) => f.path)
    // The new level's own file, the file that places it on the map and the game's project file: three files, one commit.
    expect(paths.filter((p) => p.startsWith('content/levels/'))).toHaveLength(1)
    expect(paths).toHaveLength(3)
    expect(paths).toContain('automata.toml')
    expect(repo.pulls).toEqual([])
  })
})
