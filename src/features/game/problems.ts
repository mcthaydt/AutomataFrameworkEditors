// What the game's own check says about the game as it would be with the person's changes: the framework's sentences,
// each with where to look. It is the framework that reads the game (`loadGame`), so the page never words a problem itself.
import { readGame } from '@automataframework/framework/headless'
import { type Edits, readerOf } from './changes.ts'
import type { OpenGame } from './open.ts'

export interface Problem {
  /** The framework's sentence. */
  readonly words: string
  /** The file it is in. */
  readonly file: string
  /** Where to look: a level, a thing in it, or the map. Empty when it is about the game as a whole. */
  readonly where: { readonly level?: string; readonly thing?: string; readonly map?: true }
}

const LEVEL_FILE = /^content\/levels\/([^/]+)\.json$/
/** `things[2].x` is the third thing of the level. */
const THING = /^things\[(\d+)\]/

/** The framework's sentences on the edited game, each with where to look. */
export async function problemsOf(game: OpenGame, edits: Edits): Promise<readonly Problem[]> {
  const loaded = await readGame(readerOf(game, edits))
  return loaded.diagnostics.map((one): Problem => {
    const level = LEVEL_FILE.exec(one.file)?.[1]
    if (one.file === game.worldPath) return { words: one.message, file: one.file, where: { map: true } }
    if (level === undefined) return { words: one.message, file: one.file, where: {} }
    const index = THING.exec(one.path)?.[1]
    const thing = index === undefined ? undefined : edits.now.levels[level]?.things[Number(index)]?.id
    return { words: one.message, file: one.file, where: { level, ...(thing === undefined ? {} : { thing }) } }
  })
}
