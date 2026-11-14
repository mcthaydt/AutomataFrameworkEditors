import { expect, test } from 'vitest'
import { answer, handleTokenRequest, sameOrigin } from '#src/features/exchange/exchange.ts'
import { type ProblemKind, STATUS } from '#src/features/wire/wire.ts'
import { json, recorder } from '../../fixtures/fetcher.ts'

const post = (body: unknown, origin: string | null = 'https://editors.example') =>
  new Request('https://editors.example/api/token', {
    method: 'POST',
    headers: { ...(origin === null ? {} : { origin }), 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
const env = { GITHUB_CLIENT_ID: 'id', GITHUB_CLIENT_SECRET: 'secret' }
const github = (reply: unknown) => recorder(() => json(reply))

test('a good code comes back as tokens', async () => {
  const { fetcher } = github({ access_token: 'ghu_1', refresh_token: 'ghr_1' })
  const res = await handleTokenRequest(post({ code: 'abc' }), env, fetcher)
  expect(res.status).toBe(200)
  expect(await res.json()).toEqual({ ok: true, value: { token: 'ghu_1', refresh: 'ghr_1' } })
  expect(res.headers.get('cache-control')).toBe('no-store')
})

test('an App whose tokens do not run out gives a token and no refresh', async () => {
  const { fetcher } = github({ access_token: 'ghu_1' })
  const res = await handleTokenRequest(post({ code: 'abc' }), env, fetcher)
  expect(await res.json()).toEqual({ ok: true, value: { token: 'ghu_1' } })
})

test('a code: GitHub is asked with the id, the secret and the code, wanting JSON', async () => {
  const { fetcher, calls } = github({ access_token: 'ghu_1' })
  await handleTokenRequest(post({ code: 'abc' }), { ...env, GITHUB_WEB_URL: 'http://fake.test' }, fetcher)
  expect(calls).toHaveLength(1)
  expect(calls[0]?.url).toBe('http://fake.test/login/oauth/access_token')
  expect(calls[0]?.method).toBe('POST')
  expect(calls[0]?.headers.get('accept')).toBe('application/json')
  expect(calls[0]?.body).toEqual({ client_id: 'id', client_secret: 'secret', code: 'abc' })
})

test('a refresh: the same call with grant_type=refresh_token and refresh_token', async () => {
  const { fetcher, calls } = github({ access_token: 'ghu_2', refresh_token: 'ghr_2' })
  const res = await handleTokenRequest(post({ refresh: 'ghr_1' }), env, fetcher)
  expect(calls[0]?.url).toBe('https://github.com/login/oauth/access_token')
  expect(calls[0]?.body).toEqual({
    client_id: 'id',
    client_secret: 'secret',
    grant_type: 'refresh_token',
    refresh_token: 'ghr_1',
  })
  expect(await res.json()).toEqual({ ok: true, value: { token: 'ghu_2', refresh: 'ghr_2' } })
})

test.each(['bad_verification_code', 'bad_refresh_token'])(
  'GitHub refusing with %s is 401 signed-out',
  async (error) => {
    const { fetcher } = github({ error, error_description: 'no' })
    const res = await handleTokenRequest(post({ code: 'abc' }), env, fetcher)
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ ok: false, problem: 'signed-out' })
  },
)

test('a request from another origin, or with no Origin, is 403 not-allowed and GitHub is never asked', async () => {
  for (const origin of ['https://evil.example', null]) {
    const { fetcher, calls } = github({ access_token: 'x' })
    const res = await handleTokenRequest(post({ code: 'abc' }, origin), env, fetcher)
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ ok: false, problem: 'not-allowed' })
    expect(calls).toEqual([])
  }
})

test('GET is 422 bad-request', async () => {
  const { fetcher, calls } = github({})
  const res = await handleTokenRequest(new Request('https://editors.example/api/token'), env, fetcher)
  expect(res.status).toBe(422)
  expect(await res.json()).toEqual({ ok: false, problem: 'bad-request' })
  expect(calls).toEqual([])
})

test.each([{}, { code: 7 }, { code: '' }, { code: 'a', refresh: 'b' }, 'not json', [], null])(
  'a body of %j is 422 bad-request',
  async (body) => {
    const { fetcher, calls } = github({ access_token: 'x' })
    const res = await handleTokenRequest(post(body), env, fetcher)
    expect(res.status).toBe(422)
    expect(await res.json()).toEqual({ ok: false, problem: 'bad-request' })
    expect(calls).toEqual([])
  },
)

test('a missing id or secret is 500 not-set-up, and GitHub is never asked', async () => {
  for (const missing of [{}, { GITHUB_CLIENT_ID: 'id' }, { GITHUB_CLIENT_SECRET: 'secret' }]) {
    const { fetcher, calls } = github({ access_token: 'x' })
    const res = await handleTokenRequest(post({ code: 'abc' }), missing, fetcher)
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ ok: false, problem: 'not-set-up' })
    expect(calls).toEqual([])
  }
})

test('GitHub down, or answering with something that is not JSON, is 503 busy', async () => {
  const down = recorder(() => {
    throw new Error('connection reset')
  })
  const html = recorder(() => new Response('<html>bad gateway</html>', { status: 502 }))
  const odd = recorder(() => new Response('hello', { status: 200 }))
  for (const { fetcher } of [down, html, odd]) {
    const res = await handleTokenRequest(post({ code: 'abc' }), env, fetcher)
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ ok: false, problem: 'busy' })
  }
})

test('the secret is in no response body and no thrown message', async () => {
  const bodies: string[] = []
  for (const reply of [
    { access_token: 'ghu_1' },
    { error: 'bad_verification_code', client_secret: 'secret' },
  ]) {
    const res = await handleTokenRequest(post({ code: 'abc' }), env, github(reply).fetcher)
    bodies.push(await res.text())
  }
  const failing = recorder(() => {
    throw new Error('could not reach https://github.com with secret')
  })
  bodies.push(await (await handleTokenRequest(post({ code: 'abc' }), env, failing.fetcher)).text())
  for (const text of bodies) expect(text).not.toContain('secret')
})

test('every answer is JSON, never cached, and not sniffed', () => {
  const res = answer({ ok: true, value: 1 })
  expect(res.headers.get('content-type')).toContain('application/json')
  expect(res.headers.get('cache-control')).toBe('no-store')
  expect(res.headers.get('x-content-type-options')).toBe('nosniff')
})

test('each problem has the status the plan gives it', () => {
  const expected: Record<Exclude<ProblemKind, 'offline'>, number> = {
    'signed-out': 401,
    'not-allowed': 403,
    'own-change': 403,
    blocked: 403,
    'not-found': 404,
    'not-a-game': 404,
    'changed-elsewhere': 409,
    'not-ready': 409,
    'checks-failed': 409,
    clashes: 409,
    broken: 422,
    'bad-request': 422,
    'not-set-up': 500,
    unknown: 500,
    busy: 503,
  }
  for (const [problem, status] of Object.entries(expected)) {
    expect(STATUS[problem as ProblemKind], problem).toBe(status)
    expect(answer({ ok: false, problem: problem as ProblemKind }).status, problem).toBe(status)
  }
})

test('details travel with a problem', async () => {
  const res = answer({ ok: false, problem: 'broken', details: ['a', 'b'] })
  expect(await res.json()).toEqual({ ok: false, problem: 'broken', details: ['a', 'b'] })
})

test("sameOrigin: a POST must carry its own Origin; a GET may carry none, but never another site's", () => {
  const at = (method: string, origin?: string) =>
    new Request('https://editors.example/api/game', { method, headers: origin ? { origin } : {} })
  expect(sameOrigin(at('POST', 'https://editors.example'))).toBe(true)
  expect(sameOrigin(at('POST'))).toBe(false)
  expect(sameOrigin(at('POST', 'https://evil.example'))).toBe(false)
  expect(sameOrigin(at('GET'))).toBe(true)
  expect(sameOrigin(at('GET', 'https://editors.example'))).toBe(true)
  expect(sameOrigin(at('GET', 'https://evil.example'))).toBe(false)
})
