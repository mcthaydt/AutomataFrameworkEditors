// The name a new thing gets, the way an agent would write it by hand: the character, a dash and the lowest number that
// no other thing in the level already has.
import type { Level } from '@automataframework/framework/headless'

/** `crate-2` when `crate-1` is taken; `crate-2` again when only `crate-1` and `crate-3` are. */
export function nextId(level: Level, character: string): string {
  const taken = new Set(level.things.map((t) => t.id))
  let n = 1
  while (taken.has(`${character}-${n}`)) n += 1
  return `${character}-${n}`
}
