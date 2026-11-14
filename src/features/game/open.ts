// Opening a game on the page: asks the API, then reads what came back the way the framework reads a game, so a game
// that will not load says why in the framework's own sentences, and the screens never see half a game.
import { type Diagnostic, type GameContent, loadGame } from '@automataframework/framework/headless'
import type { AccessLevel } from '../access/access.ts'
import type { Api } from '../api/api.ts'
import type { GameRef, ProblemKind, Waiting, WireFile } from '../wire/wire.ts'

export interface OpenGame {
  readonly ref: GameRef
  /** Who the API says you are; undefined for a visitor. */
  readonly login: string | undefined
  readonly level: AccessLevel
  /** Where these files were read from (the person's own waiting change, or the default branch). */
  readonly branch: string
  /** My own waiting change. */
  readonly mine: Waiting | undefined
  /** How many changes wait in all. */
  readonly waiting: number
  readonly content: GameContent
  /** Every file that came back, by its path. */
  readonly files: ReadonlyMap<string, WireFile>
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
  const loaded = await loadGame(async (path) => {
    const file = files.get(path)
    if (file === undefined) throw new Error(`${path}: no such file`)
    return file.text
  })
  if (!loaded.ok) return { ok: false, problem: 'broken', diagnostics: loaded.diagnostics }
  return {
    ok: true,
    game: {
      ref,
      login: value.login,
      level: value.level,
      branch: value.branch,
      mine: value.mine,
      waiting: value.waiting,
      content: loaded.value,
      files,
    },
  }
}

/** The path of the level file whose id is `levelId`, from the project's content list. */
export function levelPath(game: OpenGame, levelId: string): string | undefined {
  return game.content.project.content.find(
    (ref) => ref.type === 'level' && ref.path.split('/').pop() === `${levelId}.json`,
  )?.path
}
