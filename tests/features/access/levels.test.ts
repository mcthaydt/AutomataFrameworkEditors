import { expect, test } from 'vitest'
import { type AccessLevel, type Action, can, higher, LEVELS } from '#src/features/access/access.ts'

const ACTIONS: readonly Action[] = ['look', 'save', 'approve', 'save-direct', 'share']

test.each([
  ['nothing', []],
  ['look', ['look']],
  ['suggest', ['look', 'save']],
  ['approve', ['look', 'save', 'approve']],
  ['edit', ['look', 'save', 'approve', 'save-direct']],
  ['owner', ['look', 'save', 'approve', 'save-direct', 'share']],
] as const)('%s can %j and nothing else', (level, allowed) => {
  expect(ACTIONS.filter((action) => can(level, action))).toEqual(allowed)
})

test('the levels run from nothing up to owner, each one able to do what the one before it can', () => {
  expect(LEVELS).toEqual(['nothing', 'look', 'suggest', 'approve', 'edit', 'owner'])
  for (let i = 1; i < LEVELS.length; i++) {
    const below = LEVELS[i - 1] as AccessLevel
    const level = LEVELS[i] as AccessLevel
    for (const action of ACTIONS) if (can(below, action)) expect(can(level, action)).toBe(true)
  }
})

test('higher gives the higher of two levels, either way round', () => {
  expect(higher('look', 'suggest')).toBe('suggest')
  expect(higher('edit', 'approve')).toBe('edit')
  expect(higher('nothing', 'nothing')).toBe('nothing')
  expect(higher('owner', 'look')).toBe('owner')
})
