// The helper's ghost and Find: someone else puts a moved crate into the game and the page, on its next read, shows it as
// a ghost to keep or undo; a level pasted back from a helper is offered the same way; Find lands on a thing, picked.
import { type Level, writeContent } from '@automataframework/framework/headless'
import { afterEach, describe, expect, test } from 'vitest'
import { fixtureFiles, LEVEL_PATH } from '../fixtures/game/read.ts'
import {
  chooseFromMenu,
  helperWords,
  type JourneyPage,
  menuWords,
  openLevel,
  openPage,
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
type Size = keyof typeof SIZES

const level1 = JSON.parse(fixtureFiles[LEVEL_PATH] ?? '') as Level
const crateAt = (x: number): string =>
  writeContent('level', {
    ...level1,
    things: level1.things.map((t) => (t.id === 'crate-1' ? { ...t, x } : t)),
  } as never)
const reads = (j: JourneyPage): number => j.requests.filter((r) => r.includes('/api/game?')).length
/** The page coming back into view, and the game read again before this returns. */
async function reread(j: JourneyPage): Promise<void> {
  const before = reads(j)
  await j.page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await expect.poll(() => reads(j)).toBeGreaterThan(before)
  await j.page.waitForLoadState('networkidle')
}
const crateX = (j: JourneyPage) => thingNamed(j.page, 'crate-1').getAttribute('data-x')
const card = (j: JourneyPage) => j.page.locator('[data-ghost-card]')
const undoLevelStep = (j: JourneyPage) => j.page.locator('button[aria-label="Undo"]').first().click()

async function open(size: Size): Promise<JourneyPage> {
  journey = await openPage(size)
  await signIn(journey.page)
  await openLevel(journey.page)
  return journey
}

describe.each(['ipadUpright', 'phone'] as const)('at %s', (size) => {
  test('a change that came into the game shows as a ghost; Keep takes it as one step, Undo leaves the crate where it is', async () => {
    const j = await open(size)
    const repo = j.fake.repos.get('grandma/crate-game')!
    expect(await crateX(j)).toBe('6.5')

    repo.put('main', LEVEL_PATH, crateAt(8.5))
    await reread(j)
    await card(j).waitFor()
    await card(j).getByText(helperWords.ghostAbout).waitFor()
    await j.page.locator('[data-ghost="ghost:crate-1"]').waitFor({ state: 'attached' })
    await card(j).getByRole('button', { name: helperWords.keep }).click()
    await card(j).waitFor({ state: 'detached' })
    expect(await crateX(j)).toBe('8.5')
    // One Undo gives back what the person had before it came in.
    await undoLevelStep(j)
    await expect.poll(() => crateX(j)).toBe('6.5')

    // The game moves again: Undo on the ghost leaves the person's crate, and the same change is not offered twice.
    repo.put('main', LEVEL_PATH, crateAt(3.5))
    await reread(j)
    await card(j).waitFor()
    await card(j).getByRole('button', { name: helperWords.undo }).click()
    await card(j).waitFor({ state: 'detached' })
    expect(await crateX(j)).toBe('6.5')
    await reread(j)
    expect(await card(j).count()).toBe(0)
  })

  test('a level pasted back from a helper is offered the same way: garbage is refused, a real one is kept or undone', async () => {
    const j = await open(size)
    await chooseFromMenu(j.page, menuWords.help)
    await j.page.getByRole('button', { name: helperWords.helperRow }).click()
    await j.page.getByRole('button', { name: helperWords.pasteRow }).click()
    const sheet = j.page.getByRole('dialog', { name: helperWords.pasteTitle })
    await sheet.waitFor()
    const box = sheet.getByRole('textbox')
    const show = sheet.getByRole('button', { name: helperWords.pasteShow })

    await box.fill('this is not a level')
    await show.click()
    await sheet.getByText(helperWords.pasteBad).waitFor()

    await box.fill(fixtureFiles[LEVEL_PATH] ?? '')
    await show.click()
    await sheet.getByText(helperWords.pasteSame).waitFor()

    await box.fill(crateAt(9.5))
    await show.click()
    await card(j).waitFor()
    await card(j).getByRole('button', { name: helperWords.undo }).click()
    await card(j).waitFor({ state: 'detached' })
    expect(await crateX(j)).toBe('6.5')

    // Again, and this time keep it: it is one step, taken back with Undo.
    await chooseFromMenu(j.page, menuWords.help)
    await j.page.getByRole('button', { name: helperWords.helperRow }).click()
    await j.page.getByRole('button', { name: helperWords.pasteRow }).click()
    await j.page.getByRole('dialog', { name: helperWords.pasteTitle }).getByRole('textbox').fill(crateAt(9.5))
    await j.page.getByRole('button', { name: helperWords.pasteShow }).click()
    await card(j).getByRole('button', { name: helperWords.keep }).click()
    await expect.poll(() => crateX(j)).toBe('9.5')
    await undoLevelStep(j)
    await expect.poll(() => crateX(j)).toBe('6.5')
  })

  test('Find lands on a thing in another level, picked, and runs a command with its key', async () => {
    journey = await openPage(size)
    const j = journey
    await signIn(j.page)
    await openLevel(j.page, 'links-game', 'room-1')
    await j.page.locator('button.find').click()
    const sheet = j.page.getByRole('dialog', { name: helperWords.findTitle })
    await sheet.getByRole('searchbox').fill('gate 1')
    await sheet
      .getByRole('button', { name: /Gate 1/ })
      .first()
      .click()
    await sheet.waitFor({ state: 'detached' })
    await expect.poll(() => thingNamed(j.page, 'gate-1').getAttribute('aria-pressed')).toBe('true')

    // ⌘K opens it too, and Enter takes the first.
    await j.page.keyboard.press('Control+k')
    await sheet.waitFor()
    await sheet.getByRole('searchbox').fill('undo')
    await sheet.getByRole('button', { name: /Undo/ }).waitFor()
    await j.page.keyboard.press('Escape')
    await sheet.waitFor({ state: 'detached' })
  })
})
