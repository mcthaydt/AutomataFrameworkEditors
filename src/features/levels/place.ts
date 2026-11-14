// Where a box may be: positions snap to half a tile so the files stay tidy, stay inside the level, and never rest in
// a wall. Plain functions; nothing here knows about a screen or a finger.

import type { Fit } from '@automataframework/framework'
import type { GameContent, Level } from '@automataframework/framework/headless'
import { levelSize } from '@automataframework/framework/headless'

// The fit of a level in the room kept round it comes from the framework, so the editors place a thing exactly where the
// picture draws it.
export { fitInRoom, type Room } from '@automataframework/framework'

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

/** Snaps `at`, then puts the whole box inside the level, side against the edge at most. */
export function keepInside(level: Level, size: Size, at: Point): Point {
  const world = levelSize(level)
  const clamp = (value: number, half: number, whole: number): number =>
    Math.max(half, Math.min(whole - half, snap(value))) + 0
  return { x: clamp(at.x, size.w / 2, world.w), y: clamp(at.y, size.h / 2, world.h) }
}

/**
 * Which letters of the level's tiles are solid: its tileset's solid tiles, or, for a level with no tileset (or one the
 * game does not have, while it is being fixed), `#`.
 */
export function solidOf(content: GameContent, level: Level): (letter: string) => boolean {
  const tileset = level.tileset === undefined ? undefined : content.tilesets?.[level.tileset]
  if (tileset === undefined) return (letter) => letter === '#'
  const letters = new Set(tileset.tiles.filter((tile) => tile.solid).map((tile) => tile.letter))
  return (letter) => letters.has(letter)
}

/** True when the box overlaps a solid tile (`solid` says which letters are). */
export function onSolid(level: Level, size: Size, at: Point, solid: (letter: string) => boolean): boolean {
  const left = at.x - size.w / 2
  const right = at.x + size.w / 2
  const top = at.y - size.h / 2
  const bottom = at.y + size.h / 2
  for (let row = Math.max(0, Math.floor(top)); row < Math.min(level.tiles.length, Math.ceil(bottom)); row++) {
    const tiles = level.tiles[row] ?? ''
    for (let col = Math.max(0, Math.floor(left)); col < Math.min(tiles.length, Math.ceil(right)); col++) {
      const letter = tiles[col]
      if (letter === undefined || !solid(letter)) continue
      const overlapX = right > col + TOLERANCE && left < col + 1 - TOLERANCE
      const overlapY = bottom > row + TOLERANCE && top < row + 1 - TOLERANCE
      if (overlapX && overlapY) return true
    }
  }
  return false
}

/** Tiles to CSS pixels inside the stage. */
export function toScreen(fit: Fit, at: Point): Point {
  return { x: fit.left + at.x * fit.scale, y: fit.top + at.y * fit.scale }
}

/** CSS pixels inside the stage back to tiles; the origin when the stage has no size. */
export function toWorld(fit: Fit, px: Point): Point {
  if (!(fit.scale > 0)) return { x: 0, y: 0 }
  return { x: (px.x - fit.left) / fit.scale, y: (px.y - fit.top) / fit.scale }
}
