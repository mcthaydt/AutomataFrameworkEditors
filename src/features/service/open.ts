// Opening a game: its files, who the API says you are, what you may do, and your own waiting change if you have one.
import { PROJECT_FILE, parseProject } from '@automataframework/framework/headless'
import { EDITORS_DEFAULT, EDITORS_FILE, type EditorsFile, parseEditors } from '../files/files.ts'
import type { Answer, GameRef, OpenAnswer, OpenPicture, Waiting, WireFile } from '../wire/wire.ts'
import { turnedDownOf, withAsked } from './ask.ts'
import type { Repo } from '../github/github.ts'
import { type ApiDeps, enter } from './enter.ts'
import { readPictures } from './pictures.ts'
import { isWaiting, ownPull, toWaiting } from './pulls.ts'

export async function openGame(deps: ApiDeps, request: Request, game: GameRef): Promise<Answer<OpenAnswer>> {
  const entered = await enter(deps, request, game, 'look', { visitors: true })
  if (!entered.ok) return entered
  const { who, repo, level, access } = entered.value

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
  // The settings are the game's, whoever asks: always the default branch's, never a person's own change.
  const editors = await readEditors(repo, repo.facts.branch)
  if (!editors.ok) return editors
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
  let pictures: readonly OpenPicture[] = []
  if (parsed.ok) {
    const read = await readPictures(repo, branch, parsed.value.content, files)
    if (!read.ok) return read
    pictures = read.value
  }
  const people = access.people.map((person) => ({ login: person.github, level: person.level }))
  return {
    ok: true,
    value: {
      game,
      login: who?.login,
      level,
      branch,
      mine,
      waiting,
      turnedDown,
      files,
      editors: editors.value,
      people,
      pictures,
    },
  }
}

/** The editors' settings on `branch`: the default with no file, and with one that cannot be read. */
async function readEditors(repo: Repo, branch: string): Promise<Answer<EditorsFile>> {
  const read = await repo.readFile(branch, EDITORS_FILE)
  if (!read.ok) return read.problem === 'not-found' ? { ok: true, value: EDITORS_DEFAULT } : read
  const parsed = parseEditors(read.value.text)
  return { ok: true, value: parsed.ok ? parsed.value : EDITORS_DEFAULT }
}
