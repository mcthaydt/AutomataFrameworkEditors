// Opening a game: its files, who the API says you are, what you may do, and your own waiting change if you have one.
import { PROJECT_FILE, parseProject } from '@automataframework/framework/headless'
import type { Pull } from '../github/github.ts'
import type { Answer, GameRef, OpenAnswer, Waiting, WireFile } from '../wire/wire.ts'
import { type ApiDeps, type Entered, enter, SUGGESTION_PREFIX, suggestionBranch } from './enter.ts'

/** The `by` of a waiting change: the login its branch is named for. */
const byOf = (pull: Pull): string => pull.head.slice(SUGGESTION_PREFIX.length)

/** The open pulls that are waiting changes: the editor's own branches, in this repo. */
function waitingPulls(pulls: readonly Pull[]): Pull[] {
  return pulls.filter((pull) => pull.headIsHere && pull.head.startsWith(SUGGESTION_PREFIX))
}

async function waitingOf(entered: Entered, pull: Pull, login: string | undefined): Promise<Waiting> {
  const checks = await entered.repo.checks(pull.headCommit)
  return {
    number: pull.number,
    title: pull.title,
    by: byOf(pull),
    mine: login !== undefined && pull.head === suggestionBranch(login),
    checks: checks.ok ? checks.value : 'none',
  }
}

export async function openGame(deps: ApiDeps, request: Request, game: GameRef): Promise<Answer<OpenAnswer>> {
  const entered = await enter(deps, request, game, 'look', { visitors: true })
  if (!entered.ok) return entered
  const { who, repo, level } = entered.value

  let branch = repo.facts.branch
  let mine: Waiting | undefined
  let waiting = 0
  // How busy a team is, is the team's business: a visitor sees none of it.
  if (who !== undefined) {
    const pulls = await repo.openPulls()
    if (!pulls.ok) return pulls
    const open = waitingPulls(pulls.value)
    waiting = open.length
    const own = open.find((pull) => pull.head === suggestionBranch(who.login))
    if (own !== undefined) {
      branch = own.head
      mine = await waitingOf(entered.value, own, who.login)
    }
  }

  const project = await repo.readFile(branch, PROJECT_FILE)
  if (!project.ok) return project.problem === 'not-found' ? { ok: false, problem: 'not-a-game' } : project
  const files: WireFile[] = [project.value]
  const parsed = parseProject(project.value.text)
  if (parsed.ok) {
    for (const ref of parsed.value.content) {
      const read = await repo.readFile(branch, ref.path)
      if (read.ok) files.push(read.value)
      // A file that is missing is left out, and the page's `loadGame` names it. Anything else stops the open.
      else if (read.problem !== 'not-found') return read
    }
  }
  return {
    ok: true,
    value: { game, login: who?.login, level, branch, mine, waiting, files },
  }
}
