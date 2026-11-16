// The editor's marks over a level: one real element for each thing and start, so each has a hit area a finger can find
// (at least 44 by 44 points), a name a screen reader says and a journey can look for. Plain functions: nothing here
// knows about a screen's pixels beyond the camera it is given.
import type { Level } from '@automataframework/framework/headless'
import type { Characters } from './edit.ts'
import type { Point } from './place.ts'
import { type LevelView, type Screen, toScreen } from './view.ts'

/** The fewest points a thing may be hit across. */
export const MIN_HIT = 44

export interface Rect {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
}

export interface Mark {
  readonly id: string
  readonly kind: 'thing' | 'start' | 'handle' | 'arrow' | 'tag' | 'bar' | 'ghost' | 'note'
  /** Where the thing is drawn, in the stage's pixels. */
  readonly box: Rect
  /** Where a pointer finds it: the box grown to at least 44 by 44, and cut where two would share a part. */
  readonly hit: Rect
  /** What a screen reader says. */
  readonly name: string
  /** Where it is in the level, in tiles. */
  readonly at: Point
}

const area = (r: Rect): number => r.w * r.h
const centre = (r: Rect): Point => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 })
const overlaps = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

const grow = (box: Rect): Rect => {
  const w = Math.max(MIN_HIT, box.w)
  const h = Math.max(MIN_HIT, box.h)
  const c = centre(box)
  return { x: c.x - w / 2, y: c.y - h / 2, w, h }
}

/**
 * Two hit areas that cross: where the things themselves do not touch, the shared part goes to the smaller thing, or is
 * split down the middle when they are the same size, along the way the two are further apart. Things that overlap
 * each other are left to the page's stacking (the smaller is drawn on top).
 */
function settle(a: Mark, b: Mark, hits: Map<string, Rect>): void {
  const ha = hits.get(a.id) as Rect
  const hb = hits.get(b.id) as Rect
  if (!overlaps(ha, hb) || overlaps(a.box, b.box)) return
  const ca = centre(a.box)
  const cb = centre(b.box)
  const alongX = Math.abs(ca.x - cb.x) >= Math.abs(ca.y - cb.y)
  const [start, size] = alongX ? (['x', 'w'] as const) : (['y', 'h'] as const)
  const from = Math.max(ha[start], hb[start])
  const to = Math.min(ha[start] + ha[size], hb[start] + hb[size])
  const sizeA = area(a.box)
  const sizeB = area(b.box)
  const aFirst = (alongX ? ca.x : ca.y) <= (alongX ? cb.x : cb.y)
  // `first` is the one nearer the start of the way, `second` the other; each gives up some of the shared part.
  const [first, second] = aFirst ? [a, b] : [b, a]
  const cut = (mark: Mark, side: 'end' | 'start', at: number): void => {
    const h = hits.get(mark.id) as Rect
    if (side === 'end') hits.set(mark.id, { ...h, [size]: Math.max(0, at - h[start]) })
    else hits.set(mark.id, { ...h, [start]: at, [size]: Math.max(0, h[start] + h[size] - at) })
  }
  if (Math.abs(sizeA - sizeB) < 1e-6) {
    const half = (from + to) / 2
    cut(first, 'end', half)
    cut(second, 'start', half)
  } else if (sizeA < sizeB === (first === a)) {
    // The first is the smaller: the second gives up the shared part.
    cut(second, 'start', to)
  } else {
    cut(first, 'end', from)
  }
}

/** Every mark for the level at this camera, in the order the level lists its things, then its starts. */
export function marksFor(
  level: Level,
  characters: Characters,
  view: LevelView,
  screen: Screen,
  names: (id: string) => string,
): readonly Mark[] {
  const marks: Mark[] = []
  const boxOf = (at: Point, size: { w: number; h: number }): Rect => {
    const c = toScreen(view.camera, screen, at)
    const w = size.w * view.camera.scale
    const h = size.h * view.camera.scale
    return { x: c.x - w / 2, y: c.y - h / 2, w, h }
  }
  for (const thing of level.things) {
    if (view.hidden.has(thing.id)) continue
    const size = characters[thing.character]?.size ?? { w: 1, h: 1 }
    const box = boxOf(thing, size)
    marks.push({
      id: thing.id,
      kind: 'thing',
      box,
      hit: grow(box),
      name: names(thing.id),
      at: { x: thing.x, y: thing.y },
    })
  }
  for (const start of level.starts) {
    const id = `start-${start.player}`
    const box = boxOf(start, { w: 1, h: 1 })
    marks.push({ id, kind: 'start', box, hit: grow(box), name: names(id), at: { x: start.x, y: start.y } })
  }
  const hits = new Map(marks.map((m) => [m.id, m.hit] as const))
  for (let i = 0; i < marks.length; i++) {
    for (let j = i + 1; j < marks.length; j++) settle(marks[i] as Mark, marks[j] as Mark, hits)
  }
  return marks.map((m) => ({ ...m, hit: hits.get(m.id) as Rect }))
}

/** The one box that holds the marks named by `ids`, or none when none of them is on screen. */
export function unionBox(marks: readonly Mark[], ids: readonly string[]): Rect | undefined {
  const boxes = marks.filter((m) => ids.includes(m.id)).map((m) => m.box)
  if (boxes.length === 0) return undefined
  const x = Math.min(...boxes.map((b) => b.x))
  const y = Math.min(...boxes.map((b) => b.y))
  return {
    x,
    y,
    w: Math.max(...boxes.map((b) => b.x + b.w)) - x,
    h: Math.max(...boxes.map((b) => b.y + b.h)) - y,
  }
}
