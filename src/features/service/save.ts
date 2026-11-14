// Save: one level, straight into the game for someone who may, or as a waiting change for someone who may not. The
// API trusts nothing the page says: it picks the file from the game's own project file, writes the framework's
// bytes, and checks the whole game still loads before anything is written.
import {
  formatDiagnostic,
  loadGame,
  PROJECT_FILE,
  parseProject,
  writeContent,
} from '@automataframework/framework/headless'
import { can } from '../access/access.ts'
import type { Pull } from '../github/github.ts'
import type { Answer, SaveAnswer, SaveAsk, Waiting } from '../wire/wire.ts'
import { type Json, readBody, readGame } from './body.ts'
import { type ApiDeps, enter, suggestionBranch } from './enter.ts'
import { ownPull, toWaiting } from './pulls.ts'

const MESSAGE_LENGTH = 72

/** The message cut to one line of at most 72 characters; nothing left of it becomes `Change <path>`. */
export function oneLine(message: string, path: string): string {
  const line = message.replace(/\s+/g, ' ').trim().slice(0, MESSAGE_LENGTH).trim()
  return line === '' ? `Change ${path}` : line
}

function readAsk(body: Json): SaveAsk | undefined {
  const game = readGame(body.game)
  const { path, version, message } = body
  if (game === undefined || typeof path !== 'string' || typeof version !== 'string') return undefined
  if (typeof message !== 'string' || !('value' in body)) return undefined
  return { game, path, value: body.value, version, message }
}

export async function saveLevel(deps: ApiDeps, request: Request): Promise<Answer<SaveAnswer>> {
  const body = await readBody(request)
  if (!body.ok) return body
  const ask = readAsk(body.value)
  if (ask === undefined) return { ok: false, problem: 'bad-request' }
  const entered = await enter(deps, request, ask.game, 'save')
  if (!entered.ok) return entered
  const { who, repo, level } = entered.value
  if (who === undefined) return { ok: false, problem: 'signed-out' }
  const main = repo.facts.branch

  // 1. The file must be a level this game lists, as the default branch has it. M1 edits levels and nothing else.
  const project = await repo.readFile(main, PROJECT_FILE)
  if (!project.ok) return project.problem === 'not-found' ? { ok: false, problem: 'not-a-game' } : project
  const parsed = parseProject(project.value.text)
  if (!parsed.ok) return { ok: false, problem: 'not-allowed' }
  const listed = parsed.value.content
  if (!listed.some((ref) => ref.type === 'level' && ref.path === ask.path)) {
    return { ok: false, problem: 'not-allowed' }
  }

  // 2. The value must be a good level, named for its file.
  let text: string
  try {
    text = writeContent('level', ask.value as never)
  } catch (error) {
    return { ok: false, problem: 'broken', details: sentencesOf(error) }
  }
  const id = (JSON.parse(text) as { id: string }).id
  const fileName = ask.path
    .split('/')
    .pop()
    ?.replace(/\.json$/, '')
  if (id !== fileName) {
    return { ok: false, problem: 'broken', details: [`${ask.path}: the level's id must be "${fileName}".`] }
  }

  // The whole game, with this level in place, must still load: a thing's character has to exist, say.
  const files = new Map<string, string>([[PROJECT_FILE, project.value.text]])
  for (const ref of listed) {
    if (ref.path === ask.path) {
      files.set(ref.path, text)
      continue
    }
    const read = await repo.readFile(main, ref.path)
    if (read.ok) files.set(ref.path, read.value.text)
    else if (read.problem !== 'not-found') return read
  }
  const game = await loadGame(async (path) => {
    const found = files.get(path)
    if (found === undefined) throw new Error(`${path}: no such file`)
    return found
  })
  if (!game.ok) return { ok: false, problem: 'broken', details: game.diagnostics.map(formatDiagnostic) }

  // 3. The message.
  const message = oneLine(ask.message, ask.path)

  // 4. Where it goes.
  const pulls = await repo.openPulls()
  if (!pulls.ok) return pulls
  const own: Pull | undefined = ownPull(pulls.value, who.login)
  const direct = own === undefined && can(level, 'save-direct')
  let branch = main
  let freshBranch = false
  if (own !== undefined) branch = own.head
  else if (!direct) {
    branch = suggestionBranch(who.login)
    const left = await repo.branchHead(branch)
    if (left.ok) {
      // Left over from an approved, turned-down or half-made suggestion: start again from the game as it is now.
      const gone = await repo.deleteBranch(branch)
      if (!gone.ok) return gone
    } else if (left.problem !== 'not-found') return left
    const head = await repo.branchHead(main)
    if (!head.ok) return head
    const made = await repo.createBranch(branch, head.value)
    if (!made.ok) return made
    freshBranch = true
  }

  // 5. The commit, with the person as its author so the game's history says who did it.
  const saved = await repo.saveFile({
    branch,
    path: ask.path,
    text,
    version: ask.version,
    message,
    author: { name: who.login, email: `${who.id}+${who.login}@users.noreply.github.com` },
  })
  if (!saved.ok) {
    // Nothing of theirs was written: do not leave an empty branch behind.
    if (freshBranch) await repo.deleteBranch(branch)
    return saved
  }
  if (direct) return { ok: true, value: { how: 'direct', version: saved.value.version, mine: undefined } }

  // 6. The suggestion: a pull, when the branch has none yet. If it cannot be made, the next Save starts again.
  let mine: Waiting
  if (own !== undefined) {
    mine = await toWaiting(repo, { ...own, headCommit: saved.value.commit }, who.login)
  } else {
    const pull = await repo.createPull({
      branch,
      title: message,
      body: `Made with Automata Editors by ${who.login}.`,
    })
    if (!pull.ok) return pull
    mine = await toWaiting(repo, pull.value, who.login)
  }
  return { ok: true, value: { how: 'suggestion', version: saved.value.version, mine } }
}

/** The sentences of an error `writeContent` threw, one per line it names. */
function sentencesOf(error: unknown): string[] {
  const text = error instanceof Error ? error.message : 'This level cannot be saved.'
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
}
