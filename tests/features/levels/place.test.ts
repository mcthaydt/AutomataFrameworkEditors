import type { Level } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import { onSolid, snap } from '#src/features/levels/place.ts'
import { fixtureFiles, LEVEL_PATH } from '../../fixtures/game/read.ts'

const level = JSON.parse(fixtureFiles[LEVEL_PATH] ?? '{}') as Level
const box = { w: 1, h: 1 }

test.each([
  [6.74, 6.5],
  [6.75, 7],
  [-0.2, 0],
  [8.5, 8.5],
])('snap(%f) is %f', (value, want) => expect(snap(value)).toBe(want))

test('standing on the floor is not inside it', () =>
  expect(onSolid(level, box, { x: 6.5, y: 7.5 })).toBe(false))
test('half a tile lower is', () => expect(onSolid(level, box, { x: 6.5, y: 8 })).toBe(true))
test('the wall is solid, and touching its edge is not', () => {
  expect(onSolid(level, box, { x: 0.5, y: 3.5 })).toBe(true)
  expect(onSolid(level, box, { x: 1.5, y: 3.5 })).toBe(false)
})
test('a box outside the tiles is not on anything', () =>
  expect(onSolid(level, box, { x: 30, y: -4 })).toBe(false))
