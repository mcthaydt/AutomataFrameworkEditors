// Waiting changes: the list, and one change with what it would do to the game's files.

import type { ContentRef } from '@automataframework/framework/headless'
import { PROJECT_FILE, parseProject } from '@automataframework/framework/headless'
import type { Pull, Repo } from '../github/github.ts'
import type { Answer, FileChange, GameRef, Waiting, WaitingChange } from '../wire/wire.ts'
import { allowedFiles, isNewPathFor, levelLinesOnly } from './allowed.ts'
import { withAsked } from './ask.ts'
import { type ApiDeps, enter } from './enter.ts'
import { isWaiting, toWaiting } from './pulls.ts'

/** The game's project file on its default branch, and what it lists. A game that will not parse lists nothing. */
export async function listedContent(
  repo: Repo,
): Promise<Answer<{ project: { path: string; text: string }; listed: readonly ContentRef[] }>> {
  const project = await repo.readFile(repo.facts.branch, PROJECT_FILE)
  if (!project.ok) return project.problem === 'not-found' ? { ok: false, problem: 'not-a-game' } : project
  const parsed = parseProject(project.value.text)
  return {
    ok: true,
    value: {
      project: { path: PROJECT_FILE, text: project.value.text },
      listed: parsed.ok ? parsed.value.content : [],
    },
  }
}

/** What a waiting change may touch, and the game as it would be with the change's own project file. */
export interface Scope {
  /** The project file the game would have: the change's own when it changes that file, else the game's. */
  readonly project: { readonly path: string; readonly text: string }
  readonly listed: readonly ContentRef[]
  /** Level and world files the game lists or the change adds, and the project file when only its level lines change. */
  readonly allowed: ReadonlySet<string>
}

/**
 * What `head` (a waiting change's branch) may touch. The game's own level and world files, the ones the change adds
 * (where a new one goes), and `automata.toml` only when its level lines are all the change does to it. Nothing else:
 * not the sharing file, a character, or the game's code.
 */
export async function scopeOf(repo: Repo, head: string, touched: readonly string[]): Promise<Answer<Scope>> {
  const game = await listedContent(repo)
  if (!game.ok) return game
  const own: Scope = {
    project: game.value.project,
    listed: game.value.listed,
    allowed: new Set(allowedFiles(game.value.listed, undefined).keys()),
  }
  if (!touched.includes(PROJECT_FILE)) return { ok: true, value: own }
  const changed = await repo.readFile(head, PROJECT_FILE)
  if (!changed.ok) return changed.problem === 'not-found' ? { ok: true, value: own } : changed
  const parsed = parseProject(changed.value.text)
  if (!parsed.ok || !levelLinesOnly(game.value.project.text, changed.value.text)) {
    return { ok: true, value: own }
  }
  const had = new Set(game.value.listed.map((ref) => ref.path))
  const add = parsed.value.content.flatMap((ref) =>
    !had.has(ref.path) && (ref.type === 'level' || ref.type === 'world') && isNewPathFor(ref.type, ref.path)
      ? [{ type: ref.type, path: ref.path }]
      : [],
  )
  const allowed = new Set(allowedFiles(game.value.listed, { add }).keys())
  allowed.add(PROJECT_FILE)
  const project = { path: PROJECT_FILE, text: changed.value.text }
  return { ok: true, value: { project, listed: parsed.value.content, allowed } }
}

/** One waiting change by number; anything else (another kind of pull, a closed one, a fork's) is not-found. */
export async function waitingPull(repo: Repo, number: number): Promise<Answer<Pull>> {
  if (!Number.isInteger(number) || number < 1) return { ok: false, problem: 'bad-request' }
  const pull = await repo.pull(number)
  if (!pull.ok) return pull
  return isWaiting(pull.value) ? pull : { ok: false, problem: 'not-found' }
}

export async function listWaiting(
  deps: ApiDeps,
  request: Request,
  game: GameRef,
): Promise<Answer<readonly Waiting[]>> {
  const entered = await enter(deps, request, game, 'look')
  if (!entered.ok) return entered
  const { repo, who } = entered.value
  const pulls = await repo.openPulls()
  if (!pulls.ok) return pulls
  const waiting = pulls.value.filter(isWaiting).sort((a, b) => a.createdAt - b.createdAt)
  return { ok: true, value: await Promise.all(waiting.map((pull) => toWaiting(repo, pull, who?.login))) }
}

export async function showChange(
  deps: ApiDeps,
  request: Request,
  game: GameRef,
  number: number,
): Promise<Answer<WaitingChange>> {
  const entered = await enter(deps, request, game, 'look')
  if (!entered.ok) return entered
  const { repo, who } = entered.value
  const pull = await waitingPull(repo, number)
  if (!pull.ok) return pull

  const paths = await repo.pullPaths(number)
  // A change too big to judge here is one this editor will not approve: it says so, and shows nothing.
  if (!paths.ok && paths.problem !== 'not-allowed') return paths
  const touched = paths.ok ? paths.value : []
  const scope = await scopeOf(repo, pull.value.head, touched)
  if (!scope.ok) return scope
  const here = paths.ok && touched.length > 0 && touched.every((path) => scope.value.allowed.has(path))

  const changes: FileChange[] = []
  for (const path of touched.filter((p) => scope.value.allowed.has(p))) {
    const before = await repo.readFile(repo.facts.branch, path)
    if (!before.ok && before.problem !== 'not-found') return before
    const after = await repo.readFile(pull.value.head, path)
    if (!after.ok && after.problem !== 'not-found') return after
    changes.push({
      path,
      before: before.ok ? before.value.text : undefined,
      after: after.ok ? after.value.text : undefined,
    })
  }
  const waiting = await withAsked(repo, await toWaiting(repo, pull.value, who?.login), pull.value)
  return { ok: true, value: { ...waiting, changes, here } }
}
