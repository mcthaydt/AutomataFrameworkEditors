// Where a box may be: positions snap to half a tile so the files stay tidy, and a box never rests in a wall. Plain
// functions; nothing here knows about a screen or a finger.
import type { Level } from '@automataframework/framework/headless'

/** Positions snap to half a tile. */
export const STEP = 0.5
/** A box that rests exactly on solid ground is not "inside" it: touching is not overlapping. */
const TOLERANCE = 1e-9

export interface Point {
  readonly x: number
  readonly y: number
}
export interface Size {
  readonly w: number
  readonly h: number
}

/** The nearest multiple of `STEP`; halves round up. Never `-0`. */
export function snap(value: number): number {
  return Math.round(value / STEP) * STEP + 0
}

/** True when the box overlaps a solid (`#`) tile. */
export function onSolid(level: Level, size: Size, at: Point): boolean {
  const left = at.x - size.w / 2
  const right = at.x + size.w / 2
  const top = at.y - size.h / 2
  const bottom = at.y + size.h / 2
  for (let row = Math.max(0, Math.floor(top)); row < Math.min(level.tiles.length, Math.ceil(bottom)); row++) {
    const tiles = level.tiles[row] ?? ''
    for (let col = Math.max(0, Math.floor(left)); col < Math.min(tiles.length, Math.ceil(right)); col++) {
      if (tiles[col] !== '#') continue
      const overlapX = right > col + TOLERANCE && left < col + 1 - TOLERANCE
      const overlapY = bottom > row + TOLERANCE && top < row + 1 - TOLERANCE
      if (overlapX && overlapY) return true
    }
  }
  return false
}
