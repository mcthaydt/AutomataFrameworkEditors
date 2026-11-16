// Where the level's floating parts sit: beside what is picked and never on top of it, and always inside the stage.
import type { Characters } from './edit.ts'
import type { Rect } from './marks.ts'
import type { Point } from './place.ts'
import { type Camera, type Screen, toScreen } from './view.ts'

/** The height of the bar over what is picked, and the side of the pad of arrows, in points. */
export const BAR_HEIGHT = 56
export const PAD_SIDE = 164
const GAP = 8

const clamp = (value: number, low: number, high: number): number =>
  Math.min(Math.max(low, value), Math.max(low, high))
const crosses = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

/** The bar above what is picked, or below it when there is no room above, or at the top when there is none either. */
export function barPlace(box: Rect, screen: Screen, width: number): Point {
  const x = clamp(box.x + box.w / 2 - width / 2, GAP, screen.w - width - GAP)
  let y = box.y - BAR_HEIGHT - GAP
  if (y < GAP) y = box.y + box.h + GAP
  if (y + BAR_HEIGHT > screen.h - GAP) y = GAP
  return { x, y }
}

/** The pad of arrows in the first corner of the stage that is clear of what is picked. */
export function padPlace(box: Rect | undefined, screen: Screen): Point {
  const right = screen.w - PAD_SIDE - GAP
  const bottom = screen.h - PAD_SIDE - GAP
  const corners: readonly Point[] = [
    { x: right, y: bottom },
    { x: GAP, y: bottom },
    { x: right, y: GAP },
    { x: GAP, y: GAP },
  ]
  const free = corners.find((at) => box === undefined || !crosses({ ...at, w: PAD_SIDE, h: PAD_SIDE }, box))
  return free ?? (corners[0] as Point)
}

/** A menu that opens at a point, kept inside the stage. */
export function menuPlace(at: Point, screen: Screen, size = { w: 260, h: 260 }): Point {
  return { x: clamp(at.x, GAP, screen.w - size.w), y: clamp(at.y, GAP, screen.h - size.h) }
}

/** Where a thing of this size would stand if it were put at `at` (tiles), snapped to half a tile, as a box on the screen. */
export function ghostBox(camera: Camera, screen: Screen, at: Point, size: { w: number; h: number }): Rect {
  const centre = toScreen(camera, screen, { x: Math.round(at.x * 2) / 2, y: Math.round(at.y * 2) / 2 })
  const w = size.w * camera.scale
  const h = size.h * camera.scale
  return { x: centre.x - w / 2, y: centre.y - h / 2, w, h }
}

/** Faint outlines of where things were before they were taken hold of. */
export function outlines(
  camera: Camera,
  screen: Screen,
  characters: Characters,
  things: readonly {
    readonly id: string
    readonly character: string
    readonly x: number
    readonly y: number
  }[],
): readonly (Rect & { readonly id: string })[] {
  return things.map((t) => ({
    id: t.id,
    ...ghostBox(camera, screen, t, characters[t.character]?.size ?? { w: 1, h: 1 }),
  }))
}
