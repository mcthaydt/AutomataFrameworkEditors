import { expect, test } from 'vitest'
import { mainButton, statusOf } from '#src/features/shell/shell.ts'
import type { Waiting } from '#src/features/wire/wire.ts'

const mine: Waiting = { number: 3, title: 'Move Crate 1', by: 'sam', mine: true, checks: 'passing' }
const calm = { online: true, problems: 0, changes: 0, mine: undefined, toCheck: 0 }

test('the main button puts changes in for an Edit or an Owner, sends them for a Suggest or an Approve', () => {
  expect(mainButton('edit', true, 2)).toBe('put')
  expect(mainButton('owner', true, 1)).toBe('put')
  expect(mainButton('suggest', true, 1)).toBe('send')
  expect(mainButton('approve', true, 5)).toBe('send')
})

test('the main button keeps a copy for a visitor and for someone who may only look', () => {
  expect(mainButton('edit', false, 2)).toBe('keep')
  expect(mainButton('look', true, 2)).toBe('keep')
})

test('with no change there is no main button', () => {
  for (const level of ['look', 'suggest', 'approve', 'edit', 'owner'] as const) {
    expect(mainButton(level, true, 0)).toBeUndefined()
    expect(mainButton(level, false, 0)).toBeUndefined()
  }
})

test('nothing wrong and nothing changed says up to date', () => {
  expect(statusOf(calm)).toEqual([{ kind: 'up-to-date' }])
})

test('changes of a person who has sent nothing say how many', () => {
  expect(statusOf({ ...calm, changes: 3 })).toEqual([{ kind: 'changes', count: 3 }])
})

test('the bar says no internet first, then problems, then the changes, then what waits to be checked', () => {
  const said = statusOf({ online: false, problems: 2, changes: 1, mine: undefined, toCheck: 4 })
  expect(said.map((s) => s.kind)).toEqual(['offline', 'problems', 'changes', 'to-check'])
  expect(said[1]).toEqual({ kind: 'problems', count: 2 })
  expect(said[3]).toEqual({ kind: 'to-check', count: 4 })
})

test('a change that was sent says who has it, and "send more" only when there are new changes', () => {
  expect(statusOf({ ...calm, mine, approver: 'Mia' })).toEqual([{ kind: 'waiting', by: 'Mia' }])
  expect(statusOf({ ...calm, mine, changes: 2, approver: 'Mia' })).toEqual([
    { kind: 'more', count: 2, by: 'Mia' },
  ])
  expect(statusOf({ ...calm, mine })).toEqual([{ kind: 'waiting', by: '' }])
})

test('a change someone asked to be changed is not waiting: the bar says who asked, and sending names them (design round 1, R4)', () => {
  const asked = { ...mine, asked: { by: 'grandpa', words: 'Nearer the gate', at: 1 } }
  expect(statusOf({ ...calm, mine: asked, approver: 'grandma' })).toEqual([{ kind: 'asked', by: 'grandpa' }])
  expect(statusOf({ ...calm, mine: asked, approver: 'grandma', changes: 1 })).toEqual([
    { kind: 'more', count: 1, by: 'grandpa' },
  ])
})
