import { afterAll, beforeAll, beforeEach, expect, test } from 'vitest'
import { writeAccess } from '#src/features/access/access.ts'
import type { Answer, OpenAnswer } from '#src/features/wire/wire.ts'
import { DEMO, startTestApi, type TestApi } from '../../fixtures/api.ts'
import { blobSha } from '../../fixtures/fake-github/repos.ts'
import { fixtureFiles, LEVEL_PATH } from '../../fixtures/game/read.ts'

let api: TestApi
beforeAll(async () => {
  api = await startTestApi()
})
afterAll(() => api.close())
beforeEach(() => api.fake.reset())

const GAME = '/api/game?owner=grandma&name=crate-game'
const OTHER = '/api/game?owner=grandma&name=other-game'
const crate = () => api.fake.repos.get('grandma/crate-game')!
const opened = async (person: Parameters<TestApi['call']>[0], path = GAME): Promise<OpenAnswer> => {
  const res = await api.call<OpenAnswer>(person, 'GET', path)
  if (!res.answer.ok) throw new Error(`not opened: ${res.answer.problem}`)
  return res.answer.value
}
const problem = (r: { answer: Answer<unknown> }): string | undefined =>
  r.answer.ok ? undefined : r.answer.problem

test('a visitor opens the demo game: look, no login, from main, the same files grandma gets', async () => {
  const visitor = await opened('visitor')
  const grandma = await opened('grandma')
  expect(visitor).toMatchObject({
    game: { owner: 'grandma', name: 'crate-game' },
    login: undefined,
    level: 'look',
    branch: 'main',
    mine: undefined,
    waiting: 0,
  })
  expect(visitor.files).toEqual(grandma.files)
})

test('a visitor gets look even where everyone = "suggest"', async () => {
  crate().put('main', 'automata.access.toml', writeAccess({ format: 1, everyone: 'suggest', people: [] }))
  expect((await opened('visitor')).level).toBe('look')
})

test("a visitor sees none of kid's waiting change: main's files, mine undefined, waiting 0", async () => {
  crate().addPull('automata/kid')
  crate().put('automata/kid', LEVEL_PATH, '{"changed":true}\n')
  const visitor = await opened('visitor')
  expect(visitor).toMatchObject({ branch: 'main', mine: undefined, waiting: 0 })
  expect(visitor.files.find((f) => f.path === LEVEL_PATH)?.text).toBe(fixtureFiles[LEVEL_PATH])
})

test('a visitor is told not-found for a second public game, a private demo game, a demo game with no editor, and every game when no demo is set', async () => {
  expect(problem(await api.call('visitor', 'GET', OTHER))).toBe('not-found')
  // Whatever the other game's sharing file says.
  api.fake.repos
    .get('grandma/other-game')!
    .put('main', 'automata.access.toml', writeAccess({ format: 1, everyone: 'look', people: [] }))
  expect(problem(await api.call('visitor', 'GET', OTHER))).toBe('not-found')
  crate().isPublic = false
  expect(problem(await api.call('visitor', 'GET', GAME))).toBe('not-found')
  crate().isPublic = true
  crate().installed = false
  expect(problem(await api.call('visitor', 'GET', GAME))).toBe('not-found')
  crate().installed = true
  const none = await startTestApi({ DEMO_GAME: undefined })
  try {
    expect(problem(await none.call('visitor', 'GET', GAME))).toBe('not-found')
    expect(none.fake.log).toEqual([])
  } finally {
    await none.close()
  }
})

test('a visitor to a game that is not the demo game costs GitHub nothing', async () => {
  await api.call('visitor', 'GET', OTHER)
  expect(api.fake.log).toEqual([])
})

test('the demo game opens whatever its sharing file says, even a broken one', async () => {
  crate().put('main', 'automata.access.toml', '= = =')
  expect((await opened('visitor')).level).toBe('look')
})

test('a visitor is told busy when less than a quarter of the allowance is left, and signed-in people are not', async () => {
  api.fake.rate = { remaining: 1000, limit: 5000 }
  const visitor = await api.call('visitor', 'GET', GAME)
  expect([visitor.status, problem(visitor)]).toEqual([503, 'busy'])
  expect((await opened('grandma')).level).toBe('owner')
  api.fake.rate = { remaining: 1300, limit: 5000 }
  expect((await opened('visitor')).level).toBe('look')
})

test('grandma opens her game: owner, from main, with automata.toml and its three files', async () => {
  const game = await opened('grandma')
  expect(game).toMatchObject({
    login: 'grandma',
    level: 'owner',
    branch: 'main',
    mine: undefined,
    waiting: 0,
  })
  expect(game.files.map((f) => f.path)).toEqual(Object.keys(fixtureFiles))
})

test("each file's text and version are GitHub's", async () => {
  const game = await opened('grandma')
  for (const file of game.files) {
    expect(file.text).toBe(fixtureFiles[file.path])
    expect(file.version).toBe(blobSha(file.text))
  }
})

test('kid has a change waiting: the files come from automata/kid, and mine names it', async () => {
  crate().addPull('automata/kid', "Kid's change")
  crate().put('automata/kid', LEVEL_PATH, '{"moved":1}\n')
  crate().put(
    'main',
    'automata.access.toml',
    writeAccess({ format: 1, everyone: 'look', people: [{ github: 'kid', level: 'suggest' }] }),
  )
  const game = await opened('kid')
  expect(game.branch).toBe('automata/kid')
  expect(game.mine).toEqual({ number: 1, title: "Kid's change", by: 'kid', mine: true, checks: 'passing' })
  expect(game.waiting).toBe(1)
  expect(game.files.find((f) => f.path === LEVEL_PATH)?.text).toBe('{"moved":1}\n')
})

test('grandpa sees the same game from main, and waiting is 1', async () => {
  crate().addPull('automata/kid')
  crate().put('automata/kid', LEVEL_PATH, '{"moved":1}\n')
  crate().put('main', 'automata.access.toml', writeAccess({ format: 1, everyone: 'look', people: [] }))
  const game = await opened('grandpa')
  expect(game).toMatchObject({ branch: 'main', mine: undefined, waiting: 1 })
  expect(game.files.find((f) => f.path === LEVEL_PATH)?.text).toBe(fixtureFiles[LEVEL_PATH])
})

test('a pull from a fork, or from a branch the editor did not make, does not count as waiting', async () => {
  crate().addForkPull('automata/kid', 'kid/crate-game')
  crate().addPull('someone-elses-work')
  expect((await opened('grandma')).waiting).toBe(0)
})

test('a repo with no automata.toml is not-a-game', async () => {
  const res = await api.call('grandma', 'GET', '/api/game?owner=grandma&name=not-a-game')
  expect([res.status, problem(res)]).toEqual([404, 'not-a-game'])
})

test('a level file that is not JSON is still sent, as it is', async () => {
  crate().put('main', LEVEL_PATH, 'not json {')
  const game = await opened('grandma')
  expect(game.files.find((f) => f.path === LEVEL_PATH)?.text).toBe('not json {')
})

test('a project file that will not parse is still sent, with nothing else', async () => {
  crate().put('main', 'automata.toml', 'this is = = not toml')
  const game = await opened('grandma')
  expect(game.files.map((f) => f.path)).toEqual(['automata.toml'])
})

test('a file the project lists but the repo lacks is left out', async () => {
  crate().branches.get('main')!.delete('content/characters/crate.json')
  const game = await opened('grandma')
  expect(game.files.map((f) => f.path)).not.toContain('content/characters/crate.json')
})

test('/api/games lists what the person can reach that has the editor, and nothing else', async () => {
  const mine = await api.call<readonly { owner: string; name: string }[]>('grandma', 'GET', '/api/games')
  expect(mine.answer).toEqual({
    ok: true,
    value: expect.arrayContaining([
      { owner: 'grandma', name: 'crate-game' },
      { owner: 'grandma', name: 'other-game' },
    ]),
  })
  crate().installed = false
  const without = await api.call<readonly { name: string }[]>('grandma', 'GET', '/api/games')
  expect(without.answer.ok && without.answer.value.map((g) => g.name)).not.toContain('crate-game')
  const none = await api.call('stranger', 'GET', '/api/games')
  expect(none.answer).toEqual({ ok: true, value: [] })
})

test('the demo game is the one named in the setting', () => {
  expect(DEMO).toBe('grandma/crate-game')
})
