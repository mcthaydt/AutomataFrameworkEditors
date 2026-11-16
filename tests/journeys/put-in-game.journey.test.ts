// Putting the changes in the game, on the links game with its map: an Owner changes two levels and moves a level on the map,
// and one press of the sheet's button makes one commit of exactly those three files, written as the framework writes them.
import { parseContent, writeContent } from '@automataframework/framework/headless'
import type { Page } from 'playwright'
import { afterEach, describe, expect, test } from 'vitest'
import { WORDS } from '#src/features/words/words.ts'
import {
  type JourneyPage,
  openMapFromBar,
  openPage,
  putButton,
  putSheet,
  putWords,
  type SIZES,
  setupJourneys,
  signIn,
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

const SIZES_TO_TRY = [
  'computer',
  'ipadSideways',
  'ipadUpright',
  'phone',
  'phoneSideways',
] as const satisfies readonly (keyof typeof SIZES)[]

const LEVELS = ['content/levels/room-1.json', 'content/levels/room-2.json']
const WORLD = 'content/worlds/world.json'

/** Moves the crate of the level that is open two steps with the keys. */
async function nudgeCrate(page: Page): Promise<void> {
  await thingNamed(page, 'crate-1').focus()
  for (let step = 0; step < 2; step += 1) await page.keyboard.press('ArrowRight')
}

describe.each(SIZES_TO_TRY)('at %s', (size) => {
  test('two levels changed and a level moved on the map: one press, one commit of those three files', async () => {
    journey = await openPage(size)
    const { page, fake } = journey
    await signIn(page)
    await page.evaluate(() => {
      location.hash = '#/game/grandma/links-game'
    })
    await page.locator('[data-thing="exit"]').waitFor()
    await nudgeCrate(page)

    await page.locator('button.part').click()
    await page.getByRole('menuitem', { name: 'Room 2', exact: true }).click()
    // Another level is another file of the same game, not a way out of it: nothing is asked and Room 1's copy stays.
    await page.locator('[data-bar]').getByText('Room 2').first().waitFor()
    expect(await page.getByText(WORDS.leaveAsk).count()).toBe(0)
    expect(
      await page.evaluate(() => Object.keys(sessionStorage).filter((key) => key.endsWith('room-1.json'))),
    ).toEqual(['af.draft:grandma/links-game:content/levels/room-1.json'])
    await nudgeCrate(page)

    await openMapFromBar(page)
    await page.locator('[data-level="room-3"]').click()
    await page.getByRole('button', { name: 'Move apart' }).click()

    await putButton(page).click()
    const sheet = putSheet(page)
    await sheet.getByRole('heading', { name: /^Put \d+ changes in the game/ }).waitFor()
    await sheet.getByRole('button', { name: /^Put them in/ }).click()
    await sheet.getByRole('heading', { name: putWords.doneTitle, exact: true }).waitFor()

    const repo = fake.repos.get('grandma/links-game')!
    expect(repo.commits).toHaveLength(1)
    const files = repo.commits[0]?.files ?? []
    expect(files.map((f) => f.path).sort()).toEqual([...LEVELS, WORLD].sort())
    // Each file is the framework's own writing of what it reads back.
    for (const file of files) {
      const kind = file.path === WORLD ? 'world' : 'level'
      const read = parseContent(kind, file.text ?? '', file.path)
      if (!read.ok) throw new Error(`${file.path} does not read`)
      expect(file.text).toBe(writeContent(kind, read.value as never))
    }
    expect(repo.pulls).toEqual([])
  })
})

test('a level made is its own file, the file that places it and the project file, in one commit', async () => {
  journey = await openPage('ipadSideways')
  const { page, fake } = journey
  await signIn(page)
  await page.evaluate(() => {
    location.hash = '#/game/grandma/links-game'
  })
  await page.locator('[data-thing="exit"]').waitFor()
  await openMapFromBar(page)
  await page.getByRole('button', { name: 'New level' }).click()
  await page.getByText('A new level, ready to play').waitFor()
  await page.getByRole('button', { name: 'Got it' }).click()
  await page.locator('[data-level]').nth(3).waitFor()

  await putButton(page).click()
  const sheet = putSheet(page)
  await sheet.getByRole('button', { name: /^Put them in/ }).click()
  await sheet.getByRole('heading', { name: putWords.doneTitle, exact: true }).waitFor()

  const repo = fake.repos.get('grandma/links-game')!
  expect(repo.commits).toHaveLength(1)
  const paths = (repo.commits[0]?.files ?? []).map((f) => f.path)
  expect(paths.filter((p) => p.startsWith('content/levels/'))).toHaveLength(1)
  expect(paths).toHaveLength(3)
  expect(paths).toContain('automata.toml')
})
