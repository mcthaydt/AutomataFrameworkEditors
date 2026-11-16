import { type Level, loadGame } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import { change, readerOf, startEdits, undo } from '#src/features/game/changes.ts'
import { paint } from '#src/features/levels/ground.ts'
import {
  boxes,
  landing,
  marksOf,
  moveLevel,
  nudgeLevel,
  pullApart,
  wholeWorld,
} from '#src/features/map/map.ts'
import { fixtureFiles } from '../../fixtures/game/read.ts'
import { linksFiles } from '../../fixtures/links-game/links.ts'
import { openedGame } from '../../fixtures/open-game.ts'

const game = await openedGame(linksFiles())
const working = startEdits(game).now
const { content } = game
const tilesets = content.tilesets

const worked = (done: { ok: boolean }): typeof working => {
  if (!('value' in done)) throw new Error('expected a working game')
  return done.value as typeof working
}
const at = (w: typeof working, level: string): { x: number; y: number } | undefined =>
  w.world?.levels.find((entry) => entry.level === level)?.at

test('the links game has one join, three doors and starts in room-1', () => {
  const marks = marksOf(working, content)
  expect(marks.joins).toEqual([{ a: 'room-2', b: 'room-3', along: 'y', from: 5, to: 8 }])
  expect(marks.walls).toEqual([])
  expect(marks.doors).toEqual([
    { from: { level: 'room-1', thing: 'exit' }, to: { level: 'room-2', thing: 'door-in' } },
    { from: { level: 'room-2', thing: 'door-in' }, to: { level: 'room-1', thing: 'exit' } },
    { from: { level: 'room-3', thing: 'back' }, to: { level: 'room-1', thing: 'exit' } },
  ])
  expect(marks.start).toBe('room-1')
})

test('room-1 let go beside room-2 snaps to whole tiles and touch, with a wall where only it is open', () => {
  expect(landing(working, tilesets, 'room-1', { x: 3.4, y: 0.2 })).toEqual({
    kind: 'touch',
    at: { x: 4, y: 0 },
    joins: [],
    walls: [{ a: 'room-1', b: 'room-2', along: 'y', from: 5, to: 8, open: 'a' }],
  })
})

test('letting go over another level is an overlap, and the move is occupied', () => {
  expect(landing(working, tilesets, 'room-1', { x: 20, y: 0 })).toEqual({ kind: 'overlap', over: 'room-2' })
  expect(moveLevel(working, 'room-1', { x: 20, y: 0 })).toEqual({ ok: false, why: 'occupied' })
  expect(moveLevel(working, 'room-1', { x: 5, y: 0 })).toEqual({ ok: false, why: 'occupied' })
})

test('letting go in the open is free, at whole tiles', () => {
  expect(landing(working, tilesets, 'room-1', { x: 3.4, y: 12.6 })).toEqual({
    kind: 'free',
    at: { x: 3, y: 13 },
  })
  expect(landing(working, tilesets, 'room-9', { x: 1.2, y: 1.6 })).toEqual({
    kind: 'free',
    at: { x: 1, y: 2 },
  })
})

test('a level moved writes only its own place on the map', () => {
  const moved = worked(moveLevel(working, 'room-1', { x: 0.4, y: 12 }))
  expect(at(moved, 'room-1')).toEqual({ x: 0, y: 12 })
  expect(at(moved, 'room-2')).toEqual({ x: 20, y: 0 })
  expect(moveLevel(working, 'room-1', { x: 0, y: 0 })).toEqual({ ok: false, why: 'same' })
  expect(moveLevel(working, 'room-9', { x: 0, y: 0 })).toEqual({ ok: false, why: 'no-such-thing' })
})

test('pulling room-3 away leaves no join, and moving it back restores the world', () => {
  const apart = worked(pullApart(working, tilesets, 'room-3'))
  expect(at(apart, 'room-3')).toEqual({ x: 38, y: 0 })
  expect(marksOf(apart, content).joins).toEqual([])
  expect(worked(moveLevel(apart, 'room-3', { x: 36, y: 0 }))).toEqual(working)
  expect(pullApart(working, tilesets, 'room-1')).toEqual({ ok: false, why: 'same' })
})

test('a nudge is one tile, and one into another level is occupied', () => {
  expect(at(worked(nudgeLevel(working, tilesets, 'room-1', 'right')), 'room-1')).toEqual({ x: 1, y: 0 })
  expect(at(worked(nudgeLevel(working, tilesets, 'room-1', 'down')), 'room-1')).toEqual({ x: 0, y: 1 })
  expect(nudgeLevel(working, tilesets, 'room-3', 'left')).toEqual({ ok: false, why: 'occupied' })
})

test('a game with no world file has its levels in a row, and the first move makes the file', () => {
  const bare = { ...working, world: undefined }
  expect(boxes(bare, ['room-3', 'room-1', 'room-2']).map((b) => [b.level, b.x, b.y])).toEqual([
    ['room-3', 0, 0],
    ['room-1', 18, 0],
    ['room-2', 36, 0],
  ])
  const made = worked(moveLevel(bare, 'room-1', { x: 0, y: 12 }))
  expect(made.world).toEqual({
    format: 1,
    id: 'world',
    levels: [
      { level: 'room-1', at: { x: 0, y: 12 } },
      { level: 'room-2', at: { x: 18, y: 0 } },
      { level: 'room-3', at: { x: 36, y: 0 } },
    ],
  })
})

test('a level the world file leaves out sits in a row after the ones it places', () => {
  const partial = {
    ...working,
    world: {
      ...(working.world as NonNullable<typeof working.world>),
      levels: [{ level: 'room-2', at: { x: 20, y: 0 } }],
    },
  }
  expect(boxes(partial, ['room-1', 'room-2', 'room-3']).map((b) => [b.level, b.x])).toEqual([
    ['room-1', 38],
    ['room-2', 20],
    ['room-3', 56],
  ])
})

test("closing room-3's left edge turns the join into one wall that room-2 leaves open", () => {
  const characters = content.characters
  const room3 = working.levels['room-3'] as Level
  const closed = paint(
    room3,
    characters,
    [5, 6, 7].map((row) => ({ col: 0, row })),
    { letter: '#', id: 'solid', solid: true },
  )
  if (!closed.ok) throw new Error('could not close the edge')
  const edited = { ...working, levels: { ...working.levels, 'room-3': closed.value } }
  const marks = marksOf(edited, content)
  expect(marks.joins).toEqual([])
  expect(marks.walls).toEqual([{ a: 'room-2', b: 'room-3', along: 'y', from: 5, to: 8, open: 'a' }])
})

test('stacked levels have a join or a wall along their top and bottom', () => {
  const moved = worked(moveLevel(working, 'room-1', { x: 20, y: 9 }))
  const marks = marksOf(moved, content)
  // room-1 under room-2: room-2's bottom row is the floor, but room-1's top row is open between its walls.
  expect(marks.walls).toEqual([{ a: 'room-2', b: 'room-1', along: 'x', from: 21, to: 35, open: 'b' }])
  expect(marks.joins).toEqual([{ a: 'room-2', b: 'room-3', along: 'y', from: 5, to: 8 }])
  expect(landing(working, tilesets, 'room-1', { x: 20.2, y: 8.4 })).toMatchObject({
    kind: 'touch',
    at: { x: 20, y: 9 },
  })
})

test('the whole world fits every level on the screen, with a margin', () => {
  const grid = Array.from({ length: 64 }, (_, i) => ({
    level: `level-${i + 1}`,
    x: (i % 8) * 18,
    y: Math.floor(i / 8) * 11,
    w: 16,
    h: 9,
  }))
  const screen = { w: 800, h: 600 }
  const view = wholeWorld(grid, screen)
  for (const box of grid) {
    const left = screen.w / 2 + (box.x - view.x) * view.scale
    const top = screen.h / 2 + (box.y - view.y) * view.scale
    expect(left).toBeGreaterThanOrEqual(0)
    expect(top).toBeGreaterThanOrEqual(0)
    expect(left + box.w * view.scale).toBeLessThanOrEqual(screen.w)
    expect(top + box.h * view.scale).toBeLessThanOrEqual(screen.h)
  }
  expect(wholeWorld([], screen)).toEqual({ x: 0, y: 0, scale: 1 })
})

test('a move is one undoable step, and the moved game still loads', async () => {
  const edits = change(startEdits(game), worked(moveLevel(working, 'room-1', { x: 0, y: 12 })))
  expect(edits.past).toHaveLength(1)
  expect(undo(edits).now).toEqual(working)
  expect((await loadGame(readerOf(game, edits))).ok).toBe(true)
})

test('the crate game has no world file, one level, and nothing to touch', async () => {
  const crate = await openedGame(fixtureFiles)
  const only = startEdits(crate).now
  expect(boxes(only, ['level-1']).map((b) => [b.level, b.x, b.y])).toEqual([['level-1', 0, 0]])
  expect(landing(only, crate.content.tilesets, 'level-1', { x: 3, y: 3 })).toEqual({
    kind: 'free',
    at: { x: 3, y: 3 },
  })
  expect(marksOf(only, crate.content)).toEqual({ joins: [], walls: [], doors: [], start: 'level-1' })
})
