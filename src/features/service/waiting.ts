// Waiting changes: the list, and one change with what it would do to the game's files.

import type { ContentRef } from '@automataframework/framework/headless'
import { PROJECT_FILE, parseProject } from '@automataframework/framework/headless'
import type { Pull, Repo } from '../github/github.ts'
import type { Answer, FileChange, GameRef, Waiting, WaitingChange } from '../wire/wire.ts'
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
  const content = await listedContent(repo)
  if (!content.ok) return content
  const listed = new Set(content.value.listed.map((ref) => ref.path))

  const paths = await repo.pullPaths(number)
  // A change too big to judge here is one this editor will not approve: it says so, and shows nothing.
  if (!paths.ok && paths.problem !== 'not-allowed') return paths
  const touched = paths.ok ? paths.value : []
  const here = paths.ok && touched.length > 0 && touched.every((path) => listed.has(path))

  const changes: FileChange[] = []
  for (const path of touched.filter((p) => listed.has(p))) {
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
  const waiting = await toWaiting(repo, pull.value, who?.login)
  return { ok: true, value: { ...waiting, changes, here } }
}
