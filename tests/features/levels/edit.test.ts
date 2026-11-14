import { type Level, loadGame, writeContent } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import {
  describeChange,
  isDirty,
  moveThing,
  nudgeThing,
  rulesOf,
  startEdit,
  undo,
} from '#src/features/levels/levels.ts'
import { fixtureFiles, LEVEL_PATH, readFrom } from '../../fixtures/game/read.ts'

const loaded = await loadGame(readFrom(fixtureFiles))
if (!loaded.ok) throw new Error('the fixture game did not load')
const content = loaded.value
const level = JSON.parse(fixtureFiles[LEVEL_PATH] ?? '{}') as Level
const rules = rulesOf(content, level)

test('dragging the crate two tiles right', () => {
  const m = moveThing(startEdit(level), rules, 'crate-1', { x: 8.6, y: 7.4 })
  expect(m.moved).toBe(true)
  expect(m.edit.now.things[0]).toEqual({ id: 'crate-1', character: 'crate', x: 8.5, y: 7.5 })
  expect(m.edit.opened).toBe(level)
  expect(describeChange(m.edit)).toBe('Move crate-1 in level-1')
})

test('dropping it in the wall (a grass tile) leaves it where it was, and says solid', () => {
  const start = startEdit(level)
  const m = moveThing(start, rules, 'crate-1', { x: 15.5, y: 7.5 })
  expect(m).toEqual({ edit: start, moved: false, why: 'solid' })
})

test('a move to the same spot changes nothing and adds no undo step', () => {
  const m = moveThing(startEdit(level), rules, 'crate-1', { x: 6.6, y: 7.4 })
  expect(m.moved).toBe(false)
  expect(m.moved === false && m.why).toBe('same')
  expect(m.edit.past).toEqual([])
})

test('an id that is not in the level is no-such-thing', () => {
  const m = moveThing(startEdit(level), rules, 'dragon-1', { x: 3.5, y: 3.5 })
  expect(m.moved === false && m.why).toBe('no-such-thing')
  expect(nudgeThing(startEdit(level), rules, 'dragon-1', 'left').moved).toBe(false)
})

test('four nudges right move two tiles', () => {
  let edit = startEdit(level)
  for (let i = 0; i < 4; i++) {
    const m = nudgeThing(edit, rules, 'crate-1', 'right')
    expect(m.moved).toBe(true)
    edit = m.edit
  }
  expect(edit.now.things[0]).toMatchObject({ x: 8.5, y: 7.5 })
  expect(edit.past).toHaveLength(4)
})

test('a nudge into the floor says solid', () => {
  const m = nudgeThing(startEdit(level), rules, 'crate-1', 'down')
  expect(m.moved === false && m.why).toBe('solid')
})

test('undo steps back one move at a time, and stops at the opened level', () => {
  let edit = startEdit(level)
  edit = nudgeThing(edit, rules, 'crate-1', 'right').edit
  edit = nudgeThing(edit, rules, 'crate-1', 'up').edit
  expect(edit.now.things[0]).toMatchObject({ x: 7, y: 7 })
  edit = undo(edit)
  expect(edit.now.things[0]).toMatchObject({ x: 7, y: 7.5 })
  edit = undo(edit)
  expect(edit.now).toBe(level)
  expect(undo(edit)).toBe(edit)
})

test('moved away and back is not dirty, and describes nothing', () => {
  const away = nudgeThing(startEdit(level), rules, 'crate-1', 'right').edit
  expect(isDirty(away)).toBe(true)
  const back = nudgeThing(away, rules, 'crate-1', 'left').edit
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
  edit = moveThing(edit, rules, 'crate-1', { x: 8.5, y: 7.5 }).edit
  edit = moveThing(edit, rules, 'crate-2', { x: 4.5, y: 7.5 }).edit
  expect(describeChange(edit)).toBe('Move 2 things in level-1')
})

test('a thing whose character the game lacks still moves, as a one-tile box', () => {
  const odd: Level = { ...level, things: [{ id: 'x-1', character: 'ghost', x: 3.5, y: 3.5 }] }
  expect(moveThing(startEdit(odd), { ...rules, characters: {} }, 'x-1', { x: 4.5, y: 3.5 }).moved).toBe(true)
})

test('the edited level still passes the framework: writeContent does not throw', () => {
  const m = moveThing(startEdit(level), rules, 'crate-1', { x: 8.6, y: 7.4 })
  expect(() => writeContent('level', m.edit.now)).not.toThrow()
})

test('the rules name the project’s hero and take solid from the level’s tileset', () => {
  expect(rules.hero).toBe('hero')
  expect(rules.solid('G')).toBe(true)
  expect(rules.solid('.')).toBe(false)
  // The flowers are the tileset's decoration: nothing stops a crate standing on them.
  expect(rules.solid('~')).toBe(false)
})

test('moveThing refuses a place inside a grass tile', () => {
  const m = moveThing(startEdit(level), rules, 'crate-1', { x: 0.5, y: 3.5 })
  expect(m.moved === false && m.why).toBe('solid')
})
