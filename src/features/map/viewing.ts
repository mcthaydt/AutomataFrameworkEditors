// Sliding and zooming the map: pure functions of the view a person has and the levels that are on it. The view is a
// `Camera` (the tile at the screen's middle, and the pixels a tile takes), or none while every level is fitted
// ("Whole world"): fitted follows the levels as they move, a view a person made stays where it was put.
import { type Camera, type Screen, toTiles } from '../levels/levels.ts'
import type { Box } from './arrange.ts'
import { KEY_ROOM, mapCamera, type Rect, TOP_ROOM } from './shapes.ts'

/** The most pixels a tile may take on the map: a level is then wider than a phone, and nothing more is gained. */
export const MAP_MAX_SCALE = 96

/** Keeps the middle of the view over the levels, so the world can never be slid out of reach. */
function overTheWorld(camera: Camera, all: readonly Box[]): Camera {
  if (all.length === 0) return camera
  const left = Math.min(...all.map((box) => box.x))
  const top = Math.min(...all.map((box) => box.y))
  const right = Math.max(...all.map((box) => box.x + box.w))
  const bottom = Math.max(...all.map((box) => box.y + box.h))
  return {
    x: Math.min(right, Math.max(left, camera.x)),
    y: Math.min(bottom, Math.max(top, camera.y)),
    scale: camera.scale,
  }
}

/** Is this the view that fits every level (or no further out than it)? Then it is "Whole world", which follows the levels. */
const isWhole = (camera: Camera, all: readonly Box[], size: Screen): boolean =>
  camera.scale <= mapCamera(all, size).scale * 1.001

/** Two fingers (or one on empty ground) slide: the picture follows the fingers by `px`. */
export function slideMap(
  now: Camera,
  px: { readonly x: number; readonly y: number },
  all: readonly Box[],
): Camera {
  return overTheWorld({ x: now.x - px.x / now.scale, y: now.y - px.y / now.scale, scale: now.scale }, all)
}

/**
 * A pinch or a wheel: the tile under `about` (a screen pixel) stays under it. It goes no further out than every level
 * fitted, which comes back as `undefined`, and no further in than `MAP_MAX_SCALE`.
 */
export function zoomMap(
  now: Camera,
  factor: number,
  about: { readonly x: number; readonly y: number },
  all: readonly Box[],
  size: Screen,
): Camera | undefined {
  if (!(factor > 0)) return now
  const whole = mapCamera(all, size).scale
  const scale = Math.min(MAP_MAX_SCALE, Math.max(whole, now.scale * factor))
  const under = toTiles(now, size, about)
  const next = overTheWorld(
    {
      x: under.x - (about.x - size.w / 2) / scale,
      y: under.y - (about.y - size.h / 2) / scale,
      scale,
    },
    all,
  )
  return isWhole(next, all, size) ? undefined : next
}

/**
 * The view brought to a level that is picked from the list, or tabbed to: unchanged when it is already well in sight,
 * that is between the buttons along the top and the key along the foot.
 */
export function reveal(now: Camera, level: Rect, all: readonly Box[], size: Screen): Camera {
  const free = { w: size.w, top: TOP_ROOM, bottom: Math.max(TOP_ROOM + 1, size.h - KEY_ROOM) }
  const inSight =
    level.x >= 0 && level.y >= free.top && level.x + level.w <= free.w && level.y + level.h <= free.bottom
  if (inSight) return now
  const dx = level.x + level.w / 2 - free.w / 2
  const dy = level.y + level.h / 2 - (free.top + free.bottom) / 2
  return overTheWorld({ x: now.x + dx / now.scale, y: now.y + dy / now.scale, scale: now.scale }, all)
}
