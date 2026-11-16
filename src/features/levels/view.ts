// What part of a level is on the screen, and where a point of the level is on it. A camera is the tile at the screen's
// middle and how many CSS pixels a tile is; everything here is plain arithmetic, so a finger, a key and a test all
// move the same view.
import type { Level } from '@automataframework/framework/headless'
import { levelSize } from '@automataframework/framework/headless'
import type { Tool } from '../shell/shell.ts'
import type { Point } from './place.ts'

/** The tile at the screen's middle (`x`, `y`) and the CSS pixels a tile takes (`scale`). */
export interface Camera {
  readonly x: number
  readonly y: number
  readonly scale: number
}
export interface Screen {
  readonly w: number
  readonly h: number
}
export interface Insets {
  readonly top: number
  readonly right: number
  readonly bottom: number
  readonly left: number
}

/** The fewest and the most pixels a tile may take: below the first a thing is a dot, above the second nothing is left to see. */
export const MIN_SCALE = 4
export const MAX_SCALE = 128
/** The pixels a tile takes when a person asks to see a thing close up. */
export const CLOSE_UP = 64

const hold = (scale: number): number => Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))

/** The view that shows the whole level, centred in the part of the screen the panels leave free. */
export function wholeLevel(level: Level, screen: Screen, insets: Insets): Camera {
  const size = levelSize(level)
  const free = {
    w: Math.max(1, screen.w - insets.left - insets.right),
    h: Math.max(1, screen.h - insets.top - insets.bottom),
  }
  const scale = hold(Math.min(free.w / Math.max(1, size.w), free.h / Math.max(1, size.h)))
  // Where the middle of the free part is, and so which tile must be under the middle of the screen.
  const middle = { x: insets.left + free.w / 2, y: insets.top + free.h / 2 }
  return {
    x: size.w / 2 - (middle.x - screen.w / 2) / scale,
    y: size.h / 2 - (middle.y - screen.h / 2) / scale,
    scale,
  }
}

/** The view that has `around` at the screen's middle, close enough to place a thing by eye. */
export function closeUp(level: Level, around: Point, _screen: Screen): Camera {
  const size = levelSize(level)
  return {
    x: Math.min(size.w, Math.max(0, around.x)),
    y: Math.min(size.h, Math.max(0, around.y)),
    scale: CLOSE_UP,
  }
}

/** Where a tile-point is on the screen, in CSS pixels. */
export function toScreen(camera: Camera, screen: Screen, at: Point): Point {
  return {
    x: screen.w / 2 + (at.x - camera.x) * camera.scale,
    y: screen.h / 2 + (at.y - camera.y) * camera.scale,
  }
}

/** Which tile-point a screen pixel is on. */
export function toTiles(camera: Camera, screen: Screen, px: Point): Point {
  return {
    x: camera.x + (px.x - screen.w / 2) / camera.scale,
    y: camera.y + (px.y - screen.h / 2) / camera.scale,
  }
}

/** A pinch or a wheel: the tile under `about` (a screen pixel) stays under it. The size stops at both limits. */
export function zoomBy(camera: Camera, factor: number, about: Point, screen: Screen): Camera {
  if (!(factor > 0)) return camera
  const scale = hold(camera.scale * factor)
  const under = toTiles(camera, screen, about)
  return {
    x: under.x - (about.x - screen.w / 2) / scale,
    y: under.y - (about.y - screen.h / 2) / scale,
    scale,
  }
}

/** Two fingers slide: the picture follows the fingers by `px`, so the camera goes the other way. */
export function slideBy(camera: Camera, px: Point): Camera {
  return { x: camera.x - px.x / camera.scale, y: camera.y - px.y / camera.scale, scale: camera.scale }
}

/** The small map's box: the part of the level on screen, in the small map's own pixels, and how many of them a tile is. */
export function miniMap(
  level: Level,
  camera: Camera,
  screen: Screen,
  mini: Screen,
): { readonly box: { x: number; y: number; w: number; h: number }; readonly scale: number } {
  const size = levelSize(level)
  const scale = Math.min(mini.w / Math.max(1, size.w), mini.h / Math.max(1, size.h))
  const left = Math.max(0, camera.x - screen.w / 2 / camera.scale)
  const top = Math.max(0, camera.y - screen.h / 2 / camera.scale)
  const right = Math.min(size.w, camera.x + screen.w / 2 / camera.scale)
  const bottom = Math.min(size.h, camera.y + screen.h / 2 / camera.scale)
  return {
    box: {
      x: left * scale,
      y: top * scale,
      w: Math.max(0, right - left) * scale,
      h: Math.max(0, bottom - top) * scale,
    },
    scale,
  }
}

/** A tap or a drag on the small map (a point in its pixels): the camera that puts that spot at the screen's middle, size kept. */
export function fromMini(level: Level, point: Point, camera: Camera, _screen: Screen, mini: Screen): Camera {
  const size = levelSize(level)
  const scale = Math.min(mini.w / Math.max(1, size.w), mini.h / Math.max(1, size.h))
  if (!(scale > 0)) return camera
  return {
    x: Math.min(size.w, Math.max(0, point.x / scale)),
    y: Math.min(size.h, Math.max(0, point.y / scale)),
    scale: camera.scale,
  }
}

/** What the level view is showing and doing: the tool, what is picked, what is locked or hidden this visit, and where it looks. */
export interface LevelView {
  readonly tool: Tool
  readonly picked: readonly string[]
  readonly locked: ReadonlySet<string>
  readonly hidden: ReadonlySet<string>
  readonly camera: Camera
  /** The ground is picked (so painting and filling work on it). */
  readonly ground: boolean
}
