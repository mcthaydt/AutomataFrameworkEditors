import type { Level } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import { keepInside, onSolid, snap, toScreen, toWorld } from '#src/features/levels/levels.ts'
import { fixtureFiles, LEVEL_PATH } from '../../fixtures/game/read.ts'

const level = JSON.parse(fixtureFiles[LEVEL_PATH] ?? '{}') as Level
const box = { w: 1, h: 1 }

test.each([
  [6.74, 6.5],
  [6.75, 7],
  [-0.2, 0],
  [8.5, 8.5],
])('snap(%f) is %f', (value, want) => expect(snap(value)).toBe(want))

test('a box dragged past the right edge stops with its side on the edge', () =>
  expect(keepInside(level, box, { x: 40, y: 3.5 })).toEqual({ x: 15.5, y: 3.5 }))

test('a box dragged above the top stops at the top', () =>
  expect(keepInside(level, box, { x: 4.5, y: -9 })).toEqual({ x: 4.5, y: 0.5 }))

test('a box dragged past the left and bottom edges stops there, and never at -0', () => {
  expect(keepInside(level, box, { x: -5, y: 40 })).toEqual({ x: 0.5, y: 8.5 })
  expect(Object.is(keepInside(level, { w: 0, h: 0 }, { x: -0.1, y: -0.1 }).x, 0)).toBe(true)
})

test('a bigger box keeps its whole self inside', () =>
  expect(keepInside(level, { w: 2, h: 2 }, { x: 40, y: 40 })).toEqual({ x: 15, y: 8 }))

test('standing on the floor is not inside it', () =>
  expect(onSolid(level, box, { x: 6.5, y: 7.5 })).toBe(false))
test('half a tile lower is', () => expect(onSolid(level, box, { x: 6.5, y: 8 })).toBe(true))
test('the wall is solid, and touching its edge is not', () => {
  expect(onSolid(level, box, { x: 0.5, y: 3.5 })).toBe(true)
  expect(onSolid(level, box, { x: 1.5, y: 3.5 })).toBe(false)
})
test('a box outside the tiles is not on anything', () =>
  expect(onSolid(level, box, { x: 30, y: -4 })).toBe(false))

const fit = { scale: 48, left: 26, top: 100 }
test('toWorld undoes toScreen', () => {
  const at = { x: 6.5, y: 7.5 }
  const px = toScreen(fit, at)
  expect(px).toEqual({ x: 26 + 6.5 * 48, y: 100 + 7.5 * 48 })
  expect(toWorld(fit, px)).toEqual(at)
})

test('a stage with no size gives the origin, not NaN', () => {
  expect(toWorld({ scale: 0, left: 0, top: 0 }, { x: 10, y: 10 })).toEqual({ x: 0, y: 0 })
  expect(toWorld({ scale: Number.NaN, left: 0, top: 0 }, { x: 10, y: 10 })).toEqual({ x: 0, y: 0 })
})
