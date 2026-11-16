// What a stream of pointer events means, as plain data, so a finger, a Pencil and a mouse are told apart in one place
// and a test can play a whole gesture with a list. It knows nothing of a screen: points are the stage's own pixels, and
// `on` is the name of the mark under the pointer when it went down (the caller finds it).
import type { PointerKind, Pointers } from '../device/pointer.ts'
import type { Tool } from '../shell/shell.ts'
import type { Point } from './place.ts'

/** The most a pointer may wander, in pixels, and still be a tap or a press and hold. */
export const SLOP = 8
/** How long a pointer must stay put to be a press and hold, in milliseconds. */
export const HOLD_MS = 500

export interface PointerLike {
  readonly type: 'down' | 'move' | 'up' | 'cancel'
  readonly id: number
  readonly kind: PointerKind
  readonly x: number
  readonly y: number
  /** Milliseconds, from any clock that only goes forward. */
  readonly t: number
  /** The buttons pressed: 0 for a hovering Pencil. */
  readonly buttons: number
  /** The mark under the pointer. Only read when it goes down. */
  readonly on?: string | undefined
}

export type Act =
  | { readonly kind: 'tap'; readonly at: Point; readonly on: string | undefined }
  | { readonly kind: 'hold'; readonly at: Point; readonly on: string | undefined }
  | {
      readonly kind: 'drag'
      readonly phase: 'start' | 'move' | 'end' | 'cancel'
      readonly from: Point
      readonly to: Point
      readonly on: string | undefined
      /** The tool acts (not the view). */
      readonly tool: boolean
    }
  | { readonly kind: 'view'; readonly slide: Point; readonly zoom: number; readonly about: Point }
  | { readonly kind: 'hover'; readonly at: Point }

interface Down {
  readonly kind: PointerKind
  readonly start: Point
  readonly t0: number
  readonly on: string | undefined
  now: Point
  /** `undecided`: still a possible tap or hold. `tool` and `view`: a drag has begun. `done`: it means nothing more. */
  state: 'undecided' | 'tool' | 'view' | 'done'
  held: boolean
}

export interface Gestures {
  feed(event: PointerLike): readonly Act[]
  /** Tells it what time it is, so a press that has not moved becomes a hold. Call it after `HOLD_MS` from a `down`. */
  tick(t: number): readonly Act[]
}

const far = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y)
const middle = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

export function createGestures(options: {
  pointers(): Pointers
  fingerDraws(): boolean
  tool(): Tool
}): Gestures {
  const down = new Map<number, Down>()

  let two = false

  /** Does a finger that has gone beyond the slop slide the view, or does the tool act? */
  const slides = (d: Down): boolean =>
    d.kind === 'touch' &&
    d.on === undefined &&
    (options.tool() === 'pick' || (options.pointers().penSeen && !options.fingerDraws()))

  function feed(e: PointerLike): readonly Act[] {
    const at = { x: e.x, y: e.y }
    if (e.type === 'down') {
      const acts: Act[] = []
      const fingers = [...down.values()].filter((d) => d.kind === 'touch' && d.state !== 'done')
      if (e.kind === 'touch' && fingers.length > 0) {
        // A second finger: whatever the first was doing is given up, and the two slide and zoom the view.
        for (const d of down.values()) {
          if (d.state === 'tool')
            acts.push({ kind: 'drag', phase: 'cancel', from: d.start, to: d.now, on: d.on, tool: true })
          d.state = 'view'
        }
        two = true
        down.set(e.id, {
          kind: e.kind,
          start: at,
          t0: e.t,
          on: undefined,
          now: at,
          state: 'view',
          held: false,
        })
        return acts
      }
      down.set(e.id, { kind: e.kind, start: at, t0: e.t, on: e.on, now: at, state: 'undecided', held: false })
      return acts
    }

    const d = down.get(e.id)
    if (d === undefined) {
      if (e.type === 'move' && e.kind === 'pen' && e.buttons === 0) return [{ kind: 'hover', at }]
      return []
    }

    if (e.type === 'move') {
      const before = d.now
      d.now = at
      if (two) {
        const both = [...down.values()].filter((f) => f.kind === 'touch' && f.state === 'view')
        const [a, b] = both
        if (a === undefined || b === undefined) return []
        const was = a === d ? { a: before, b: b.now } : { a: a.now, b: before }
        const nowMid = middle(a.now, b.now)
        const wasMid = middle(was.a, was.b)
        const wasGap = far(was.a, was.b)
        return [
          {
            kind: 'view',
            slide: { x: nowMid.x - wasMid.x, y: nowMid.y - wasMid.y },
            zoom: wasGap > 0 ? far(a.now, b.now) / wasGap : 1,
            about: nowMid,
          },
        ]
      }
      if (d.state === 'done' || d.held) return []
      if (d.state === 'undecided') {
        if (far(d.start, at) <= SLOP) return []
        d.state = slides(d) ? 'view' : 'tool'
        if (d.state === 'view') {
          return [{ kind: 'view', slide: { x: at.x - d.start.x, y: at.y - d.start.y }, zoom: 1, about: at }]
        }
        return [
          { kind: 'drag', phase: 'start', from: d.start, to: d.start, on: d.on, tool: true },
          { kind: 'drag', phase: 'move', from: d.start, to: at, on: d.on, tool: true },
        ]
      }
      if (d.state === 'view') {
        return [{ kind: 'view', slide: { x: at.x - before.x, y: at.y - before.y }, zoom: 1, about: at }]
      }
      return [{ kind: 'drag', phase: 'move', from: d.start, to: at, on: d.on, tool: true }]
    }

    // up or cancel: this pointer is finished.
    down.delete(e.id)
    if (down.size === 0) two = false
    const finished = d.state
    d.state = 'done'
    if (e.type === 'cancel') {
      return finished === 'tool'
        ? [{ kind: 'drag', phase: 'cancel', from: d.start, to: d.now, on: d.on, tool: true }]
        : []
    }
    if (finished === 'tool')
      return [{ kind: 'drag', phase: 'end', from: d.start, to: at, on: d.on, tool: true }]
    if (finished === 'undecided' && !d.held) return [{ kind: 'tap', at, on: d.on }]
    return []
  }

  function tick(t: number): readonly Act[] {
    const acts: Act[] = []
    if (two) return acts
    for (const d of down.values()) {
      if (d.state !== 'undecided' || d.held || t - d.t0 < HOLD_MS) continue
      d.held = true
      acts.push({ kind: 'hold', at: d.now, on: d.on })
    }
    return acts
  }

  return { feed, tick }
}
