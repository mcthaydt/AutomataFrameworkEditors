// Every /api request. Routes by method and path, and never throws: anything unexpected is 500 unknown, with nothing
// of it in the body.
import { answer, handleTokenRequest } from '../exchange/exchange.ts'
import type { Deps } from '../github/github.ts'
import type { Answer, GameRef } from '../wire/wire.ts'
import { approveChange, turnDownChange } from './approve.ts'
import type { ApiDeps, ApiEnv } from './enter.ts'
import { listGames } from './games.ts'
import { openGame } from './open.ts'
import { readSharing, writeSharing } from './people.ts'
import { saveLevel } from './save.ts'
import { listWaiting, showChange } from './waiting.ts'

export type { ApiEnv } from './enter.ts'

type Route = (deps: ApiDeps, request: Request, url: URL) => Promise<Answer<unknown>>

/** The game a GET names: `?owner=&name=`. Whatever is not there is empty, and the door says bad-request. */
const gameOf = (url: URL): GameRef => ({
  owner: url.searchParams.get('owner') ?? '',
  name: url.searchParams.get('name') ?? '',
})

/** The routes: each is a method and a path, and what it does. */
const ROUTES: Readonly<Record<string, Route>> = {
  'GET /api/games': (deps, request) => listGames(deps, request),
  'POST /api/save': (deps, request) => saveLevel(deps, request),
  'POST /api/approve': (deps, request) => approveChange(deps, request),
  'POST /api/turn-down': (deps, request) => turnDownChange(deps, request),
  'GET /api/waiting': (deps, request, url) => listWaiting(deps, request, gameOf(url)),
  'GET /api/change': (deps, request, url) =>
    showChange(deps, request, gameOf(url), Number(url.searchParams.get('number'))),
  'GET /api/sharing': (deps, request, url) => readSharing(deps, request, gameOf(url)),
  'POST /api/sharing': (deps, request) => writeSharing(deps, request),
  'GET /api/game': (deps, request, url) => openGame(deps, request, gameOf(url)),
}
const PATHS = new Set(['/api/token', ...Object.keys(ROUTES).map((key) => key.split(' ')[1] ?? '')])

const notFound = (): Response => answer({ ok: false, problem: 'not-found' })

export async function handleApi(request: Request, env: ApiEnv, deps: Partial<Deps> = {}): Promise<Response> {
  try {
    const url = new URL(request.url)
    if (!PATHS.has(url.pathname)) return notFound()
    // Wrapped, because a Worker's `fetch` throws when it is called as a method of another object.
    const fetcher: typeof fetch = deps.fetcher ?? ((input, init) => fetch(input, init))
    if (url.pathname === '/api/token') return await handleTokenRequest(request, env, fetcher)
    const route = ROUTES[`${request.method} ${url.pathname}`]
    if (route === undefined) return answer({ ok: false, problem: 'bad-request' })
    return answer(await route({ env, fetcher, now: deps.now ?? Date.now }, request, url))
  } catch {
    // What went wrong is never put in the body: it could hold a token or a key.
    return answer({ ok: false, problem: 'unknown' })
  }
}
