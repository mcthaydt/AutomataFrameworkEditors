import { type Level, loadGame } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import { keepInside, onSolid, snap, solidOf, toScreen, toWorld } from '#src/features/levels/levels.ts'
import { fixtureFiles, LEVEL_PATH, readFrom } from '../../fixtures/game/read.ts'

const loaded = await loadGame(readFrom(fixtureFiles))
if (!loaded.ok) throw new Error('the fixture game did not load')
const content = loaded.value
const level = JSON.parse(fixtureFiles[LEVEL_PATH] ?? '{}') as Level
const solid = solidOf(content, level)
const box = { w: 1, h: 1 }

test('with the meadow tileset G is solid and the rest is not; with no tileset only # is', () => {
  expect(solid('G')).toBe(true)
  expect(['.', '~', '#'].map(solid)).toEqual([false, false, false])
  const bare = solidOf(content, { ...level, tileset: undefined })
  expect(['#', 'G', '.'].map(bare)).toEqual([true, false, false])
  // A tileset the game does not have, while it is being fixed, is read as no tileset.
  expect(solidOf(content, { ...level, tileset: 'nowhere' })('#')).toBe(true)
})

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
  expect(onSolid(level, box, { x: 6.5, y: 7.5 }, solid)).toBe(false))
test('half a tile lower is', () => expect(onSolid(level, box, { x: 6.5, y: 8 }, solid)).toBe(true))
test('flowers are not solid, so a crate may stand in them', () =>
  expect(onSolid(level, box, { x: 2.5, y: 5.5 }, solid)).toBe(false))
test('the wall is solid, and touching its edge is not', () => {
  expect(onSolid(level, box, { x: 0.5, y: 3.5 }, solid)).toBe(true)
  expect(onSolid(level, box, { x: 1.5, y: 3.5 }, solid)).toBe(false)
})
test('a box outside the tiles is not on anything', () =>
  expect(onSolid(level, box, { x: 30, y: -4 }, solid)).toBe(false))

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
