import { writeContent } from '@automataframework/framework/headless'
import { afterAll, beforeAll, beforeEach, expect, test } from 'vitest'
import { writeAccess } from '#src/features/access/access.ts'
import type { Answer, SaveAnswer, SaveAsk } from '#src/features/wire/wire.ts'
import { WORDS } from '#src/features/words/words.ts'
import { startTestApi, type TestApi } from '../../fixtures/api.ts'
import { blobSha } from '../../fixtures/fake-github/repos.ts'
import { fixtureFiles, LEVEL_PATH } from '../../fixtures/game/read.ts'

let api: TestApi
beforeAll(async () => {
  api = await startTestApi()
})
afterAll(() => api.close())
beforeEach(() => {
  api.fake.reset()
  // grandpa approves, kid suggests, stranger edits; anyone else may look.
  repo().put(
    'main',
    'automata.access.toml',
    writeAccess({
      format: 1,
      everyone: 'look',
      people: [
        { github: 'grandpa', level: 'approve' },
        { github: 'kid', level: 'suggest' },
        { github: 'stranger', level: 'edit' },
      ],
    }),
  )
})

const repo = () => api.fake.repos.get('grandma/crate-game')!
const GAME = { owner: 'grandma', name: 'crate-game' }
const level = JSON.parse(fixtureFiles[LEVEL_PATH] ?? '{}')
const moved = { ...level, things: [{ ...level.things[0], x: 8.5, y: 7.5 }] }
const OPENED = blobSha(fixtureFiles[LEVEL_PATH] ?? '')
const ask = (over: Partial<SaveAsk> = {}): SaveAsk => ({
  game: GAME,
  path: LEVEL_PATH,
  value: moved,
  version: OPENED,
  message: 'Move crate-1 in level-1',
  ...over,
})
const save = (person: Parameters<TestApi['call']>[0], body: unknown) =>
  api.call<SaveAnswer>(person, 'POST', '/api/save', body)
const problem = (r: { answer: Answer<unknown> }): string | undefined =>
  r.answer.ok ? undefined : r.answer.problem
const main = () => repo().branches.get('main')!
const untouched = () => {
  expect(repo().commits).toEqual([])
  expect(repo().pulls).toEqual([])
  expect(main().get(LEVEL_PATH)).toBe(fixtureFiles[LEVEL_PATH])
}

test('kid (suggest) saves: one commit on automata/kid, one pull into main, main untouched', async () => {
  const { answer } = await save('kid', ask())
  expect(answer).toMatchObject({
    ok: true,
    value: { how: 'suggestion', mine: { number: 1, by: 'kid', mine: true } },
  })
  expect(repo().commits).toEqual([
    expect.objectContaining({
      branch: 'automata/kid',
      path: LEVEL_PATH,
      message: 'Move crate-1 in level-1',
      author: 'kid',
    }),
  ])
  expect(repo().commits[0]?.text).toBe(writeContent('level', moved))
  expect(repo().pulls).toEqual([
    { number: 1, title: 'Move crate-1 in level-1', head: 'automata/kid', base: 'main', state: 'open' },
  ])
  expect(main().get(LEVEL_PATH)).toBe(fixtureFiles[LEVEL_PATH])
})

test("the suggestion's pull says it was made with the App, by name", async () => {
  await save('kid', ask())
  expect(repo().pullFacts.get(1)?.body).toBe(`Made with ${WORDS.appOnGitHub} by kid.`)
  expect(repo().pullFacts.get(1)?.body).toBe('Made with Automata Framework Editors by kid.')
})

test('kid saves again: a second commit on the same branch, still one pull', async () => {
  const first = await save('kid', ask())
  if (!first.answer.ok) throw new Error(first.answer.problem)
  const again = { ...moved, things: [{ ...moved.things[0], x: 9.5 }] }
  const second = await save('kid', ask({ value: again, version: first.answer.value.version }))
  expect(second.answer).toMatchObject({ ok: true, value: { how: 'suggestion' } })
  expect(repo().commits.map((c) => c.branch)).toEqual(['automata/kid', 'automata/kid'])
  expect(repo().pulls).toHaveLength(1)
  expect(repo().branches.get('automata/kid')?.get(LEVEL_PATH)).toBe(writeContent('level', again))
})

test('grandma (owner) and an edit-level person save: one commit on main, no branch, no pull, how is direct', async () => {
  for (const person of ['grandma', 'stranger'] as const) {
    api.fake.reset()
    repo().put(
      'main',
      'automata.access.toml',
      writeAccess({ format: 1, everyone: 'look', people: [{ github: 'stranger', level: 'edit' }] }),
    )
    const { answer } = await save(person, ask())
    expect(answer).toMatchObject({ ok: true, value: { how: 'direct' } })
    expect(repo().commits).toEqual([expect.objectContaining({ branch: 'main', author: person })])
    expect([...repo().branches.keys()]).toEqual(['main'])
    expect(repo().pulls).toEqual([])
    expect(main().get(LEVEL_PATH)).toBe(writeContent('level', moved))
  }
})

test('an edit-level person with a change already waiting adds to it instead', async () => {
  repo().addPull('automata/stranger')
  const { answer } = await save('stranger', ask())
  expect(answer).toMatchObject({ ok: true, value: { how: 'suggestion', mine: { by: 'stranger' } } })
  expect(repo().commits.map((c) => c.branch)).toEqual(['automata/stranger'])
  expect(main().get(LEVEL_PATH)).toBe(fixtureFiles[LEVEL_PATH])
  expect(repo().pulls).toHaveLength(1)
})

test('grandpa (approve) saves: a suggestion, like kid', async () => {
  const { answer } = await save('grandpa', ask())
  expect(answer).toMatchObject({ ok: true, value: { how: 'suggestion', mine: { by: 'grandpa' } } })
  expect(main().get(LEVEL_PATH)).toBe(fixtureFiles[LEVEL_PATH])
})

test('a look-level person and a stranger are refused, and nothing is written', async () => {
  // Everyone may look; nobody at that level may save.
  repo().put('main', 'automata.access.toml', writeAccess({ format: 1, everyone: 'look', people: [] }))
  const kid = await save('kid', ask())
  expect([kid.status, problem(kid)]).toEqual([403, 'not-allowed'])
  repo().put('main', 'automata.access.toml', writeAccess({ format: 1, everyone: 'nothing', people: [] }))
  const stranger = await save('stranger', ask())
  expect([stranger.status, problem(stranger)]).toEqual([404, 'not-found'])
  expect(repo().commits).toEqual([])
  expect(repo().pulls).toEqual([])
  expect(main().get(LEVEL_PATH)).toBe(fixtureFiles[LEVEL_PATH])
})

test("the bytes written are the framework's, whatever order the keys came in", async () => {
  const shuffled = Object.fromEntries(Object.entries(moved).reverse())
  await save('grandma', ask({ value: shuffled }))
  expect(main().get(LEVEL_PATH)).toBe(writeContent('level', moved))
})

test.each([
  ['automata.toml'],
  ['automata.access.toml'],
  ['content/characters/crate.json'],
  ['.github/workflows/ci.yml'],
  ['content/levels/../../automata.access.toml'],
  ['content/levels/new-level.json'],
])('saving to %s is not-allowed and nothing is written', async (path) => {
  const owner = await save('grandma', ask({ path }))
  expect([owner.status, problem(owner)]).toEqual([403, 'not-allowed'])
  expect(repo().commits).toEqual([])
  expect(repo().pulls).toEqual([])
  expect([...repo().branches.keys()]).toEqual(['main'])
})

test("a level with a thing outside the map is broken, with the framework's sentence, and nothing is written", async () => {
  const off = { ...moved, things: [{ ...moved.things[0], x: 99, y: 7.5 }] }
  const res = await save('grandma', ask({ value: off }))
  expect([res.status, problem(res)]).toEqual([422, 'broken'])
  expect(res.answer.ok === false && (res.answer.details ?? []).length).toBeGreaterThan(0)
  expect(repo().commits).toEqual([])
})

test("a level whose id is not the file's name is broken", async () => {
  const res = await save('grandma', ask({ value: { ...moved, id: 'level-2' } }))
  expect(problem(res)).toBe('broken')
  expect(repo().commits).toEqual([])
})

test('a level that makes the game fail to load (a thing whose character is dragon) is broken, and nothing is written', async () => {
  const dragon = { ...moved, things: [{ ...moved.things[0], character: 'dragon' }] }
  const res = await save('grandma', ask({ value: dragon }))
  expect(problem(res)).toBe('broken')
  expect(JSON.stringify(res.answer)).toContain('dragon')
  untouched()
})

test('the level changed on main since it was opened: changed-elsewhere, no pull, their file untouched', async () => {
  const theirs = writeContent('level', { ...level, things: [{ ...level.things[0], x: 3.5 }] })
  repo().put('main', LEVEL_PATH, theirs)
  const res = await save('kid', ask())
  expect([res.status, problem(res)]).toEqual([409, 'changed-elsewhere'])
  expect(repo().pulls).toEqual([])
  expect(main().get(LEVEL_PATH)).toBe(theirs)
  expect(repo().branches.has('automata/kid')).toBe(false)
})

test('my other device saved to my suggestion first: changed-elsewhere', async () => {
  await save('kid', ask())
  const res = await save('kid', ask({ value: { ...moved, things: [{ ...moved.things[0], x: 2.5 }] } }))
  expect(problem(res)).toBe('changed-elsewhere')
  expect(repo().commits).toHaveLength(1)
})

test('a branch left from an approved suggestion is started again from main', async () => {
  const old = repo().addPull('automata/kid')
  old.state = 'merged'
  const res = await save('kid', ask())
  expect(res.answer).toMatchObject({ ok: true, value: { how: 'suggestion', mine: { number: 2 } } })
  expect(repo().branches.get('automata/kid')?.get(LEVEL_PATH)).toBe(writeContent('level', moved))
  expect(repo().pulls.filter((p) => p.state === 'open')).toHaveLength(1)
})

test('the pull could not be made (GitHub drops that one call): the next save makes one commit and one pull, not two', async () => {
  api.fake.failing = (method, path) => method === 'POST' && path.endsWith('/pulls')
  const first = await save('kid', ask())
  expect([first.status, problem(first)]).toEqual([503, 'busy'])
  expect(repo().pulls).toEqual([])
  api.fake.failing = undefined
  const second = await save('kid', ask())
  expect(second.answer).toMatchObject({ ok: true, value: { how: 'suggestion' } })
  expect(repo().pulls.filter((p) => p.state === 'open')).toHaveLength(1)
  expect(repo().branches.get('automata/kid')?.get(LEVEL_PATH)).toBe(writeContent('level', moved))
})

test("a branch rule that blocks the App on main: an owner's save is blocked, and nothing is written", async () => {
  repo().rule = 'blocks-app'
  const res = await save('grandma', ask())
  expect([res.status, problem(res)]).toEqual([403, 'blocked'])
  untouched()
})

test('a message of 300 characters with line breaks becomes one line of 72', async () => {
  await save('kid', ask({ message: `${'long words\n'.repeat(40)}` }))
  const title = repo().pulls[0]?.title ?? ''
  expect(title.length).toBeLessThanOrEqual(72)
  expect(title).not.toContain('\n')
  expect(repo().commits[0]?.message).toBe(title)
})

test('an empty message becomes "Change <path>"', async () => {
  await save('kid', ask({ message: '   ' }))
  expect(repo().pulls[0]?.title).toBe(`Change ${LEVEL_PATH}`)
})

test('a body that is not a SaveAsk is bad-request', async () => {
  for (const body of [{}, { game: GAME }, { ...ask(), version: 3 }, [], 'x']) {
    expect(problem(await save('grandma', body))).toBe('bad-request')
  }
  const raw = await api.raw('POST', '/api/save', {
    headers: { authorization: `Bearer ${api.fake.tokenFor('grandma')}`, 'content-type': 'application/json' },
  })
  expect(problem(raw)).toBe('bad-request')
  untouched()
})

test('with no token, Save is signed-out, GitHub is asked nothing and nothing changes', async () => {
  const res = await save('visitor', ask())
  expect([res.status, problem(res)]).toEqual([401, 'signed-out'])
  expect(api.fake.log).toEqual([])
  untouched()
})
