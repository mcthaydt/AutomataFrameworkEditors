import { afterAll, beforeAll, beforeEach, expect, test } from 'vitest'
import { writeAccess } from '#src/features/access/access.ts'
import type { Answer, HistoryPage } from '#src/features/wire/wire.ts'
import { LINKS, startTestApi, type TestApi } from '../../fixtures/api.ts'
import { type FakeRepo, nextSha } from '../../fixtures/fake-github/repos.ts'

let api: TestApi
beforeAll(async () => {
  api = await startTestApi()
})
afterAll(() => api.close())
beforeEach(() => {
  api.fake.reset()
  repo().put(
    'main',
    'automata.access.toml',
    writeAccess({ format: 1, everyone: 'look', people: [{ github: 'kid', level: 'suggest' }] }),
  )
})

const repo = (): FakeRepo => api.fake.repos.get(LINKS)!
const ROOM_1 = 'content/levels/room-1.json'
const ROOM_2 = 'content/levels/room-2.json'
const WORLD = 'content/worlds/world.json'
const HERO = 'content/characters/hero.json'
const T0 = Date.UTC(2026, 10, 16, 9, 0, 0)

/** A commit on `main`, as if someone saved through the API, made `minute` minutes after T0. */
function commit(minute: number, author: string, message: string, paths: readonly string[]): string {
  const sha = nextSha(`history:${minute}:${message}`)
  const files = paths.map((path) => ({ path, text: '{}\n' }))
  repo().commits.push({
    sha,
    branch: 'main',
    message,
    path: paths[0] ?? '',
    text: '{}\n',
    author,
    files,
  })
  repo().commitDates.set(sha, T0 + minute * 60_000)
  return sha
}
/** `count` commits, the oldest first, each moving a room. */
const many = (count: number): void => {
  for (let i = 0; i < count; i++) commit(i, i % 2 === 0 ? 'grandma' : 'kid', `Move a thing ${i}`, [ROOM_1])
}
const history = (person: Parameters<TestApi['call']>[0], page: string | number = 0) =>
  api.call<HistoryPage>(person, 'GET', `/api/history?owner=grandma&name=links-game&page=${page}`)
const lines = async (page: number) => {
  const res = await history('kid', page)
  if (!res.answer.ok) throw new Error(`no history: ${res.answer.problem}`)
  return res.answer.value
}
const problem = (r: { answer: Answer<unknown> }): string | undefined =>
  r.answer.ok ? undefined : r.answer.problem
const COMMITS = /\/repos\/grandma\/links-game\/commits(\/[^/]+)?$/
/** The calls a page of history cost: the one list and each commit's paths. */
const commitCalls = (): number => {
  const asked = api.fake.log.filter((r) => r.method === 'GET' && COMMITS.test(r.path))
  return asked.length
}

test('a page is ten commits, newest first, with who, when and their own words', async () => {
  many(12)
  const page = await lines(0)
  expect(page.lines).toHaveLength(10)
  expect(page.lines.map((l) => l.words)).toEqual(
    Array.from({ length: 10 }, (_, i) => `Move a thing ${11 - i}`),
  )
  expect(page.lines[0]).toMatchObject({ by: 'kid', at: T0 + 11 * 60_000 })
  expect(page.more).toBe(true)
  expect(page.lines[0]?.commit).toMatch(/^[0-9a-f]{40}$/)
})

test('the second page holds the older ones, and has no more', async () => {
  many(12)
  const page = await lines(1)
  expect(page.lines.map((l) => l.words)).toEqual(['Move a thing 1', 'Move a thing 0'])
  expect(page.more).toBe(false)
})

test('page 0 makes one list call and ten calls for what each commit touched, eleven in all', async () => {
  many(30)
  const before = commitCalls()
  await lines(0)
  expect(commitCalls() - before).toBe(11)
})

test('a commit names the levels it touched from their paths, and says when it touched the world file', async () => {
  commit(1, 'grandma', 'Level and map', [ROOM_1, ROOM_2, WORLD])
  commit(2, 'grandma', 'Only a room', [ROOM_2])
  commit(3, 'grandma', 'Only the map', [WORLD])
  const page = await lines(0)
  const by = (words: string) => page.lines.find((l) => l.words === words)
  expect(by('Level and map')).toMatchObject({ levels: ['room-1', 'room-2'], map: true })
  expect(by('Only a room')).toMatchObject({ levels: ['room-2'], map: false })
  expect(by('Only the map')).toMatchObject({ levels: [], map: true })
})

test('a commit that touched only other content has no levels and no map, and shows its own words', async () => {
  commit(1, 'kid', 'Make the hero faster', [HERO])
  const [line] = (await lines(0)).lines
  expect(line).toMatchObject({ words: 'Make the hero faster', levels: [], map: false })
})

test("only the first line of a commit's message is its words", async () => {
  commit(1, 'kid', 'Moved a crate\n\nMade with Automata Editors by kid.', [ROOM_1])
  expect((await lines(0)).lines[0]?.words).toBe('Moved a crate')
})

test('commits that touched nothing under content are left out of the history', async () => {
  commit(1, 'grandma', 'Change who can help', ['automata.access.toml'])
  commit(2, 'grandma', 'A level', [ROOM_1])
  expect((await lines(0)).lines.map((l) => l.words)).toEqual(['A level'])
})

test('page 4 is the last: 45 commits give it five lines, and 50 give it ten, neither with more', async () => {
  many(45)
  const last = await lines(4)
  expect(last.lines).toHaveLength(5)
  expect(last.more).toBe(false)
  expect((await lines(3)).more).toBe(true)
  repo().commits.length = 0
  many(60)
  const full = await lines(4)
  expect(full.lines).toHaveLength(10)
  expect(full.more).toBe(false)
})

test('a page past the fifth, and a page that is not a whole number, are bad-request', async () => {
  many(3)
  expect(problem(await history('kid', 5))).toBe('bad-request')
  expect(problem(await history('kid', -1))).toBe('bad-request')
  expect(problem(await history('kid', '1.5'))).toBe('bad-request')
  expect(problem(await history('kid', 'two'))).toBe('bad-request')
})

test('a person who may only look can read it, and someone with no access cannot', async () => {
  many(2)
  expect((await history('stranger', 0)).answer.ok).toBe(true)
  repo().put('main', 'automata.access.toml', writeAccess({ format: 1, everyone: 'nothing', people: [] }))
  expect(problem(await history('stranger', 0))).toBe('not-found')
})

test('a visitor reads the demo game only; any other game is not-found', async () => {
  const res = await api.call<HistoryPage>(
    'visitor',
    'GET',
    '/api/history?owner=grandma&name=crate-game&page=0',
  )
  expect(res.answer.ok).toBe(true)
  expect(problem(await history('visitor', 0))).toBe('not-found')
})
