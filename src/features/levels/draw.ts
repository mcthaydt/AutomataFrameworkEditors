// What a thing is drawn behind or in front of. A thing's `draw` is kept in the level file and used by Play; this only
// sets it. `things` is never reordered: its order is the spawn order, so the sim and every recording stay as they are.
import type { Level, LevelThing } from '@automataframework/framework/headless'
import { type Done, no, ok } from './done.ts'

/** The framework's three values for a thing's `draw`. */
export type Draw = 'behind' | 'with-hero' | 'in-front'

/** The "Drawn" control's three choices, in that order. */
export const DRAWS: readonly Draw[] = ['behind', 'with-hero', 'in-front']

/** How a thing is drawn: its own `draw`, else with the hero. */
export function drawOf(thing: LevelThing): Draw {
  return thing.draw ?? 'with-hero'
}

/**
 * Sets `draw` on each thing. `with-hero` takes the key out (a file never holds the default). `things` keeps its order.
 * 'same' when nothing changes.
 */
export function setDraw(level: Level, ids: readonly string[], to: Draw): Done {
  if (ids.length === 0) return no('no-such-thing')
  const wanted = new Set(ids)
  if (ids.some((id) => !level.things.some((thing) => thing.id === id))) return no('no-such-thing')
  let changed = false
  const things = level.things.map((thing): LevelThing => {
    if (!wanted.has(thing.id) || drawOf(thing) === to) return thing
    changed = true
    const { draw: _gone, ...rest } = thing
    return to === 'with-hero' ? rest : { ...rest, draw: to }
  })
  return changed ? ok({ ...level, things }) : no('same')
}
