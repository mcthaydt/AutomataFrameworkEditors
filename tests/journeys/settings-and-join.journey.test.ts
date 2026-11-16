// A thing's settings and the lines between things, on every size: a door pointed at another level (its tag, and "Go to"),
// a switch's line to what it opens taken away, undone and drawn again with a finger, and the crate's number set in halves.
import type { Page } from 'playwright'
import { afterEach, describe, expect, test } from 'vitest'
import {
  type JourneyPage,
  openGame,
  openLevel,
  openPage,
  picture,
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

/** On a phone the settings are folded to a button; a bigger window shows them beside the level. */
async function showSettings(page: Page): Promise<void> {
  const folded = page.locator('button[data-tour="settings"]')
  if ((await folded.count()) > 0) await folded.first().click()
}

const SIZES_TO_TRY = [
  'ipadSideways',
  'ipadUpright',
  'phone',
] as const satisfies readonly (keyof typeof SIZES)[]

describe.each(SIZES_TO_TRY)('at %s', (size) => {
  test('a door is pointed at another level, tagged, and followed', async () => {
    journey = await openPage(size)
    const { page } = journey
    await signIn(page)
    await openGame(page, 'links-game')
    await thingNamed(page, 'exit').waitFor()
    await thingNamed(page, 'exit').click()
    await showSettings(page)
    const level = page.getByRole('combobox', { name: 'Leads to' })
    await level.selectOption('room-3')
    await page.locator('[data-tag]', { hasText: 'To Room 3' }).first().waitFor()
    await page.waitForTimeout(300)
    await picture(page, `settings-door-${size}`)
    await page.getByRole('button', { name: 'Go to Room 3' }).click()
    await thingNamed(page, 'back').waitFor()
    await expect.poll(() => page.locator('button.part').first().innerText()).toContain('Room 3')
  })

  test("a switch's line is taken away, undone, and drawn again", async () => {
    journey = await openPage(size)
    const { page } = journey
    await signIn(page)
    await openGame(page, 'links-game')
    await thingNamed(page, 'plate-1').waitFor()
    await page.getByRole('button', { name: /^Join/ }).click()
    const line = page.locator('[data-line]').first()
    await line.waitFor()
    await page.waitForTimeout(300)
    await picture(page, `join-line-${size}`)
    await line.click()
    await page.getByRole('button', { name: 'Take this line away' }).click()
    expect(await page.locator('[data-line]').count()).toBe(0)
    await page.keyboard.press('Control+z')
    expect(await page.locator('[data-line]').count()).toBe(1)
    await page
      .getByRole('button', { name: 'Take this line away' })
      .waitFor({ state: 'detached' })
      .catch(() => {})
    await line.click()
    await page.getByRole('button', { name: 'Take this line away' }).click()
    expect(await page.locator('[data-line]').count()).toBe(0)

    // Drawn again, from the plate to the gate.
    const from = await thingNamed(page, 'plate-1').boundingBox()
    const to = await thingNamed(page, 'gate-1').boundingBox()
    if (from === null || to === null) throw new Error('no plate or gate')
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
    await page.mouse.down()
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 })
    await page.mouse.up()
    expect(await page.locator('[data-line]').count()).toBe(1)
    await page.waitForTimeout(300)
    await picture(page, `join-drawn-${size}`)
  })

  test("the crate's number moves in halves", async () => {
    journey = await openPage(size)
    const { page } = journey
    await signIn(page)
    await openLevel(page)
    await thingNamed(page, 'crate-1').click()
    await showSettings(page)
    const slider = page.locator('input[type="range"][aria-label="How heavy"]')
    await slider.waitFor()
    expect(await slider.getAttribute('min')).toBe('0.5')
    expect(await slider.getAttribute('max')).toBe('4')
    expect(await slider.getAttribute('step')).toBe('0.5')
    await slider.focus()
    await page.keyboard.press('ArrowRight')
    expect(await slider.inputValue()).toBe('1.5')
    await page.waitForTimeout(300)
    await picture(page, `settings-heavy-${size}`)
  })
})
