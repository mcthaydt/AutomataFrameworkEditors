import type { Level } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import { compareLevels } from '#src/features/levels/levels.ts'
import { fixtureFiles, LEVEL_PATH } from '../../fixtures/game/read.ts'

const level = JSON.parse(fixtureFiles[LEVEL_PATH] ?? '{}') as Level
const NONE = { moved: [], added: [], erased: [], retyped: [], other: 0 }

test('the crate moved is one move with both points', () => {
  const after: Level = { ...level, things: level.things.map((t) => ({ ...t, x: 8.5 })) }
  expect(compareLevels(level, after)).toEqual({
    ...NONE,
    moved: [{ id: 'crate-1', from: { x: 6.5, y: 7.5 }, to: { x: 8.5, y: 7.5 } }],
  })
})

test('nothing changed is nothing', () => {
  expect(compareLevels(level, level)).toEqual(NONE)
})

test('a thing added is an add, and one taken away is an erase', () => {
  const after: Level = { ...level, things: [{ id: 'crate-2', character: 'crate', x: 3.5, y: 7.5 }] }
  expect(compareLevels(level, after)).toEqual({ ...NONE, added: ['crate-2'], erased: ['crate-1'] })
})

test('tiles changed is one other', () => {
  const tiles = [...level.tiles]
  tiles[0] = `#${'#'.repeat(14)}#`
  expect(compareLevels(level, { ...level, tiles })).toEqual({ ...NONE, other: 1 })
})

test('a thing given another character is a retype, not a move', () => {
  const after: Level = { ...level, things: level.things.map((t) => ({ ...t, character: 'hero' })) }
  expect(compareLevels(level, after)).toEqual({ ...NONE, retyped: ['crate-1'] })
})

test('a start point that moved is a move, by its hit id', () => {
  const after: Level = { ...level, starts: level.starts.map((s) => ({ ...s, x: 3.5 })) }
  expect(compareLevels(level, after)).toEqual({
    ...NONE,
    moved: [{ id: 'start-1', from: { x: 2.5, y: 7.5 }, to: { x: 3.5, y: 7.5 } }],
  })
})

test('a start point added or taken away is one other each', () => {
  const two: Level = { ...level, starts: [...level.starts, { player: 2, x: 4.5, y: 7.5 }] }
  expect(compareLevels(level, two)).toEqual({ ...NONE, other: 1 })
  expect(compareLevels(two, level)).toEqual({ ...NONE, other: 1 })
})
