// What differs between two versions of a level, in the few terms a person can look at: which things moved, which were
// added, taken away or given another character, and how much else changed. Used to say what a change is (its title when
// saved, its lines when looked at before approving).
import type { Level } from '@automataframework/framework/headless'
import type { Point } from './place.ts'

/** A thing's own id, or `start-<player>` for a start point. */
export type HitId = string
/** The hit id of a player's start point. */
export const startId = (player: number): HitId => `start-${player}`

export interface ThingMove {
  readonly id: HitId
  readonly from: Point
  readonly to: Point
}

export interface LevelChanges {
  /** Things and start points that are somewhere else, by hit id. */
  readonly moved: readonly ThingMove[]
  /** Things that were not in the level before. */
  readonly added: readonly string[]
  /** Things that are not in the level any more. The joints that held one go with it and are not counted. */
  readonly erased: readonly string[]
  /** Things that are now another character. */
  readonly retyped: readonly string[]
  /** Everything else (the tiles, a start point added or taken away), one for each. */
  readonly other: number
}

/** What differs between two versions of a level. */
export function compareLevels(before: Level, after: Level): LevelChanges {
  const was = new Map(before.things.map((t) => [t.id, t] as const))
  const now = new Map(after.things.map((t) => [t.id, t] as const))
  const moved: ThingMove[] = []
  const added: string[] = []
  const erased: string[] = []
  const retyped: string[] = []
  let other = 0
  for (const thing of after.things) {
    const old = was.get(thing.id)
    if (old === undefined) added.push(thing.id)
    else {
      if (old.character !== thing.character) retyped.push(thing.id)
      if (old.x !== thing.x || old.y !== thing.y) {
        moved.push({ id: thing.id, from: { x: old.x, y: old.y }, to: { x: thing.x, y: thing.y } })
      }
    }
  }
  for (const thing of before.things) if (!now.has(thing.id)) erased.push(thing.id)
  const starts = new Map(before.starts.map((s) => [s.player, s] as const))
  for (const start of after.starts) {
    const old = starts.get(start.player)
    if (old === undefined) other += 1
    else if (old.x !== start.x || old.y !== start.y) {
      moved.push({ id: startId(start.player), from: { x: old.x, y: old.y }, to: { x: start.x, y: start.y } })
    }
  }
  const afterPlayers = new Set(after.starts.map((s) => s.player))
  for (const start of before.starts) if (!afterPlayers.has(start.player)) other += 1
  if (JSON.stringify(before.tiles) !== JSON.stringify(after.tiles)) other += 1
  return { moved, added, erased, retyped, other }
}
