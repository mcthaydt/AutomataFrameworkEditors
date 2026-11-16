// What a hand does to a level, as the pure edits of `things.ts` put together: picked things and starts move together,
// a copy lands beside what it copies, and every refusal has a word. Nothing here knows about a screen.
import type { Level } from '@automataframework/framework/headless'
import { type Done, no, ok, type Why } from './done.ts'
import type { Characters } from './edit.ts'
import type { Way } from './nudge.ts'
import type { Point } from './place.ts'
import { copyThings, moveStart, moveThings, nudgeThings } from './things.ts'

/** A start point is picked as `start-1`, `start-2`: the player's number after the dash. */
export const isStart = (id: string): boolean => /^start-\d+$/.test(id)
export const playerOf = (id: string): number => Number(id.slice('start-'.length))

/** Which row of `levels` words says why an edit was refused, or none for a refusal that is not worth saying. */
export function refusalWord(
  why: Why,
):
  | 'refuseSolid'
  | 'refuseOutside'
  | 'refuseOccupied'
  | 'refuseNotAllowed'
  | 'refuseTaken'
  | 'refuseGone'
  | undefined {
  switch (why) {
    case 'same':
      return undefined
    case 'solid':
      return 'refuseSolid'
    case 'outside':
      return 'refuseOutside'
    case 'occupied':
      return 'refuseOccupied'
    case 'taken':
      return 'refuseTaken'
    case 'no-such-thing':
      return 'refuseGone'
    case 'limit':
    case 'not-allowed':
      return 'refuseNotAllowed'
  }
}

/**
 * The picked things and starts moved by the same step of tiles, all of them or none. The step is worked out from
 * `base`, the level as it was when a finger went down, so a whole drag is one step back.
 */
export function movePicked(
  base: Level,
  characters: Characters,
  hero: string,
  ids: readonly string[],
  by: Point,
): Done {
  const things = ids.filter((id) => !isStart(id))
  const starts = ids.filter(isStart)
  const step = { x: Math.round(by.x) + 0, y: Math.round(by.y) + 0 }
  let now = base
  let moved = false
  if (things.length > 0) {
    const done = moveThings(now, characters, things, by, true)
    if (done.ok) {
      now = done.value
      moved = true
    } else if (done.why !== 'same') return done
  }
  for (const id of starts) {
    const start = base.starts.find((s) => s.player === playerOf(id))
    if (start === undefined) return no('no-such-thing')
    const done = moveStart(now, characters, hero, start.player, { x: start.x + step.x, y: start.y + step.y })
    if (done.ok) {
      now = done.value
      moved = true
    } else if (done.why !== 'same') return done
  }
  return moved ? ok(now) : no('same')
}

/** The same move one tile at a time, as the pad and the arrow keys make it. */
export function nudgePicked(
  level: Level,
  characters: Characters,
  hero: string,
  ids: readonly string[],
  way: Way,
): Done {
  const by = {
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
  }[way]
  return ids.every((id) => !isStart(id))
    ? nudgeThings(level, characters, ids, way)
    : movePicked(level, characters, hero, ids, by)
}

/** The places a copy is tried at, nearest first: beside, below, the other sides, then a step further. */
const BESIDE: readonly Point[] = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
  { x: 2, y: 0 },
  { x: 0, y: 2 },
  { x: -2, y: 0 },
  { x: 0, y: -2 },
]

/** A copy of the things beside them, at the first place where it fits. */
export function copyNear(
  level: Level,
  characters: Characters,
  ids: readonly string[],
): Done<{ level: Level; ids: readonly string[] }> {
  let last: Done<{ level: Level; ids: readonly string[] }> = no('no-such-thing')
  for (const by of BESIDE) {
    last = copyThings(level, characters, ids, by)
    if (last.ok) return last
    if (last.why === 'no-such-thing' || last.why === 'not-allowed') return last
  }
  return last
}
