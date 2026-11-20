import { expect, test } from 'vitest'
import { actOfCommand } from '#src/features/world/keys.ts'

const on = { canPlay: true }

test('what Find offers to do becomes what a key would have done', () => {
  expect(actOfCommand('undo', on)).toEqual({ kind: 'step', which: 'undo' })
  expect(actOfCommand('redo', on)).toEqual({ kind: 'step', which: 'redo' })
  expect(actOfCommand('help', on)).toEqual({ kind: 'help' })
  expect(actOfCommand('duplicate', on)).toEqual({ kind: 'level', command: 'duplicate' })
  expect(actOfCommand('tool:paint', on)).toEqual({ kind: 'tool', tool: 'paint' })
  expect(actOfCommand('place:crate', on)).toEqual({ kind: 'place', character: 'crate' })
})

test('Play is only offered where a level can play, and an unknown command does nothing', () => {
  expect(actOfCommand('play', on)).toEqual({ kind: 'play' })
  expect(actOfCommand('play', { canPlay: false })).toBeUndefined()
  expect(actOfCommand('tool:nonsense', on)).toBeUndefined()
  expect(actOfCommand('nonsense', on)).toBeUndefined()
})
