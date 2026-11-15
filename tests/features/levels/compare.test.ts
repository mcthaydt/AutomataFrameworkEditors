import type { Level } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import { compareLevels } from '#src/features/levels/levels.ts'
import { fixtureFiles, LEVEL_PATH } from '../../fixtures/game/read.ts'

const level = JSON.parse(fixtureFiles[LEVEL_PATH] ?? '{}') as Level

test('the crate moved is one move with both points', () => {
  const after: Level = { ...level, things: level.things.map((t) => ({ ...t, x: 8.5 })) }
  expect(compareLevels(level, after)).toEqual({
    moved: [{ id: 'crate-1', from: { x: 6.5, y: 7.5 }, to: { x: 8.5, y: 7.5 } }],
    other: 0,
  })
})

test('nothing changed is no move and nothing else', () => {
  expect(compareLevels(level, level)).toEqual({ moved: [], other: 0 })
})

test('a thing added and one taken away are two others and no moves', () => {
  const after: Level = { ...level, things: [{ id: 'crate-2', character: 'crate', x: 3.5, y: 7.5 }] }
  expect(compareLevels(level, after)).toEqual({ moved: [], other: 2 })
})

test('tiles changed is one other', () => {
  const tiles = [...level.tiles]
  tiles[0] = `#${'#'.repeat(14)}#`
  expect(compareLevels(level, { ...level, tiles })).toEqual({ moved: [], other: 1 })
})

test('a thing given another character is an other, not a move', () => {
  const after: Level = { ...level, things: level.things.map((t) => ({ ...t, character: 'hero' })) }
  expect(compareLevels(level, after)).toEqual({ moved: [], other: 1 })
})
