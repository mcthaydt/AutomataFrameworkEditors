// Copy to paste: things taken out of a level to be put into the same level or another. Held in memory for this visit
// only (the device keeps nothing of it). A copy never carries a link, since the thing it pointed at is not where the
// copy lands, and a character that may be in a level only once is never copied.
import {
  type Level,
  type LevelThing,
  levelSize,
  type ThingValue,
} from '@automataframework/framework/headless'
import { type Done, no, ok } from './done.ts'
import type { Characters } from './edit.ts'
import { onSolid, type Point, snap } from './place.ts'
import { nextId } from './things.ts'

export interface Clip {
  readonly things: readonly LevelThing[]
}

const isLinks = (value: ThingValue): boolean =>
  Array.isArray(value) && value.length > 0 && value.every((one) => typeof one === 'string')

/** What a thing keeps when it is copied: its numbers, switches and choices, but not a list of links. */
function withoutLinks(thing: LevelThing): LevelThing {
  if (thing.values === undefined) return thing
  const kept = Object.entries(thing.values).filter(([, value]) => !isLinks(value))
  const { values: _before, ...rest } = thing
  return kept.length === 0 ? rest : { ...rest, values: Object.fromEntries(kept) }
}

/** The things to put in the clipboard: what `ids` names, in the order the level lists them. Nothing when none is. */
export function copyToClip(level: Level, characters: Characters, ids: readonly string[]): Done<Clip> {
  const wanted = new Set(ids)
  const things = level.things.filter((thing) => wanted.has(thing.id))
  if (things.length === 0) return no('no-such-thing')
  if (things.some((thing) => characters[thing.character]?.['one-per-level'] === true))
    return no('not-allowed')
  return ok({ things: things.map(withoutLinks) })
}

/**
 * Puts the clip into the level with its first thing at `at` and the rest where they were beside it. All of them land
 * or none does. Each has a fresh id.
 */
export function pasteClip(
  level: Level,
  characters: Characters,
  clip: Clip,
  at: Point,
): Done<{ level: Level; ids: readonly string[] }> {
  const first = clip.things[0]
  if (first === undefined) return no('no-such-thing')
  const world = levelSize(level)
  let now = level
  const ids: string[] = []
  for (const thing of clip.things) {
    if (characters[thing.character]?.['one-per-level'] === true) return no('not-allowed')
    const size = characters[thing.character]?.size ?? { w: 1, h: 1 }
    const to = { x: snap(at.x + thing.x - first.x), y: snap(at.y + thing.y - first.y) }
    const inside =
      to.x - size.w / 2 >= -1e-9 &&
      to.x + size.w / 2 <= world.w + 1e-9 &&
      to.y - size.h / 2 >= -1e-9 &&
      to.y + size.h / 2 <= world.h + 1e-9
    if (!inside) return no('outside')
    if (onSolid(level, size, to)) return no('solid')
    const id = nextId(now, thing.character)
    now = { ...now, things: [...now.things, { ...thing, id, x: to.x, y: to.y }] }
    ids.push(id)
  }
  return ok({ level: now, ids })
}
