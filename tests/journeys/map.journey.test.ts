// The world map on every size: opened from the top bar on the links game, with every level, its doors and the bar where
// two of them meet in sight.
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

const SIZES_TO_TRY = [
  'ipadSideways',
  'ipadUpright',
  'phone',
] as const satisfies readonly (keyof typeof SIZES)[]

describe.each(SIZES_TO_TRY)('at %s', (size) => {
  test('the map opens from the top bar with every level and its marks in sight', async () => {
    journey = await openPage(size)
    const { page } = journey
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
    expect(await page.locator('[data-level]').count()).toBe(3)
    expect(await page.locator('[data-mark="join"]').count()).toBe(1)
    expect(await page.locator('[data-mark="door"]').count()).toBe(3)
    await page.waitForTimeout(400)
    await picture(page, `map-${size}`)
  })
})
