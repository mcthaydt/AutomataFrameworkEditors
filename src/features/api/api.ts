// The page's only way out. Every method is one /api call on this site's own address; the page never talks to GitHub
// or to anyone else. A call carries the person's sign-in as a Bearer header. When the API says the sign-in ran out,
// it is renewed once, without the person noticing, and the call is made again.

import type {
  Answer,
  ChangeAsk,
  GameRef,
  OpenAnswer,
  SaveAnswer,
  SaveAsk,
  SharingAnswer,
  SharingAsk,
  Tokens,
  Waiting,
  WaitingChange,
} from '../wire/wire.ts'
import { STATUS } from '../wire/wire.ts'

export interface Auth {
  /** The sign-in the page keeps, if any. */
  token(): string | undefined
  /** Swaps the kept refresh for a new sign-in; says whether it worked. */
  renew(): Promise<boolean>
}

export interface Api {
  games(): Promise<Answer<readonly GameRef[]>>
  open(game: GameRef): Promise<Answer<OpenAnswer>>
  save(ask: SaveAsk): Promise<Answer<SaveAnswer>>
  waiting(game: GameRef): Promise<Answer<readonly Waiting[]>>
  change(ask: ChangeAsk): Promise<Answer<WaitingChange>>
  approve(ask: ChangeAsk): Promise<Answer<true>>
  turnDown(ask: ChangeAsk): Promise<Answer<true>>
  sharing(game: GameRef): Promise<Answer<SharingAnswer>>
  share(ask: SharingAsk): Promise<Answer<SharingAnswer>>
}

type Fetcher = typeof fetch
const wrapped: Fetcher = (input, init) => fetch(input, init)

/** Whether `value` has the shape of an `Answer`: anything else (an HTML error page, say) is not one. */
function isAnswer(value: unknown): value is Answer<unknown> {
  if (typeof value !== 'object' || value === null) return false
  const answer = value as { ok?: unknown; value?: unknown; problem?: unknown }
  if (answer.ok === true) return 'value' in answer
  return answer.ok === false && typeof answer.problem === 'string' && answer.problem in STATUS
}

const query = (game: GameRef, more: Record<string, string> = {}): string =>
  new URLSearchParams({ owner: game.owner, name: game.name, ...more }).toString()

export function createApi(auth: Auth, fetcher: Fetcher = wrapped): Api {
  /** One try. `visit` lets a call with no sign-in go out anyway (opening the demo game needs none). */
  async function once<T>(
    method: 'GET' | 'POST',
    path: string,
    body: unknown,
    token: string | undefined,
  ): Promise<Answer<T>> {
    let res: Response
    try {
      res = await fetcher(path, {
        method,
        headers: {
          accept: 'application/json',
          ...(token === undefined ? {} : { authorization: `Bearer ${token}` }),
          ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      })
    } catch {
      return { ok: false, problem: 'offline' }
    }
    let parsed: unknown
    try {
      parsed = await res.json()
    } catch {
      return { ok: false, problem: 'unknown' }
    }
    return isAnswer(parsed) ? (parsed as Answer<T>) : { ok: false, problem: 'unknown' }
  }

  async function call<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
    visit = false,
  ): Promise<Answer<T>> {
    const token = auth.token()
    if (token === undefined && !visit) return { ok: false, problem: 'signed-out' }
    const first = await once<T>(method, path, body, token)
    if (first.ok || first.problem !== 'signed-out' || token === undefined) return first
    // The sign-in ran out: renew it once, and ask again with the new one. A second refusal is final.
    if (!(await auth.renew())) return first
    return once<T>(method, path, body, auth.token())
  }

  return {
    games: () => call('GET', '/api/games'),
    open: (game) => call('GET', `/api/game?${query(game)}`, undefined, true),
    save: (ask) => call('POST', '/api/save', ask),
    waiting: (game) => call('GET', `/api/waiting?${query(game)}`),
    change: ({ game, number }) => call('GET', `/api/change?${query(game, { number: String(number) })}`),
    approve: (ask) => call('POST', '/api/approve', ask),
    turnDown: (ask) => call('POST', '/api/turn-down', ask),
    sharing: (game) => call('GET', `/api/sharing?${query(game)}`),
    share: (ask) => call('POST', '/api/sharing', ask),
  }
}

/** POST /api/token. Undefined when it fails for any reason. */
export async function swapTokens(
  ask: { code: string } | { refresh: string },
  fetcher: Fetcher = wrapped,
): Promise<Tokens | undefined> {
  try {
    const res = await fetcher('/api/token', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(ask),
    })
    const parsed: unknown = await res.json()
    if (!isAnswer(parsed) || !parsed.ok) return undefined
    const tokens = parsed.value as Tokens
    return typeof tokens.token === 'string' && tokens.token !== '' ? tokens : undefined
  } catch {
    return undefined
  }
}
