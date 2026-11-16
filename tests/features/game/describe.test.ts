import type { Level, LevelThing } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import type { Working } from '#src/features/game/changes.ts'
import { type ChangeLine, describe, titleOf } from '#src/features/game/describe.ts'

const thing = (id: string, x = 2.5, y = 3.5, over: Partial<LevelThing> = {}): LevelThing => ({
  id,
  character: 'crate',
  x,
  y,
  ...over,
})
const level = (id: string, things: readonly LevelThing[], over: Partial<Level> = {}): Level => ({
  format: 1,
  id,
  tiles: ['....', '....', '####'],
  things,
  starts: [{ player: 1, x: 1.5, y: 1.5 }],
  ...over,
})
const working = (levels: readonly Level[], world?: Working['world']): Working => ({
  levels: Object.fromEntries(levels.map((l) => [l.id, l])),
  world,
  project: '',
})

const one = level('level-1', [thing('crate-1'), thing('crate-2', 4.5)])
const before = working([one])

test('nothing changed is no line, and a crate moved and moved back is no line', () => {
  expect(describe(before, before)).toEqual([])
  const away = working([level('level-1', [thing('crate-1', 6.5), thing('crate-2', 4.5)])])
  expect(describe(before, away)).toHaveLength(1)
  const back = working([level('level-1', [thing('crate-1'), thing('crate-2', 4.5)])])
  expect(describe(before, back)).toEqual([])
})

test('one crate moved is one moved line', () => {
  const after = working([level('level-1', [thing('crate-1', 6.5), thing('crate-2', 4.5)])])
  expect(describe(before, after)).toEqual([{ kind: 'moved', level: 'level-1', thing: 'crate-1' }])
})

test('painted tiles are one ground line, however many tiles', () => {
  const after = working([level('level-1', one.things, { tiles: ['####', '####', '####'] })])
  expect(describe(before, after)).toEqual([{ kind: 'ground', level: 'level-1' }])
})

test('starts, the look and the joints are each one line of the level', () => {
  const changed = level('level-1', one.things, {
    starts: [{ player: 1, x: 3.5, y: 1.5 }],
    sky: '#112233',
    joints: [{ id: 'j', kind: 'pin', thing: 'crate-1', x: 1, y: 1 }],
  })
  const after = working([changed])
  expect(describe(before, after).map((line) => line.kind)).toEqual(['start', 'look', 'joined'])
})

test('a thing added, taken away, given another character or other values is a line each', () => {
  const plate = thing('crate-2', 4.5, 3.5, { character: 'plate' })
  const after = working([level('level-1', [plate, thing('crate-3', 6.5)])])
  expect(describe(before, after)).toEqual([
    { kind: 'settings', level: 'level-1', thing: 'crate-2' },
    { kind: 'added', level: 'level-1', thing: 'crate-3' },
    { kind: 'deleted', level: 'level-1', thing: 'crate-1' },
  ])
  const crate1 = thing('crate-1', 2.5, 3.5, { values: { opens: ['g'] } })
  const valued = working([level('level-1', [crate1, thing('crate-2', 4.5)])])
  expect(describe(before, valued)).toEqual([{ kind: 'settings', level: 'level-1', thing: 'crate-1' }])
})

test('a thing taken away and the same thing added under another id is one renamed line', () => {
  const after = working([level('level-1', [thing('box-1'), thing('crate-2', 4.5)])])
  expect(describe(before, after)).toEqual([{ kind: 'renamed', level: 'level-1', thing: 'box-1' }])
})

test('things in another order are one order line, naming the first thing out of its place', () => {
  const after = working([level('level-1', [thing('crate-2', 4.5), thing('crate-1')])])
  expect(describe(before, after)).toEqual([{ kind: 'order', level: 'level-1', thing: 'crate-2' }])
})

test('a new level is one level-new line and no line for its things, nor for its place on the map', () => {
  const world = { format: 1 as const, id: 'world', levels: [{ level: 'level-1', at: { x: 0, y: 0 } }] }
  const room = level('level-2', [thing('crate-9'), thing('crate-8')])
  const placed = { ...world, levels: [...world.levels, { level: 'level-2', at: { x: 20, y: 0 } }] }
  const after = working([one, room], placed)
  expect(describe(working([one], world), after)).toEqual([{ kind: 'level-new', level: 'level-2' }])
})

test('a level taken away is one level-deleted line, and one renamed is one level-renamed line', () => {
  const room = level('level-2', [thing('crate-9')])
  const both = working([one, room])
  expect(describe(both, working([one]))).toEqual([{ kind: 'level-deleted', level: 'level-2' }])
  const renamed = working([one, { ...room, id: 'level-3' }])
  expect(describe(both, renamed)).toEqual([{ kind: 'level-renamed', level: 'level-3' }])
})

test('a level put somewhere else on the map is one level-moved line', () => {
  const at = (x: number): Working['world'] => ({
    format: 1,
    id: 'world',
    levels: [{ level: 'level-1', at: { x, y: 0 } }],
  })
  const lines = describe(working([one], at(0)), working([one], at(8)))
  expect(lines).toEqual([{ kind: 'level-moved', level: 'level-1' }])
})

test('titleOf has the three forms, and nothing for nothing', () => {
  const moved: ChangeLine = { kind: 'moved', level: 'level-1', thing: 'crate-1' }
  expect(titleOf([])).toBe('')
  expect(titleOf([moved])).toBe('Move Crate 1 in Level 1')
  const ground: ChangeLine = { kind: 'ground', level: 'level-1' }
  const three: ChangeLine[] = [moved, ground, { kind: 'start', level: 'level-1' }]
  expect(titleOf(three)).toBe('3 changes in Level 1')
  const five: ChangeLine[] = [
    moved,
    ground,
    { kind: 'level-new', level: 'level-2' },
    { kind: 'added', level: 'level-2', thing: 'crate-1' },
    { kind: 'level-moved', level: 'level-3' },
  ]
  expect(titleOf(five)).toBe('5 changes in 3 levels')
})

test('titleOf says each kind of single change in a few plain words', () => {
  const words = (line: ChangeLine) => titleOf([line])
  expect(words({ kind: 'added', level: 'level-1', thing: 'crate-1' })).toBe('Add Crate 1 in Level 1')
  expect(words({ kind: 'deleted', level: 'level-1', thing: 'crate-1' })).toBe('Delete Crate 1 in Level 1')
  expect(words({ kind: 'renamed', level: 'level-1', thing: 'box-1' })).toBe('Rename Box 1 in Level 1')
  expect(words({ kind: 'settings', level: 'level-1', thing: 'crate-1' })).toBe('Change Crate 1 in Level 1')
  expect(words({ kind: 'ground', level: 'level-1' })).toBe('Paint Level 1')
  expect(words({ kind: 'level-new', level: 'level-2' })).toBe('Make Level 2')
  expect(words({ kind: 'level-deleted', level: 'level-2' })).toBe('Delete Level 2')
  expect(words({ kind: 'level-moved', level: 'level-2' })).toBe('Move Level 2 on the map')
  expect(words({ kind: 'level-renamed', level: 'level-3' })).toBe('Rename to Level 3')
})
