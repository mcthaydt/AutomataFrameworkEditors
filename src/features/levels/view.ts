// The view of a level: how much bigger than the whole level it is drawn, and which point of the level is in the middle
// of the clear cell. Every way a view changes is a plain function here, so fingers, the wheel, keys and buttons all end
// in the same few numbers. Nothing here knows about a page.
import type { Fit } from '@automataframework/framework'
import type { Point, Size } from './place.ts'

/** zoom 1 is the whole level fitted in the clear cell; `x` and `y` are the level's point, in tiles, at the cell's middle. */
export interface LevelView {
  readonly zoom: number
  readonly x: number
  readonly y: number
}
/** A box in some unit; the clear cell is one in CSS pixels, a thing's place one in tiles. */
export interface Box {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
}

/** The most zoom is the one at which a tile is this many CSS pixels, and never less than 2 (ruling 20). */
export const MOST_TILE_PX = 128
/** One press of a zoom button. */
export const ZOOM_STEP = 1.5
/** How near the clear cell's edge a dragged thing starts the level sliding. */
export const EDGE_PX = 40
/** The fastest the level slides, at the edge itself. */
export const SLIDE_PX_S = 480
/** Around a thing that is brought into view, so it is not left touching the edge. */
const REVEAL_MARGIN = 0.5

/** The whole level, in the middle. */
export const whole = (world: Size): LevelView => ({ zoom: 1, x: world.w / 2, y: world.h / 2 })

/** Is it the whole level (or near enough that a pinch's last pixel does not count)? */
export const isWhole = (view: LevelView): boolean => view.zoom < 1.005

/** The most the view may zoom: 1 when the level has no room at all. */
export function mostZoom(home: Fit): number {
  return home.scale > 0 ? Math.max(2, MOST_TILE_PX / home.scale) : 1
}

const usable = (home: Fit): boolean => home.scale > 0 && Number.isFinite(home.scale)

/** One axis: the middle, kept so the level never leaves the clear cell's edges, or centered when it is smaller. */
function clampAxis(middle: number, worldSize: number, cellSize: number, scale: number): number {
  if (worldSize * scale <= cellSize + 1e-9) return worldSize / 2
  const half = cellSize / 2 / scale
  return Math.min(Math.max(middle, half), worldSize - half)
}

/** The view kept legal (ruling 20): zoom from 1 to the most, and the level never lost off the screen. */
export function clampView(view: LevelView, home: Fit, clear: Box, world: Size): LevelView {
  if (!usable(home) || !Number.isFinite(view.zoom + view.x + view.y)) return whole(world)
  const zoom = Math.min(Math.max(view.zoom, 1), mostZoom(home))
  const scale = home.scale * zoom
  return {
    zoom,
    x: clampAxis(view.x, world.w, clear.w, scale),
    y: clampAxis(view.y, world.h, clear.h, scale),
  }
}

/** The framework's `Fit` that draws this view: what `setView` takes. */
export function fitOf(view: LevelView, home: Fit, clear: Box): Fit {
  const scale = home.scale * view.zoom
  return {
    scale,
    left: clear.x + clear.w / 2 - view.x * scale,
    top: clear.y + clear.h / 2 - view.y * scale,
  }
}

/** The view that has `level` (a point of the level) under `at` (a point of the stage) at this zoom. */
function holding(zoom: number, level: Point, at: Point, home: Fit, clear: Box): LevelView {
  const scale = home.scale * zoom
  return {
    zoom,
    x: level.x - (at.x - (clear.x + clear.w / 2)) / scale,
    y: level.y - (at.y - (clear.y + clear.h / 2)) / scale,
  }
}

/** The level's point under a point of the stage, in this view. */
function levelPointAt(view: LevelView, home: Fit, clear: Box, at: Point): Point {
  const scale = home.scale * view.zoom
  return {
    x: view.x + (at.x - (clear.x + clear.w / 2)) / scale,
    y: view.y + (at.y - (clear.y + clear.h / 2)) / scale,
  }
}

/** Zooms by `factor`, keeping the level's point under `at` under it. */
export function zoomAbout(
  view: LevelView,
  home: Fit,
  clear: Box,
  world: Size,
  at: Point,
  factor: number,
): LevelView {
  const start = clampView(view, home, clear, world)
  if (!usable(home) || !Number.isFinite(factor + at.x + at.y) || factor <= 0) return start
  const zoom = Math.min(Math.max(start.zoom * factor, 1), mostZoom(home))
  return clampView(holding(zoom, levelPointAt(start, home, clear, at), at, home, clear), home, clear, world)
}

/** Moves the level by `dx`, `dy` pixels: a finger moving left by 10 moves the level left by 10. */
export function panBy(
  view: LevelView,
  home: Fit,
  clear: Box,
  world: Size,
  dx: number,
  dy: number,
): LevelView {
  const start = clampView(view, home, clear, world)
  if (!usable(home) || !Number.isFinite(dx + dy)) return start
  const scale = home.scale * start.zoom
  return clampView({ zoom: start.zoom, x: start.x - dx / scale, y: start.y - dy / scale }, home, clear, world)
}

const middle = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
const apart = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y)

/**
 * Two fingers moved from `from` to `to`: scaled by the ratio of their distances and moved by their midpoint, always
 * worked out from the view the gesture started with.
 */
export function pinch(
  start: LevelView,
  home: Fit,
  clear: Box,
  world: Size,
  from: readonly [Point, Point],
  to: readonly [Point, Point],
): LevelView {
  const first = clampView(start, home, clear, world)
  const before = apart(from[0], from[1])
  const after = apart(to[0], to[1])
  const mid = middle(to[0], to[1])
  if (!usable(home) || !(before > 0) || !(after > 0) || !Number.isFinite(before + after + mid.x + mid.y)) {
    return first
  }
  const zoom = Math.min(Math.max(first.zoom * (after / before), 1), mostZoom(home))
  const held = levelPointAt(first, home, clear, middle(from[0], from[1]))
  return clampView(holding(zoom, held, mid, home, clear), home, clear, world)
}

/** The zoom after a press of a button: in is one step, out is one step back and anything near 1 is 1. */
export function stepZoom(zoom: number, way: 'in' | 'out', most: number): number {
  if (way === 'in') return Math.min(most, zoom * ZOOM_STEP)
  const smaller = zoom / ZOOM_STEP
  return smaller < 1.01 ? 1 : smaller
}

/** One axis of `reveal`: the middle that shows `low` to `high` by the least move. */
function revealAxis(middleNow: number, half: number, low: number, high: number): number {
  if (low < middleNow - half) return low + half
  if (high > middleNow + half) return high - half
  return middleNow
}

/**
 * The view that shows a box (in tiles, with half a tile round it) by the least move at the same zoom. The same object
 * when it is in sight already.
 */
export function reveal(view: LevelView, home: Fit, clear: Box, world: Size, box: Box): LevelView {
  const start = clampView(view, home, clear, world)
  if (!usable(home)) return start
  const scale = home.scale * start.zoom
  const x = revealAxis(start.x, clear.w / 2 / scale, box.x - REVEAL_MARGIN, box.x + box.w + REVEAL_MARGIN)
  const y = revealAxis(start.y, clear.h / 2 / scale, box.y - REVEAL_MARGIN, box.y + box.h + REVEAL_MARGIN)
  if (x === start.x && y === start.y) {
    return start.zoom === view.zoom && start.x === view.x && start.y === view.y ? view : start
  }
  return clampView({ zoom: start.zoom, x, y }, home, clear, world)
}

/** How far the level slides while a dragged thing is held near an edge of the clear cell, in `seconds`. */
export function edgeSlide(
  at: Point,
  clear: Box,
  seconds: number,
): { readonly dx: number; readonly dy: number } {
  const along = (value: number, low: number, high: number): number => {
    const toLow = Math.max(0, (EDGE_PX - (value - low)) / EDGE_PX)
    const toHigh = Math.max(0, (EDGE_PX - (high - value)) / EDGE_PX)
    return (Math.min(1, toHigh) - Math.min(1, toLow)) * SLIDE_PX_S * seconds
  }
  const dx = along(at.x, clear.x, clear.x + clear.w)
  const dy = along(at.y, clear.y, clear.y + clear.h)
  return { dx: Number.isFinite(dx) ? dx + 0 : 0, dy: Number.isFinite(dy) ? dy + 0 : 0 }
}
