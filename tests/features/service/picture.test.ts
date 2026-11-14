import { afterAll, afterEach, beforeAll, beforeEach, expect, test } from 'vitest'
import { handleApi } from '#src/features/service/service.ts'
import type { WirePicture } from '#src/features/wire/wire.ts'
import { bytesFromBase64 } from '#src/lib/base64.ts'
import { startTestApi, type TestApi } from '../../fixtures/api.ts'
import { fixturePictures } from '../../fixtures/game/pictures.ts'

let api: TestApi
beforeAll(async () => {
  api = await startTestApi()
})
afterAll(() => api.close())
beforeEach(() => api.fake.reset())
afterEach(() => {
  delete (globalThis as { caches?: unknown }).caches
})

const HERO = 'content/figures/hero.png'
const ask = (path: string, over: { name?: string; branch?: string } = {}): string =>
  `/api/picture?owner=grandma&name=${over.name ?? 'crate-game'}&branch=${over.branch ?? 'main'}&path=${path}`
/** How many times the pretend GitHub was asked for the file itself. */
const asked = (path: string): number =>
  api.fake.log.filter((r) => r.path.endsWith(`/contents/${path}`)).length
const problem = (r: { answer: { ok: boolean } }): string | undefined =>
  r.answer.ok ? undefined : (r.answer as unknown as { problem: string }).problem

test('the fixture game has the picture these tests read', async () => {
  expect(Object.keys(await fixturePictures())).toContain(HERO)
})

test('a visitor reads a picture of the demo game on its default branch, in the bytes the game has', async () => {
  const res = await api.call<WirePicture>('visitor', 'GET', ask(HERO))
  expect(res.status).toBe(200)
  if (!res.answer.ok) throw new Error(res.answer.problem)
  expect(res.answer.value.path).toBe(HERO)
  expect(bytesFromBase64(res.answer.value.base64)).toEqual((await fixturePictures())[HERO])
  expect(asked(HERO)).toBe(1)
})

test('a visitor asking for any other game is told not-found', async () => {
  expect(problem(await api.call('visitor', 'GET', ask(HERO, { name: 'other-game' })))).toBe('not-found')
  expect(asked(HERO)).toBe(0)
})

test.each([
  ['a path that climbs out of the folder', '../secret.png'],
  ['code', 'src/main.ts'],
  ['a content file that is not a picture', 'content/a.json'],
  ['a picture hidden in a climbing path', 'content/../../secret.png'],
])('%s is a bad request, and GitHub is not asked', async (_what, path) => {
  const res = await api.call('visitor', 'GET', ask(path))
  expect(problem(res)).toBe('bad-request')
  expect(res.status).toBe(400)
  expect(asked(path)).toBe(0)
})

test('no branch is a bad request', async () => {
  expect(problem(await api.call('visitor', 'GET', ask(HERO, { branch: '' })))).toBe('bad-request')
})

test('a branch that is no open waiting change is not-found, for a visitor and for grandma', async () => {
  expect(problem(await api.call('visitor', 'GET', ask(HERO, { branch: 'automata/kid' })))).toBe('not-found')
  expect(problem(await api.call('grandma', 'GET', ask(HERO, { branch: 'automata/kid' })))).toBe('not-found')
})

test('a signed-in person reads a picture from a waiting change, and a visitor still cannot', async () => {
  const repo = api.fake.repos.get('grandma/crate-game')
  if (repo === undefined) throw new Error('no crate-game')
  repo.addPull('automata/kid')
  expect((await api.call('grandma', 'GET', ask(HERO, { branch: 'automata/kid' }))).answer.ok).toBe(true)
  expect(problem(await api.call('visitor', 'GET', ask(HERO, { branch: 'automata/kid' })))).toBe('not-found')
})

test('a picture that is not in the game is not-found', async () => {
  expect(problem(await api.call('visitor', 'GET', ask('content/figures/nothing.png')))).toBe('not-found')
})

test('a post is a bad request, not a picture', async () => {
  expect(problem(await api.call('grandma', 'POST', ask(HERO), {}))).toBe('bad-request')
})

test('a good answer may be kept by the person’s own browser for five minutes, and a bad one is never kept', async () => {
  const good = await fetchAsApi(ask(HERO))
  expect(good.headers.get('cache-control')).toBe('private, max-age=300')
  expect(good.headers.get('x-content-type-options')).toBe('nosniff')
  const bad = await fetchAsApi(ask('content/a.json'))
  expect(bad.headers.get('cache-control')).toBe('no-store')
})

test('with Cloudflare’s cache, a second visitor’s ask for the same demo picture does not reach GitHub', async () => {
  const kept = new Map<string, Response>()
  ;(globalThis as { caches?: unknown }).caches = {
    default: {
      match: async (request: Request) => kept.get(request.url)?.clone(),
      put: async (request: Request, response: Response) => {
        kept.set(request.url, response)
      },
    },
  }
  const first = await api.call<WirePicture>('visitor', 'GET', ask(HERO))
  const before = asked(HERO)
  const second = await api.call<WirePicture>('visitor', 'GET', ask(HERO))
  expect(before).toBe(1)
  expect(asked(HERO)).toBe(1)
  expect(second.answer).toEqual(first.answer)
  expect([...kept.values()][0]?.headers.get('cache-control')).toBe('public, max-age=300')
})

test('what a signed-in person reads is never put in the shared cache', async () => {
  const kept = new Map<string, Response>()
  ;(globalThis as { caches?: unknown }).caches = {
    default: {
      match: async (request: Request) => kept.get(request.url)?.clone(),
      put: async (request: Request, response: Response) => {
        kept.set(request.url, response)
      },
    },
  }
  await api.call('grandma', 'GET', ask(HERO))
  expect(kept.size).toBe(0)
})

/** The raw response, for the headers `call` does not give back. */
async function fetchAsApi(path: string): Promise<Response> {
  return handleApi(new Request(`https://editors.test${path}`), {
    ...api.fake.env,
    DEMO_GAME: 'grandma/crate-game',
  })
}
