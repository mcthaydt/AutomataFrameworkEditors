import { afterAll, beforeAll, beforeEach, expect, test } from 'vitest'
import { handleApi } from '#src/features/service/service.ts'
import { SITE, startTestApi, type TestApi } from '../../fixtures/api.ts'

let api: TestApi
beforeAll(async () => {
  api = await startTestApi()
})
afterAll(() => api.close())
beforeEach(() => api.fake.reset())

test('an unknown route is 404 not-found; a wrong method is 422 bad-request', async () => {
  const unknown = await api.call('grandma', 'GET', '/api/nothing')
  expect([unknown.status, unknown.answer]).toEqual([404, { ok: false, problem: 'not-found' }])
  const wrong = await api.call('grandma', 'POST', '/api/games')
  expect([wrong.status, wrong.answer]).toEqual([422, { ok: false, problem: 'bad-request' }])
})

test('every answer is JSON with cache-control: no-store', async () => {
  const request = new Request(`${SITE}/api/games`, {
    headers: { authorization: `Bearer ${api.fake.tokenFor('grandma')}` },
  })
  for (const req of [request, new Request(`${SITE}/api/nothing`), new Request(`${SITE}/api/game`)]) {
    const res = await handleApi(req, { ...api.fake.env, DEMO_GAME: 'grandma/crate-game' })
    expect(res.headers.get('content-type')).toContain('application/json')
    expect(res.headers.get('cache-control')).toBe('no-store')
    await res.json()
  }
})

test('a thrown error inside a route is 500 unknown and its message is not in the body', async () => {
  // A request whose address cannot be read: nothing the routes catch, so it reaches the catch-all.
  const broken = {
    get url(): string {
      throw new Error('secret-in-the-message')
    },
  } as unknown as Request
  const res = await handleApi(broken, { ...api.fake.env })
  expect(res.status).toBe(500)
  const text = await res.text()
  expect(JSON.parse(text)).toEqual({ ok: false, problem: 'unknown' })
  expect(text).not.toContain('secret')
})

test('no answer, for any route and any person, contains a token, the secret or the key', async () => {
  const forbidden = [
    api.fake.env.GITHUB_CLIENT_SECRET ?? '',
    api.fake.env.GITHUB_APP_PRIVATE_KEY ?? '',
    'ghu_',
    'ghs_',
    'ghr_',
    'BEGIN',
  ]
  const crate = api.fake.repos.get('grandma/crate-game')!
  crate.addPull('automata/kid')
  for (const person of ['grandma', 'kid', 'visitor'] as const) {
    for (const path of [
      '/api/games',
      '/api/game?owner=grandma&name=crate-game',
      '/api/game?owner=grandma&name=other-game',
    ]) {
      const res = await api.call(person, 'GET', path)
      const text = JSON.stringify(res.answer)
      for (const bad of forbidden)
        expect([person, path, bad, text.includes(bad)]).toEqual([person, path, bad, false])
    }
  }
})
