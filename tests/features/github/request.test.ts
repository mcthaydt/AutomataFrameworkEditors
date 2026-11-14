import { expect, test } from 'vitest'
import { type Reply, send } from '#src/features/github/github.ts'
import type { Answer } from '#src/features/wire/wire.ts'
import { json, recorder } from '../../fixtures/fetcher.ts'

const env = { GITHUB_API_URL: 'http://fake.test' }
const as = { kind: 'installation', token: 'ghs_1' } as const
const get = (handler: Parameters<typeof recorder>[0], extra: Partial<Parameters<typeof send>[1]> = {}) => {
  const { fetcher, calls } = recorder(handler)
  const result = send({ env, fetcher }, { method: 'GET', path: '/repos/o/n', as, ...extra })
  return { result, calls }
}
const problem = (answer: Answer<Reply>): string => (answer.ok ? 'ok' : answer.problem)

test('every call carries the two headers GitHub asks for, and the token it is sent as', async () => {
  const { result, calls } = get(() => json({ a: 1 }))
  expect(await result).toMatchObject({ ok: true, value: { status: 200, body: { a: 1 } } })
  expect(calls[0]?.url).toBe('http://fake.test/repos/o/n')
  expect(calls[0]?.headers.get('accept')).toBe('application/vnd.github+json')
  expect(calls[0]?.headers.get('x-github-api-version')).toBe('2022-11-28')
  expect(calls[0]?.headers.get('authorization')).toBe('Bearer ghs_1')
})

test('a query and a JSON body are sent as asked', async () => {
  const { result, calls } = get(() => json({}), {
    method: 'POST',
    query: { per_page: '100', state: 'open' },
    body: { a: 1 },
  })
  await result
  expect(calls[0]?.url).toBe('http://fake.test/repos/o/n?per_page=100&state=open')
  expect(calls[0]?.method).toBe('POST')
  expect(calls[0]?.body).toEqual({ a: 1 })
})

test('a request that throws, and any 5xx, is busy', async () => {
  const down = get(() => {
    throw new Error('reset')
  })
  expect(problem(await down.result)).toBe('busy')
  for (const status of [500, 502, 503]) expect(problem(await get(() => json({}, status)).result)).toBe('busy')
})

test("401 is not-set-up for the App's own tokens and signed-out for a person's", async () => {
  expect(problem(await get(() => json({}, 401), { as: { kind: 'app', token: 'jwt' } }).result)).toBe(
    'not-set-up',
  )
  expect(problem(await get(() => json({}, 401)).result)).toBe('not-set-up')
  expect(problem(await get(() => json({}, 401), { as: { kind: 'person', token: 'ghu' } }).result)).toBe(
    'signed-out',
  )
})

test('404 is not-found', async () => expect(problem(await get(() => json({}, 404)).result)).toBe('not-found'))

test('429, or 403 with no allowance left or a retry-after, is busy', async () => {
  expect(problem(await get(() => json({}, 429)).result)).toBe('busy')
  expect(problem(await get(() => json({}, 403, { 'x-ratelimit-remaining': '0' })).result)).toBe('busy')
  expect(problem(await get(() => json({}, 403, { 'retry-after': '30' })).result)).toBe('busy')
})

test('any other 403 is blocked', async () =>
  expect(problem(await get(() => json({}, 403, { 'x-ratelimit-remaining': '4000' })).result)).toBe('blocked'))

test('anything else unexpected is unknown', async () => {
  expect(problem(await get(() => json({}, 418)).result)).toBe('unknown')
  expect(problem(await get(() => json({}, 301)).result)).toBe('unknown')
})

test('a status the caller expects is handed back, not turned into a problem', async () => {
  const result = await get(() => json({ message: 'sha' }, 409), { pass: [409] }).result
  expect(result).toMatchObject({ ok: true, value: { status: 409, body: { message: 'sha' } } })
})

test('an empty answer has no body', async () => {
  const result = await get(() => new Response(null, { status: 204 })).result
  expect(result).toMatchObject({ ok: true, value: { status: 204, body: undefined } })
})

test('the allowance is read from every answer that says it', async () => {
  const rate: { remaining?: number; limit?: number } = {}
  const { fetcher } = recorder(() =>
    json({}, 200, { 'x-ratelimit-remaining': '1200', 'x-ratelimit-limit': '5000' }),
  )
  await send({ env, fetcher }, { method: 'GET', path: '/x', as }, rate)
  expect(rate).toEqual({ remaining: 1200, limit: 5000 })
})

test('no token and no body appears in a problem', async () => {
  const result = await get(() => json({ message: 'ghs_1 is bad' }, 418)).result
  expect(JSON.stringify(result)).not.toContain('ghs_1')
})
