// Where the drawing notes go: the tile grid over the level's own area, two measure lines from the level's edges to the
// picked thing's middle, and a block of notes beside the thing, joined to it by a leader line. Plain functions on CSS
// pixels inside the stage; nothing here knows about a screen. The numbers the notes write are the file's own `x` and
// `y`; this only says where to draw them.
import type { Fit } from '@automataframework/framework'
import { type Level, levelSize } from '@automataframework/framework/headless'
import type { Point, Size } from './place.ts'

export interface Box {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
}
export interface Line {
  readonly from: Point
  readonly to: Point
}
export interface Notes {
  /** The level's own area in the stage, and one tile's side, in CSS pixels. */
  readonly grid: Box & { readonly tile: number }
  /** From the level's left edge to the thing's middle, then from its top edge to the thing's middle. */
  readonly measures: readonly Line[]
  /** Where the block of notes goes (its top left corner), and the line that joins it to the thing. */
  readonly block:
    | {
        readonly side: 'right' | 'left' | 'above' | 'below'
        readonly at: Point
        readonly leader: Line
      }
    | undefined
}

/** The air between the thing's button and the block of notes. */
const GAP = 16

const NOTHING: Notes = { grid: { x: 0, y: 0, w: 0, h: 0, tile: 0 }, measures: [], block: undefined }
const clamp = (value: number, least: number, most: number): number => Math.max(least, Math.min(most, value))

export function notesFor(input: {
  readonly level: Level
  readonly fit: Fit
  /** The picked thing's button in the stage; undefined when nothing is picked. */
  readonly thing: Box | undefined
  /** The clear cell in the stage. */
  readonly clear: Box
  /** The block of notes as measured on the page. */
  readonly block: Size
}): Notes {
  const { level, fit, thing, clear, block } = input
  if (!(fit.scale > 0)) return NOTHING
  const world = levelSize(level)
  const grid = { x: fit.left, y: fit.top, w: world.w * fit.scale, h: world.h * fit.scale, tile: fit.scale }
  if (thing === undefined) return { grid, measures: [], block: undefined }

  const middle = { x: thing.x + thing.w / 2, y: thing.y + thing.h / 2 }
  const measures: readonly Line[] = [
    { from: { x: grid.x, y: middle.y }, to: middle },
    { from: { x: middle.x, y: grid.y }, to: middle },
  ]

  // The block goes on the first side where it fits inside the clear cell and keeps its distance from the thing.
  const sideways = clamp(middle.y - block.h / 2, clear.y, clear.y + clear.h - block.h)
  const upright = clamp(middle.x - block.w / 2, clear.x, clear.x + clear.w - block.w)
  const candidates = [
    {
      side: 'right',
      at: { x: thing.x + thing.w + GAP, y: sideways },
      to: { x: thing.x + thing.w, y: middle.y },
      near: (at: Point): Point => ({ x: at.x, y: at.y + block.h / 2 }),
    },
    {
      side: 'left',
      at: { x: thing.x - GAP - block.w, y: sideways },
      to: { x: thing.x, y: middle.y },
      near: (at: Point): Point => ({ x: at.x + block.w, y: at.y + block.h / 2 }),
    },
    {
      side: 'above',
      at: { x: upright, y: thing.y - GAP - block.h },
      to: { x: middle.x, y: thing.y },
      near: (at: Point): Point => ({ x: at.x + block.w / 2, y: at.y + block.h }),
    },
    {
      side: 'below',
      at: { x: upright, y: thing.y + thing.h + GAP },
      to: { x: middle.x, y: thing.y + thing.h },
      near: (at: Point): Point => ({ x: at.x + block.w / 2, y: at.y }),
    },
  ] as const
  const fits = (at: Point): boolean =>
    at.x >= clear.x - 0.01 &&
    at.y >= clear.y - 0.01 &&
    at.x + block.w <= clear.x + clear.w + 0.01 &&
    at.y + block.h <= clear.y + clear.h + 0.01
  const found = candidates.find((candidate) => fits(candidate.at))
  if (found !== undefined) {
    return {
      grid,
      measures,
      block: { side: found.side, at: found.at, leader: { from: found.near(found.at), to: found.to } },
    }
  }
  // No side has room: below, pushed back inside the clear cell, whatever it covers.
  const below = candidates[3]
  const at = {
    x: clamp(below.at.x, clear.x, Math.max(clear.x, clear.x + clear.w - block.w)),
    y: clamp(below.at.y, clear.y, Math.max(clear.y, clear.y + clear.h - block.h)),
  }
  return { grid, measures, block: { side: 'below', at, leader: { from: below.near(at), to: below.to } } }
}
