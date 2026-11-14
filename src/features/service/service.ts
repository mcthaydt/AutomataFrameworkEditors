// Every /api request. Routes by method and path, and never throws: anything unexpected is 500 unknown, with nothing
// of it in the body.
import { answer, handleTokenRequest } from '../exchange/exchange.ts'
import type { Deps } from '../github/github.ts'
import type { Answer } from '../wire/wire.ts'
import type { ApiDeps, ApiEnv } from './enter.ts'
import { listGames } from './games.ts'
import { openGame } from './open.ts'

export type { ApiEnv } from './enter.ts'

type Route = (deps: ApiDeps, request: Request, url: URL) => Promise<Answer<unknown>>

/** The routes: each is a method and a path, and what it does. */
const ROUTES: Readonly<Record<string, Route>> = {
  'GET /api/games': (deps, request) => listGames(deps, request),
  'GET /api/game': (deps, request, url) => {
    const owner = url.searchParams.get('owner') ?? ''
    const name = url.searchParams.get('name') ?? ''
    return openGame(deps, request, { owner, name })
  },
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
