// What the game's own check says about the game as it would be with the person's changes: the framework's sentences,
// each with where to look. It is the framework that reads the game (`loadGame`), so the page never words a problem itself.
import { readGame } from '@automataframework/framework/headless'
import { nameOf } from '../words/words.ts'
import { type Edits, readerOf } from './changes.ts'
import type { OpenGame } from './open.ts'

export interface Problem {
  /** The framework's sentence. */
  readonly words: string
  /** The file it is in. */
  readonly file: string
  /** Where to look: a level, a thing in it, or the map. Empty when it is about the game as a whole. */
  readonly where: { readonly level?: string; readonly thing?: string; readonly map?: true }
  /** Two levels that meet where one is open and the other has ground in the way: the map words this one itself. */
  readonly wall?: { readonly open: string; readonly solid: string }
}

/** The framework's sentence about two levels that meet at a wall: "room-1's right edge is open at …, but room-2, which
 *  touches it, is solid there." */
const WALL = /^(\S+)'s \w+ edge is open at .*?, but (\S+), which touches it, is solid there\./

/**
 * A framework sentence with the game's level ids said as the map says them ("room-1" is "Room 1"), and an id in quotes
 * too ("room-9" is "Room 9"): a person meets each level by one name (design round 2, A10 and R14).
 */
export function withNames(words: string, levels: readonly string[]): string {
  const ids = [...levels]
    .sort((a, b) => b.length - a.length)
    .map((id) => id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const named =
    ids.length === 0
      ? words
      : words.replace(new RegExp(`(?<![\\w-])(${ids.join('|')})(?![\\w-])`, 'g'), (id) => nameOf(id))
  return named.replace(/"([a-z0-9]+(?:-[a-z0-9]+)+)"/g, (_, id: string) => `"${nameOf(id)}"`)
}

/** A problem in the person's words: a wall in the map's own sentence, any other as the framework says it, with names. */
export function sayProblem(problem: Problem, wall: (open: string, solid: string) => string): string {
  return problem.wall === undefined
    ? problem.words
    : wall(nameOf(problem.wall.open), nameOf(problem.wall.solid))
}

const LEVEL_FILE = /^content\/levels\/([^/]+)\.json$/
/** `things[2].x` is the third thing of the level. */
const THING = /^things\[(\d+)\]/

/** The framework's sentences on the edited game, each with where to look. */
export async function problemsOf(game: OpenGame, edits: Edits): Promise<readonly Problem[]> {
  const loaded = await readGame(readerOf(game, edits))
  const levels = Object.keys(edits.now.levels)
  return loaded.diagnostics.map((one): Problem => {
    const level = LEVEL_FILE.exec(one.file)?.[1]
    const words = withNames(one.message, levels)
    if (one.file === game.worldPath) {
      const met = WALL.exec(one.message)
      const wall =
        met?.[1] === undefined || met[2] === undefined ? undefined : { open: met[1], solid: met[2] }
      return { words, file: one.file, where: { map: true }, ...(wall === undefined ? {} : { wall }) }
    }
    if (level === undefined) return { words, file: one.file, where: {} }
    const index = THING.exec(one.path)?.[1]
    const thing = index === undefined ? undefined : edits.now.levels[level]?.things[Number(index)]?.id
    return { words, file: one.file, where: { level, ...(thing === undefined ? {} : { thing }) } }
  })
}
