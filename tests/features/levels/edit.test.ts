import { type Character, type Level, loadGame, writeContent } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import {
  addThing,
  canErase,
  describeChange,
  eraseThing,
  isDirty,
  type LevelEdit,
  type LevelRules,
  moveThing,
  nudgeThing,
  placeOf,
  redo,
  rulesOf,
  setCharacter,
  sizeOf,
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

const same = (a: LevelEdit, b: LevelEdit): boolean => JSON.stringify(a.now) === JSON.stringify(b.now)
const twoStarts: Level = { ...level, starts: [...level.starts, { player: 2, x: 4.5, y: 7.5 }] }
const held: Level = {
  ...level,
  things: [...level.things, { id: 'plank-1', character: 'crate', x: 9.5, y: 7.5 }],
  joints: [
    { id: 'j-1', kind: 'pin', thing: 'plank-1', x: 9.5, y: 7.5 },
    { id: 'j-2', kind: 'pin', thing: 'plank-1', holder: 'crate-1', x: 9.5, y: 6.5 },
    { id: 'j-3', kind: 'pin', thing: 'crate-1', x: 6.5, y: 7.5 },
  ],
}

test('every change pushes a step and empties what was undone', () => {
  const moved = moveThing(startEdit(level), rules, 'crate-1', { x: 8.5, y: 7.5 }).edit
  expect(moved.past).toEqual([level])
  expect(moved.future).toEqual([])
  const back = undo(moved)
  expect(back.future).toEqual([moved.now])
  const again = nudgeThing(back, rules, 'crate-1', 'up').edit
  expect(again.future).toEqual([])
})

test('undo then redo gives the changed level back, and redo with nothing undone is the same edit', () => {
  const moved = moveThing(startEdit(level), rules, 'crate-1', { x: 8.5, y: 7.5 }).edit
  expect(JSON.stringify(redo(undo(moved)).now)).toBe(JSON.stringify(moved.now))
  expect(redo(moved)).toBe(moved)
})

test('three undos and three redos of a move, an add and an erase end where they started', () => {
  let edit = startEdit(level)
  edit = moveThing(edit, rules, 'crate-1', { x: 8.5, y: 7.5 }).edit
  edit = addThing(edit, rules, 'crate', { x: 4.5, y: 7.5 }).edit
  edit = eraseThing(edit, 'crate-1')
  const end = edit
  for (let i = 0; i < 3; i++) edit = undo(edit)
  expect(edit.now).toBe(level)
  for (let i = 0; i < 3; i++) edit = redo(edit)
  expect(same(edit, end)).toBe(true)
})

test('a new crate at 6.7, 3.4 is crate-2, snapped and kept inside', () => {
  const added = addThing(startEdit(level), rules, 'crate', { x: 6.7, y: 3.4 })
  expect(added.added).toBe(true)
  expect(added.added && added.id).toBe('crate-2')
  expect(added.edit.now.things.at(-1)).toEqual({ id: 'crate-2', character: 'crate', x: 6.5, y: 3.5 })
})

test('a new thing is kept inside the level', () => {
  const far = addThing(startEdit(level), rules, 'hero', { x: -20, y: 3.5 })
  // The left wall is grass, so the box pushed to the edge is on solid ground.
  expect(far).toMatchObject({ added: false, why: 'solid' })
  const up = addThing(startEdit(level), rules, 'crate', { x: 8.5, y: -20 })
  expect(up.added && up.edit.now.things.at(-1)).toMatchObject({ x: 8.5, y: 0.5 })
})

test('a new thing in a solid tile, or of an unknown character, is refused and says why', () => {
  const start = startEdit(level)
  const inWall = addThing(start, rules, 'crate', { x: 15.5, y: 7.5 })
  expect(inWall).toEqual({ edit: start, added: false, why: 'solid' })
  expect(addThing(start, rules, 'dragon', { x: 6.5, y: 3.5 })).toEqual({
    edit: start,
    added: false,
    why: 'no-such-character',
  })
})

test('a start point can be erased only while another is left', () => {
  expect(canErase(level, 'start-1')).toBe(false)
  expect(canErase(twoStarts, 'start-1')).toBe(true)
  expect(canErase(level, 'crate-1')).toBe(true)
  expect(canErase(level, 'dragon-1')).toBe(false)
})

test('erasing the last start point, or something that is not there, changes nothing', () => {
  const start = startEdit(level)
  expect(eraseThing(start, 'start-1')).toBe(start)
  expect(eraseThing(start, 'dragon-1')).toBe(start)
})

test('erasing a thing a joint holds drops that joint, and the level still passes the framework', () => {
  const erased = eraseThing(startEdit(held), 'plank-1')
  expect(erased.now.things.map((t) => t.id)).toEqual(['crate-1'])
  expect(erased.now.joints?.map((j) => j.id)).toEqual(['j-3'])
  expect(() => writeContent('level', erased.now)).not.toThrow()
  const gone = eraseThing(startEdit(held), 'crate-1')
  expect(gone.now.joints?.map((j) => j.id)).toEqual(['j-1'])
})

test('the last joint going leaves no joint list, and a level without one stays without', () => {
  const only: Level = {
    ...held,
    things: held.things.filter((t) => t.id === 'plank-1'),
    joints: held.joints?.slice(0, 1),
  }
  expect('joints' in eraseThing(startEdit(only), 'plank-1').now).toBe(false)
  expect('joints' in eraseThing(startEdit(level), 'crate-1').now).toBe(false)
})

test('a second start point can be erased, and the other stays', () => {
  const erased = eraseThing(startEdit(twoStarts), 'start-1')
  expect(erased.now.starts).toEqual([{ player: 2, x: 4.5, y: 7.5 }])
  expect(erased.past).toHaveLength(1)
})

test('another character keeps the thing’s name and place', () => {
  const turned = setCharacter(startEdit(level), rules, 'crate-1', 'hero')
  expect(turned.now.things[0]).toEqual({ id: 'crate-1', character: 'hero', x: 6.5, y: 7.5 })
  expect(describeChange(turned)).toBe('Make crate-1 a hero in level-1')
})

test('another character that would stick out of the level is kept inside it', () => {
  const edge: Level = { ...level, things: [{ id: 'crate-1', character: 'crate', x: 1.5, y: 0.5 }] }
  const crate = rules.characters.crate as Character
  const big: LevelRules = {
    ...rules,
    characters: { ...rules.characters, giant: { ...crate, id: 'giant', size: { w: 3, h: 3 } } },
  }
  const turned = setCharacter(startEdit(edge), big, 'crate-1', 'giant')
  expect(turned.now.things[0]).toEqual({ id: 'crate-1', character: 'giant', x: 1.5, y: 1.5 })
  expect(turned.past).toEqual([edge])
})

test('an unknown character, an unknown thing or the same character changes nothing', () => {
  const start = startEdit(level)
  expect(setCharacter(start, rules, 'crate-1', 'dragon')).toBe(start)
  expect(setCharacter(start, rules, 'dragon-1', 'hero')).toBe(start)
  expect(setCharacter(start, rules, 'crate-1', 'crate')).toBe(start)
})

test('a start point moves like a thing, at the hero’s size', () => {
  expect(sizeOf(rules, level, 'start-1')).toEqual({ w: 0.8, h: 1 })
  expect(sizeOf(rules, level, 'crate-1')).toEqual({ w: 1, h: 1 })
  expect(placeOf(level, 'start-1')).toEqual({ x: 2.5, y: 7.5 })
  expect(placeOf(level, 'crate-1')).toEqual({ x: 6.5, y: 7.5 })
  expect(placeOf(level, 'dragon-1')).toBeUndefined()
  const moved = moveThing(startEdit(level), rules, 'start-1', { x: 4.6, y: 7.5 })
  expect(moved.moved).toBe(true)
  expect(moved.edit.now.starts[0]).toEqual({ player: 1, x: 4.5, y: 7.5 })
  expect(describeChange(moved.edit)).toBe('Move start-1 in level-1')
  expect(nudgeThing(startEdit(level), rules, 'start-1', 'right').edit.now.starts[0]?.x).toBe(3)
  expect(moveThing(startEdit(level), rules, 'start-1', { x: 15.5, y: 7.5 })).toMatchObject({ why: 'solid' })
})

test('describeChange for each kind of change', () => {
  const start = startEdit(level)
  const added = addThing(start, rules, 'crate', { x: 4.5, y: 3.5 }).edit
  expect(describeChange(added)).toBe('Add crate-2 to level-1')
  expect(describeChange(eraseThing(start, 'crate-1'))).toBe('Erase crate-1 from level-1')
  const mixed = eraseThing(added, 'crate-1')
  expect(describeChange(mixed)).toBe('Change level-1')
  const one = addThing(start, rules, 'crate', { x: 4.5, y: 3.5 }).edit
  expect(describeChange(addThing(one, rules, 'crate', { x: 8.5, y: 3.5 }).edit)).toBe('Change level-1')
  expect(describeChange(start)).toBe('')
})
