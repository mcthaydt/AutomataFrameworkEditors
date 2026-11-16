// The ways out of a wall: two levels that touch where only one of them is open. Each is a pure step that gives the new
// state (one undo walks it back), or says it cannot be done.
import { type GameContent, openTile } from '@automataframework/framework/headless'
import type { Working } from '../game/game.ts'
import { type Cell, type Done, emptyKind, kindsOf, no, ok, paint } from '../levels/levels.ts'
import { type Box, boxes, moveLevel, type Wall } from './arrange.ts'

/** How many tiles of ground clearing these walls would take. */
export const tilesToClear = (walls: readonly Wall[]): number =>
  walls.reduce((sum, wall) => sum + wall.to - wall.from, 0)

/** The level whose ground is in the way: the one that is not open where they meet. */
const solidOf = (wall: Wall): string => (wall.open === 'a' ? wall.b : wall.a)

/** The ground of the level that is in the way, along the side it shares, where only the other is open: gone. */
export function clearWalls(working: Working, content: GameContent, walls: readonly Wall[]): Done<Working> {
  const all = boxes(working, Object.keys(working.levels))
  let levels = working.levels
  for (const wall of walls) {
    const id = solidOf(wall)
    const level = levels[id]
    const box = all.find((one) => one.level === id)
    if (level === undefined || box === undefined) return no('no-such-thing')
    // The side it shares is its far edge when it is the first of the two (left or top), its near edge when the second.
    const first = id === wall.a
    const cells: Cell[] = []
    for (let k = wall.from; k < wall.to; k++) {
      cells.push(
        wall.along === 'y'
          ? { col: first ? box.w - 1 : 0, row: k - box.y }
          : { col: k - box.x, row: first ? box.h - 1 : 0 },
      )
    }
    const done = paint(level, content.characters, cells, emptyKind(kindsOf(level, content.tilesets)))
    if (!done.ok) return done
    levels = { ...levels, [id]: done.value }
  }
  return ok({ ...working, levels })
}

type Way = 'up' | 'down' | 'left' | 'right'

/** The open tiles along the edge of a level that faces the other one, counted from the level's own corner. */
function opening(
  level: NonNullable<Working['levels'][string]>,
  box: Box,
  edge: 'near' | 'far',
  along: 'x' | 'y',
  isOpen: ReturnType<typeof openTile>,
): number[] {
  const count = along === 'y' ? box.h : box.w
  const fixed = edge === 'far' ? (along === 'y' ? box.w : box.h) - 1 : 0
  const open: number[] = []
  for (let k = 0; k < count; k++)
    if (isOpen(level, ...((along === 'y' ? [fixed, k] : [k, fixed]) as [number, number]))) open.push(k)
  return open
}

/**
 * Slides `mover` along the side it shares with the other level, the fewest tiles that put one of its openings against
 * one of the other's. Undefined when either has no opening there, or they already meet, or the slide is blocked.
 */
export function meetOpenings(
  working: Working,
  content: GameContent,
  wall: Wall,
  mover: string,
): { readonly working: Working; readonly way: Way; readonly tiles: number } | undefined {
  const all = boxes(working, Object.keys(working.levels))
  const other = mover === wall.a ? wall.b : wall.a
  const mine = all.find((box) => box.level === mover)
  const theirs = all.find((box) => box.level === other)
  const mineLevel = working.levels[mover]
  const theirLevel = working.levels[other]
  if (!mine || !theirs || !mineLevel || !theirLevel) return undefined
  const isOpen = openTile(content.tilesets)
  const first = mover === wall.a
  const here = opening(mineLevel, mine, first ? 'far' : 'near', wall.along, isOpen)
  const there = opening(theirLevel, theirs, first ? 'near' : 'far', wall.along, isOpen)
  const origin = (box: Box): number => (wall.along === 'y' ? box.y : box.x)
  let best: number | undefined
  for (const a of here) {
    for (const b of there) {
      const slide = origin(theirs) + b - (origin(mine) + a)
      if (best === undefined || Math.abs(slide) < Math.abs(best)) best = slide
    }
  }
  if (best === undefined || best === 0) return undefined
  const to = wall.along === 'y' ? { x: mine.x, y: mine.y + best } : { x: mine.x + best, y: mine.y }
  const moved = moveLevel(working, mover, to)
  if (!moved.ok) return undefined
  const way: Way = wall.along === 'y' ? (best < 0 ? 'up' : 'down') : best < 0 ? 'left' : 'right'
  return { working: moved.value, way, tiles: Math.abs(best) }
}
