import { type Level, loadGame, writeContent } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import {
  hold,
  link,
  mayOpen,
  rowsOf,
  setValue,
  shared,
  unlink,
  waysOut,
} from '#src/features/levels/values.ts'
import { readFrom } from '../../fixtures/game/read.ts'
import { linksMap } from '../../fixtures/links-game/read.ts'

const loaded = await loadGame(readFrom(linksMap()))
if (!loaded.ok) throw new Error('the links game did not load')
const { characters, levels } = loaded.value
const room1 = levels['room-1'] as Level
const room2 = levels['room-2'] as Level

const reach = characters.critter?.values?.find((v) => v.id === 'reach')
if (reach?.type !== 'number') throw new Error('the critter has no reach')

const levelOf = (done: { ok: boolean }): Level => {
  if (!('value' in done)) throw new Error('expected a level')
  return done.value as Level
}
const thing = (level: Level, id: string) => level.things.find((t) => t.id === id)
/** The links game with one level swapped in, read the way a real game is read. */
async function loadsWith(id: string, level: Level): Promise<boolean> {
  const files = linksMap()
  files.set(`content/levels/${id}.json`, writeContent('level', level as never))
  return (await loadGame(readFrom(files))).ok
}

/** Room 2 with the critter holding only its own reach. */
const critterOnly: Level = {
  ...room2,
  things: room2.things.map((t) =>
    t.id === 'critter-1' ? { id: t.id, character: t.character, x: t.x, y: t.y, values: { reach: 5 } } : t,
  ),
}

test('hold keeps a number inside its limits and on its step', () => {
  expect(hold(reach, 9)).toBe(8)
  expect(hold(reach, 0)).toBe(1)
  expect(hold(reach, 3.4)).toBe(3.5)
  expect(hold(reach, 3.5)).toBe(3.5)
  expect(hold({ ...reach, step: undefined }, 3.4)).toBe(3.4)
})

test("a thing's values come in its character's order, then any it does not declare", () => {
  const rows = rowsOf(
    { id: 'critter-9', character: 'critter', x: 1, y: 1, values: { speed: 7, reach: 5 } },
    characters.critter,
  )
  expect(rows.map((r) => r.id)).toEqual(['walk', 'reach', 'speed'])
  expect(rows[0]).toMatchObject({ value: undefined, own: false })
  expect(rows[1]).toMatchObject({ value: 5, own: true })
  expect(rows[2]).toEqual({ id: 'speed', declaration: undefined, value: 7, own: true })
})

test('a value the thing leaves out shows its default and is not its own', () => {
  const rows = rowsOf(thing(room2, 'critter-1') as never, characters.critter)
  expect(rows.find((r) => r.id === 'reach')).toMatchObject({ value: 3, own: false })
  expect(rowsOf({ id: 'x-1', character: 'ghost', x: 1, y: 1, values: { a: 1 } }, undefined)).toEqual([
    { id: 'a', declaration: undefined, value: 1, own: true },
  ])
})

test('a number is set held to its declaration, and the file stays valid', async () => {
  const level = levelOf(setValue(room2, characters, 'critter-1', 'reach', 9))
  expect(thing(level, 'critter-1')?.values).toMatchObject({ reach: 8 })
  expect(await loadsWith('room-2', level)).toBe(true)
})

test('the default is taken out of the file, and no values object is left when it was the last', async () => {
  const level = levelOf(setValue(critterOnly, characters, 'critter-1', 'reach', 3))
  expect(thing(level, 'critter-1')).toEqual({ id: 'critter-1', character: 'critter', x: 7.5, y: 7.5 })
  expect(setValue(critterOnly, characters, 'critter-1', 'reach', undefined)).toMatchObject({ ok: true })
  expect(await loadsWith('room-2', level)).toBe(true)
})

test('setting what is already held is the same', () => {
  expect(setValue(critterOnly, characters, 'critter-1', 'reach', 5)).toEqual({ ok: false, why: 'same' })
  expect(setValue(room2, characters, 'critter-1', 'reach', 3)).toEqual({ ok: false, why: 'same' })
})

test('a switch, a choice and a way into a level are set as their kind', async () => {
  const stays = levelOf(setValue(room2, characters, 'button-1', 'stays', false))
  expect(thing(stays, 'button-1')?.values).toEqual({ opens: ['gate-1'] })
  const to = levelOf(setValue(room2, characters, 'door-in', 'to', { level: 'room-3' }))
  expect(thing(to, 'door-in')?.values).toEqual({ to: { level: 'room-3' } })
  expect(await loadsWith('room-2', to)).toBe(true)
  expect(setValue(room2, characters, 'button-1', 'stays', 'yes' as never)).toEqual({
    ok: false,
    why: 'not-allowed',
  })
  expect(setValue(room2, characters, 'critter-1', 'reach', 'far' as never)).toEqual({
    ok: false,
    why: 'not-allowed',
  })
})

test('a path value, a link by setValue and a value the character lacks are not allowed', () => {
  expect(setValue(room2, characters, 'critter-1', 'walk', [{ x: 1, y: 1 }] as never)).toEqual({
    ok: false,
    why: 'not-allowed',
  })
  expect(setValue(room2, characters, 'button-1', 'opens', ['gate-1'])).toEqual({
    ok: false,
    why: 'not-allowed',
  })
  expect(setValue(room2, characters, 'critter-1', 'speed', 3)).toEqual({ ok: false, why: 'not-allowed' })
  expect(setValue(room2, characters, 'dragon-1', 'reach', 3)).toEqual({ ok: false, why: 'no-such-thing' })
})

test('a plate may open exactly the gates, and never itself', () => {
  expect(mayOpen(room1, characters, 'plate-1', 'opens')).toEqual(['gate-1'])
  expect(mayOpen(room1, characters, 'crate-1', 'opens')).toEqual([])
  expect(mayOpen(room1, characters, 'plate-1', 'nothing')).toEqual([])
  expect(mayOpen(room1, characters, 'dragon', 'opens')).toEqual([])
})

/** Room 1 with six gates, and the plate holding the first four. */
const gates: Level = {
  ...room1,
  things: [
    ...room1.things.map((t) =>
      t.id === 'plate-1' ? { ...t, values: { opens: ['gate-1', 'gate-2', 'gate-3', 'gate-4'] } } : t,
    ),
    ...[2, 3, 4, 5].map((n) => ({ id: `gate-${n}`, character: 'gate', x: 1.25 + n, y: 4 })),
  ],
}

test('a fifth link is the limit, and a full plate offers only what it holds', () => {
  expect(link(gates, characters, 'plate-1', 'opens', 'gate-5')).toEqual({ ok: false, why: 'limit' })
  expect(mayOpen(gates, characters, 'plate-1', 'opens')).toEqual(['gate-1', 'gate-2', 'gate-3', 'gate-4'])
})

test('linking adds to the list, and unlinking takes one out, and both leave a valid game', async () => {
  const fewer = levelOf(unlink(gates, 'plate-1', 'opens', 'gate-2'))
  expect(thing(fewer, 'plate-1')?.values).toEqual({ opens: ['gate-1', 'gate-3', 'gate-4'] })
  const again = levelOf(link(fewer, characters, 'plate-1', 'opens', 'gate-5'))
  expect(thing(again, 'plate-1')?.values).toEqual({ opens: ['gate-1', 'gate-3', 'gate-4', 'gate-5'] })
  expect(await loadsWith('room-1', again)).toBe(true)
  const none = levelOf(unlink(room1, 'plate-1', 'opens', 'gate-1'))
  expect(thing(none, 'plate-1')?.values).toEqual({ opens: [] })
})

test('a link to what cannot be opened, to itself, twice, or to nothing is refused', () => {
  expect(link(room1, characters, 'plate-1', 'opens', 'crate-1')).toEqual({ ok: false, why: 'not-allowed' })
  expect(link(room1, characters, 'plate-1', 'opens', 'plate-1')).toEqual({ ok: false, why: 'not-allowed' })
  expect(link(room1, characters, 'plate-1', 'opens', 'gate-1')).toEqual({ ok: false, why: 'same' })
  expect(link(room1, characters, 'plate-1', 'opens', 'dragon')).toEqual({ ok: false, why: 'no-such-thing' })
  expect(link(room1, characters, 'crate-1', 'opens', 'gate-1')).toEqual({ ok: false, why: 'not-allowed' })
  expect(unlink(room1, 'plate-1', 'opens', 'crate-1')).toEqual({ ok: false, why: 'same' })
  expect(unlink(room1, 'dragon', 'opens', 'gate-1')).toEqual({ ok: false, why: 'no-such-thing' })
})

test('a value that holds one link is a single id, and unlinking takes the value out', () => {
  const one = {
    ...characters,
    plate: {
      ...characters.plate,
      values: [{ id: 'opens', name: 'Opens', type: 'thing' as const, kinds: ['gate'] }],
    },
  }
  const bare: Level = {
    ...room1,
    things: room1.things.map((t) => (t.id === 'plate-1' ? { ...t, values: undefined } : t)),
  }
  const linkedOne = levelOf(link(bare, one as never, 'plate-1', 'opens', 'gate-1'))
  expect(thing(linkedOne, 'plate-1')?.values).toEqual({ opens: 'gate-1' })
  expect(link(linkedOne, one as never, 'plate-1', 'opens', 'gate-1')).toEqual({ ok: false, why: 'same' })
  const gone = levelOf(unlink(linkedOne, 'plate-1', 'opens', 'gate-1'))
  expect(thing(gone, 'plate-1')).toEqual({ id: 'plate-1', character: 'plate', x: 8.5, y: 7.875 })
})

test('several things share a value when they all hold it, and show mixed when they differ', () => {
  const a = rowsOf(thing(room2, 'critter-1') as never, characters.critter)
  const b = rowsOf(
    { id: 'critter-2', character: 'critter', x: 2, y: 2, values: { reach: 6 } },
    characters.critter,
  )
  const c = rowsOf({ id: 'critter-3', character: 'critter', x: 3, y: 3 }, characters.critter)
  const both = shared([a, b])
  expect(both.map((row) => row.id)).toEqual(['walk', 'reach'])
  expect(both[1]).toEqual({ id: 'reach', mixed: true })
  expect(shared([a, c]).find((row) => row.id === 'reach')).toMatchObject({ value: 3, own: false })
  expect(shared([a, rowsOf(thing(room1, 'crate-1') as never, characters.crate)])).toEqual([])
  expect(shared([])).toEqual([])
  expect(shared([a])).toEqual(a)
})

test('a door leads to every level but its own, and to the doors in them', () => {
  expect(waysOut(levels, characters, 'room-1')).toEqual([
    { level: 'room-2', things: ['door-in'] },
    { level: 'room-3', things: ['back'] },
  ])
  expect(waysOut(levels, characters, 'room-3').map((w) => w.level)).toEqual(['room-1', 'room-2'])
})
