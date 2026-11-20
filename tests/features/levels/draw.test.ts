import { type Level, LevelSchema } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import { change, startEdits, toPut } from '#src/features/game/changes.ts'
import { DRAWS, drawOf, setDraw } from '#src/features/levels/draw.ts'
import { linksFiles } from '../../fixtures/links-game/links.ts'
import { openedGame } from '../../fixtures/open-game.ts'

const links = await openedGame(linksFiles())
const room1 = links.content.levels['room-1'] as Level
const ids = room1.things.map((t) => t.id)
const levelOf = (done: { ok: boolean }): Level => {
  if (!('value' in done)) throw new Error('expected a level')
  return done.value as Level
}

test('the three draws are in the order the control shows them', () => {
  expect(DRAWS).toEqual(['behind', 'with-hero', 'in-front'])
})

test('a thing with no draw is drawn with the hero', () => {
  expect(drawOf(room1.things[0] as Level['things'][number])).toBe('with-hero')
})

test('setDraw keeps things in the same order with the same ids, and the file passes the schema', () => {
  const crate = ids[0] as string
  const done = setDraw(room1, [crate], 'in-front')
  expect(done.ok).toBe(true)
  const level = levelOf(done)
  expect(level.things.map((t) => t.id)).toEqual(ids)
  expect(level.things.find((t) => t.id === crate)?.draw).toBe('in-front')
  expect(LevelSchema.safeParse(level).success).toBe(true)
})

test('with-hero takes the key out: a file never holds the default', () => {
  const crate = ids[0] as string
  const front = levelOf(setDraw(room1, [crate], 'behind'))
  const back = levelOf(setDraw(front, [crate], 'with-hero'))
  expect(back.things.find((t) => t.id === crate)).not.toHaveProperty('draw')
  expect(back).toEqual(room1)
})

test('several things change together, and the others stay as they are', () => {
  const picked = ids.slice(0, 2)
  const level = levelOf(setDraw(room1, picked, 'behind'))
  for (const id of picked) expect(level.things.find((t) => t.id === id)?.draw).toBe('behind')
  for (const id of ids.slice(2))
    expect(level.things.find((t) => t.id === id)).toEqual(room1.things.find((t) => t.id === id))
})

test('nothing to change says same, and a thing that is not there says so', () => {
  expect(setDraw(room1, [ids[0] as string], 'with-hero')).toEqual({ ok: false, why: 'same' })
  expect(setDraw(room1, ['nope'], 'behind')).toEqual({ ok: false, why: 'no-such-thing' })
  expect(setDraw(room1, [], 'behind')).toEqual({ ok: false, why: 'no-such-thing' })
})

test('what is put into the game lists things in the opened order, with the key only where it is set', () => {
  const crate = ids[0] as string
  const start = startEdits(links)
  const edits = change(start, {
    ...start.now,
    levels: { ...start.now.levels, 'room-1': levelOf(setDraw(room1, [crate], 'in-front')) },
  })
  const file = toPut(links, edits).files.find((f) => f.path.endsWith('room-1.json'))
  const put = file?.value as Level
  expect(put.things.map((t) => t.id)).toEqual(ids)
  expect(put.things.filter((t) => t.draw !== undefined).map((t) => t.id)).toEqual([crate])
})
