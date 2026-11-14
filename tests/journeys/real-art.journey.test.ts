// The demo game's level as a visitor sees it: drawn in the game's own art, not as boxes. The buttons over the picture
// prove where a thing is for a finger; these read the picture itself, at every size.
import { afterEach, describe, expect, test } from 'vitest'
import {
  dragByTouch,
  type JourneyPage,
  openPage,
  pictureColourBeside,
  pictureColourUnder,
  SIZES,
  setupJourneys,
  thingNamed,
} from '../fixtures/journey.ts'
import { WORDS } from '../fixtures/words.ts'

setupJourneys()

let journey: JourneyPage | undefined
afterEach(async () => {
  const found = (await journey?.problems()) ?? []
  await journey?.close()
  journey = undefined
  expect(found).toEqual([])
})

/** What a game with no pictures would draw: the sky, and the crate's box colour. */
const SKY = '#9fd3f0'
const CRATE_BOX = '#c9a227'
const pictureAsks = (j: JourneyPage): string[] =>
  j.requests.filter((r) => r.includes('/api/picture?')).map((r) => r.replace(/^GET /, ''))

describe.each(Object.keys(SIZES) as (keyof typeof SIZES)[])('at %s', (size) => {
  test('a visitor sees the demo level in its art, and the art follows a drag', async () => {
    const j = await openPage(size)
    journey = j
    await j.page.getByRole('button', { name: WORDS.tryIt }).click()
    await j.page.getByRole('link', { name: 'level-1' }).click()
    await thingNamed(j.page, 'crate-1').waitFor()

    // The crate is its figure's picture: not the sky behind it, and not the box a game with no pictures draws.
    await expect.poll(() => pictureColourUnder(j.page, 'crate-1')).not.toBe(SKY)
    const crate = await pictureColourUnder(j.page, 'crate-1')
    expect(crate).not.toBe(CRATE_BOX)

    await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
    await expect.poll(() => thingNamed(j.page, 'crate-1').getAttribute('data-x')).toBe('8.5')
    // The same picture is now under the crate's button, and is gone from where it was.
    await expect.poll(() => pictureColourUnder(j.page, 'crate-1')).toBe(crate)
    await expect.poll(() => pictureColourBeside(j.page, 'crate-1', -2)).not.toBe(crate)

    // Each picture was asked for once, and the first visit loaded no physics.
    const asks = pictureAsks(j)
    expect(new Set(asks).size).toBe(asks.length)
    for (const name of [
      'figures/crate.png',
      'figures/hero.png',
      'figures/meadow.png',
      'backdrops/valley.png',
    ])
      expect(
        asks.some((ask) => decodeURIComponent(ask).includes(`content/${name}`)),
        name,
      ).toBe(true)
    expect(j.requests.filter((r) => r.includes('.wasm'))).toEqual([])
  })
})
