// Opening a game: its files, who the API says you are, what you may do, and your own waiting change if you have one.
import { PROJECT_FILE, parseProject } from '@automataframework/framework/headless'
import type { Answer, GameRef, OpenAnswer, Waiting, WireFile } from '../wire/wire.ts'
import { type ApiDeps, enter } from './enter.ts'
import { turnedDownOf, withAsked } from './ask.ts'
import { isWaiting, ownPull, toWaiting } from './pulls.ts'

export async function openGame(deps: ApiDeps, request: Request, game: GameRef): Promise<Answer<OpenAnswer>> {
  const entered = await enter(deps, request, game, 'look', { visitors: true })
  if (!entered.ok) return entered
  const { who, repo, level } = entered.value

  let branch = repo.facts.branch
  let mine: Waiting | undefined
  let waiting = 0
  let turnedDown: OpenAnswer['turnedDown']
  // How busy a team is, is the team's business: a visitor sees none of it.
  if (who !== undefined) {
    const pulls = await repo.openPulls()
    if (!pulls.ok) return pulls
    waiting = pulls.value.filter(isWaiting).length
    const own = ownPull(pulls.value, who.login)
    if (own !== undefined) {
      branch = own.head
      mine = await withAsked(repo, await toWaiting(repo, own, who.login), own)
    } else {
      // Nothing of yours waits: was your last change turned down?
      turnedDown = await turnedDownOf(repo, who.login)
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
    value: { game, login: who?.login, level, branch, mine, waiting, turnedDown, files },
  }
}
