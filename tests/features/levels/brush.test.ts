import { type Level, loadGame } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import {
  handOf,
  kindOfStroke,
  paintStroke,
  startStroke,
  strokeTo,
  wayChanged,
} from '#src/features/levels/brush.ts'
import { kindsOf } from '#src/features/levels/ground.ts'
import { readFrom } from '../../fixtures/game/read.ts'
import { linksMap } from '../../fixtures/links-game/read.ts'

const loaded = await loadGame(readFrom(linksMap()))
if (!loaded.ok) throw new Error('the links game did not load')
const characters = loaded.value.characters
const room1 = loaded.value.levels['room-1'] as Level
const kinds = kindsOf(room1, loaded.value.tilesets)
const solid = kinds.find((k) => k.solid) ?? kinds[0]
if (solid === undefined) throw new Error('no kinds')

test('the hand is the free thumb button held, or the keys a computer has', () => {
  const none = new Set<string>()
  expect(handOf(none, false, false)).toBe('brush')
  expect(handOf(none, true, false)).toBe('box')
  expect(handOf(none, false, true)).toBe('erase')
  expect(handOf(none, true, true)).toBe('fill')
  expect(handOf(new Set(['box']), false, false)).toBe('box')
  expect(handOf(new Set(['fill']), true, false)).toBe('fill')
  expect(handOf(new Set(['erase']), false, false)).toBe('erase')
})

test('a brush follows the path with no gap, a box is its corners, a fill is where it began', () => {
  const brush = startStroke(room1, 'brush', { col: 0, row: 0 })
  const distinct = (cells: readonly { col: number; row: number }[]): number =>
    new Set(cells.map((c) => `${c.col},${c.row}`)).size
  expect(distinct(strokeTo(brush, { col: 5, row: 0 }))).toBe(6)
  expect(distinct(strokeTo(brush, { col: 5, row: 3 }))).toBe(6 + 3)
  const box = startStroke(room1, 'box', { col: 1, row: 1 })
  expect(strokeTo(box, { col: 3, row: 2 })).toHaveLength(6)
  expect(strokeTo(box, { col: 1, row: 1 })).toHaveLength(1)
  const fill = startStroke(room1, 'fill', { col: 0, row: 0 })
  expect(strokeTo(fill, { col: 9, row: 9 }).length).toBeGreaterThan(1)
})

test('an eraser paints the empty kind', () => {
  const erase = startStroke(room1, 'erase', { col: 0, row: 0 })
  expect(kindOfStroke(erase, solid, kinds).solid).toBe(false)
  expect(kindOfStroke(startStroke(room1, 'brush', { col: 0, row: 0 }), solid, kinds)).toBe(solid)
})

test('a stroke over a thing leaves its spot and says which', () => {
  const thing = room1.things[0]
  if (thing === undefined) throw new Error('room-1 has no thing')
  const cell = { col: Math.floor(thing.x), row: Math.floor(thing.y) }
  const stroke = startStroke(room1, 'brush', cell)
  const painted = paintStroke(stroke, characters, [cell, { col: cell.col + 0, row: cell.row }], solid)
  expect(painted.left.length).toBeGreaterThan(0)
})

test('the way across to another level opened, closed, grew or shrank, by how much of its stretch is open', () => {
  const side = { side: 'right' as const, from: 2, to: 4, other: 'room-2' }
  expect(wayChanged([side], [side])).toBeUndefined()
  expect(wayChanged([side], [])).toEqual({ other: 'room-2', how: 'closed' })
  expect(wayChanged([], [side])).toEqual({ other: 'room-2', how: 'opened' })
  expect(wayChanged([side], [{ ...side, to: 5 }])).toEqual({ other: 'room-2', how: 'wider' })
  expect(wayChanged([side], [{ ...side, to: 3 }])).toEqual({ other: 'room-2', how: 'narrower' })
})
