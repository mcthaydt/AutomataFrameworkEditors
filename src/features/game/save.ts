// Saving a level from the page: one call to the API, and the opened game brought up to date with what it saved. The
// page never writes bytes the API would not: it works the new text out with the framework's own `writeContent`, so the
// game it holds afterwards is the file as it now is.
import { type Level, writeContent } from '@automataframework/framework/headless'
import type { Api } from '../api/api.ts'
import type { ProblemKind } from '../wire/wire.ts'
import { levelPath, type OpenGame } from './open.ts'

export type SaveResult =
  | { readonly ok: true; readonly how: 'direct' | 'suggestion'; readonly game: OpenGame }
  | { readonly ok: false; readonly problem: ProblemKind; readonly details?: readonly string[] }

export async function saveLevel(
  api: Api,
  game: OpenGame,
  level: Level,
  message: string,
): Promise<SaveResult> {
  const path = levelPath(game, level.id)
  const opened = path === undefined ? undefined : game.files.get(path)
  // A level the project does not list cannot be saved: nothing is sent.
  if (path === undefined || opened === undefined) return { ok: false, problem: 'unknown' }
  const answer = await api.save({ game: game.ref, path, value: level, version: opened.version, message })
  if (!answer.ok) {
    return answer.details === undefined
      ? { ok: false, problem: answer.problem }
      : { ok: false, problem: answer.problem, details: answer.details }
  }
  const { how, version, mine } = answer.value
  const files = new Map(game.files)
  files.set(path, { path, text: writeContent('level', level as never), version })
  return {
    ok: true,
    how,
    game: {
      ...game,
      files,
      mine: mine ?? game.mine,
      content: { ...game.content, levels: { ...game.content.levels, [level.id]: level } },
    },
  }
}
