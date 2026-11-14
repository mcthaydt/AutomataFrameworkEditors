// The API's sign-in side: the one place the App's client secret is used. It swaps the code GitHub sends back for the
// person's tokens, answers who a token belongs to, and makes every /api answer. Nothing here touches a page.
import type { Answer, Tokens } from '../wire/wire.ts'
import { STATUS } from '../wire/wire.ts'

export { type Who, whoIs } from './who.ts'

export interface ExchangeEnv {
  readonly GITHUB_CLIENT_ID?: string
  readonly GITHUB_CLIENT_SECRET?: string
  /** Default `https://github.com`; tests point it at the pretend GitHub. */
  readonly GITHUB_WEB_URL?: string
  /** Default `https://api.github.com`. */
  readonly GITHUB_API_URL?: string
}

/** Every /api answer is made here: JSON, the status from `STATUS`, never cached, never sniffed. */
export function answer<T>(result: Answer<T>): Response {
  return new Response(JSON.stringify(result), {
    status: result.ok ? 200 : STATUS[result.problem],
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  })
}

/**
 * True when the request comes from this site's own pages. A POST must carry an `Origin` equal to its own address. A
 * browser sends no `Origin` on a same-origin GET, so a GET may carry none, but never another site's. That is enough:
 * the sign-in is a header the page keeps, not a cookie, so another site cannot borrow it.
 */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const own = new URL(request.url).origin
  if (request.method === 'GET' || request.method === 'HEAD') return origin === null || origin === own
  return origin === own
}

const fail = (problem: 'not-allowed' | 'bad-request' | 'not-set-up' | 'busy' | 'signed-out'): Response =>
  answer({ ok: false, problem })

/** The `{ code }` or `{ refresh }` a page may send, or undefined for anything else. */
async function readAsk(request: Request): Promise<{ code: string } | { refresh: string } | undefined> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return undefined
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return undefined
  const { code, refresh } = body as { code?: unknown; refresh?: unknown }
  const hasCode = code !== undefined
  const hasRefresh = refresh !== undefined
  if (hasCode === hasRefresh) return undefined
  if (typeof code === 'string' && code !== '') return { code }
  if (typeof refresh === 'string' && refresh !== '') return { refresh }
  return undefined
}

/**
 * POST { "code" } (a new sign-in) or { "refresh" } (the next token). Gives `Answer<Tokens>`. GitHub is asked with
 * the App's id and secret, which never leave this function: no answer and no thrown message holds them.
 */
export async function handleTokenRequest(
  request: Request,
  env: ExchangeEnv,
  fetcher: typeof fetch = fetch,
): Promise<Response> {
  if (!sameOrigin(request)) return fail('not-allowed')
  if (request.method !== 'POST') return fail('bad-request')
  const { GITHUB_CLIENT_ID: id, GITHUB_CLIENT_SECRET: secret } = env
  if (!id || !secret) return fail('not-set-up')
  const ask = await readAsk(request)
  if (ask === undefined) return fail('bad-request')

  const credentials =
    'code' in ask
      ? { client_id: id, client_secret: secret, code: ask.code }
      : { client_id: id, client_secret: secret, grant_type: 'refresh_token', refresh_token: ask.refresh }
  let reply: { access_token?: unknown; refresh_token?: unknown; error?: unknown }
  try {
    const res = await fetcher(`${env.GITHUB_WEB_URL ?? 'https://github.com'}/login/oauth/access_token`, {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify(credentials),
    })
    if (!res.ok) return fail('busy')
    reply = (await res.json()) as typeof reply
  } catch {
    return fail('busy')
  }
  if (typeof reply !== 'object' || reply === null) return fail('busy')
  // GitHub answers a bad or used code with 200 and an error name, not with a failing status.
  if (typeof reply.error === 'string') return fail('signed-out')
  if (typeof reply.access_token !== 'string' || reply.access_token === '') return fail('busy')
  const tokens: Tokens =
    typeof reply.refresh_token === 'string' && reply.refresh_token !== ''
      ? { token: reply.access_token, refresh: reply.refresh_token }
      : { token: reply.access_token }
  return answer({ ok: true, value: tokens })
}
