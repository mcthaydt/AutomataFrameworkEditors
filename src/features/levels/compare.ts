// What differs between two versions of a level, in the few terms a person can look at: which things moved, and how
// much else changed. Used to say what a change is (its title when saved, its lines when looked at before approving).
import type { Level } from '@automataframework/framework/headless'
import type { Point } from './place.ts'

export interface ThingMove {
  readonly id: string
  readonly from: Point
  readonly to: Point
}

/**
 * What moved between two versions of a level. Everything that is not a move (a thing added, taken away or given
 * another character, the tiles, the start points) is counted apart as `other`, one for each.
 */
export function compareLevels(
  before: Level,
  after: Level,
): { readonly moved: readonly ThingMove[]; readonly other: number } {
  const was = new Map(before.things.map((t) => [t.id, t] as const))
  const now = new Map(after.things.map((t) => [t.id, t] as const))
  const moved: ThingMove[] = []
  let other = 0
  for (const thing of after.things) {
    const old = was.get(thing.id)
    if (old === undefined) other += 1
    else if (old.character !== thing.character) other += 1
    else if (old.x !== thing.x || old.y !== thing.y) {
      moved.push({ id: thing.id, from: { x: old.x, y: old.y }, to: { x: thing.x, y: thing.y } })
    }
  }
  for (const thing of before.things) if (!now.has(thing.id)) other += 1
  if (JSON.stringify(before.tiles) !== JSON.stringify(after.tiles)) other += 1
  if (JSON.stringify(before.starts) !== JSON.stringify(after.starts)) other += 1
  return { moved, other }
}
