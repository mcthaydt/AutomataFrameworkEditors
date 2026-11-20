// Where the map's floating cards sit, and what a drag says it would do. Pure: the same numbers the screen uses.
import type { LevelPoint } from '@automataframework/framework/headless'
import { nameOf, type Row, type Words } from '../words/words.ts'
import type { Box, Landing } from './arrange.ts'
import type { Rect } from './shapes.ts'

export type { Rect } from './shapes.ts'

const GAP = 8

const clamp = (value: number, low: number, high: number): number =>
  Math.min(Math.max(low, value), Math.max(low, high))
const overlap = (a: Rect, b: Rect): number =>
  Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) *
  Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y))

/**
 * Where a floating card may sit: the first of the places below, above, right and left of `anchor` that is inside
 * `screen` and covers none of `keepClear`; failing those, the far left or far right of the screen, level with it, where
 * a card does not hide the level it is for. When every one does, the one that covers least (the anchor counts too).
 */
export function placeCard(
  card: { readonly w: number; readonly h: number },
  anchor: Rect,
  keepClear: readonly Rect[],
  screen: Rect,
): Rect {
  const within = (x: number, y: number): Rect => ({
    x: clamp(x, screen.x, screen.x + screen.w - card.w),
    y: clamp(y, screen.y, screen.y + screen.h - card.h),
    ...card,
  })
  const across = anchor.x + anchor.w / 2 - card.w / 2
  const down = anchor.y + anchor.h / 2 - card.h / 2
  const candidates = [
    within(across, anchor.y + anchor.h + GAP),
    within(across, anchor.y - card.h - GAP),
    within(anchor.x + anchor.w + GAP, down),
    within(anchor.x - card.w - GAP, down),
    // The band under the levels, clear of the anchor's own bar: a card there hides no level at all.
    within(screen.x + GAP, anchor.y + anchor.h + GAP),
    within(screen.x + screen.w - card.w - GAP, anchor.y + anchor.h + GAP),
    within(screen.x + GAP, down),
    within(screen.x + screen.w - card.w - GAP, down),
  ]
  const covered = (at: Rect): number => [anchor, ...keepClear].reduce((sum, one) => sum + overlap(at, one), 0)
  return candidates.reduce((best, one) => (covered(one) < covered(best) ? one : best))
}

const text = (row: Row, ...parts: string[]): string => (typeof row === 'function' ? row(...parts) : row)

/** The line under a drag or on the move pad: what the next step would do. */
export function landingWords(landing: Landing, words: Words): string {
  const say = words.arrange
  if (landing.kind === 'overlap') return text(say.landOver, nameOf(landing.over))
  if (landing.kind === 'free') return text(say.landFree)
  const join = landing.joins[0]
  if (join !== undefined) return text(say.landJoin, nameOf(join.a), nameOf(join.b))
  const wall = landing.walls[0]
  if (wall !== undefined) return text(say.landWall, nameOf(wall.a), nameOf(wall.b))
  return text(say.landTouch)
}

/** Where a new level goes when nothing says: right of every level, on the top row, two tiles clear. */
export function freeSpot(all: readonly Box[]): LevelPoint {
  if (all.length === 0) return { x: 0, y: 0 }
  return { x: Math.max(...all.map((box) => box.x + box.w)) + 2, y: Math.min(...all.map((box) => box.y)) }
}

/** Whether a level of this size put with its top left at `at` would cover none of the levels there already. */
export function fits(
  all: readonly Box[],
  at: LevelPoint,
  size: { readonly w: number; readonly h: number },
): boolean {
  return all.every(
    (box) =>
      at.x + size.w <= box.x || box.x + box.w <= at.x || at.y + size.h <= box.y || box.y + box.h <= at.y,
  )
}
