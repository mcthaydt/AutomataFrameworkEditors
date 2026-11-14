import { expect, test } from 'vitest'
import { type Auth, createApi, swapTokens } from '#src/features/api/api.ts'
import type { ProblemKind } from '#src/features/wire/wire.ts'
import { type Handler, json, recorder as record } from '../../fixtures/fetcher.ts'

/** The page's calls are to its own address, written without one; Node needs a whole address to build a Request. */
const SITE = 'http://site.test'
function recorder(handler: Handler) {
  const inner = record(handler)
  const fetcher: typeof fetch = (input, init) => inner.fetcher(new URL(String(input), SITE), init)
  return { fetcher, calls: inner.calls }
}
const path = (url: string): string => url.replace(SITE, '')

const GAME = { owner: 'grandma', name: 'crate-game' }
const ok = (value: unknown) => json({ ok: true, value })

function auth(tokens: (string | undefined)[], renews: boolean[] = []): Auth & { renewed: number } {
  let at = 0
  const state = {
    renewed: 0,
    token: () => tokens[Math.min(at, tokens.length - 1)],
    renew: async () => {
      state.renewed++
      const worked = renews.shift() ?? false
      if (worked) at++
      return worked
    },
  }
  return state
}

test('each method is one call with its verb, path, query or body, and the Bearer header', async () => {
  const { fetcher, calls } = recorder(() => ok([]))
  const api = createApi(auth(['t1']), fetcher)
  await api.games()
  await api.open(GAME)
  await api.waiting(GAME)
  await api.change({ game: GAME, number: 3 })
  await api.sharing(GAME)
  const ask = { game: GAME, path: 'p', value: {}, version: 'v', message: 'm' }
  await api.save(ask)
  await api.approve({ game: GAME, number: 2 })
  await api.turnDown({ game: GAME, number: 2 })
  const sharing = {
    game: GAME,
    access: { format: 1 as const, everyone: 'look' as const, people: [] },
    version: undefined,
  }
  await api.share(sharing)
  expect(calls.map((c) => `${c.method} ${path(c.url)}`)).toEqual([
    'GET /api/games',
    'GET /api/game?owner=grandma&name=crate-game',
    'GET /api/waiting?owner=grandma&name=crate-game',
    'GET /api/change?owner=grandma&name=crate-game&number=3',
    'GET /api/sharing?owner=grandma&name=crate-game',
    'POST /api/save',
    'POST /api/approve',
    'POST /api/turn-down',
    'POST /api/sharing',
  ])
  for (const call of calls) expect(call.headers.get('authorization')).toBe('Bearer t1')
  expect(calls[5]?.body).toEqual(ask)
  expect(calls[6]?.body).toEqual({ game: GAME, number: 2 })
  expect(calls[8]?.body).toEqual(JSON.parse(JSON.stringify(sharing)))
})

test('with no token, open is sent with no Authorization header and every other method is signed-out, nothing sent', async () => {
  const { fetcher, calls } = recorder(() => ok({}))
  const api = createApi(auth([undefined]), fetcher)
  await api.open(GAME)
  expect(calls).toHaveLength(1)
  expect(calls[0]?.headers.has('authorization')).toBe(false)
  const others = [
    await api.games(),
    await api.save({ game: GAME, path: 'p', value: {}, version: 'v', message: 'm' }),
    await api.waiting(GAME),
    await api.change({ game: GAME, number: 1 }),
    await api.approve({ game: GAME, number: 1 }),
    await api.turnDown({ game: GAME, number: 1 }),
    await api.sharing(GAME),
    await api.share({ game: GAME, access: { format: 1, everyone: 'look', people: [] }, version: undefined }),
  ]
  for (const answer of others) expect(answer).toEqual({ ok: false, problem: 'signed-out' })
  expect(calls).toHaveLength(1)
})

test('a signed-out answer, then a renew that says yes, makes the call again with the new token', async () => {
  let n = 0
  const { fetcher, calls } = recorder(() =>
    n++ === 0 ? json({ ok: false, problem: 'signed-out' }, 401) : ok([GAME]),
  )
  const a = auth(['old', 'new'], [true])
  const answer = await createApi(a, fetcher).games()
  expect(answer).toEqual({ ok: true, value: [GAME] })
  expect(calls.map((c) => c.headers.get('authorization'))).toEqual(['Bearer old', 'Bearer new'])
  expect(a.renewed).toBe(1)
})

test('a second signed-out is final: no third call', async () => {
  const { fetcher, calls } = recorder(() => json({ ok: false, problem: 'signed-out' }, 401))
  const a = auth(['old', 'new'], [true])
  expect(await createApi(a, fetcher).games()).toEqual({ ok: false, problem: 'signed-out' })
  expect(calls).toHaveLength(2)
  expect(a.renewed).toBe(1)
})

test('a renew that says no ends it after one call', async () => {
  const { fetcher, calls } = recorder(() => json({ ok: false, problem: 'signed-out' }, 401))
  const a = auth(['old'], [false])
  expect(await createApi(a, fetcher).games()).toEqual({ ok: false, problem: 'signed-out' })
  expect(calls).toHaveLength(1)
})

test('a visitor whose open is refused is not asked to renew anything', async () => {
  const { fetcher } = recorder(() => json({ ok: false, problem: 'not-found' }, 404))
  const a = auth([undefined])
  expect(await createApi(a, fetcher).open(GAME)).toEqual({ ok: false, problem: 'not-found' })
  expect(a.renewed).toBe(0)
})

test('a request that throws is offline', async () => {
  const { fetcher } = recorder(() => {
    throw new TypeError('Failed to fetch')
  })
  expect(await createApi(auth(['t']), fetcher).games()).toEqual({ ok: false, problem: 'offline' })
})

test('HTML where JSON was expected, or JSON that is not an Answer, is unknown', async () => {
  for (const make of [
    () => new Response('<html>Oops</html>', { status: 502 }),
    () => json({ hello: 'world' }),
    () => json({ ok: false, problem: 'made-up' }),
    () => json({ ok: true }),
    () => json(null),
  ]) {
    const { fetcher } = recorder(make)
    expect(await createApi(auth(['t']), fetcher).games()).toEqual({ ok: false, problem: 'unknown' })
  }
})

test('a problem the API names is passed on as it is, with its details', async () => {
  const problem: ProblemKind = 'broken'
  const { fetcher } = recorder(() => json({ ok: false, problem, details: ['a', 'b'] }, 422))
  expect(
    await createApi(auth(['t']), fetcher).save({
      game: GAME,
      path: 'p',
      value: {},
      version: 'v',
      message: 'm',
    }),
  ).toEqual({
    ok: false,
    problem,
    details: ['a', 'b'],
  })
})

test('swapTokens posts the code or the refresh to /api/token and gives the tokens', async () => {
  const { fetcher, calls } = recorder(() => ok({ token: 'a', refresh: 'b' }))
  expect(await swapTokens({ code: 'c1' }, fetcher)).toEqual({ token: 'a', refresh: 'b' })
  expect(await swapTokens({ refresh: 'r1' }, fetcher)).toEqual({ token: 'a', refresh: 'b' })
  expect(calls.map((c) => [c.method, path(c.url), c.body])).toEqual([
    ['POST', '/api/token', { code: 'c1' }],
    ['POST', '/api/token', { refresh: 'r1' }],
  ])
  expect(calls[0]?.headers.has('authorization')).toBe(false)
})

test('swapTokens is undefined for a refusal, a throw, nonsense, or an empty token', async () => {
  for (const make of [
    () => json({ ok: false, problem: 'signed-out' }, 401),
    () => {
      throw new Error('offline')
    },
    () => new Response('nope'),
    () => ok({ token: '' }),
    () => ok({}),
  ]) {
    expect(await swapTokens({ code: 'x' }, recorder(make).fetcher)).toBeUndefined()
  }
})
