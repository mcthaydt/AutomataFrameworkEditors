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
})
