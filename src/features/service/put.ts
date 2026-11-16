// Put: every changed file of a game in one change, straight into the game for someone who may, or as a waiting change
// for someone who may not. As with Save, the API trusts nothing the page says: it picks each file from the game's own
// project file, writes the framework's bytes, and (when the game asks for it) checks the whole game still loads before
// anything is written. Nothing is written unless every file is.
import { PROJECT_FILE, parseProject, writeContent } from '@automataframework/framework/headless'
import { can } from '../access/access.ts'
import { changeProject, type ProjectChange } from '../files/files.ts'
import type { Pull } from '../github/github.ts'
import type { Answer, PutAnswer, PutAsk, PutFile, Waiting, WireFile } from '../wire/wire.ts'
import { allowedFiles } from './allowed.ts'
import { type Json, isObject, readBody, readGame } from './body.ts'
import { type ApiDeps, enter, suggestionBranch } from './enter.ts'
import { oneLine } from './message.ts'
import { ownPull, toWaiting } from './pulls.ts'
import { stopsOnProblems, wholeGameLoads } from './whole.ts'

/** More files than a person could have changed by hand in one sitting: refused, not cut. */
const MOST_FILES = 200

const optionalString = (value: unknown): string | undefined | null =>
  value === undefined ? undefined : typeof value === 'string' ? value : null

function readFileAsk(raw: unknown): PutFile | undefined {
  if (!isObject(raw) || typeof raw.path !== 'string') return undefined
  const version = optionalString(raw.version)
  if (version === null) return undefined
  // A file taken away has no `value` (JSON leaves an undefined out).
  return { path: raw.path, value: raw.value, version }
}

function readProject(raw: unknown): ProjectChange | undefined | null {
  if (raw === undefined) return undefined
  if (!isObject(raw)) return null
  const { add, remove, rename } = raw
  const adds: { type: 'level' | 'world'; path: string }[] = []
  if (add !== undefined) {
    if (!Array.isArray(add)) return null
    for (const one of add) {
      if (!isObject(one) || typeof one.path !== 'string') return null
      if (one.type !== 'level' && one.type !== 'world') return null
      adds.push({ type: one.type, path: one.path })
    }
  }
  if (remove !== undefined && !(Array.isArray(remove) && remove.every((p) => typeof p === 'string'))) {
    return null
  }
  let renames: Record<string, string> | undefined
  if (rename !== undefined) {
    if (!isObject(rename) || !Object.values(rename).every((id) => typeof id === 'string')) return null
    renames = rename as Record<string, string>
  }
  return {
    ...(add === undefined ? {} : { add: adds }),
    ...(remove === undefined ? {} : { remove: remove as string[] }),
    ...(renames === undefined ? {} : { rename: renames }),
  }
}

function readAsk(body: Json): PutAsk | undefined {
  const game = readGame(body.game)
  if (game === undefined || typeof body.message !== 'string' || !Array.isArray(body.files)) return undefined
  if (body.files.length > MOST_FILES) return undefined
  const files = body.files.map(readFileAsk)
  if (files.some((f) => f === undefined)) return undefined
  const project = readProject(body.project)
  const projectVersion = optionalString(body.projectVersion)
  if (project === null || projectVersion === null) return undefined
  // A change to the project file starts from a version of it; one with nothing in it asks for nothing.
  if (project !== undefined && projectVersion === undefined) return undefined
  const ask: PutAsk = {
    game,
    files: files as PutFile[],
    message: body.message,
    ...(project === undefined ? {} : { project }),
    ...(projectVersion === undefined ? {} : { projectVersion }),
  }
  if (new Set(ask.files.map((f) => f.path)).size !== ask.files.length) return undefined
  return ask.files.length === 0 && project === undefined ? undefined : ask
}

/** The sentences of an error `writeContent` threw, one per line it names. */
function sentencesOf(error: unknown): string[] {
  const text = error instanceof Error ? error.message : 'This file cannot be saved.'
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
}

export async function putFiles(deps: ApiDeps, request: Request): Promise<Answer<PutAnswer>> {
  const body = await readBody(request)
  if (!body.ok) return body
  const ask = readAsk(body.value)
  if (ask === undefined) return { ok: false, problem: 'bad-request' }
  const entered = await enter(deps, request, ask.game, 'save')
  if (!entered.ok) return entered
  const { who, repo, level } = entered.value
  if (who === undefined) return { ok: false, problem: 'signed-out' }
  const main = repo.facts.branch

  // Where it goes: a person's own waiting change, or the game, or a new waiting change.
  const pulls = await repo.openPulls()
  if (!pulls.ok) return pulls
  const own: Pull | undefined = ownPull(pulls.value, who.login)
  const direct = own === undefined && can(level, 'save-direct')
  const readFrom = own === undefined ? main : own.head

  // 1. The files this change may touch are the level and world files the game lists, and the ones it adds.
  const project = await repo.readFile(readFrom, PROJECT_FILE)
  if (!project.ok) return project.problem === 'not-found' ? { ok: false, problem: 'not-a-game' } : project
  const parsed = parseProject(project.value.text)
  if (!parsed.ok) return { ok: false, problem: 'not-allowed' }
  const allowed = allowedFiles(parsed.value.content, ask.project)
  const listedPaths = new Set(parsed.value.content.map((ref) => ref.path))
  for (const file of ask.files) if (!allowed.has(file.path)) return { ok: false, problem: 'not-allowed' }
  // Only a file the game lists may be taken out of the list.
  for (const path of ask.project?.remove ?? []) {
    if (!allowed.has(path) || !listedPaths.has(path)) return { ok: false, problem: 'not-allowed' }
  }
  for (const add of ask.project?.add ?? []) {
    if (!allowed.has(add.path)) return { ok: false, problem: 'not-allowed' }
  }

  // 2. Each value must be a good file of its kind, named for its file; the bytes are the framework's.
  const written = new Map<string, string | undefined>()
  for (const file of ask.files) {
    if (file.value === undefined) {
      written.set(file.path, undefined)
      continue
    }
    const kind = allowed.get(file.path) ?? 'level'
    let text: string
    try {
      text = writeContent(kind, file.value as never)
    } catch (error) {
      return { ok: false, problem: 'broken', details: sentencesOf(error) }
    }
    const id = (JSON.parse(text) as { id: string }).id
    const fileName = file.path
      .split('/')
      .pop()
      ?.replace(/\.json$/, '')
    if (id !== fileName) {
      return { ok: false, problem: 'broken', details: [`${file.path}: the id must be "${fileName}".`] }
    }
    written.set(file.path, text)
  }

  // 3. The project file's lines, on the version the person started from.
  let projectText: string | undefined
  if (ask.project !== undefined) {
    if (ask.projectVersion !== project.value.version) {
      return { ok: false, problem: 'changed-elsewhere', details: [PROJECT_FILE] }
    }
    const changed = changeProject(project.value.text, ask.project)
    if (changed === undefined) {
      const why = `${PROJECT_FILE}: this change can't be made (a game needs the level it starts in).`
      return { ok: false, problem: 'broken', details: [why] }
    }
    if (changed !== project.value.text) projectText = changed
  }

  // 4. When the game asks for it, the whole game with the change in place must load.
  const stops = await stopsOnProblems(repo, readFrom)
  if (!stops.ok) return stops
  if (stops.value) {
    const after = parseProject(projectText ?? project.value.text)
    if (!after.ok) {
      return { ok: false, problem: 'broken', details: [`${PROJECT_FILE}: this file would not read.`] }
    }
    const whole = await wholeGameLoads(
      repo,
      readFrom,
      { path: PROJECT_FILE, text: projectText ?? project.value.text },
      after.value.content,
      written,
    )
    if (!whole.ok) return whole
  }

  // 5. The message, and where it goes.
  const message = oneLine(ask.message, ask.files[0]?.path ?? PROJECT_FILE)
  let branch = readFrom
  let freshBranch = false
  if (own === undefined && !direct) {
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

  // 6. One commit with every file, with the person as its author so the game's history says who did it.
  const committed = await repo.commitFiles({
    branch,
    files: [
      ...ask.files.map((file) => ({
        path: file.path,
        text: written.get(file.path),
        version: file.version,
      })),
      ...(projectText === undefined
        ? []
        : [{ path: PROJECT_FILE, text: projectText, version: project.value.version }]),
    ],
    message,
    author: { name: who.login, email: `${who.id}+${who.login}@users.noreply.github.com` },
  })
  if (!committed.ok) {
    // Nothing of theirs was written: do not leave an empty branch behind.
    if (freshBranch) await repo.deleteBranch(branch)
    return committed
  }
  const { commit, versions } = committed.value
  const projectFile: WireFile | undefined =
    projectText === undefined
      ? undefined
      : { path: PROJECT_FILE, text: projectText, version: versions[PROJECT_FILE] ?? '' }
  const { [PROJECT_FILE]: _project, ...fileVersions } = versions
  const answer = { versions: fileVersions, ...(projectFile === undefined ? {} : { project: projectFile }) }
  if (direct) return { ok: true, value: { how: 'direct', ...answer, mine: undefined } }

  // 7. The suggestion: a pull, when the branch has none yet. If it cannot be made, the next Put starts again.
  let mine: Waiting
  if (own !== undefined) {
    mine = await toWaiting(repo, { ...own, headCommit: commit }, who.login)
  } else {
    const pull = await repo.createPull({
      branch,
      title: message,
      body: `Made with Automata Editors by ${who.login}.`,
    })
    if (!pull.ok) return pull
    mine = await toWaiting(repo, pull.value, who.login)
  }
  return { ok: true, value: { how: 'suggestion', ...answer, mine } }
}
