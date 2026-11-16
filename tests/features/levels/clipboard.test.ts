import { type Level, loadGame } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import { copyToClip, pasteClip } from '#src/features/levels/clipboard.ts'
import { readFrom } from '../../fixtures/game/read.ts'
import { linksMap } from '../../fixtures/links-game/read.ts'

const loaded = await loadGame(readFrom(linksMap()))
if (!loaded.ok) throw new Error('the links game did not load')
const characters = loaded.value.characters
const room1 = loaded.value.levels['room-1'] as Level
const room3 = loaded.value.levels['room-3'] as Level

const crowd: Level = {
  ...room1,
  things: room1.things.map((t) => (t.id === 'plate-1' ? { ...t, values: { opens: ['gate-1'] } } : t)),
}

test('what is copied keeps its numbers and loses its links', () => {
  const done = copyToClip(crowd, characters, ['plate-1', 'crate-1'])
  expect(done.ok).toBe(true)
  if (!done.ok) return
  expect(done.value.things.map((t) => t.id)).toEqual(['crate-1', 'plate-1'])
  expect(done.value.things.find((t) => t.id === 'plate-1')?.values).toBeUndefined()
})

test('nothing, or a thing that may be in a level only once, is not copied', () => {
  expect(copyToClip(room1, characters, ['nope'])).toEqual({ ok: false, why: 'no-such-thing' })
  expect(copyToClip(room3, characters, ['goal-1'])).toEqual({ ok: false, why: 'not-allowed' })
})

test('a paste puts the first thing at the spot and the rest beside it, each with its own id', () => {
  const clip = copyToClip(room1, characters, ['crate-1', 'plate-1'])
  if (!clip.ok) throw new Error('a clip')
  const crate = room1.things.find((t) => t.id === 'crate-1')
  const plate = room1.things.find((t) => t.id === 'plate-1')
  if (crate === undefined || plate === undefined) throw new Error('fixture things')
  const done = pasteClip(room1, characters, clip.value, { x: crate.x - 2, y: crate.y - 3 })
  expect(done.ok).toBe(true)
  if (!done.ok) return
  expect(done.value.ids).toEqual(['crate-2', 'plate-2'])
  const copy = done.value.level.things.find((t) => t.id === 'plate-2')
  expect(copy?.x).toBeCloseTo(plate.x - 2, 1)
  expect(done.value.level.things.slice(0, room1.things.length)).toEqual(room1.things)
})

test('a paste that would land in a wall or off the level lands nowhere', () => {
  const clip = copyToClip(room1, characters, ['crate-1'])
  if (!clip.ok) throw new Error('a clip')
  expect(pasteClip(room1, characters, clip.value, { x: 0.5, y: 8.5 })).toMatchObject({ ok: false })
  expect(pasteClip(room1, characters, clip.value, { x: -40, y: 3 })).toEqual({ ok: false, why: 'outside' })
})
