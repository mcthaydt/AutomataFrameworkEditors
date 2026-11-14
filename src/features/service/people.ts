// Sharing: who may do what in a game. The Share screen is a touch screen for `automata.access.toml`, and this is the
// one place the API reads and writes it. Only an Owner may do either.
import {
  ACCESS_FILE,
  type AccessFile,
  CLOSED,
  checkAccess,
  defaultAccess,
  parseAccess,
  writeAccess,
} from '../access/access.ts'
import type { Repo } from '../github/github.ts'
import type { Answer, GameRef, SharingAnswer } from '../wire/wire.ts'
import { readBody, readGame } from './body.ts'
import { type ApiDeps, enter } from './enter.ts'

const MESSAGE = 'Change who can help with this game'
const sameName = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase()

/** The file as the default branch has it. A file that cannot be read counts as an empty list, and says so. */
async function current(repo: Repo): Promise<Answer<SharingAnswer>> {
  const owner = repo.facts.ownerLogin
  const read = await repo.readFile(repo.facts.branch, ACCESS_FILE)
  if (!read.ok) {
    if (read.problem !== 'not-found') return read
    return {
      ok: true,
      value: { access: defaultAccess(repo.facts.isPublic), version: undefined, owner, broken: false },
    }
  }
  const parsed = parseAccess(read.value.text)
  return {
    ok: true,
    value: {
      access: parsed.ok ? parsed.value : CLOSED,
      version: read.value.version,
      owner,
      broken: !parsed.ok,
    },
  }
}

export async function readSharing(
  deps: ApiDeps,
  request: Request,
  game: GameRef,
): Promise<Answer<SharingAnswer>> {
  const entered = await enter(deps, request, game, 'share')
  if (!entered.ok) return entered
  return current(entered.value.repo)
}

export async function writeSharing(deps: ApiDeps, request: Request): Promise<Answer<SharingAnswer>> {
  const body = await readBody(request)
  if (!body.ok) return body
  const game = readGame(body.value.game)
  const { version } = body.value
  if (game === undefined || (version !== undefined && version !== null && typeof version !== 'string')) {
    return { ok: false, problem: 'bad-request' }
  }
  const checked = checkAccess(body.value.access)
  if (!checked.ok) return { ok: false, problem: 'bad-request', details: checked.problems }

  const entered = await enter(deps, request, game, 'share')
  if (!entered.ok) return entered
  const { repo, who } = entered.value
  if (who === undefined) return { ok: false, problem: 'signed-out' }
  const owner = repo.facts.ownerLogin

  // The account that owns the game is always an Owner, so it is never in the list.
  const wanted: AccessFile = {
    ...checked.value,
    people: checked.value.people.filter((person) => !sameName(person.github, owner)),
  }

  const now = await current(repo)
  if (!now.ok) return now
  // Only names new to the list are looked up: the ones already there were found when they were added.
  const known = new Set(now.value.access.people.map((person) => person.github.toLowerCase()))
  const missing: string[] = []
  for (const person of wanted.people) {
    if (known.has(person.github.toLowerCase())) continue
    const exists = await repo.userExists(person.github)
    if (!exists.ok) return exists
    if (!exists.value) missing.push(person.github)
  }
  if (missing.length > 0) return { ok: false, problem: 'not-found', details: missing }

  const text = writeAccess(wanted)
  // The same list again writes nothing (a file that is not there yet is still written, so that it is there).
  if (now.value.version !== undefined && !now.value.broken && writeAccess(now.value.access) === text)
    return now

  const saved = await repo.saveFile({
    branch: repo.facts.branch,
    path: ACCESS_FILE,
    text,
    version: typeof version === 'string' ? version : undefined,
    message: MESSAGE,
    author: { name: who.login, email: `${who.id}+${who.login}@users.noreply.github.com` },
  })
  if (!saved.ok) return saved
  return { ok: true, value: { access: wanted, version: saved.value.version, owner, broken: false } }
}
