// The door every route but /api/token goes through. It works out who is asking, from the Bearer token and nothing the
// page says; opens the repo as the App; reads the sharing file from the default branch; and works out the person's
// level from that. A route that gets past the door knows who may do what.
import {
  ACCESS_FILE,
  type AccessFile,
  type AccessLevel,
  type Action,
  CLOSED,
  can,
  defaultAccess,
  levelOf,
  parseAccess,
} from '../access/access.ts'
import { sameOrigin, type Who, whoIs } from '../exchange/exchange.ts'
import { type AppEnv, type Deps, openRepo, type Repo } from '../github/github.ts'
import type { Answer, GameRef } from '../wire/wire.ts'

/** What the API's own settings add to the App's: the one game a visitor may open (`owner/name`). */
export interface ApiEnv extends AppEnv {
  readonly DEMO_GAME?: string
}
export interface ApiDeps extends Deps {
  readonly env: ApiEnv
}

export interface Entered {
  /** Undefined for a visitor. */
  readonly who: Who | undefined
  /** The person's GitHub token, for the few calls GitHub wants made as them. Undefined for a visitor. */
  readonly token: string | undefined
  readonly repo: Repo
  readonly access: AccessFile
  /** The sharing file's version on the default branch; undefined when there is no file. */
  readonly accessVersion: string | undefined
  readonly level: AccessLevel
}

/** Where a person's waiting change lives: `automata/` and their login in lower case. */
export const SUGGESTION_PREFIX = 'automata/'
export function suggestionBranch(login: string): string {
  return `${SUGGESTION_PREFIX}${login.toLowerCase()}`
}

const NAME = /^[A-Za-z0-9._-]{1,100}$/
/** A visitor's open gives way when less than this share of GitHub's allowance is left, so the team can still work. */
const VISITOR_RESERVE = 0.25

const refuse = <T>(problem: Extract<Answer<T>, { ok: false }>['problem']): Answer<T> => ({
  ok: false,
  problem,
})
const sameName = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase()

/** True only for the site's demo game: the one thing a visitor who has not signed in may open. */
export function isDemo(env: ApiEnv, game: GameRef): boolean {
  const [owner, name, ...rest] = (env.DEMO_GAME ?? '').split('/')
  return (
    rest.length === 0 &&
    owner !== undefined &&
    name !== undefined &&
    sameName(owner, game.owner) &&
    sameName(name, game.name)
  )
}

/**
 * What someone who has not signed in may do: 'look' at the demo game if it is public and the editor was added to it;
 * otherwise 'nothing'. Its sharing file and GitHub's roles do not matter; every other game is its team's.
 */
export function visitorLevel(env: ApiEnv, game: GameRef, repo: Repo): 'nothing' | 'look' {
  return isDemo(env, game) && repo.facts.isPublic ? 'look' : 'nothing'
}

/** The Bearer token of a request: undefined when there is no header at all, '' when it is there but unusable. */
function bearer(request: Request): string | undefined {
  const header = request.headers.get('authorization')
  if (header === null) return undefined
  const match = /^Bearer (\S+)$/.exec(header)
  return match?.[1] ?? ''
}

/**
 * Who is asking, for a route that is about the person and no game: the origin checked, and the token asked of GitHub
 * as this App's own. A visitor has no token and gets `signed-out`.
 */
export async function signedIn(
  deps: ApiDeps,
  request: Request,
): Promise<Answer<{ who: Who; token: string }>> {
  if (!sameOrigin(request)) return refuse('not-allowed')
  const token = bearer(request)
  if (token === undefined || token === '') return refuse('signed-out')
  const found = await whoIs(token, deps.env, deps.fetcher)
  return found.ok ? { ok: true, value: { who: found.value, token } } : found
}

/** The sharing file as the default branch has it: the game's own, the default when there is none, closed when broken. */
async function readAccess(repo: Repo): Promise<Answer<{ access: AccessFile; version: string | undefined }>> {
  const read = await repo.readFile(repo.facts.branch, ACCESS_FILE)
  if (!read.ok) {
    if (read.problem !== 'not-found') return read
    return { ok: true, value: { access: defaultAccess(repo.facts.isPublic), version: undefined } }
  }
  const parsed = parseAccess(read.value.text)
  return {
    ok: true,
    value: { access: parsed.ok ? parsed.value : CLOSED, version: read.value.version },
  }
}

/**
 * Who is asking (from the Bearer token), the repo, the sharing file from the default branch, and their level. Refuses
 * unless they may do `action`. A route that takes visitors passes `visitors: true`; with no token at all, only the
 * demo game opens, and only to look. A token that is there but empty or wrong is always `signed-out`, so a sign-in that
 * ran out is renewed and not quietly turned into a visit.
 */
export async function enter(
  deps: ApiDeps,
  request: Request,
  game: GameRef,
  action: Action,
  opts: { visitors: boolean } = { visitors: false },
): Promise<Answer<Entered>> {
  if (!sameOrigin(request)) return refuse('not-allowed')
  const token = bearer(request)
  if (token === undefined && !opts.visitors) return refuse('signed-out')
  if (!NAME.test(game.owner) || !NAME.test(game.name)) return refuse('bad-request')

  let who: Who | undefined
  if (token !== undefined) {
    const found = await whoIs(token, deps.env, deps.fetcher)
    if (!found.ok) return found
    who = found.value
  } else if (!isDemo(deps.env, game)) {
    // A visitor and any other game: nothing is said about it, and GitHub is not asked.
    return refuse('not-found')
  }

  const opened = await openRepo(deps, game)
  if (!opened.ok) return opened
  const repo = opened.value

  if (who === undefined) {
    if (visitorLevel(deps.env, game, repo) !== 'look') return refuse('not-found')
    const left = repo.allowance()
    if (left !== undefined && left < VISITOR_RESERVE) return refuse('busy')
    if (!can('look', action)) return refuse('not-allowed')
    return {
      ok: true,
      value: {
        who: undefined,
        token: undefined,
        repo,
        access: CLOSED,
        accessVersion: undefined,
        level: 'look',
      },
    }
  }

  const shared = await readAccess(repo)
  if (!shared.ok) return shared
  let level = levelOf(shared.value.access, who.login, repo.facts.ownerLogin)
  // An organisation's game has no person as its owner: the repo's GitHub admins are its Owners.
  if (level !== 'owner' && repo.facts.ownerIsOrg && token !== undefined) {
    const admin = await repo.isAdmin(token)
    if (!admin.ok) return admin
    if (admin.value) level = 'owner'
  }
  if (level === 'nothing') return refuse('not-found')
  if (!can(level, action)) return refuse('not-allowed')
  return {
    ok: true,
    value: { who, token, repo, access: shared.value.access, accessVersion: shared.value.version, level },
  }
}
