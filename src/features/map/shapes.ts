// Where each mark of the map is on the screen, worked out from the boxes and the camera. Pure arithmetic: the map's
// look and its tests use the same numbers. Tiles are the map's own (where the world file puts a level); pixels are CSS
// pixels of the part that holds the map.
import type { Level } from '@automataframework/framework/headless'
import { type Camera, type Point, type Screen, toScreen } from '../levels/levels.ts'
import type { Box, Door } from './arrange.ts'
import { wholeWorld } from './arrange.ts'

export interface Rect {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
}

/** Room the two buttons take along the top of the map ("Whole world" and "New level"), kept clear of what floats. */
export const TOP_ROOM = 60

/** Room the key takes along the bottom of the map, so no level is drawn under it. */
export const KEY_ROOM = 56
/** How wide the key at the foot is at most: a card may sit in the band beside it. */
export const KEY_WIDTH = 580

/** The "Whole world" view: every level inside the part, with the key's room kept clear at the foot. */
export function mapCamera(all: readonly Box[], size: Screen): Camera {
  const free = { w: Math.max(1, size.w), h: Math.max(1, size.h - KEY_ROOM) }
  const view = wholeWorld(all, free)
  // The part's middle is KEY_ROOM / 2 lower than the free area's middle, so the tile there is a little lower down.
  return { x: view.x, y: view.y + KEY_ROOM / 2 / view.scale, scale: view.scale }
}

/** A level's box as a rectangle of pixels. */
export function rectOf(box: Box, camera: Camera, size: Screen): Rect {
  const at = toScreen(camera, size, box)
  return { x: at.x, y: at.y, w: box.w * camera.scale, h: box.h * camera.scale }
}

/** A shared stretch (a join or a wall) as a line of pixels, from its start to its end, on the side two levels share. */
export function stretchOf(
  stretch: {
    readonly a: string
    readonly b: string
    readonly along: 'x' | 'y'
    readonly from: number
    readonly to: number
  },
  all: readonly Box[],
  camera: Camera,
  size: Screen,
): { readonly from: Point; readonly to: Point } | undefined {
  const b = all.find((box) => box.level === stretch.b)
  if (b === undefined) return undefined
  // `a` is the left or top level, so the side they share is where `b` begins.
  return stretch.along === 'y'
    ? {
        from: toScreen(camera, size, { x: b.x, y: stretch.from }),
        to: toScreen(camera, size, { x: b.x, y: stretch.to }),
      }
    : {
        from: toScreen(camera, size, { x: stretch.from, y: b.y }),
        to: toScreen(camera, size, { x: stretch.to, y: b.y }),
      }
}

/** The middle of a thing in a level, or the level's own start (else its middle) when there is no such thing. */
function spotIn(level: Level | undefined, box: Box, thing: string | undefined): Point {
  const found = thing === undefined ? undefined : level?.things.find((one) => one.id === thing)
  if (found !== undefined) return { x: box.x + found.x, y: box.y + found.y }
  const start = level?.starts[0]
  if (start !== undefined) return { x: box.x + start.x, y: box.y + start.y }
  return { x: box.x + box.w / 2, y: box.y + box.h / 2 }
}

/** A door as an arrow: from the door itself to where a person comes out, both in pixels. */
export function arrowOf(
  door: Door,
  all: readonly Box[],
  levels: Readonly<Record<string, Level>>,
  camera: Camera,
  size: Screen,
): { readonly from: Point; readonly to: Point } | undefined {
  const here = all.find((box) => box.level === door.from.level)
  const there = all.find((box) => box.level === door.to.level)
  if (here === undefined || there === undefined) return undefined
  const from = spotIn(levels[here.level], here, door.from.thing)
  const to = spotIn(levels[there.level], there, door.to.thing)
  return { from: toScreen(camera, size, from), to: toScreen(camera, size, to) }
}

/** A gentle curve from one point to another, drawn as an SVG path; its far end carries the arrow's head. */
export function curve(from: Point, to: Point): string {
  const lift = Math.min(60, Math.hypot(to.x - from.x, to.y - from.y) / 3)
  return `M${from.x} ${from.y} Q${(from.x + to.x) / 2} ${Math.min(from.y, to.y) - lift} ${to.x} ${to.y}`
}

type Stretch = Parameters<typeof stretchOf>[0]

/** Each shared stretch as a line of pixels, named by its pair; one with no level to sit on is left out. */
export function linesOf(
  stretches: readonly Stretch[],
  all: readonly Box[],
  camera: Camera,
  size: Screen,
): { readonly a: string; readonly b: string; readonly from: Point; readonly to: Point }[] {
  return stretches.flatMap((one) => {
    const found = stretchOf(one, all, camera, size)
    return found === undefined ? [] : [{ a: one.a, b: one.b, ...found }]
  })
}

/** Each door as an arrow named by where it is and where it goes; one with no level to sit on is left out. */
export function arrowsOf(
  doors: readonly Door[],
  all: readonly Box[],
  levels: Readonly<Record<string, Level>>,
  camera: Camera,
  size: Screen,
): {
  readonly level: string
  readonly thing: string
  readonly goes: string
  readonly from: Point
  readonly to: Point
}[] {
  return doors.flatMap((door) => {
    const found = arrowOf(door, all, levels, camera, size)
    return found === undefined
      ? []
      : [{ level: door.from.level, thing: door.from.thing, goes: door.to.level, ...found }]
  })
}
