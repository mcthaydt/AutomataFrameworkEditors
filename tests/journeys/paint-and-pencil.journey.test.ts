// Painting what the ground is, on an iPad held sideways and on a phone: pick Paint, paint a step, close the way across to
// the next level and open it again (reading what each note says), take every change back with Undo; the Show menu and
// the free thumb's buttons are where a person can reach them; and the Pencil does the tool while a finger slides the view.
import type { Locator, Page } from 'playwright'
import { afterEach, describe, expect, test } from 'vitest'
import {
  type JourneyPage,
  openLevel,
  openPage,
  picture,
  pictureColourAt,
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

const SIZES_TO_TRY = ['ipadSideways', 'phone'] as const satisfies readonly (keyof typeof SIZES)[]

type Box = { x: number; y: number; width: number; height: number }
const overlap = (a: Box, b: Box): boolean =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
async function boxOf(where: Locator): Promise<Box> {
  const box = await where.boundingBox()
  if (box === null) throw new Error('nothing to measure')
  return box
}

/** The picture can be taken once the fonts are in and the page has drawn twice. */
const settled = (page: Page): Promise<void> =>
  page.evaluate(async () => {
    await document.fonts.ready
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
  })

/** The middle of a tile of the open level, in the page's pixels (the level is 16 tiles wide and 9 tall, shown whole). */
async function tileAt(page: Page, col: number, row: number): Promise<{ x: number; y: number }> {
  const stage = page.locator('.stage[data-scale]')
  const box = await boxOf(stage)
  const scale = Number(await stage.getAttribute('data-scale'))
  return {
    x: box.x + box.width / 2 + (col + 0.5 - 8) * scale,
    y: box.y + box.height / 2 + (row + 0.5 - 4.5) * scale,
  }
}
async function dragTiles(page: Page, from: [number, number], to: [number, number]): Promise<void> {
  const start = await tileAt(page, ...from)
  const end = await tileAt(page, ...to)
  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  for (const f of [0.25, 0.5, 0.75, 1]) {
    await page.mouse.move(start.x + (end.x - start.x) * f, start.y + (end.y - start.y) * f)
  }
  await page.mouse.up()
}
const colourOf = async (page: Page, col: number, row: number): Promise<string> =>
  pictureColourAt(page, await tileAt(page, col, row))
const tool = (page: Page, name: RegExp) => page.getByRole('button', { name }).first()

async function inRoom2(page: Page): Promise<void> {
  await signIn(page)
  await openLevel(page, 'links-game', 'room-2')
}

describe.each(SIZES_TO_TRY)('at %s', (size) => {
  test('a step is painted, the way across is closed and opened again (each said), and Undo takes every change back', async () => {
    journey = await openPage(size)
    const { page } = journey
    await inRoom2(page)
    const sky = await colourOf(page, 7, 3)
    const wayOpen = await colourOf(page, 15, 6)

    await tool(page, /^Paint/).click()
    const tray = page.locator('.strip button.one[data-kind]')
    await expect.poll(() => tray.allInnerTexts()).toEqual(['Solid', 'Empty'])
    await expect
      .poll(() => page.locator('button.one[data-kind="#"]').getAttribute('aria-pressed'))
      .toBe('true')

    // A step in the air.
    await dragTiles(page, [6, 3], [8, 3])
    await expect.poll(() => colourOf(page, 7, 3)).not.toBe(sky)
    await page.getByText('Painted Solid').waitFor()

    // The open stretch on the right edge, where Room 3 begins: painted over, the way across closes.
    await dragTiles(page, [15, 5], [15, 7])
    await expect.poll(() => colourOf(page, 15, 6)).not.toBe(wayOpen)
    await page.getByText('The way across to Room 3 is closed now').waitFor()
    await settled(page)
    await picture(page, `paint-closed-${size}`)

    // Erased again, it opens.
    await tool(page, /^Erase/).click()
    await dragTiles(page, [15, 5], [15, 7])
    await expect.poll(() => colourOf(page, 15, 6)).toBe(wayOpen)
    await page.getByText('The way across to Room 3 is open now').waitFor()

    // Three steps, three Undos: everything is as it was.
    for (let step = 0; step < 3; step += 1) await page.keyboard.press('Control+z')
    await expect.poll(() => colourOf(page, 7, 3)).toBe(sky)
    await expect.poll(() => colourOf(page, 15, 6)).toBe(wayOpen)
    await expect
      .poll(() => page.locator('button[aria-label="Undo"]').first().getAttribute('aria-disabled'))
      .toBe('true')
  })

  test('a menu opened from the top bar lies over the Show panel: every row of it can be pressed', async () => {
    journey = await openPage(size)
    const { page } = journey
    await inRoom2(page)
    await tool(page, /^Show/).click()
    await page.getByRole('dialog', { name: 'Show' }).waitFor()
    const game = page.locator('button.game')
    await ((await game.count()) > 0 ? game : page.locator('button.part')).first().click()
    await page.getByRole('menuitem').first().waitFor()
    await settled(page)
    // A long menu scrolls inside itself: the rows in its own box are the ones in sight, and each must be on top.
    const covered = await page.evaluate(() => {
      const menu = document.querySelector<HTMLElement>('[role="menu"]')
      if (menu === null) return ['no menu']
      const room = menu.getBoundingClientRect()
      return [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]')].flatMap((row) => {
        const box = row.getBoundingClientRect()
        const x = box.left + box.width / 2
        const y = box.top + box.height / 2
        if (y < room.top || y > room.bottom || y > window.innerHeight) return []
        const at = document.elementFromPoint(x, y)
        return at !== null && row.contains(at) ? [] : [(row.textContent ?? '').trim().slice(0, 24)]
      })
    })
    expect(covered, 'rows of the menu under another panel').toEqual([])
  })

  test("Show changes the picture, and the free thumb's buttons can be reached and pressed", async () => {
    journey = await openPage(size)
    const { page } = journey
    await inRoom2(page)
    await tool(page, /^Paint/).click()

    const wall = await colourOf(page, 0, 3)
    await tool(page, /^Show/).click()
    const menu = page.getByRole('dialog', { name: 'Show' })
    await menu.waitFor()
    await menu.getByRole('radio', { name: 'Tiles' }).click()
    await menu.getByRole('switch', { name: 'Show what it is' }).click()
    await menu.getByRole('switch', { name: 'The frames each screen sees' }).click()
    await expect.poll(() => colourOf(page, 0, 3)).not.toBe(wall)
    await page.locator('[data-frame]').first().waitFor()
    await menu.getByRole('radio', { name: 'Close up' }).click()
    await expect
      .poll(() => page.locator('.stage[data-scale]').getAttribute('data-scale').then(Number))
      .toBeGreaterThan(40)
    await menu.getByRole('radio', { name: 'Whole level' }).click()
    await settled(page)
    await picture(page, `paint-show-${size}`)
    await menu.getByRole('button', { name: 'Close' }).click()
    await menu.waitFor({ state: 'detached' })

    // The Hold tab folds out Box, Fill and Erase, clear of the toolbar and the tray.
    await page.getByRole('button', { name: /^More ways/ }).click()
    for (const name of ['Box', 'Fill', 'Erase']) {
      const button = page.locator('.hold').getByRole('button', { name })
      await button.waitFor()
      for (const [what, other] of [
        ['the toolbar', page.getByRole('group', { name: 'Tools' })],
        ['the tray', page.locator('.strip')],
        ['the list', page.locator('nav.rail')],
      ] as const) {
        if ((await other.count()) === 0) continue
        expect(overlap(await boxOf(button), await boxOf(other)), `${name} sits on ${what}`).toBe(false)
      }
    }
    // Box kept on, a drag paints the whole box.
    await page.locator('.hold').getByRole('button', { name: 'Box' }).click()
    const before = await colourOf(page, 7, 4)
    await dragTiles(page, [6, 3], [8, 4])
    await expect.poll(() => colourOf(page, 7, 4)).not.toBe(before)
    await settled(page)
    await picture(page, `paint-hold-${size}`)
  })

  test('the Pencil paints and a finger slides the view; a hovering Pencil paints nothing', async () => {
    journey = await openPage(size)
    const { page } = journey
    await inRoom2(page)
    await tool(page, /^Paint/).click()
    const sky = await colourOf(page, 7, 3)
    const from = await tileAt(page, 6, 3)
    const to = await tileAt(page, 8, 3)

    const send = (type: string, kind: string, at: { x: number; y: number }, buttons: number): Promise<void> =>
      page.evaluate(
        ({ type, kind, at, buttons }) =>
          void document.querySelector('.stage[data-scale]')?.dispatchEvent(
            new PointerEvent(type, {
              pointerId: kind === 'pen' ? 7 : 8,
              pointerType: kind,
              clientX: at.x,
              clientY: at.y,
              buttons,
              bubbles: true,
            }),
          ),
        { type, kind, at, buttons },
      )
    // Hovering: the outline follows the tip and no tile changes.
    await send('pointermove', 'pen', from, 0)
    await page.locator('[data-hover="paint"]').waitFor()
    expect(await colourOf(page, 7, 3)).toBe(sky)
    // The Pencil drags: it paints.
    await send('pointerdown', 'pen', from, 1)
    for (const f of [0.5, 1])
      await send('pointermove', 'pen', { x: from.x + (to.x - from.x) * f, y: from.y }, 1)
    await send('pointerup', 'pen', to, 0)
    await expect.poll(() => colourOf(page, 7, 3)).not.toBe(sky)
    // A finger drag now slides the view and paints nothing.
    const cell = await colourOf(page, 7, 4)
    const crate = page.locator('[data-thing="crate-1"]')
    const was = await boxOf(crate)
    const a = await tileAt(page, 3, 2)
    await send('pointerdown', 'touch', a, 1)
    for (const f of [0.3, 0.6, 1]) await send('pointermove', 'touch', { x: a.x + 120 * f, y: a.y }, 1)
    await send('pointerup', 'touch', { x: a.x + 120, y: a.y }, 0)
    await expect.poll(async () => (await boxOf(crate)).x).toBeGreaterThan(was.x + 60)
    expect(await colourOf(page, 7, 4)).toBe(cell)
    await settled(page)
    await picture(page, `paint-pencil-${size}`)
  })
})
