// Who a token belongs to. GitHub's `/user` would accept a token made by any app; this asks whether the token was
// made by *this* App's sign-in, so a token from somewhere else is never taken for a person here.
import type { Answer } from '../wire/wire.ts'
import type { ExchangeEnv } from './exchange.ts'

export interface Who {
  readonly login: string
  readonly id: number
}

/** `POST {api}/applications/{client_id}/token`, with the App's id and secret: 404 or 422 is a token that is not ours. */
export async function whoIs(
  token: string,
  env: ExchangeEnv,
  fetcher: typeof fetch = fetch,
): Promise<Answer<Who>> {
  if (token === '') return { ok: false, problem: 'signed-out' }
  const { GITHUB_CLIENT_ID: id, GITHUB_CLIENT_SECRET: secret } = env
  if (!id || !secret) return { ok: false, problem: 'not-set-up' }
  let res: Response
  try {
    res = await fetcher(`${env.GITHUB_API_URL ?? 'https://api.github.com'}/applications/${id}/token`, {
      method: 'POST',
      headers: {
        accept: 'application/vnd.github+json',
        'x-github-api-version': '2022-11-28',
        authorization: `Basic ${btoa(`${id}:${secret}`)}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ access_token: token }),
    })
  } catch {
    // A blip must never throw a person out, so an unreachable GitHub is busy, not signed-out.
    return { ok: false, problem: 'busy' }
  }
  if (res.status === 404 || res.status === 422) return { ok: false, problem: 'signed-out' }
  if (res.status === 401) return { ok: false, problem: 'not-set-up' }
  if (!res.ok) return { ok: false, problem: 'busy' }
  try {
    const body = (await res.json()) as { user?: { login?: unknown; id?: unknown } }
    const { login, id: userId } = body.user ?? {}
    if (typeof login === 'string' && login !== '' && typeof userId === 'number') {
      return { ok: true, value: { login, id: userId } }
    }
  } catch {
    return { ok: false, problem: 'busy' }
  }
  return { ok: false, problem: 'signed-out' }
}
