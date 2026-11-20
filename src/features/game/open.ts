// Opening a game on the page: asks the API, then reads what came back the way the framework reads a game, so a game
// that will not load says why in the framework's own sentences, and the screens never see half a game.
import { type Diagnostic, type GameContent, readGame } from '@automataframework/framework/headless'
import type { AccessLevel } from '../access/access.ts'
import type { Api } from '../api/api.ts'
import type { EditorsFile } from '../files/files.ts'
import type { GameRef, OpenPicture, Person, ProblemKind, Waiting, WireFile } from '../wire/wire.ts'

export interface OpenGame {
  readonly ref: GameRef
  /** Who the API says you are; undefined for a visitor. */
  readonly login: string | undefined
  readonly level: AccessLevel
  /** Where these files were read from (the person's own waiting change, or the default branch). */
  readonly branch: string
  /** My own waiting change. */
  readonly mine: Waiting | undefined
  /** My own changes were turned down: who did it, and when. */
  readonly turnedDown: { readonly by: string; readonly at: number } | undefined
  /** How many changes wait in all. */
  readonly waiting: number
  readonly content: GameContent
  /** Every file that came back, by its path. */
  readonly files: ReadonlyMap<string, WireFile>
  /** The editors' settings for everyone on this game. */
  readonly editors: EditorsFile
  /** The version of the settings file, to change it from; undefined when the game has none. */
  readonly editorsVersion: string | undefined
  /** Who is in the game. */
  readonly people: readonly Person[]
  /** The pictures its tilesets name, by their path, as the API sent them. */
  readonly pictures: readonly OpenPicture[]
  /** The path of the world file the project lists; undefined when the game has none (yet). */
  readonly worldPath: string | undefined
}

export type Opened =
  | { readonly ok: true; readonly game: OpenGame }
  | { readonly ok: false; readonly problem: 'broken'; readonly diagnostics: readonly Diagnostic[] }
  | { readonly ok: false; readonly problem: Exclude<ProblemKind, 'broken'> }

export async function openGame(api: Api, ref: GameRef): Promise<Opened> {
  const answer = await api.open(ref)
  if (!answer.ok) {
    // The API says `broken` only for a save; for an open, the framework reads the files. Either way it is not a game.
    return { ok: false, problem: answer.problem === 'broken' ? 'unknown' : answer.problem }
  }
  const { value } = answer
  const files = new Map(value.files.map((file) => [file.path, file] as const))
  // The game opens whenever every file reads, even with problems between files: they are listed, not a reason to refuse.
  const loaded = await readGame(async (path) => {
    const file = files.get(path)
    if (file === undefined) throw new Error(`${path}: no such file`)
    return file.text
  })
  if (loaded.content === undefined) return { ok: false, problem: 'broken', diagnostics: loaded.diagnostics }
  return {
    ok: true,
    game: {
      ref,
      login: value.login,
      level: value.level,
      branch: value.branch,
      mine: value.mine,
      turnedDown: value.turnedDown,
      waiting: value.waiting,
      content: loaded.content,
      files,
      editors: value.editors,
      editorsVersion: value.editorsVersion,
      people: value.people,
      pictures: value.pictures,
      worldPath: loaded.content.project.content.find((ref) => ref.type === 'world')?.path,
    },
  }
}

/** The path of the level file whose id is `levelId`, from the project's content list. */
export function levelPath(game: OpenGame, levelId: string): string | undefined {
  return game.content.project.content.find(
    (ref) => ref.type === 'level' && ref.path.split('/').pop() === `${levelId}.json`,
  )?.path
}
