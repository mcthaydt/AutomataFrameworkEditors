// Pick, Place and Erase by touch, on every size: put a crate down, move it with the pad, make a copy, delete the copy,
// erase the first crate, then undo each step. Nothing is left changed, so nothing is waiting to be saved.
import { afterEach, describe, expect, test } from 'vitest'
import { fixtureFiles, LEVEL_PATH } from '../fixtures/game/read.ts'
import {
  type JourneyPage,
  openLevel,
  openPage,
  quietButton,
  SIZES,
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
  'ipadSideways',
  'ipadUpright',
  'phone',
] as const satisfies readonly (keyof typeof SIZES)[]

describe.each(SIZES_TO_TRY)('at %s', (size) => {
  test('a crate is put down, moved, copied and erased, and every step has its way back', async () => {
    journey = await openPage(size)
    const { page } = journey
    await signIn(page)
    await openLevel(page)

    const first = await thingNamed(page, 'crate-1').boundingBox()
    const scale = Number(await page.locator('[data-scale]').first().getAttribute('data-scale'))
    if (first === null || !(scale > 0)) throw new Error('the level is not on screen')
    const tile = (dx: number) => ({
      x: first.x + first.width / 2 + dx * scale,
      y: first.y + first.height / 2,
    })
    const things = () => page.locator('[data-thing^="crate-"]')
    const undo = () => page.locator('[aria-label="Undo"]:visible').first().tap()
    expect(await things().count()).toBe(1)

    // Put a crate down: the Place tool, the crate in the tray, then the level.
    await page.getByRole('button', { name: /^Place/ }).tap()
    await page.locator('[data-character="crate"]').first().tap()
    await page.touchscreen.tap(tile(4).x, tile(4).y)
    await thingNamed(page, 'crate-2').waitFor()
    expect(await things().count()).toBe(2)

    // Pick it up with the pad, one tile.
    await page.getByRole('button', { name: /^Pick/ }).tap()
    await thingNamed(page, 'crate-2').tap()
    const before = await thingNamed(page, 'crate-2').getAttribute('data-x')
    await page.getByRole('button', { name: 'Move', exact: true }).tap()
    await page.locator('button.arrow.right').tap()
    await expect
      .poll(async () => Number(await thingNamed(page, 'crate-2').getAttribute('data-x')))
      .toBe(Number(before) + 1)
    await page.getByRole('button', { name: 'Done', exact: true }).tap()

    // Copy it, then delete the copy.
    await page.getByRole('button', { name: 'Make a copy', exact: true }).tap()
    await expect.poll(() => things().count()).toBe(3)
    await page.getByRole('button', { name: 'Delete', exact: true }).tap()
    await expect.poll(() => things().count()).toBe(2)

    // Erase the first crate with the Erase tool.
    await page.getByRole('button', { name: /^Erase/ }).tap()
    await thingNamed(page, 'crate-1').tap()
    await expect.poll(() => things().count()).toBe(1)

    // Five steps were taken: put, move, copy, delete, erase. Five Undos, and the level is the one that was opened.
    for (let step = 0; step < 5; step += 1) await undo()
    await expect.poll(() => things().count()).toBe(1)
    expect(await thingNamed(page, 'crate-1').getAttribute('data-x')).toBe('6.5')
    await quietButton(page).waitFor()
    expect(fixtureFiles[LEVEL_PATH]).toContain('"crate-1"')
  })
})

// The tray of things to put down (and the ground's, with Paint) is a strip over the level's foot. It leaves the floor and
// what stands on it in sight: the level is drawn in the room above it, at every size, a phone on its side included.
describe.each(Object.keys(SIZES) as (keyof typeof SIZES)[])('the tray at %s', (size) => {
  test.each(['Place', 'Paint'])('%s leaves the crate and the floor under it in sight', async (tool) => {
    journey = await openPage(size)
    const { page } = journey
    await signIn(page)
    await openLevel(page)
    await page
      .getByRole('button', { name: new RegExp(`^${tool}`) })
      .first()
      .click()
    const strip = page.locator('.strip[data-ui]')
    await strip.waitFor()
    await page.waitForTimeout(300)
    const tray = await strip.boundingBox()
    const crate = await thingNamed(page, 'crate-1').boundingBox()
    const scale = Number(await page.locator('[data-scale]').first().getAttribute('data-scale'))
    if (tray === null || crate === null || !(scale > 0))
      throw new Error('the tray or the level is not on screen')
    // The floor is the row of tiles under the crate: all of it above the tray.
    expect(
      tray.y,
      `the tray (top ${Math.round(tray.y)}) covers the floor under the crate (bottom ${Math.round(crate.y + crate.height)}, tile ${Math.round(scale)})`,
    ).toBeGreaterThanOrEqual(crate.y + crate.height + scale - 1)
  })
})
