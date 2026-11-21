// The world map on every size: opened from the top bar on the links game, with every level, its doors and the bar where
// two of them meet in sight; then arranged: levels pushed together and pulled apart, a wall's way out, a level that goes
// back when dropped on another, and a level made, renamed and taken away.
import type { Page } from 'playwright'
import { afterEach, describe, expect, test } from 'vitest'
import {
  type JourneyPage,
  openGame,
  openPage,
  picture,
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

/** Takes a level by its middle with the mouse and moves it this many tiles. */
async function drag(page: Page, id: string, tiles: { x: number; y: number }, letGo = true): Promise<void> {
  const scale = Number(await page.locator('[data-scale]').first().getAttribute('data-scale'))
  const box = await page.locator(`[data-level="${id}"]`).boundingBox()
  if (box === null) throw new Error(`no level ${id} on the map`)
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + (tiles.x * scale) / 2, y + (tiles.y * scale) / 2, { steps: 4 })
  await page.mouse.move(x + tiles.x * scale, y + tiles.y * scale, { steps: 4 })
  if (letGo) await page.mouse.up()
}
const count = (page: Page, mark: string): Promise<number> => page.locator(`[data-mark="${mark}"]`).count()

const SIZES_TO_TRY = [
  'ipadSideways',
  'ipadUpright',
  'phone',
] as const satisfies readonly (keyof typeof SIZES)[]

describe.each(SIZES_TO_TRY)('at %s', (size) => {
  test('the map opens from the top bar with every level and its marks in sight', async () => {
    journey = await openPage(size)
    const { page } = journey
    await openMap(page, size)
    expect(await page.locator('[data-level]').count()).toBe(3)
    expect(await page.locator('[data-mark="join"]').count()).toBe(1)
    expect(await page.locator('[data-mark="door"]').count()).toBe(3)
    await page.waitForTimeout(400)
    await picture(page, `map-${size}`)
  })

  test('levels pushed together, pulled apart, a wall mended, a level made and taken away', async () => {
    journey = await openPage(size)
    const { page } = journey
    await openMap(page, size)
    const joins = await count(page, 'join')

    // Room 1 pushed against Room 2: its open edge meets Room 2's solid one, so they touch at a wall.
    await drag(page, 'room-1', { x: 3.4, y: 0.2 }, false)
    await page.getByRole('status').filter({ hasText: 'meet at a wall' }).waitFor()
    await page.mouse.up()
    await page.locator('[data-way="clear"]').waitFor()
    expect(await count(page, 'wall')).toBe(1)
    expect(await count(page, 'join')).toBe(joins)
    // The wall's marker is something a finger presses: 44 by 44 at least.
    const marker = await page.locator('[data-wall]').boundingBox()
    expect(marker?.width).toBeGreaterThanOrEqual(43.5)
    expect(marker?.height).toBeGreaterThanOrEqual(43.5)
    await page.waitForTimeout(300)
    await picture(page, `map-wall-${size}`)

    // The first way out clears the ground: they join. Undo puts the wall back; doing it again joins them again.
    await page.locator('[data-way="clear"]').click()
    expect(await count(page, 'wall')).toBe(0)
    expect(await count(page, 'join')).toBe(joins + 1)
    await page.waitForTimeout(300)
    await picture(page, `map-joined-${size}`)
    await page.keyboard.press('Control+z')
    expect(await count(page, 'wall')).toBe(1)
    await page.locator('[data-wall]').click()
    await page.locator('[data-way="clear"]').click()
    expect(await count(page, 'join')).toBe(joins + 1)

    // Room 3 pulled apart from Room 2 no longer joins; pushed back it does; undo takes it away again.
    await page.locator('[data-level="room-3"]').click()
    await page.getByRole('button', { name: 'Move apart' }).click()
    expect(await count(page, 'join')).toBe(joins)
    await page.waitForTimeout(300)
    await picture(page, `map-apart-${size}`)
    await drag(page, 'room-3', { x: -1.8, y: 0 }, false)
    await page.mouse.up()
    expect(await count(page, 'join')).toBe(joins + 1)
    await page.keyboard.press('Control+z')
    expect(await count(page, 'join')).toBe(joins)
    await page.keyboard.press('Control+z')
    expect(await count(page, 'join')).toBe(joins + 1)

    // Dropped on another level, a level goes back.
    const was = await page.locator('[data-level="room-1"]').boundingBox()
    await drag(page, 'room-1', { x: 20, y: 1 }, false)
    await page.getByRole('status').filter({ hasText: 'already here' }).waitFor()
    await page.waitForTimeout(200)
    await picture(page, `map-overlap-${size}`)
    await page.mouse.up()
    expect(await page.locator('[data-level="room-1"]').boundingBox()).toEqual(was)

    // A new level, renamed (the care sentence comes first), taken away, and brought back by Undo.
    await page.getByRole('button', { name: 'New level' }).click()
    await page.getByText('A new level, ready to play').waitFor()
    expect(await page.locator('[data-level]').count()).toBe(4)
    await page.waitForTimeout(200)
    await picture(page, `map-new-${size}`)
    await page.getByRole('button', { name: 'Got it' }).click()
    await page.getByRole('button', { name: 'More' }).click()
    await page.getByRole('menuitem', { name: /^Rename/ }).click()
    await page.getByText(/This changes the name the game's files use/).waitFor()
    await page.getByRole('textbox').fill('cellar')
    await page.getByRole('textbox').press('Enter')
    await page.locator('[data-level="cellar"]').waitFor()
    await page.getByRole('button', { name: 'More' }).click()
    await page.getByRole('menuitem', { name: /^Delete/ }).click()
    expect(await page.locator('[data-level="cellar"]').count()).toBe(0)
    await page.getByRole('button', { name: 'Undo' }).last().click()
    await page.locator('[data-level="cellar"]').waitFor()
  })
  test('the map zooms with Ctrl and the wheel, slides with the wheel, and "Whole world" brings every level back', async () => {
    journey = await openPage(size)
    const { page } = journey
    await openMap(page, size)
    const scaleNow = async (): Promise<number> =>
      Number(await page.locator('[data-scale]').first().getAttribute('data-scale'))
    const whole = page.getByRole('button', { name: 'Whole world', exact: true })
    const fitted = await scaleNow()
    expect(await whole.getAttribute('aria-pressed')).toBe('true')
    const room = await page.locator('[data-level="room-2"]').boundingBox()
    if (room === null) throw new Error('no room-2 on the map')
    await page.mouse.move(room.x + room.width / 2, room.y + room.height / 2)
    await page.keyboard.down('Control')
    await page.mouse.wheel(0, -500)
    await page.keyboard.up('Control')
    await page.waitForFunction(
      (was) => Number(document.querySelector('[data-scale]')?.getAttribute('data-scale')) > was * 1.5,
      fitted,
    )
    expect(await whole.getAttribute('aria-pressed')).toBe('false')
    // The wheel on its own slides the zoomed map: the level moves up the screen as the wheel turns down. A bar or a card
    // over the pointer keeps the wheel for itself, so it turns over a spot of the map clear of them.
    const clear = await page.evaluate(() => {
      const sheet = document.querySelector('[role="region"]')?.getBoundingClientRect()
      if (sheet === undefined) return null
      for (let y = sheet.top + 80; y < sheet.bottom - 80; y += 40) {
        for (let x = sheet.left + 20; x < sheet.right - 20; x += 40) {
          const hit = document.elementFromPoint(x, y)
          if (hit !== null && hit.closest('[role="region"]') !== null && hit.closest('[data-ui]') === null)
            return { x, y }
        }
      }
      return null
    })
    if (clear === null) throw new Error('no spot on the map clear of the buttons')
    await page.mouse.move(clear.x, clear.y)
    const before = await page.locator('[data-level="room-2"]').boundingBox()
    await page.mouse.wheel(0, 120)
    await page.waitForFunction(
      (top) =>
        (document.querySelector('[data-level="room-2"]')?.getBoundingClientRect().top ?? top) < top - 60,
      before?.y ?? 0,
    )
    // Two frames on, what the page shows is what is drawn.
    await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))))
    await picture(page, `map-zoomed-${size}`)
    await whole.click()
    expect(await scaleNow()).toBe(fitted)
    expect(await whole.getAttribute('aria-pressed')).toBe('true')
    expect(await page.locator('[data-level]').count()).toBe(3)
  })
})

// The blind judge's pair 6: on a phone held sideways, a room's three dots opened a menu over "New level" with the short
// bar still showing behind it. One menu at a time: the bar steps aside, and the menu keeps off the top strip's buttons
// and inside the screen, scrolling in itself when it is taller than the room.
describe.each(['phoneSideways', 'phone', 'computer'] as const)('the room menu at %s', (size) => {
  test('opens alone, clear of "New level" and "Whole world", and fits or scrolls inside the screen', async () => {
    journey = await openPage(size)
    const { page } = journey
    await openMap(page, size)
    await page.locator('[data-level="room-3"]').click()
    await page.getByRole('toolbar').waitFor()
    await page.getByRole('button', { name: 'More' }).click()
    const menu = page.getByRole('menu')
    await menu.waitFor()
    await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))))
    expect(await page.getByRole('toolbar').isVisible()).toBe(false)
    const box = await menu.boundingBox()
    if (box === null) throw new Error('no menu')
    const view = page.viewportSize() ?? { width: 0, height: 0 }
    expect(box.y).toBeGreaterThanOrEqual(0)
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.y + box.height).toBeLessThanOrEqual(view.height)
    expect(box.x + box.width).toBeLessThanOrEqual(view.width)
    for (const name of ['New level', 'Whole world']) {
      const other = await page.getByRole('button', { name, exact: true }).boundingBox()
      if (other === null) throw new Error(`no ${name}`)
      const meet =
        box.x < other.x + other.width &&
        other.x < box.x + box.width &&
        box.y < other.y + other.height &&
        other.y < box.y + box.height
      expect(meet, `the menu covers ${name}`).toBe(false)
    }
    // Every row can be reached: the last one scrolls into sight inside the menu and is pressable there.
    const last = page.getByRole('menuitem', { name: /^Delete/ })
    await last.scrollIntoViewIfNeeded()
    const row = await last.boundingBox()
    if (row === null) throw new Error('no Delete row')
    expect(row.y + row.height).toBeLessThanOrEqual(Math.min(view.height, box.y + box.height) + 1)
    await picture(page, `map-menu-${size}`)
    // Escape puts it away, and the bar comes back.
    await page.keyboard.press('Escape')
    await menu.waitFor({ state: 'detached' })
    expect(await page.getByRole('toolbar').isVisible()).toBe(true)
  })
})
