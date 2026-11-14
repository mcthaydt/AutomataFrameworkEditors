import { afterAll, beforeAll, beforeEach, expect, test } from 'vitest'
import { writeAccess } from '#src/features/access/access.ts'
import type { Answer, OpenAnswer } from '#src/features/wire/wire.ts'
import { SITE, startTestApi, type TestApi } from '../../fixtures/api.ts'

let api: TestApi
beforeAll(async () => {
  api = await startTestApi()
})
afterAll(() => api.close())
beforeEach(() => api.fake.reset())

const GAME = '/api/game?owner=grandma&name=crate-game'
const crate = () => api.fake.repos.get('grandma/crate-game')!
const problem = (r: { answer: Answer<unknown> }): string | undefined =>
  r.answer.ok ? undefined : r.answer.problem

test('a call from another origin is refused before GitHub is asked anything', async () => {
  const post = await api.raw('POST', '/api/save', { headers: { origin: 'https://evil.test' } })
  const get = await api.raw('GET', GAME, { headers: { origin: 'https://evil.test' } })
  expect([problem(post), problem(get)]).toEqual(['not-allowed', 'not-allowed'])
  expect(api.fake.log).toEqual([])
})

test('a GET with no Origin and a good token opens the game, as the real page sends it', async () => {
  const res = await api.raw<OpenAnswer>('GET', GAME, {
    headers: { authorization: `Bearer ${api.fake.tokenFor('grandma')}` },
  })
  expect(res.status).toBe(200)
  expect(res.answer.ok).toBe(true)
})

test("a GET carrying the site's own Origin works too", async () => {
  const res = await api.raw('GET', GAME, {
    headers: { origin: SITE, authorization: `Bearer ${api.fake.tokenFor('grandma')}` },
  })
  expect(res.answer.ok).toBe(true)
})

test('an empty token, a made-up token, and a token from before signedOutEverywhere() are all signed-out, on every route', async () => {
  const old = api.fake.tokenFor('grandma')
  api.fake.signedOutEverywhere()
  for (const authorization of ['Bearer ', 'Bearer', 'Bearer made-up', `Bearer ${old}`, 'Basic abc']) {
    for (const path of [GAME, '/api/games']) {
      const res = await api.raw('GET', path, { headers: { authorization } })
      expect([authorization, res.status, problem(res)]).toEqual([authorization, 401, 'signed-out'])
    }
  }
})

test('with no token, GET /api/games is signed-out and GitHub is asked nothing', async () => {
  const res = await api.call('visitor', 'GET', '/api/games')
  expect([res.status, problem(res)]).toEqual([401, 'signed-out'])
  expect(api.fake.log).toEqual([])
})

test('a real GitHub token that this App did not make is signed-out', async () => {
  // GitHub knows the token, but it was not made by this App's sign-in: the applications/{id}/token check says 404.
  const res = await api.raw('GET', GAME, { headers: { authorization: 'Bearer gho_made_by_another_app' } })
  expect(problem(res)).toBe('signed-out')
})

test('the level comes from the sharing file on main, never from the request', async () => {
  const ask = { headers: { authorization: `Bearer ${api.fake.tokenFor('kid')}`, 'x-level': 'owner' } }
  // No sharing file on a public game: everyone may look, so kid is at look, whatever the request says.
  expect(await api.raw<OpenAnswer>('GET', `${GAME}&level=owner`, ask)).toMatchObject({
    answer: { ok: true, value: { level: 'look' } },
  })
  crate().put('main', 'automata.access.toml', writeAccess({ format: 1, everyone: 'nothing', people: [] }))
  expect((await api.raw<OpenAnswer>('GET', `${GAME}&level=owner`, ask)).answer).toMatchObject({
    ok: false,
    problem: 'not-found',
  })
})

test("a sharing file on a suggestion branch changes nobody's level", async () => {
  crate().addPull('automata/kid')
  crate().put(
    'automata/kid',
    'automata.access.toml',
    writeAccess({ format: 1, everyone: 'look', people: [{ github: 'kid', level: 'owner' }] }),
  )
  crate().put('main', 'automata.access.toml', writeAccess({ format: 1, everyone: 'look', people: [] }))
  const res = await api.call<OpenAnswer>('kid', 'GET', GAME)
  expect(res.answer).toMatchObject({ ok: true, value: { level: 'look' } })
})

test('a broken sharing file lets only the repo owner in', async () => {
  crate().put('main', 'automata.access.toml', 'this is = = not toml')
  const owner = await api.call<OpenAnswer>('grandma', 'GET', GAME)
  expect(owner.answer).toMatchObject({ ok: true, value: { level: 'owner' } })
  const other = await api.call('grandpa', 'GET', GAME)
  expect([other.status, problem(other)]).toEqual([404, 'not-found'])
})

test('a private game with no sharing file is not-found for a stranger, and open for its owner', async () => {
  crate().isPublic = false
  expect(problem(await api.call('stranger', 'GET', GAME))).toBe('not-found')
  expect((await api.call('grandma', 'GET', GAME)).answer.ok).toBe(true)
})

test('a game the editor was never added to is not-found', async () => {
  crate().installed = false
  const res = await api.call('grandma', 'GET', GAME)
  expect([res.status, problem(res)]).toEqual([404, 'not-found'])
})

test('names with a slash or a space are bad-request', async () => {
  for (const query of [
    'owner=gran%2Fdma&name=crate-game',
    'owner=grandma&name=crate%20game',
    'owner=&name=x',
    'name=x',
  ]) {
    const res = await api.call('grandma', 'GET', `/api/game?${query}`)
    expect([query, problem(res)]).toEqual([query, 'bad-request'])
  }
})

test('GitHub down is busy', async () => {
  const token = api.fake.tokenFor('grandma')
  api.fake.down = true
  const res = await api.raw('GET', GAME, { headers: { authorization: `Bearer ${token}` } })
  expect([res.status, problem(res)]).toEqual([503, 'busy'])
})

test("an organisation's game: its GitHub admins are Owners, and everyone else gets what the file says", async () => {
  crate().ownerType = 'Organization'
  crate().admins.add('grandpa')
  crate().put('main', 'automata.access.toml', writeAccess({ format: 1, everyone: 'look', people: [] }))
  expect(await api.call<OpenAnswer>('grandpa', 'GET', GAME)).toMatchObject({
    answer: { ok: true, value: { level: 'owner' } },
  })
  expect(await api.call<OpenAnswer>('kid', 'GET', GAME)).toMatchObject({
    answer: { ok: true, value: { level: 'look' } },
  })
})

test("an organisation's admins still get in when its sharing file is broken", async () => {
  crate().ownerType = 'Organization'
  crate().admins.add('grandpa')
  crate().put('main', 'automata.access.toml', '= = =')
  expect(await api.call<OpenAnswer>('grandpa', 'GET', GAME)).toMatchObject({
    answer: { ok: true, value: { level: 'owner' } },
  })
  expect(problem(await api.call('kid', 'GET', GAME))).toBe('not-found')
})
