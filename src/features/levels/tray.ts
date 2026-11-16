// What the tray holds besides the game's characters, and how many of each this level has.
import type { Level } from '@automataframework/framework/headless'

/** The tray's name for "the start", which is not a character. */
export const START = '@start'

/** How many things of each character the level has. */
export function countsOf(level: Level): Readonly<Record<string, number>> {
  const counts: Record<string, number> = {}
  for (const thing of level.things) counts[thing.character] = (counts[thing.character] ?? 0) + 1
  return counts
}
