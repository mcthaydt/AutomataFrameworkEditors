import { type Level, loadGame } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import { MIN_HIT, marksFor, type Rect } from '#src/features/levels/marks.ts'
import type { LevelView } from '#src/features/levels/view.ts'
import { readFrom } from '../../fixtures/game/read.ts'
import { linksMap } from '../../fixtures/links-game/read.ts'

const loaded = await loadGame(readFrom(linksMap()))
if (!loaded.ok) throw new Error('the links game did not load')
const characters = loaded.value.characters
const room1 = loaded.value.levels['room-1'] as Level
const room2 = loaded.value.levels['room-2'] as Level

const screen = { w: 800, h: 500 }
const view = (scale: number, over: Partial<LevelView> = {}): LevelView => ({
  tool: 'pick',
  picked: [],
  locked: new Set(),
  hidden: new Set(),
  camera: { x: 8, y: 4.5, scale },
  ground: false,
  ...over,
})
const names = (id: string): string => `name of ${id}`
const overlap = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w - 1e-9 && b.x < a.x + a.w - 1e-9 && a.y < b.y + b.h - 1e-9 && b.y < a.y + a.h - 1e-9

/** A level of two crates side by side, `gap` tiles between their centres, and nothing else. */
const pair = (gap: number): Level => ({
  ...room1,
  things: [
    { id: 'crate-1', character: 'crate', x: 5, y: 4 },
    { id: 'crate-2', character: 'crate', x: 5 + gap, y: 4 },
  ],
  starts: [],
})

test('a thing of 16 pixels is hit across 44 by 44, round the same middle', () => {
  const [mark] = marksFor(
    { ...room1, things: room1.things.slice(0, 1), starts: [] },
    characters,
    view(16),
    screen,
    names,
  )
  if (mark === undefined) throw new Error('no mark')
  expect(mark.box.w).toBeCloseTo(16 * (characters[room1.things[0]?.character ?? '']?.size.w ?? 1), 6)
  expect(mark.hit.w).toBe(MIN_HIT)
  expect(mark.hit.h).toBe(MIN_HIT)
  expect(mark.hit.x + mark.hit.w / 2).toBeCloseTo(mark.box.x + mark.box.w / 2, 6)
  expect(mark.hit.y + mark.hit.h / 2).toBeCloseTo(mark.box.y + mark.box.h / 2, 6)
})

test('a thing bigger than 44 points keeps its own size as its hit area', () => {
  const [mark] = marksFor(
    { ...room1, things: room1.things.slice(0, 1), starts: [] },
    characters,
    view(100),
    screen,
    names,
  )
  expect(mark?.hit).toEqual(mark?.box)
})

test('two crates side by side at 20 pixels each split the shared part', () => {
  // A crate is one tile; at 20 pixels a tile, centres 1.5 tiles (30 pixels) apart leave a 10-pixel gap.
  const [a, b] = marksFor(pair(1.5), characters, view(20), screen, names)
  if (a === undefined || b === undefined) throw new Error('two marks')
  expect(overlap(a.hit, b.hit)).toBe(false)
  expect(a.hit.x + a.hit.w).toBeCloseTo(b.hit.x, 6)
  // The cut is in the middle of what they would have shared.
  expect(a.hit.x + a.hit.w).toBeCloseTo((a.box.x + a.box.w + b.box.x) / 2, 6)
  expect(a.hit.w).toBeGreaterThan(20)
  expect(b.hit.w).toBeGreaterThan(20)
})

test('things that are apart keep their whole 44 by 44', () => {
  const [a, b] = marksFor(pair(6), characters, view(20), screen, names)
  expect(a?.hit.w).toBe(MIN_HIT)
  expect(b?.hit.w).toBe(MIN_HIT)
})

test('a smaller thing next to a bigger one keeps the shared part', () => {
  const level: Level = {
    ...room1,
    things: [
      { id: 'crate-1', character: 'crate', x: 5, y: 4 },
      { id: 'plate-1', character: 'plate', x: 6.6, y: 4 },
    ],
    starts: [],
  }
  const [crate, plate] = marksFor(level, characters, view(24), screen, names)
  if (crate === undefined || plate === undefined) throw new Error('two marks')
  const crateArea = crate.box.w * crate.box.h
  const plateArea = plate.box.w * plate.box.h
  expect(plateArea).toBeLessThan(crateArea)
  expect(overlap(crate.hit, plate.hit)).toBe(false)
  expect(plate.hit.w).toBeGreaterThanOrEqual(MIN_HIT)
})

test('each mark has the name it is given, hidden things have none, and starts follow the things', () => {
  const marks = marksFor(
    room2,
    characters,
    view(30, { hidden: new Set([room2.things[0]?.id ?? '']) }),
    screen,
    names,
  )
  expect(marks.map((m) => m.id)).toEqual([
    ...room2.things.slice(1).map((t) => t.id),
    ...room2.starts.map((s) => `start-${s.player}`),
  ])
  expect(marks.every((m) => m.name === names(m.id))).toBe(true)
  expect(marks.filter((m) => m.kind === 'start')).toHaveLength(room2.starts.length)
})

test('a thing whose character the game lacks is a 1 by 1 mark', () => {
  const odd: Level = { ...room1, things: [{ id: 'ghost-1', character: 'ghost', x: 3, y: 3 }], starts: [] }
  const [mark] = marksFor(odd, characters, view(40), screen, names)
  expect([mark?.box.w, mark?.box.h]).toEqual([40, 40])
})
