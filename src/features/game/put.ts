// Putting every change in the game from the page: one call to the API, and the game the page holds brought up to date
// with what went in. When the game moved under the person, nothing is written: the game is opened again and the person's
// changes are laid over it, so they can look at both before pressing once more.
import { PROJECT_FILE } from '@automataframework/framework/headless'
import { can } from '../access/access.ts'
import type { Api } from '../api/api.ts'
import type { ProblemKind } from '../wire/wire.ts'
import { afterPut, type Edits, startEdits, toPut } from './changes.ts'
import { describe, titleOf } from './describe.ts'
import { type Merged, merge } from './merge.ts'
import { type OpenGame, openGame } from './open.ts'

export type PutResult =
  | {
      readonly ok: true
      readonly how: 'direct' | 'suggestion'
      readonly game: OpenGame
      readonly edits: Edits
    }
  /** The game opened again, with the person's changes laid over it. */
  | {
      readonly ok: false
      readonly problem: 'changed-elsewhere'
      readonly merged: Merged
      readonly game: OpenGame
    }
  | {
      readonly ok: false
      readonly problem: Exclude<ProblemKind, 'changed-elsewhere'>
      readonly details?: readonly string[]
    }

/** A game that cannot be opened again is said as that problem; one that cannot be read, or whose answer is itself a clash, is unknown. */
const reopened = (problem: ProblemKind): Exclude<ProblemKind, 'changed-elsewhere'> =>
  problem === 'broken' || problem === 'changed-elsewhere' ? 'unknown' : problem

/** Every changed file, and the project file's lines, in one press. */
export async function put(api: Api, game: OpenGame, edits: Edits): Promise<PutResult> {
  const { files, project } = toPut(game, edits)
  const projectVersion = game.files.get(PROJECT_FILE)?.version
  // Nothing changed, or a project line to change from a project file the page does not hold: nothing is sent.
  if (
    (files.length === 0 && project === undefined) ||
    (project !== undefined && projectVersion === undefined)
  ) {
    return { ok: false, problem: 'unknown' }
  }
  const answer = await api.put({
    game: game.ref,
    files,
    ...(project === undefined ? {} : { project, projectVersion: projectVersion as string }),
    message: titleOf(describe(edits.base, edits.now)),
  })
  if (answer.ok) return { ok: true, how: answer.value.how, ...afterPut(game, edits, answer.value) }
  if (answer.problem === 'changed-elsewhere') {
    const again = await openGame(api, game.ref)
    if (!again.ok) return { ok: false, problem: reopened(again.problem) }
    const merged = merge(edits.base, edits.now, startEdits(again.game).now)
    return { ok: false, problem: 'changed-elsewhere', merged, game: again.game }
  }
  return answer.details === undefined
    ? { ok: false, problem: answer.problem }
    : { ok: false, problem: answer.problem, details: answer.details }
}

/** The person's changes over a game opened again: its files as the base, what was merged as what is on screen. */
export function laidOver(edits: Edits, game: OpenGame, merged: Merged): Edits {
  const { base } = startEdits(game)
  return {
    base,
    now: merged.now,
    // One Undo brings back what the person had before the game's changes came in.
    past: [...edits.past, edits.now].slice(-200),
    future: [],
  }
}

export type TakeBack =
  | { readonly ok: true; readonly game: OpenGame; readonly edits: Edits }
  | { readonly ok: false; readonly problem: ProblemKind }

/**
 * Takes the person's waiting changes back (the same call an approver's turn-down makes). The game is opened again as it
 * is without them, and everything the person had is theirs on the device again, to put in or send once more.
 */
export async function takeBack(api: Api, game: OpenGame, edits: Edits): Promise<TakeBack> {
  if (game.mine === undefined) return { ok: false, problem: 'unknown' }
  const done = await api.turnDown({ game: game.ref, number: game.mine.number })
  if (!done.ok) return { ok: false, problem: done.problem }
  const again = await openGame(api, game.ref)
  if (!again.ok) return { ok: false, problem: reopened(again.problem) }
  return { ok: true, game: again.game, edits: { ...edits, base: startEdits(again.game).base } }
}

/** Who checks a person's changes: the first person who may approve, else the game's owner. Said by their name. */
export const approverOf = (game: OpenGame): string =>
  game.people.find((person) => person.login !== game.login && can(person.level, 'approve'))?.login ??
  game.ref.owner
