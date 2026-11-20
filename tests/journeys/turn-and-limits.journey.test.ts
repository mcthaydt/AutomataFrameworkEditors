// A value at its limits, and turning the device. A number typed past its least or most stops at it, each step has its
// Undo; and with a thing picked, its settings open, the number pad open and its field focused, the window turns from
// 1210 by 834 to 834 by 1210 and back, and the on-screen keyboard (stood in for by a smaller visual viewport, the layout
// one unchanged: CI cannot open a real keyboard) takes part of the screen, and the pick, the open settings and the
// focused field all survive each.
import type { Page } from 'playwright'
import { afterEach, describe, expect, test } from 'vitest'
import {
  type JourneyPage,
  openLevel,
  openPage,
  picture,
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

/** On a phone and an upright iPad the settings wait folded in a line; a wide window shows them beside the level. */
async function showSettings(page: Page): Promise<void> {
  const folded = page.locator('button[data-tour="settings"]')
  if ((await folded.count()) > 0) await folded.first().click()
  await page.locator('aside.panel').waitFor()
}
const slider = (page: Page) => page.locator('input[type="range"][aria-label="How heavy"]')
const field = (page: Page) => page.getByRole('textbox', { name: /number/i })

describe.each(['ipadSideways', 'phone'] as const)('at %s', (size) => {
  test('a number typed past its limits stops at them, and Undo gives every step back', async () => {
    journey = await openPage(size)
    const { page } = journey
    await signIn(page)
    await openLevel(page)
    await thingNamed(page, 'crate-1').click()
    await showSettings(page)
    expect(await slider(page).inputValue()).toBe('1')
    await page.getByRole('button', { name: /^1, How heavy/ }).click()
    const typed = async (words: string, then: string): Promise<void> => {
      await field(page).fill(words)
      await field(page).press('Enter')
      await expect.poll(() => slider(page).inputValue()).toBe(then)
    }
    await typed('99', '4')
    await page.locator('[data-step="up"]').click()
    expect(await slider(page).inputValue(), 'one more than the most').toBe('4')
    await typed('-3', '0.5')
    await page.locator('[data-step="down"]').click()
    expect(await slider(page).inputValue(), 'one less than the least').toBe('0.5')
    await picture(page, `limits-${size}`)
    // Undo takes every change back to where it began.
    await page.locator('[data-step="up"]').waitFor()
    for (let step = 0; step < 6 && (await slider(page).inputValue()) !== '1'; step += 1) {
      await page.keyboard.press('Control+z')
    }
    expect(await slider(page).inputValue()).toBe('1')
  })
})

test('turning the device and the keyboard coming up keep the pick, the open settings and the focused field', async () => {
  journey = await openPage('ipadSideways')
  const { page } = journey
  await signIn(page)
  await openLevel(page)
  await thingNamed(page, 'crate-1').click()
  await showSettings(page)
  await page.getByRole('button', { name: /^1, How heavy/ }).click()
  await field(page).fill('2')
  await field(page).focus()

  /** What a person would say is still there: the thing picked, its settings open, the pad open, the field the cursor is in. */
  const kept = async (where: string): Promise<void> => {
    // The settings are folded in a line on a window that is too narrow for them to sit beside the level.
    const folded = page.locator('button[data-tour="settings"]')
    expect(await folded.count(), `${where}: the settings fold away`).toBe(0)
    expect(await page.locator('aside.panel').count(), `${where}: the settings`).toBe(1)
    expect(await page.locator('aside.panel').getByText('Crate 1').count(), `${where}: the pick`).toBeGreaterThan(0)
    expect(await field(page).count(), `${where}: the number pad`).toBe(1)
    expect(await field(page).inputValue(), `${where}: what was typed`).toBe('2')
    expect(
      await page.evaluate(() => (document.activeElement as HTMLInputElement | null)?.getAttribute('aria-label') ?? ''),
      `${where}: the focused field`,
    ).toMatch(/number/i)
  }
  await kept('before')
  for (const [width, height, where] of [
    [834, 1210, 'upright'],
    [1210, 834, 'sideways again'],
  ] as const) {
    await page.setViewportSize({ width, height })
    await page.waitForTimeout(300)
    await kept(where)
  }
  // The keyboard: the visual viewport shrinks and tells the page, while the layout viewport stays.
  await page.evaluate(() => {
    const view = window.visualViewport
    if (view === null) return
    Object.defineProperty(view, 'height', { configurable: true, value: Math.round(window.innerHeight * 0.55) })
    view.dispatchEvent(new Event('resize'))
  })
  await page.waitForTimeout(300)
  await kept('with the keyboard up')
  await picture(page, 'turn-keyboard-ipadSideways')
})
