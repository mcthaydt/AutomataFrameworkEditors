// Small helpers for the tests of what a person holds: one crate slid along in the links game's first room, a level read
// out of the edits, the world with a level placed, and a level as the framework writes it.
import { type Level, type WorldFile, writeContent } from '@automataframework/framework/headless'
import { type Edits, inLevel } from '#src/features/game/changes.ts'

/** The links game's crate in room 1 put at `x`, as one step. */
export const slide = (edits: Edits, x: number): Edits =>
  inLevel(edits, 'room-1', (level) => ({
    ...level,
    things: level.things.map((t) => (t.id === 'crate-1' ? { ...t, x } : t)),
  }))

export const levelOf = (edits: Edits, id: string): Level => edits.now.levels[id] as Level

/** The world with one level placed (or moved) where `entry` says. */
export function placed(edits: Edits, entry: { level: string; at: { x: number; y: number } }): WorldFile {
  const world = edits.now.world
  if (world === undefined) throw new Error('the game has a world')
  return { ...world, levels: [...world.levels.filter((l) => l.level !== entry.level), entry] }
}

export const roomText = (room: Level): string => writeContent('level', room as never)
