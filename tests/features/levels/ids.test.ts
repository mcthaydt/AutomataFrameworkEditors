import type { Level } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import { nextId } from '#src/features/levels/levels.ts'
import { fixtureFiles, LEVEL_PATH } from '../../fixtures/game/read.ts'

const level = JSON.parse(fixtureFiles[LEVEL_PATH] ?? '{}') as Level
const withIds = (...ids: string[]): Level => ({
  ...level,
  things: ids.map((id) => ({ id, character: 'crate', x: 3.5, y: 7.5 })),
})

test('the first of a character is number one', () => {
  expect(nextId(level, 'hero')).toBe('hero-1')
})

test('the next number after the ones taken', () => {
  expect(nextId(level, 'crate')).toBe('crate-2')
})

test('a gap is filled, lowest first', () => {
  expect(nextId(withIds('crate-1', 'crate-3'), 'crate')).toBe('crate-2')
  expect(nextId(withIds('crate-2', 'crate-3'), 'crate')).toBe('crate-1')
})

test('another character’s numbers do not count', () => {
  expect(nextId(withIds('crate-1', 'spark-1'), 'spark')).toBe('spark-2')
})
