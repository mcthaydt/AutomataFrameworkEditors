import { type Character, type Level, writeContent } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import {
  describeChange,
  isDirty,
  moveThing,
  nudgeThing,
  startEdit,
  undo,
} from '#src/features/levels/levels.ts'
import { fixtureFiles, LEVEL_PATH } from '../../fixtures/game/read.ts'

const level = JSON.parse(fixtureFiles[LEVEL_PATH] ?? '{}') as Level
const characters: Record<string, Character> = {
  crate: JSON.parse(fixtureFiles['content/characters/crate.json'] ?? '{}'),
  hero: JSON.parse(fixtureFiles['content/characters/hero.json'] ?? '{}'),
}

test('dragging the crate two tiles right', () => {
  const m = moveThing(startEdit(level), characters, 'crate-1', { x: 8.6, y: 7.4 })
  expect(m.moved).toBe(true)
  expect(m.edit.now.things[0]).toEqual({ id: 'crate-1', character: 'crate', x: 8.5, y: 7.5 })
  expect(m.edit.opened).toBe(level)
  expect(describeChange(m.edit)).toBe('Move crate-1 in level-1')
})

test('dropping it in the wall leaves it where it was, and says solid', () => {
  const start = startEdit(level)
  const m = moveThing(start, characters, 'crate-1', { x: 15.5, y: 7.5 })
  expect(m).toEqual({ edit: start, moved: false, why: 'solid' })
})

test('a move to the same spot changes nothing and adds no undo step', () => {
  const m = moveThing(startEdit(level), characters, 'crate-1', { x: 6.6, y: 7.4 })
  expect(m.moved).toBe(false)
  expect(m.moved === false && m.why).toBe('same')
  expect(m.edit.past).toEqual([])
})

test('an id that is not in the level is no-such-thing', () => {
  const m = moveThing(startEdit(level), characters, 'dragon-1', { x: 3.5, y: 3.5 })
  expect(m.moved === false && m.why).toBe('no-such-thing')
  expect(nudgeThing(startEdit(level), characters, 'dragon-1', 'left').moved).toBe(false)
})

test('four nudges right move two tiles', () => {
  let edit = startEdit(level)
  for (let i = 0; i < 4; i++) {
    const m = nudgeThing(edit, characters, 'crate-1', 'right')
    expect(m.moved).toBe(true)
    edit = m.edit
  }
  expect(edit.now.things[0]).toMatchObject({ x: 8.5, y: 7.5 })
  expect(edit.past).toHaveLength(4)
})

test('a nudge into the floor says solid', () => {
  const m = nudgeThing(startEdit(level), characters, 'crate-1', 'down')
  expect(m.moved === false && m.why).toBe('solid')
})

test('undo steps back one move at a time, and stops at the opened level', () => {
  let edit = startEdit(level)
  edit = nudgeThing(edit, characters, 'crate-1', 'right').edit
  edit = nudgeThing(edit, characters, 'crate-1', 'up').edit
  expect(edit.now.things[0]).toMatchObject({ x: 7, y: 7 })
  edit = undo(edit)
  expect(edit.now.things[0]).toMatchObject({ x: 7, y: 7.5 })
  edit = undo(edit)
  expect(edit.now).toBe(level)
  expect(undo(edit)).toBe(edit)
})

test('moved away and back is not dirty, and describes nothing', () => {
  const away = nudgeThing(startEdit(level), characters, 'crate-1', 'right').edit
  expect(isDirty(away)).toBe(true)
  const back = nudgeThing(away, characters, 'crate-1', 'left').edit
  expect(isDirty(back)).toBe(false)
  expect(describeChange(back)).toBe('')
  expect(isDirty(startEdit(level))).toBe(false)
})

test('several things moved are told as a count', () => {
  const two: Level = {
    ...level,
    things: [...level.things, { id: 'crate-2', character: 'crate', x: 3.5, y: 7.5 }],
  }
  let edit = startEdit(two)
  edit = moveThing(edit, characters, 'crate-1', { x: 8.5, y: 7.5 }).edit
  edit = moveThing(edit, characters, 'crate-2', { x: 4.5, y: 7.5 }).edit
  expect(describeChange(edit)).toBe('Move 2 things in level-1')
})

test('a thing whose character the game lacks still moves, as a one-tile box', () => {
  const odd: Level = { ...level, things: [{ id: 'x-1', character: 'ghost', x: 3.5, y: 3.5 }] }
  expect(moveThing(startEdit(odd), {}, 'x-1', { x: 4.5, y: 3.5 }).moved).toBe(true)
})

test('the edited level still passes the framework: writeContent does not throw', () => {
  const m = moveThing(startEdit(level), characters, 'crate-1', { x: 8.6, y: 7.4 })
  expect(() => writeContent('level', m.edit.now)).not.toThrow()
})
