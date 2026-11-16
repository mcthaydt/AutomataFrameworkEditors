// Arranging levels on the world map: where a level may land, how to move one, push two together and pull them apart.
// Pure functions of what a person is holding. Which levels join is the framework's `layoutWorld`; the walls (a shared
// side where only one level is open) are worked out here from the same `openTile`.
import {
  type GameContent,
  type IsOpen,
  type Join,
  type Level,
  type LevelPoint,
  layoutWorld,
  openTile,
  type WorldFile,
} from '@automataframework/framework/headless'
import type { Working } from '../game/game.ts'
import { type Done, type MapBox, mapBoxes, no, ok, placeOn, startOf } from '../levels/levels.ts'

export type Box = MapBox

/** The part of a shared side where exactly one of two touching levels is open. `a` is the left or top level. */
export interface Wall {
  readonly a: string
  readonly b: string
  readonly along: 'x' | 'y'
  /** Map tiles along the side, `to` not included. */
  readonly from: number
  readonly to: number
  /** Which of the two is open there. */
  readonly open: 'a' | 'b'
}

export type Landing =
  | { readonly kind: 'free'; readonly at: LevelPoint }
  | {
      readonly kind: 'touch'
      readonly at: LevelPoint
      readonly joins: readonly Join[]
      /** Edges that touch with one side solid. */
      readonly walls: readonly Wall[]
    }
  | { readonly kind: 'overlap'; readonly over: string }

/** Every level as a box: where the world file puts it, or in a row along the top, two tiles apart, in the project's order. */
export const boxes = (working: Working, order: readonly string[]): readonly Box[] => mapBoxes(working, order)

const allBoxes = (working: Working): readonly Box[] => mapBoxes(working, Object.keys(working.levels))

const whole = (n: number): number => Math.round(n) + 0

/** How far two ranges overlap, in tiles; zero or less when they only touch or are apart. */
const along = (from1: number, to1: number, from2: number, to2: number): number =>
  Math.min(to1, to2) - Math.max(from1, from2)

/** Whether two boxes cover some of the same tiles. */
const overlaps = (a: Box, b: Box): boolean =>
  along(a.x, a.x + a.w, b.x, b.x + b.w) > 0 && along(a.y, a.y + a.h, b.y, b.y + b.h) > 0

/** The two boxes as (first, second) when they touch along a side, `first` being the left or top one. */
function touching(a: Box, b: Box): { first: Box; second: Box; along: 'x' | 'y' } | undefined {
  const rows = along(a.y, a.y + a.h, b.y, b.y + b.h) > 0
  const columns = along(a.x, a.x + a.w, b.x, b.x + b.w) > 0
  if (rows && a.x + a.w === b.x) return { first: a, second: b, along: 'y' }
  if (rows && b.x + b.w === a.x) return { first: b, second: a, along: 'y' }
  if (columns && a.y + a.h === b.y) return { first: a, second: b, along: 'x' }
  if (columns && b.y + b.h === a.y) return { first: b, second: a, along: 'x' }
  return undefined
}

/** The walls along the side two touching levels share. */
function wallsBetween(
  pair: { first: Box; second: Box; along: 'x' | 'y' },
  levels: Readonly<Record<string, Level>>,
  isOpen: IsOpen,
): Wall[] {
  const { first, second } = pair
  const one = levels[first.level]
  const other = levels[second.level]
  if (one === undefined || other === undefined) return []
  const lo = pair.along === 'y' ? Math.max(first.y, second.y) : Math.max(first.x, second.x)
  const hi =
    pair.along === 'y'
      ? Math.min(first.y + first.h, second.y + second.h)
      : Math.min(first.x + first.w, second.x + second.w)
  const open = (k: number): 'a' | 'b' | undefined => {
    const [a, b] =
      pair.along === 'y'
        ? [isOpen(one, first.w - 1, k - first.y), isOpen(other, 0, k - second.y)]
        : [isOpen(one, k - first.x, first.h - 1), isOpen(other, k - second.x, 0)]
    if (a === b) return undefined
    return a ? 'a' : 'b'
  }
  const walls: Wall[] = []
  for (let k = lo; k < hi; k++) {
    const side = open(k)
    if (side === undefined) continue
    const last = walls.at(-1)
    if (last !== undefined && last.to === k && last.open === side)
      walls[walls.length - 1] = { ...last, to: k + 1 }
    else walls.push({ a: first.level, b: second.level, along: pair.along, from: k, to: k + 1, open: side })
  }
  return walls
}

/** The world file as the map would hold it with these boxes. */
const worldOf = (working: Working, placed: readonly Box[]): WorldFile => ({
  format: 1,
  id: working.world?.id ?? 'world',
  levels: placed.map((box) => ({ level: box.level, at: { x: box.x, y: box.y } })),
})

/**
 * What letting go at `at` would do. `at` is snapped to whole tiles; within one tile of another level it snaps to touch.
 * A level that is not there lands free.
 */
export function landing(
  working: Working,
  tilesets: GameContent['tilesets'],
  level: string,
  at: LevelPoint,
): Landing {
  const mine = allBoxes(working).find((box) => box.level === level)
  if (mine === undefined) return { kind: 'free', at: { x: whole(at.x), y: whole(at.y) } }
  const others = allBoxes(working).filter((box) => box.level !== level)
  let x = whole(at.x)
  let y = whole(at.y)
  // Within one tile of touching another level's side, along the stretch they share, it snaps there.
  let best: { axis: 'x' | 'y'; to: number } | undefined
  const nearer = (axis: 'x' | 'y', now: number, to: number): void => {
    const gap = Math.abs(to - now)
    if (gap === 0 || gap > 1) return
    if (best === undefined || gap < Math.abs(best.to - (best.axis === 'x' ? x : y))) best = { axis, to }
  }
  for (const other of others) {
    if (along(y, y + mine.h, other.y, other.y + other.h) > 0) {
      nearer('x', x, other.x + other.w)
      nearer('x', x, other.x - mine.w)
    }
    if (along(x, x + mine.w, other.x, other.x + other.w) > 0) {
      nearer('y', y, other.y + other.h)
      nearer('y', y, other.y - mine.h)
    }
  }
  const snapped = best as { axis: 'x' | 'y'; to: number } | undefined
  if (snapped !== undefined) {
    if (snapped.axis === 'x') x = snapped.to
    else y = snapped.to
  }
  const there: Box = { ...mine, x, y }
  const over = others.find((other) => overlaps(there, other))
  if (over !== undefined) return { kind: 'overlap', over: over.level }
  const neighbours = others.flatMap((other) => {
    const pair = touching(there, other)
    return pair === undefined ? [] : [pair]
  })
  if (neighbours.length === 0) return { kind: 'free', at: { x, y } }
  const placed = allBoxes(working).map((box) => (box.level === level ? there : box))
  const isOpen = openTile(tilesets)
  const joins = layoutWorld(worldOf(working, placed), working.levels, isOpen).joins.filter(
    (join) => join.a === level || join.b === level,
  )
  const walls = neighbours.flatMap((pair) => wallsBetween(pair, working.levels, isOpen))
  return { kind: 'touch', at: { x, y }, joins, walls }
}

/** Puts the level there, writing the world file (made now, id "world", when the game has none). `occupied` on an overlap. */
export function moveLevel(working: Working, level: string, at: LevelPoint): Done<Working> {
  const mine = allBoxes(working).find((box) => box.level === level)
  if (mine === undefined) return no('no-such-thing')
  const x = whole(at.x)
  const y = whole(at.y)
  if (mine.x === x && mine.y === y) return no('same')
  const there: Box = { ...mine, x, y }
  if (allBoxes(working).some((box) => box.level !== level && overlaps(there, box))) return no('occupied')
  return ok(placeOn(working, level, { x, y }))
}

const WAYS = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
} as const

/** One tile. The tilesets are not needed to move a level, but a caller has them in hand with `landing`. */
export function nudgeLevel(
  working: Working,
  _tilesets: GameContent['tilesets'],
  level: string,
  way: keyof typeof WAYS,
): Done<Working> {
  const mine = allBoxes(working).find((box) => box.level === level)
  if (mine === undefined) return no('no-such-thing')
  return moveLevel(working, level, { x: mine.x + WAYS[way].x, y: mine.y + WAYS[way].y })
}

/** How far apart `pullApart` puts levels. */
const PULL = 2

/** Moves the level two tiles straight away from every level it touches. `same` when it touches none. */
export function pullApart(
  working: Working,
  _tilesets: GameContent['tilesets'],
  level: string,
): Done<Working> {
  const mine = allBoxes(working).find((box) => box.level === level)
  if (mine === undefined) return no('no-such-thing')
  let dx = 0
  let dy = 0
  for (const other of allBoxes(working)) {
    if (other.level === level) continue
    const pair = touching(mine, other)
    if (pair === undefined) continue
    // Away from the other: right when it is on the left, and so on.
    if (pair.along === 'y') dx += pair.first === mine ? -1 : 1
    else dy += pair.first === mine ? -1 : 1
  }
  if (dx === 0 && dy === 0) return no('same')
  return moveLevel(working, level, { x: mine.x + Math.sign(dx) * PULL, y: mine.y + Math.sign(dy) * PULL })
}

/** A door, drawn from its thing to the level (and thing) it leads to. */
export interface Door {
  readonly from: { readonly level: string; readonly thing: string }
  readonly to: { readonly level: string; readonly thing?: string }
}

/** Every join, wall and door on the map, from `layoutWorld` and the levels' `leads-to` values. */
export function marksOf(
  working: Working,
  content: GameContent,
): {
  readonly joins: readonly Join[]
  readonly walls: readonly Wall[]
  readonly doors: readonly Door[]
  readonly start: string
} {
  const placed = allBoxes(working)
  const isOpen = openTile(content.tilesets)
  const joins = layoutWorld(worldOf(working, placed), working.levels, isOpen).joins
  const walls: Wall[] = []
  placed.forEach((a, i) => {
    for (const b of placed.slice(i + 1)) {
      const pair = touching(a, b)
      if (pair !== undefined) walls.push(...wallsBetween(pair, working.levels, isOpen))
    }
  })
  const doors: Door[] = []
  for (const box of placed) {
    for (const thing of working.levels[box.level]?.things ?? []) {
      for (const declared of content.characters[thing.character]?.values ?? []) {
        if (declared.type !== 'leads-to') continue
        const way = thing.values?.[declared.id] as { level?: unknown; thing?: string } | undefined
        if (typeof way !== 'object' || way === null || Array.isArray(way) || typeof way.level !== 'string')
          continue
        doors.push({
          from: { level: box.level, thing: thing.id },
          to: { level: way.level, ...(way.thing === undefined ? {} : { thing: way.thing }) },
        })
      }
    }
  }
  return { joins, walls, doors, start: startOf(working) ?? content.project.start }
}

/** The view that shows every level with a margin of two tiles ("Whole world"): the tile at the screen's middle and the pixels a tile takes. */
export function wholeWorld(
  all: readonly Box[],
  screen: { readonly w: number; readonly h: number },
): { readonly x: number; readonly y: number; readonly scale: number } {
  const MARGIN = 2
  if (all.length === 0) return { x: 0, y: 0, scale: 1 }
  const left = Math.min(...all.map((box) => box.x)) - MARGIN
  const top = Math.min(...all.map((box) => box.y)) - MARGIN
  const right = Math.max(...all.map((box) => box.x + box.w)) + MARGIN
  const bottom = Math.max(...all.map((box) => box.y + box.h)) + MARGIN
  const scale = Math.min(screen.w / (right - left), screen.h / (bottom - top))
  return { x: (left + right) / 2, y: (top + bottom) / 2, scale }
}
