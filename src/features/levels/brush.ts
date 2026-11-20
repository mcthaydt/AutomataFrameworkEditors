// A stroke of the Paint tool as plain data: which way the hand is working (a brush, a box, a fill or an eraser), the
// cells it has gone over, and what it did to the ground. Every move is worked out from the level as it was when the hand
// went down, so one whole stroke is one step back.
import type { Level } from '@automataframework/framework/headless'
import type { Done } from './done.ts'
import type { Edge } from './edges.ts'
import type { Characters } from './edit.ts'
import {
  boxCells,
  type Cell,
  emptyKind,
  fillCells,
  type Kind,
  leftAlone,
  lineCells,
  paint,
} from './ground.ts'

export type Hand = 'brush' | 'box' | 'fill' | 'erase'

/** The hand's way from what is held: the free thumb's buttons, or the keys a computer has (Shift: box, Alt: erase, both: fill). */
export function handOf(held: ReadonlySet<string>, shift: boolean, alt: boolean): Hand {
  if (held.has('fill') || (shift && alt)) return 'fill'
  if (held.has('box') || shift) return 'box'
  if (held.has('erase') || alt) return 'erase'
  return 'brush'
}

export interface Stroke {
  readonly base: Level
  readonly hand: Hand
  readonly first: Cell
  readonly cells: Cell[]
}

export const startStroke = (base: Level, hand: Hand, first: Cell): Stroke => ({
  base,
  hand,
  first,
  cells: [first],
})

/** The hand has moved to `to`: a brush and an eraser follow the path with no gap, a box is the corners, a fill is where it began. */
export function strokeTo(stroke: Stroke, to: Cell): readonly Cell[] {
  if (stroke.hand === 'box') return boxCells(stroke.first, to)
  if (stroke.hand === 'fill') return fillCells(stroke.base, stroke.first)
  stroke.cells.push(...lineCells(stroke.cells.at(-1) ?? stroke.first, to))
  return stroke.cells
}

/** What the hand paints with: an eraser paints the empty kind. */
export const kindOfStroke = (stroke: Stroke, chosen: Kind, kinds: readonly Kind[]): Kind =>
  stroke.hand === 'erase' ? emptyKind(kinds) : chosen

export interface Painted {
  readonly done: Done
  /** Cells a thing or a start stands on, which a solid kind left as they were. */
  readonly left: readonly Cell[]
}

export function paintStroke(
  stroke: Stroke,
  characters: Characters,
  cells: readonly Cell[],
  kind: Kind,
): Painted {
  return {
    done: paint(stroke.base, characters, cells, kind),
    left: leftAlone(stroke.base, characters, cells, kind),
  }
}

/** How the way across to another level changed between two sets of edges: the first level whose open stretch grew or shrank. */
export function wayChanged(
  before: readonly Edge[],
  after: readonly Edge[],
): { readonly other: string; readonly how: 'opened' | 'closed' | 'wider' | 'narrower' } | undefined {
  const open = (edges: readonly Edge[], other: string): number =>
    edges.filter((edge) => edge.other === other).reduce((sum, edge) => sum + edge.to - edge.from, 0)
  for (const other of new Set([...before, ...after].map((edge) => edge.other))) {
    const was = open(before, other)
    const now = open(after, other)
    if (now === was) continue
    if (was === 0) return { other, how: 'opened' }
    if (now === 0) return { other, how: 'closed' }
    return { other, how: now > was ? 'wider' : 'narrower' }
  }
  return undefined
}
