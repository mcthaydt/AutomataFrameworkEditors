// The four faults the owner's pictures showed, each pictured at the size it showed on and measured: the Move card over two
// joined rooms (iPad sideways), the Join hint (phone), a whole level on the phone's map, and the thing's menu (iPad upright).
import type { Locator, Page } from 'playwright'
import { afterEach, describe, expect, test } from 'vitest'
import {
  type JourneyPage,
  openGame,
  openMapOf,
  openPage,
  picture,
  settled,
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

interface Box {
  x: number
  y: number
  width: number
  height: number
}
async function boxOf(where: Locator): Promise<Box> {
  const box = await where.boundingBox()
  if (box === null) throw new Error('nothing there to measure')
  return box
}
const overlap = (a: Box, b: Box): boolean =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
const inside = (a: Box, frame: Box): boolean =>
  a.x >= frame.x - 1 &&
  a.y >= frame.y - 1 &&
  a.x + a.width <= frame.x + frame.width + 1 &&
  a.y + a.height <= frame.y + frame.height + 1

async function openLinksMap(page: Page): Promise<void> {
  await signIn(page)
  await openMapOf(page)
}

describe('the pictures the owner showed', () => {
  test('issue 1: the Move card covers none of the three rooms, on iPad sideways', async () => {
    journey = await openPage('ipadSideways')
    const { page } = journey
    await openLinksMap(page)
    await page.locator('[data-level="room-3"]').click()
    await page.getByRole('button', { name: 'Move', exact: true }).click()
    await page.locator('.pad.glass-2').waitFor()
    const card = await boxOf(page.locator('.pad.glass-2'))
    for (const id of ['room-1', 'room-2', 'room-3']) {
      expect(overlap(card, await boxOf(page.locator(`[data-level="${id}"]`))), `the card covers ${id}`).toBe(
        false,
      )
    }
    await settled(page)
    await picture(page, 'issue-1-move-card')
  })

  test('issue 2: the Join hint covers neither the plate nor the gate, on a phone', async () => {
    journey = await openPage('phone')
    const { page } = journey
    await signIn(page)
    await openGame(page, 'links-game')
    await thingNamed(page, 'plate-1').waitFor()
    await page.getByRole('button', { name: /^Join/ }).click()
    await page.locator('[data-line]').waitFor()
    await page.locator('[data-line]').click()
    await page.getByRole('button', { name: 'Take this line away' }).click()
    const hint = page.locator('.hint')
    await hint.waitFor({ timeout: 20_000 })
    const at = await boxOf(hint)
    for (const id of ['plate-1', 'gate-1']) {
      expect(overlap(at, await boxOf(thingNamed(page, id))), `the hint covers ${id}`).toBe(false)
    }
    await settled(page)
    await picture(page, 'issue-2-join-hint')
  })

  test('issue 3: the whole of room 1 is in view on the map, on a phone', async () => {
    journey = await openPage('phone')
    const { page } = journey
    await openLinksMap(page)
    await page.locator('[data-level="room-1"]').click()
    await page.getByRole('toolbar').waitFor()
    const stage = await boxOf(page.locator('[data-scale]').first())
    const room = await boxOf(page.locator('[data-level="room-1"]'))
    expect(inside(room, stage), 'room 1 runs off the map').toBe(true)
    await settled(page)
    await picture(page, 'issue-3-map-whole')
  })

  test('issue 4: "Where it is" stays in sight when a list in the settings is used, on iPad upright', async () => {
    journey = await openPage('ipadUpright')
    const { page } = journey
    await signIn(page)
    await openGame(page, 'links-game')
    await thingNamed(page, 'plate-1').click()
    const folded = page.locator('button[data-tour="settings"]')
    if ((await folded.count()) > 0) await folded.first().click()
    const body = page.locator('aside.panel .body')
    await body.waitFor()
    const list = page.locator('[data-value="opens"] .opens')
    await list.getByRole('button', { name: 'Nothing' }).click()
    await page
      .locator('[data-value="opens"] .opens button[aria-pressed="true"]', { hasText: 'Nothing' })
      .waitFor()
    expect(
      inside(await boxOf(page.locator('[data-group="where"] h3')), await boxOf(body)),
      '"Where it is" is out of sight',
    ).toBe(true)
    await settled(page)
    await picture(page, 'issue-4-dropdown')
  })
})
