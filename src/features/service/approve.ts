// Approve and turn down. Approve is the one place the editor changes someone else's work on the default branch, so it
// checks everything and changes nothing unless every check passes.
import { can } from '../access/access.ts'
import type { Answer, ChangeAsk } from '../wire/wire.ts'
import { askedText, MOST_WORDS, notPutInText } from './ask.ts'
import { readBody, readGame } from './body.ts'
import { type ApiDeps, enter, SUGGESTION_PREFIX, suggestionBranch } from './enter.ts'
import { scopeOf, waitingPull } from './waiting.ts'
import { stopsOnProblems, wholeGameLoads } from './whole.ts'

/** Checks may not have started on a commit this young, so "none yet" is not yet "no checks". */
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

  // 2. Everything it changes is a level or world file this game lists or the change adds, or the project file's level
  // lines: the sharing file and the game's code can never be approved here.
  const paths = await repo.pullPaths(change.number)
  if (!paths.ok) return paths
  const scope = await scopeOf(repo, change.head, paths.value)
  if (!scope.ok) return scope
  if (paths.value.length === 0 || !paths.value.every((path) => scope.value.allowed.has(path))) {
    return { ok: false, problem: 'not-allowed' }
  }

  // 3. Not your own, unless you could have saved straight in.
  if (change.head === suggestionBranch(who.login) && !can(level, 'save-direct')) {
    return { ok: false, problem: 'own-change' }
  }

  // 4. When the game asks for it, the whole game with the change (and its own project file) in place still loads. A
  // problem is otherwise only shown: a half-made game can still be put in.
  const stops = await stopsOnProblems(repo, repo.facts.branch)
  if (!stops.ok) return stops
  if (stops.value) {
    const replace = new Map<string, string | undefined>()
    for (const path of paths.value) {
      const read = await repo.readFile(change.head, path)
      if (!read.ok && read.problem !== 'not-found') return read
      replace.set(path, read.ok ? read.value.text : undefined)
    }
    const whole = await wholeGameLoads(
      repo,
      repo.facts.branch,
      scope.value.project,
      scope.value.listed,
      replace,
    )
    if (!whole.ok) return whole
  }

  // 5. The checks on the exact commit being approved.
  const checks = await repo.checks(change.headCommit)
  if (!checks.ok) return checks
  if (checks.value === 'failing') return { ok: false, problem: 'checks-failed' }
  if (checks.value === 'running') return { ok: false, problem: 'not-ready' }
  if (checks.value === 'none') {
    // Checks start after a commit, not after the pull was opened: a second save on an old pull puts a new commit there
    // whose checks are not queued yet. One more call, and only when the checks say `none`.
    const made = await repo.commitTime(change.headCommit)
    if (!made.ok) return made
    if (deps.now() - Math.max(made.value, change.createdAt) < CHECKS_GRACE_MS) {
      return { ok: false, problem: 'not-ready' }
    }
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
  if (own) {
    // Taking your own back: the change and its branch are gone, and nothing is left to say.
    const closed = await repo.closePull(pull.value.number)
    if (!closed.ok) return closed
    await repo.deleteBranch(pull.value.head)
    return { ok: true, value: true }
  }
  // Turning someone else's down keeps its branch, so it can be brought back; the author is told, in a comment.
  const said = await repo.comment(pull.value.number, notPutInText(who.login))
  if (!said.ok) return said
  const closed = await repo.closePull(pull.value.number)
  if (!closed.ok) return closed
  return { ok: true, value: true }
}

/** Asks the author of a waiting change to change it: a comment, with the person's own login taken from their sign-in. */
export async function askChange(deps: ApiDeps, request: Request): Promise<Answer<true>> {
  const body = await readBody(request)
  if (!body.ok) return body
  const game = readGame(body.value.game)
  const { number, words } = body.value
  if (game === undefined || typeof number !== 'number' || typeof words !== 'string') {
    return { ok: false, problem: 'bad-request' }
  }
  const said = words.trim()
  if (said === '' || said.length > MOST_WORDS) return { ok: false, problem: 'bad-request' }
  const entered = await enter(deps, request, game, 'approve')
  if (!entered.ok) return entered
  const { who, repo } = entered.value
  if (who === undefined) return { ok: false, problem: 'signed-out' }
  const pull = await waitingPull(repo, number)
  if (!pull.ok) return pull
  // You ask someone else to change theirs; your own you simply change.
  if (pull.value.head === suggestionBranch(who.login)) return { ok: false, problem: 'own-change' }
  return repo.comment(pull.value.number, askedText(who.login, said))
}

/** The Undo of a turn-down: the newest closed change from that branch waits again, if nothing has been started since. */
export async function reopenChange(deps: ApiDeps, request: Request): Promise<Answer<true>> {
  const ask = await readAsk(request)
  if (!ask.ok) return ask
  const entered = await enter(deps, request, ask.value.game, 'approve')
  if (!entered.ok) return entered
  const { who, repo } = entered.value
  if (who === undefined) return { ok: false, problem: 'signed-out' }
  const found = await repo.anyPull(ask.value.number)
  if (!found.ok) return found
  const pull = found.value
  if (pull.state !== 'closed' || !pull.headIsHere || !pull.head.startsWith(SUGGESTION_PREFIX)) {
    return { ok: false, problem: 'not-found' }
  }
  // It must be the last one sent from that branch, with its branch still there and no other change open from it.
  const newest = await repo.closedPull(pull.head)
  if (!newest.ok) return newest
  if (newest.value?.number !== pull.number) return { ok: false, problem: 'not-found' }
  const branch = await repo.branchHead(pull.head)
  if (!branch.ok) return branch
  const open = await repo.openPulls()
  if (!open.ok) return open
  if (open.value.some((p) => p.head === pull.head)) return { ok: false, problem: 'not-found' }
  return repo.reopenPull(pull.number)
}

/** "Got it": the leftover branch of your own turned-down change goes. Nothing to clear is fine; a live change stays. */
export async function clearTurnedDown(deps: ApiDeps, request: Request): Promise<Answer<true>> {
  const body = await readBody(request)
  if (!body.ok) return body
  const game = readGame(body.value.game)
  if (game === undefined) return { ok: false, problem: 'bad-request' }
  const entered = await enter(deps, request, game, 'look')
  if (!entered.ok) return entered
  const { who, repo } = entered.value
  if (who === undefined) return { ok: false, problem: 'signed-out' }
  const branch = suggestionBranch(who.login)
  const there = await repo.branchHead(branch)
  if (!there.ok) return there.problem === 'not-found' ? { ok: true, value: true } : there
  const open = await repo.openPulls()
  if (!open.ok) return open
  if (open.value.some((p) => p.head === branch)) return { ok: true, value: true }
  return repo.deleteBranch(branch)
}
