import { type Level, loadGame } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import { joinFacts } from '#src/features/levels/joins.ts'
import { tagFacts } from '#src/features/levels/tags.ts'
import { opens, putAt, setValues, whereIs } from '#src/features/levels/values.ts'
import { readFrom } from '../../fixtures/game/read.ts'
import { linksMap } from '../../fixtures/links-game/read.ts'

const loaded = await loadGame(readFrom(linksMap()))
if (!loaded.ok) throw new Error('the links game did not load')
const { characters, levels } = loaded.value
const room1 = levels['room-1'] as Level
const room2 = levels['room-2'] as Level
const levelOf = (done: { ok: boolean }): Level => {
  if (!('value' in done)) throw new Error('expected a level')
  return done.value as Level
}
const thing = (level: Level, id: string) => level.things.find((t) => t.id === id)

test('what a switch opens is replaced when it may open only one, and "nothing" takes it away', () => {
  // The plate may open up to four gates, so what it opens stays a list.
  const without = levelOf(opens(room1, characters, 'plate-1', 'opens', undefined))
  expect(thing(without, 'plate-1')?.values).toBeUndefined()
  expect(opens(without, characters, 'plate-1', 'opens', undefined)).toEqual({ ok: false, why: 'same' })
  const again = levelOf(opens(without, characters, 'plate-1', 'opens', 'gate-1'))
  expect(thing(again, 'plate-1')?.values).toEqual({ opens: ['gate-1'] })
})

test('a switch is never made to open what it may not', () => {
  expect(opens(room1, characters, 'plate-1', 'opens', 'crate-1')).toEqual({ ok: false, why: 'not-allowed' })
  expect(opens(room1, characters, 'plate-1', 'opens', 'plate-1')).toEqual({ ok: false, why: 'not-allowed' })
  expect(opens(room1, characters, 'crate-1', 'opens', 'gate-1')).toEqual({ ok: false, why: 'not-allowed' })
})

test('one value set on several things is set on all of them, or on none', () => {
  const two = {
    ...room2,
    things: [...room2.things, { id: 'critter-2', character: 'critter', x: 4.5, y: 7.5 }],
  }
  const done = levelOf(setValues(two, characters, ['critter-1', 'critter-2'], 'reach', 9))
  expect(thing(done, 'critter-1')?.values).toMatchObject({ reach: 8 })
  expect(thing(done, 'critter-2')?.values).toEqual({ reach: 8 })
  // A thing whose character lacks the value stops the whole change.
  const mixed = setValues(two, characters, ['critter-1', 'crate-1'], 'reach', 2)
  expect(mixed).toEqual({ ok: false, why: 'not-allowed' })
  expect(setValues(two, characters, [], 'reach', 2)).toEqual({ ok: false, why: 'no-such-thing' })
})

test('where a thing is is said from its left edge and top edge, and put there by moving it', () => {
  const crate = thing(room1, 'crate-1')
  if (crate === undefined) throw new Error('no crate')
  const where = whereIs(room1, characters, crate)
  expect(where).toEqual({ left: 5, top: 7, leftMost: 15, topMost: 8 })
  const moved = levelOf(putAt(room1, characters, 'crate-1', 'x', 8))
  expect(thing(moved, 'crate-1')?.x).toBe(8.5)
  expect(putAt(room1, characters, 'crate-1', 'x', 5)).toEqual({ ok: false, why: 'same' })
  expect(putAt(room1, characters, 'crate-1', 'x', 40)).toEqual({ ok: false, why: 'outside' })
})

test('the values worth a tag are the number, choice and words values, a changed switch and a way into a level', () => {
  const facts = tagFacts(room1, characters)
  expect(facts.map((f) => `${f.thing.id}:${f.declaration.id}`)).toEqual(['exit:to'])
  const room2Facts = tagFacts(room2, characters)
  // The critter's reach is drawn as a ring, not a tag; its path is a line. The button holds a switch at its non-default.
  expect(room2Facts.map((f) => `${f.thing.id}:${f.declaration.id}`)).toEqual(['door-in:to', 'button-1:stays'])
})

test('each thing a switch opens gets a line, from the switch to the thing', () => {
  expect(joinFacts(room1, characters)).toEqual([{ from: 'plate-1', value: 'opens', to: 'gate-1' }])
  const dangling = {
    ...room1,
    things: room1.things.map((t) =>
      t.id === 'plate-1' ? { ...t, values: { opens: ['gate-1', 'gone'] } } : t,
    ),
  }
  expect(joinFacts(dangling, characters)).toEqual([{ from: 'plate-1', value: 'opens', to: 'gate-1' }])
})
