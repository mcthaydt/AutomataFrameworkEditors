// The one place a call to GitHub is made and an answer becomes a problem. Everything else in this feature asks for
// a path and gets a value or a problem back; nothing else reads a status code.
import type { ExchangeEnv } from '../exchange/exchange.ts'
import type { Answer } from '../wire/wire.ts'

export interface AppEnv extends ExchangeEnv {
  readonly GITHUB_APP_ID?: string
  /** The .pem GitHub gives, pasted whole (PKCS#1), or a PKCS#8 one. */
  readonly GITHUB_APP_PRIVATE_KEY?: string
}

export interface Deps {
  readonly env: AppEnv
  readonly fetcher: typeof fetch
  /** The time in milliseconds. */
  readonly now: () => number
}

/** Who a call is made as: the App itself (a JWT), an installation (a token for one repo), or a signed-in person. */
export interface As {
  readonly kind: 'app' | 'installation' | 'person'
  readonly token: string
}

export interface Req {
  readonly method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** From the root, with each segment already encoded: `/repos/o/n/contents/a%20b.json`. */
  readonly path: string
  readonly query?: Readonly<Record<string, string>>
  readonly body?: unknown
  readonly as: As
  /** Statuses the caller reads for itself (a 409 it will settle by looking, say) instead of getting a problem. */
  readonly pass?: readonly number[]
}

export interface Reply {
  readonly status: number
  /** The JSON of the answer; undefined when there was none. */
  readonly body: unknown
  readonly headers: Headers
}

/** What GitHub last said about the allowance: how many calls are left of how many. */
export interface RateWatch {
  remaining?: number
  limit?: number
}

const API = 'https://api.github.com'

export async function send(
  deps: Pick<Deps, 'env' | 'fetcher'>,
  req: Req,
  rate?: RateWatch,
): Promise<Answer<Reply>> {
  const query = req.query === undefined ? '' : `?${new URLSearchParams(req.query)}`
  let res: Response
  try {
    res = await deps.fetcher(`${deps.env.GITHUB_API_URL ?? API}${req.path}${query}`, {
      method: req.method,
      headers: {
        accept: 'application/vnd.github+json',
        'x-github-api-version': '2022-11-28',
        authorization: `Bearer ${req.as.token}`,
        ...(req.body === undefined ? {} : { 'content-type': 'application/json' }),
      },
      ...(req.body === undefined ? {} : { body: JSON.stringify(req.body) }),
    })
  } catch {
    return { ok: false, problem: 'busy' }
  }
  if (rate !== undefined) {
    const remaining = Number(res.headers.get('x-ratelimit-remaining'))
    const limit = Number(res.headers.get('x-ratelimit-limit'))
    if (res.headers.get('x-ratelimit-remaining') !== null && Number.isFinite(remaining))
      rate.remaining = remaining
    if (res.headers.get('x-ratelimit-limit') !== null && Number.isFinite(limit)) rate.limit = limit
  }
  if (res.status >= 500) return { ok: false, problem: 'busy' }
  if (req.pass?.includes(res.status) !== true && !(res.status >= 200 && res.status < 300)) {
    return { ok: false, problem: problemFor(res, req.as) }
  }
  let body: unknown
  const text = await res.text().catch(() => '')
  if (text !== '') {
    try {
      body = JSON.parse(text)
    } catch {
      body = undefined
    }
  }
  return { ok: true, value: { status: res.status, body, headers: res.headers } }
}

/** What an answer GitHub gave, that nobody asked for, means. */
function problemFor(
  res: Response,
  as: As,
): 'busy' | 'not-set-up' | 'signed-out' | 'not-found' | 'blocked' | 'unknown' {
  if (res.status === 401) return as.kind === 'person' ? 'signed-out' : 'not-set-up'
  if (res.status === 404) return 'not-found'
  if (res.status === 429) return 'busy'
  if (res.status === 403) {
    const spent = res.headers.get('x-ratelimit-remaining') === '0' || res.headers.get('retry-after') !== null
    return spent ? 'busy' : 'blocked'
  }
  return 'unknown'
}
