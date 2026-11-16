import { type Level, loadGame } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import {
  copyThings,
  deleteThings,
  isId,
  moveStart,
  moveThings,
  nextId,
  nudgeThings,
  onlyOne,
  placeThing,
  renameThing,
} from '#src/features/levels/things.ts'
import { readFrom } from '../../fixtures/game/read.ts'
import { linksMap } from '../../fixtures/links-game/read.ts'

const loaded = await loadGame(readFrom(linksMap()))
if (!loaded.ok) throw new Error('the links game did not load')
const characters = loaded.value.characters
const room1 = loaded.value.levels['room-1'] as Level
const room2 = loaded.value.levels['room-2'] as Level
const room3 = loaded.value.levels['room-3'] as Level

const idsOf = (level: Level): string[] => level.things.map((t) => t.id)
const thing = (level: Level, id: string) => level.things.find((t) => t.id === id)
const levelOf = (value: { ok: boolean }): Level => {
  if (!('value' in value)) throw new Error('expected a level')
  return value.value as Level
}

test('two things move together by one step, and keep their place in the file', () => {
  const done = moveThings(room1, characters, ['crate-1', 'gate-1'], { x: 1.2, y: 0 }, false)
  expect(done.ok).toBe(true)
  const level = levelOf(done)
  expect(thing(level, 'crate-1')).toMatchObject({ x: 6.5, y: 7.5 })
  expect(thing(level, 'gate-1')).toMatchObject({ x: 12.25, y: 4 })
  expect(idsOf(level)).toEqual(idsOf(room1))
})

test('lining up moves by whole tiles', () => {
  const level = levelOf(moveThings(room1, characters, ['crate-1'], { x: 1.4, y: -0.6 }, true))
  expect(thing(level, 'crate-1')).toMatchObject({ x: 6.5, y: 6.5 })
})

test('two things moved together where one would hit solid: neither moves', () => {
  const done = moveThings(room1, characters, ['crate-1', 'gate-1'], { x: 0, y: 1 }, false)
  expect(done).toEqual({ ok: false, why: 'solid' })
})

test('a move off the level is outside, to nowhere is same, and an unknown id is no-such-thing', () => {
  expect(moveThings(room1, characters, ['crate-1'], { x: 40, y: 0 }, false)).toEqual({
    ok: false,
    why: 'outside',
  })
  expect(moveThings(room1, characters, ['crate-1'], { x: 0.1, y: 0 }, false)).toEqual({
    ok: false,
    why: 'same',
  })
  expect(moveThings(room1, characters, ['dragon-1'], { x: 1, y: 0 }, false)).toEqual({
    ok: false,
    why: 'no-such-thing',
  })
  expect(moveThings(room1, characters, [], { x: 1, y: 0 }, false)).toEqual({
    ok: false,
    why: 'no-such-thing',
  })
})

test('a nudge is one tile', () => {
  const level = levelOf(nudgeThings(room1, characters, ['crate-1'], 'left'))
  expect(thing(level, 'crate-1')).toMatchObject({ x: 4.5, y: 7.5 })
  expect(nudgeThings(room1, characters, ['crate-1'], 'down')).toEqual({ ok: false, why: 'solid' })
})

test('a thing whose character the game lacks moves as a 1 by 1 box and is otherwise left as it is', () => {
  const odd: Level = {
    ...room1,
    things: [...room1.things, { id: 'ghost-1', character: 'ghost', x: 3.5, y: 3.5 }],
  }
  const level = levelOf(moveThings(odd, characters, ['ghost-1'], { x: 1, y: 0 }, false))
  expect(thing(level, 'ghost-1')).toEqual({ id: 'ghost-1', character: 'ghost', x: 4.5, y: 3.5 })
  expect(thing(level, 'crate-1')).toBe(thing(odd, 'crate-1'))
  expect(moveThings(odd, characters, ['ghost-1'], { x: 0, y: 5 }, false)).toEqual({ ok: false, why: 'solid' })
})

test('the next id is the lowest free number', () => {
  const level: Level = {
    ...room1,
    things: [
      { id: 'crate-1', character: 'crate', x: 5.5, y: 7.5 },
      { id: 'crate-3', character: 'crate', x: 6.5, y: 7.5 },
    ],
  }
  expect(nextId(level, 'crate')).toBe('crate-2')
  expect(nextId(level, 'plate')).toBe('plate-1')
})

test('a new thing has no values and goes last', () => {
  const done = placeThing(room1, characters, 'crate', { x: 3.4, y: 7.5 })
  expect(done.ok).toBe(true)
  if (!done.ok) return
  expect(done.value.id).toBe('crate-2')
  expect(done.value.replaced).toBeUndefined()
  expect(done.value.level.things.at(-1)).toEqual({ id: 'crate-2', character: 'crate', x: 3.5, y: 7.5 })
})

test('placing in a wall, off the level, or a character the game lacks is refused', () => {
  expect(placeThing(room1, characters, 'crate', { x: 3.5, y: 8.5 })).toEqual({ ok: false, why: 'solid' })
  expect(placeThing(room1, characters, 'crate', { x: -3, y: 3 })).toEqual({ ok: false, why: 'outside' })
  expect(placeThing(room1, characters, 'ghost', { x: 3.5, y: 3.5 })).toEqual({
    ok: false,
    why: 'not-allowed',
  })
})

test('a one-per-level thing placed again is moved, keeps its id, and says what it replaced', () => {
  expect(onlyOne(room3, characters, 'goal')).toBe('goal-1')
  expect(onlyOne(room3, characters, 'crate')).toBeUndefined()
  const done = placeThing(room3, characters, 'goal', { x: 5.5, y: 7.5 })
  expect(done.ok).toBe(true)
  if (!done.ok) return
  expect(done.value).toMatchObject({ id: 'goal-1', replaced: 'goal-1' })
  expect(done.value.level.things.filter((t) => t.character === 'goal')).toHaveLength(1)
  expect(thing(done.value.level, 'goal-1')).toMatchObject({ x: 5.5, y: 7.5 })
})

test('a copy keeps its values but not a link to the thing it came from', () => {
  const crowd: Level = {
    ...room1,
    things: room1.things.map((t) =>
      t.id === 'plate-1' ? { ...t, values: { opens: ['gate-1', 'plate-1'] } } : t,
    ),
  }
  const done = copyThings(crowd, characters, ['plate-1'], { x: 1, y: 0 })
  expect(done.ok).toBe(true)
  if (!done.ok) return
  expect(done.value.ids).toEqual(['plate-2'])
  expect(thing(done.value.level, 'plate-2')).toEqual({
    id: 'plate-2',
    character: 'plate',
    x: 9.5,
    y: 7.875,
    values: { opens: ['gate-1'] },
  })
  expect(thing(done.value.level, 'plate-1')).toBe(thing(crowd, 'plate-1'))
})

test('copying two things gives each its own id, and a copy in a wall or a one-per-level thing is refused', () => {
  const done = copyThings(room1, characters, ['crate-1', 'plate-1'], { x: 1, y: 0 })
  expect(done.ok && done.value.ids).toEqual(['crate-2', 'plate-2'])
  expect(copyThings(room1, characters, ['crate-1'], { x: 0, y: 1 })).toEqual({ ok: false, why: 'solid' })
  expect(copyThings(room3, characters, ['goal-1'], { x: 1, y: 0 })).toEqual({ ok: false, why: 'not-allowed' })
  expect(copyThings(room1, characters, ['crate-1'], { x: 0.1, y: 0 })).toEqual({ ok: false, why: 'same' })
  expect(copyThings(room1, characters, ['nope'], { x: 1, y: 0 })).toEqual({ ok: false, why: 'no-such-thing' })
})

test("deleting a gate empties it from a plate's opens", () => {
  const level = levelOf(deleteThings(room1, ['gate-1']))
  expect(idsOf(level)).toEqual(['crate-1', 'plate-1', 'exit'])
  expect(thing(level, 'plate-1')?.values).toEqual({ opens: [] })
  expect(deleteThings(room1, ['dragon'])).toEqual({ ok: false, why: 'no-such-thing' })
  expect(deleteThings(room1, [])).toEqual({ ok: false, why: 'no-such-thing' })
})

test('deleting a thing takes out the joints that held it or were held by it', () => {
  const joined: Level = {
    ...room1,
    joints: [
      { id: 'j-1', kind: 'rope', thing: 'crate-1' },
      { id: 'j-2', kind: 'rope', thing: 'gate-1', holder: 'crate-1' },
      { id: 'j-3', kind: 'rope', thing: 'gate-1' },
    ] as never,
  }
  const level = levelOf(deleteThings(joined, ['crate-1']))
  expect(level.joints?.map((j) => (j as { id: string }).id)).toEqual(['j-3'])
  const bare = levelOf(deleteThings(joined, ['crate-1', 'gate-1']))
  expect(bare.joints).toBeUndefined()
})

test('renaming a gate mends the plate that opens it', () => {
  const level = levelOf(renameThing(room1, 'gate-1', 'Big Gate'))
  expect(idsOf(level)).toEqual(['crate-1', 'plate-1', 'big-gate', 'exit'])
  expect(thing(level, 'plate-1')?.values).toEqual({ opens: ['big-gate'] })
})

test('renaming mends the joints too', () => {
  const joined: Level = {
    ...room1,
    joints: [{ id: 'j-2', kind: 'rope', thing: 'gate-1', holder: 'crate-1' }] as never,
  }
  const level = levelOf(renameThing(joined, 'crate-1', 'box'))
  expect(level.joints).toEqual([{ id: 'j-2', kind: 'rope', thing: 'gate-1', holder: 'box' }])
})

test('a name already in use is taken, the same name is same, nonsense is not-allowed', () => {
  expect(renameThing(room1, 'gate-1', 'Crate 1')).toEqual({ ok: false, why: 'taken' })
  expect(renameThing(room1, 'gate-1', 'gate 1')).toEqual({ ok: false, why: 'same' })
  expect(renameThing(room1, 'gate-1', '!!!')).toEqual({ ok: false, why: 'not-allowed' })
  expect(renameThing(room1, 'dragon', 'Fire')).toEqual({ ok: false, why: 'no-such-thing' })
})

test("a hero's start moves, and a wall, the same place or a player with no start are refused", () => {
  const level = levelOf(moveStart(room2, characters, 'hero', 1, { x: 4.4, y: 7.5 }))
  expect(level.starts.find((s) => s.player === 1)).toMatchObject({ x: 4.5, y: 7.5 })
  expect(level.starts.find((s) => s.player === 2)).toMatchObject({ x: 3.5, y: 7.5 })
  expect(moveStart(room2, characters, 'hero', 1, { x: 2.5, y: 7.5 })).toEqual({ ok: false, why: 'same' })
  expect(moveStart(room2, characters, 'hero', 1, { x: 0.5, y: 7.5 })).toEqual({ ok: false, why: 'solid' })
  expect(moveStart(room2, characters, 'hero', 3, { x: 4.5, y: 7.5 })).toEqual({
    ok: false,
    why: 'no-such-thing',
  })
})

test('an id is lower-case words joined by dashes, starting with a letter', () => {
  expect(['crate-1', 'big-gate', 'a'].every(isId)).toBe(true)
  expect(['', '1-crate', 'Crate', 'big--gate', '-gate', 'gate-', 'a'.repeat(65)].some(isId)).toBe(false)
})

test('a single link to a thing is taken out when it goes, and follows it when it is renamed', () => {
  const single: Level = {
    ...room1,
    things: room1.things.map((t) => (t.id === 'plate-1' ? { ...t, values: { opens: 'gate-1' } } : t)),
  }
  const gone = levelOf(deleteThings(single, ['gate-1']))
  expect(thing(gone, 'plate-1')).toEqual({ id: 'plate-1', character: 'plate', x: 8.5, y: 7.875 })
  const renamed = levelOf(renameThing(single, 'gate-1', 'big gate'))
  expect(thing(renamed, 'plate-1')?.values).toEqual({ opens: 'big-gate' })
})
