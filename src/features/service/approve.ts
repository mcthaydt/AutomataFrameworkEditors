// Approve and turn down. Approve is the one place the editor changes someone else's work on the default branch, so it
// checks everything and changes nothing unless every check passes.
import { can } from '../access/access.ts'
import type { Answer, ChangeAsk } from '../wire/wire.ts'
import { readBody, readGame } from './body.ts'
import { type ApiDeps, enter, suggestionBranch } from './enter.ts'
import { listedContent, waitingPull } from './waiting.ts'
import { wholeGameLoads } from './whole.ts'

/** Checks may not have started on a change this young, so "none yet" is not yet "no checks". */
const CHECKS_GRACE_MS = 2 * 60_000

async function readAsk(request: Request): Promise<Answer<ChangeAsk>> {
  const body = await readBody(request)
  if (!body.ok) return body
  const game = readGame(body.value.game)
  const { number } = body.value
  if (game === undefined || typeof number !== 'number') return { ok: false, problem: 'bad-request' }
  return { ok: true, value: { game, number } }
}

export async function approveChange(deps: ApiDeps, request: Request): Promise<Answer<true>> {
  const ask = await readAsk(request)
  if (!ask.ok) return ask
  const entered = await enter(deps, request, ask.value.game, 'approve')
  if (!entered.ok) return entered
  const { who, repo, level } = entered.value
  if (who === undefined) return { ok: false, problem: 'signed-out' }

  // 1. It is a waiting change.
  const pull = await waitingPull(repo, ask.value.number)
  if (!pull.ok) return pull
  const change = pull.value

  // 2. Everything it changes is a content file this game lists: the sharing file and the project file above all
  // can never be approved here.
  const content = await listedContent(repo)
  if (!content.ok) return content
  const listed = new Set(content.value.listed.map((ref) => ref.path))
  const paths = await repo.pullPaths(change.number)
  if (!paths.ok) return paths
  if (paths.value.length === 0 || !paths.value.every((path) => listed.has(path))) {
    return { ok: false, problem: 'not-allowed' }
  }

  // 3. Not your own, unless you could have saved straight in.
  if (change.head === suggestionBranch(who.login) && !can(level, 'save-direct')) {
    return { ok: false, problem: 'own-change' }
  }

  // 4. The whole game, with the change in place, still loads.
  const replace = new Map<string, string | undefined>()
  for (const path of paths.value) {
    const read = await repo.readFile(change.head, path)
    if (!read.ok && read.problem !== 'not-found') return read
    replace.set(path, read.ok ? read.value.text : undefined)
  }
  const whole = await wholeGameLoads(
    repo,
    repo.facts.branch,
    content.value.project,
    content.value.listed,
    replace,
  )
  if (!whole.ok) return whole

  // 5. The checks on the exact commit being approved.
  const checks = await repo.checks(change.headCommit)
  if (!checks.ok) return checks
  if (checks.value === 'failing') return { ok: false, problem: 'checks-failed' }
  if (checks.value === 'running') return { ok: false, problem: 'not-ready' }
  if (checks.value === 'none' && deps.now() - change.createdAt < CHECKS_GRACE_MS) {
    return { ok: false, problem: 'not-ready' }
  }

  // 6. Merge that commit and no other: if the branch moved since it was looked at, GitHub refuses.
  const merged = await repo.mergePull(change.number, {
    title: `Approve: ${change.title}`,
    message: `Approved by ${who.login}.`,
    headCommit: change.headCommit,
  })
  if (!merged.ok) return merged
  // The branch is done with; a failure to delete it is not a failure to approve.
  await repo.deleteBranch(change.head)
  return { ok: true, value: true }
}

export async function turnDownChange(deps: ApiDeps, request: Request): Promise<Answer<true>> {
  const ask = await readAsk(request)
  if (!ask.ok) return ask
  const entered = await enter(deps, request, ask.value.game, 'look')
  if (!entered.ok) return entered
  const { who, repo, level } = entered.value
  if (who === undefined) return { ok: false, problem: 'signed-out' }
  const pull = await waitingPull(repo, ask.value.number)
  if (!pull.ok) return pull
  // Someone who may approve may turn any down; anyone may take their own back.
  const own = pull.value.head === suggestionBranch(who.login)
  if (!own && !can(level, 'approve')) return { ok: false, problem: 'not-allowed' }
  const closed = await repo.closePull(pull.value.number)
  if (!closed.ok) return closed
  await repo.deleteBranch(pull.value.head)
  return { ok: true, value: true }
}
