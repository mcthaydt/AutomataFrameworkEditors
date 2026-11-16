// A thing's settings and the lines between things, on every size: a door pointed at another level (its tag, and "Go to"
// coming out at that door), a switch's line to what it opens taken away, undone and drawn again with a finger, the
// crate's number set in halves, and the places the old layouts went wrong shown fixed with pictures: nothing floats over
// the settings, "Where it is" stays in them with a list open, and the hint covers neither the plate nor the gate.
import type { Locator, Page } from 'playwright'
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

/** On a phone and an upright iPad the settings wait folded in a line; a wide window shows them beside the level. */
async function showSettings(page: Page): Promise<void> {
  const folded = page.locator('button[data-tour="settings"]')
  if ((await folded.count()) > 0) await folded.first().click()
  await page.locator('aside.panel').waitFor()
}

/** The picture can be taken once the fonts are in and the page has drawn twice. */
const settled = (page: Page): Promise<void> =>
  page.evaluate(async () => {
    await document.fonts.ready
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
  })

type Box = { x: number; y: number; width: number; height: number }
async function boxOf(where: Locator): Promise<Box> {
  const box = await where.boundingBox()
  if (box === null) throw new Error('nothing to measure')
  return box
}
const overlap = (a: Box, b: Box): boolean =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
const inside = (inner: Box, outer: Box): boolean =>
  inner.x >= outer.x &&
  inner.y >= outer.y &&
  inner.x + inner.width <= outer.x + outer.width &&
  inner.y + inner.height <= outer.y + outer.height

/**
 * Draws a line the way a finger does: the finger's own events (down on one thing, a path across, up over the other), sent
 * as the page's own because a script cannot drive a second kind of finger in every engine.
 */
async function drawByFinger(page: Page, from: string, to: string): Promise<void> {
  await page.evaluate(
    async ({ from, to }) => {
      const mark = (id: string): HTMLElement => {
        const found = document.querySelector<HTMLElement>(`[data-thing="${id}"]`)
        if (found === null) throw new Error(`no ${id} to draw with`)
        return found
      }
      const middle = (el: HTMLElement): { x: number; y: number } => {
        const r = el.getBoundingClientRect()
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
      }
      const start = middle(mark(from))
      const end = middle(mark(to))
      const send = (type: string, at: { x: number; y: number }, buttons: number): void => {
        mark(from).dispatchEvent(
          new PointerEvent(type, {
            pointerId: 5,
            pointerType: 'touch',
            isPrimary: true,
            clientX: at.x,
            clientY: at.y,
            buttons,
            bubbles: true,
          }),
        )
      }
      const frame = () => new Promise((done) => requestAnimationFrame(done))
      send('pointerdown', start, 1)
      for (let step = 1; step <= 6; step += 1) {
        send(
          'pointermove',
          { x: start.x + ((end.x - start.x) * step) / 6, y: start.y + ((end.y - start.y) * step) / 6 },
          1,
        )
        await frame()
      }
      send('pointerup', end, 0)
    },
    { from, to },
  )
}

async function openLinks(page: Page): Promise<void> {
  await signIn(page)
  await openGame(page, 'links-game')
  await thingNamed(page, 'plate-1').waitFor()
}

const SIZES_TO_TRY = [
  'ipadSideways',
  'ipadUpright',
  'phone',
] as const satisfies readonly (keyof typeof SIZES)[]

describe.each(SIZES_TO_TRY)('at %s', (size) => {
  test('a door is pointed at another level and tagged; nothing floats over the settings; Go to comes out at that door', async () => {
    journey = await openPage(size)
    const { page } = journey
    await openLinks(page)
    await thingNamed(page, 'exit').click()
    await showSettings(page)
    await page.getByRole('combobox', { name: 'Leads to' }).selectOption('room-3')
    await page.getByRole('radio', { name: 'By a door' }).click()
    await page.getByRole('combobox', { name: 'Which door' }).selectOption('back')
    await page.locator('[data-tag]', { hasText: 'To Room 3' }).first().waitFor()

    // The bar, the tag and the door itself are all clear of the settings, and the door stays in sight.
    const panel = await boxOf(page.locator('aside.panel'))
    expect(overlap(await boxOf(page.locator('.float').first()), panel), 'the bar covers the settings').toBe(
      false,
    )
    expect(overlap(await boxOf(thingNamed(page, 'exit')), panel), 'the settings cover the door').toBe(false)
    await settled(page)
    await picture(page, `settings-door-${size}`)

    await page.getByRole('button', { name: 'Go to Room 3' }).click()
    await thingNamed(page, 'back').waitFor()
    await expect.poll(() => page.locator('button.part').first().innerText()).toContain('Room 3')
    // It opened at the door you come out of: that door is picked.
    await expect.poll(() => thingNamed(page, 'back').getAttribute('aria-pressed')).toBe('true')
  })

  test("a switch's line is taken away, undone and drawn again with a finger, and its settings say what it opens", async () => {
    journey = await openPage(size)
    const { page } = journey
    await openLinks(page)
    await page.getByRole('button', { name: /^Join/ }).click()
    const line = page.locator('[data-line]')
    await line.waitFor()
    await settled(page)
    await picture(page, `join-line-${size}`)
    await line.click()
    await page.getByRole('button', { name: 'Take this line away' }).click()
    await line.waitFor({ state: 'detached' })
    await page.keyboard.press('Control+z')
    await line.waitFor()
    await line.click()
    await page.getByRole('button', { name: 'Take this line away' }).click()
    await line.waitFor({ state: 'detached' })

    // Drawn again, from the plate to the gate, by a finger.
    await drawByFinger(page, 'plate-1', 'gate-1')
    await line.waitFor()
    await page.getByRole('button', { name: /^Pick/ }).click()
    await thingNamed(page, 'plate-1').click()
    await showSettings(page)
    await page
      .locator('[data-value="opens"] .opens button[aria-pressed="true"]', { hasText: 'Gate 1' })
      .waitFor()
    await settled(page)
    await picture(page, `join-drawn-${size}`)
  })

  test('"Where it is" stays inside the settings with the "Opens" list open', async () => {
    journey = await openPage(size)
    const { page } = journey
    await openLinks(page)
    await thingNamed(page, 'plate-1').click()
    await showSettings(page)
    const heading = page.locator('[data-group="where"] h3')
    await heading.scrollIntoViewIfNeeded()
    const panel = await boxOf(page.locator('aside.panel'))
    const at = await boxOf(heading)
    expect(inside(at, panel), 'the heading is outside the settings').toBe(true)
    expect(at.y).toBeGreaterThanOrEqual(
      (await boxOf(page.locator('[data-value="opens"] .opens'))).y +
        (await boxOf(page.locator('[data-value="opens"] .opens'))).height,
    )
    await settled(page)
    await picture(page, `settings-where-${size}`)
  })

  test('the Join hint covers neither the plate nor the gate it points at', async () => {
    journey = await openPage(size)
    const { page } = journey
    await openLinks(page)
    await page.getByRole('button', { name: /^Join/ }).click()
    // Nothing is joined yet: a plate with no line, so the hint stays up.
    await page.locator('[data-line]').waitFor()
    await page.locator('[data-line]').click()
    await page.getByRole('button', { name: 'Take this line away' }).click()
    const hint = page.locator('.hint')
    await hint.waitFor()
    const at = await boxOf(hint)
    for (const id of ['plate-1', 'gate-1']) {
      expect(overlap(at, await boxOf(thingNamed(page, id))), `the hint covers ${id}`).toBe(false)
    }
    await settled(page)
    await picture(page, `join-hint-${size}`)
  })

  test("a level's open edge says where it leads, and goes to look", async () => {
    journey = await openPage(size)
    const { page } = journey
    await openLinks(page)
    await page.locator('button.part').click()
    await page.getByRole('menuitem', { name: 'Room 2', exact: true }).click()
    const card = page.locator('[data-edge-card]')
    await card.waitFor()
    await settled(page)
    await picture(page, `edge-card-${size}`)
    await card.getByRole('button', { name: /^Go to / }).click()
    await expect.poll(() => page.locator('button.part').first().innerText()).toContain('Room 3')
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
    await settled(page)
    await picture(page, `settings-heavy-${size}`)
  })
})
