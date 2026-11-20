import { expect, test } from 'vitest'
import { clock, spotOf } from '#src/features/play/spot.ts'

const one = [{ level: 'a', x: 0, y: 0, w: 16, h: 9 }]
const place = [
  { level: 'a', x: 0, y: 0, w: 16, h: 9 },
  { level: 'b', x: 16, y: 0, w: 16, h: 9 },
]

test('a tap is read back the way the framework fits the level in the box', () => {
  // 480 by 270 holds 16 by 9 at 30 pixels a tile, with no bars.
  expect(spotOf({ w: 480, h: 270 }, one, 'a', { x: 360, y: 90 })).toEqual({ x: 12, y: 3 })
  // A wider box leaves a bar at each side: the level starts 60 pixels in.
  expect(spotOf({ w: 600, h: 270 }, one, 'a', { x: 360, y: 90 })).toEqual({ x: 10, y: 3 })
})

test('a tap on a bar, or on another level of the place, is not a spot', () => {
  expect(spotOf({ w: 600, h: 270 }, one, 'a', { x: 20, y: 90 })).toBeUndefined()
  expect(spotOf({ w: 960, h: 270 }, place, 'a', { x: 700, y: 90 })).toBeUndefined()
  expect(spotOf({ w: 0, h: 0 }, one, 'a', { x: 1, y: 1 })).toBeUndefined()
})

test('in a place the spot is in the opened level own tiles', () => {
  expect(spotOf({ w: 960, h: 270 }, place, 'b', { x: 720, y: 90 })).toEqual({ x: 8, y: 3 })
})

test('the clock says minutes and seconds', () => {
  expect(clock(0, 60)).toBe('0:00')
  expect(clock(60 * 72 + 30, 60)).toBe('1:12')
  expect(clock(-5, 60)).toBe('0:00')
})
