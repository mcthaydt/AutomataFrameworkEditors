import { expect, test } from 'vitest'
import { change, startEdits, undo } from '#src/features/game/changes.ts'
import { emptyKind, kindsOf, paint } from '#src/features/levels/levels.ts'
import { landing, marksOf, moveLevel, pullApart, type Wall } from '#src/features/map/arrange.ts'
import { clearWalls, meetOpenings, tilesToClear } from '#src/features/map/walls.ts'
import { linksFiles } from '../../fixtures/links-game/links.ts'
import { openedGame } from '../../fixtures/open-game.ts'

const game = await openedGame(linksFiles())
const { content } = game
const start = startEdits(game).now

// Room 1 pushed up against Room 2: its open right edge meets Room 2's solid left edge.
const dropped = landing(start, content.tilesets, 'room-1', { x: 3.4, y: 0.2 })
if (dropped.kind !== 'touch') throw new Error('room-1 does not touch room-2')
const moved = moveLevel(start, 'room-1', dropped.at)
if (!moved.ok) throw new Error('room-1 did not move')
const touching = moved.value
const walls = marksOf(touching, content).walls

test('pushed against room-2, room-1 meets a wall and does not join', () => {
  expect(walls).toHaveLength(1)
  expect(marksOf(touching, content).joins.some((join) => join.a === 'room-1' || join.b === 'room-1')).toBe(
    false,
  )
  expect(tilesToClear(walls)).toBe(3)
})

test('clearing the ground where they meet joins them, and undo puts the wall back', () => {
  const cleared = clearWalls(touching, content, walls)
  if (!cleared.ok) throw new Error('the ground did not clear')
  const after = marksOf(cleared.value, content)
  expect(after.walls).toEqual([])
  expect(after.joins.some((join) => join.a === 'room-1' && join.b === 'room-2')).toBe(true)
  const edits = change({ ...startEdits(game), now: touching }, cleared.value)
  expect(marksOf(undo(edits).now, content).walls).toHaveLength(1)
})

test('moving so the openings meet slides the level to where they are, and joins them', () => {
  // Room 2 gets a gap in its left edge three rows above where Room 1 is open.
  const room2 = touching.levels['room-2']
  if (room2 === undefined) throw new Error('no room-2')
  const gap = paint(
    room2,
    content.characters,
    [{ col: 0, row: 2 }],
    emptyKind(kindsOf(room2, content.tilesets)),
  )
  if (!gap.ok) throw new Error('the gap did not open')
  const holed = { ...touching, levels: { ...touching.levels, 'room-2': gap.value } }
  const wall = marksOf(holed, content).walls.find((one) => one.a === 'room-1') as Wall
  const met = meetOpenings(holed, content, wall, 'room-1')
  expect(met).toMatchObject({ way: 'up', tiles: 3 })
  const joined = marksOf((met as NonNullable<typeof met>).working, content).joins
  expect(joined.some((join) => join.a === 'room-1' && join.b === 'room-2')).toBe(true)
})

test('there is no such move when the other level has no opening on that side', () => {
  expect(meetOpenings(touching, content, walls[0] as Wall, 'room-1')).toBeUndefined()
})

test('moving apart leaves no wall', () => {
  const apart = pullApart(touching, content.tilesets, 'room-1')
  if (!apart.ok) throw new Error('did not move apart')
  expect(marksOf(apart.value, content).walls).toEqual([])
})
