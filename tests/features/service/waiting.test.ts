import { writeContent } from '@automataframework/framework/headless'
import { afterAll, beforeAll, beforeEach, expect, test } from 'vitest'
import { writeAccess } from '#src/features/access/access.ts'
import type {
  Answer,
  OpenAnswer,
  SaveAnswer,
  SaveAsk,
  Waiting,
  WaitingChange,
} from '#src/features/wire/wire.ts'
import { startTestApi, type TestApi } from '../../fixtures/api.ts'
import { blobSha } from '../../fixtures/fake-github/repos.ts'
import { fixtureFiles, LEVEL_PATH } from '../../fixtures/game/read.ts'

let api: TestApi
beforeAll(async () => {
  api = await startTestApi()
})
afterAll(() => api.close())

const repo = () => api.fake.repos.get('grandma/crate-game')!
const GAME = { owner: 'grandma', name: 'crate-game' }
const Q = '?owner=grandma&name=crate-game'
const level = JSON.parse(fixtureFiles[LEVEL_PATH] ?? '{}')
const moved = { ...level, things: [{ ...level.things[0], x: 8.5, y: 7.5 }] }
const problem = (r: { answer: Answer<unknown> }): string | undefined =>
  r.answer.ok ? undefined : r.answer.problem

/** kid has saved a change, and its checks pass. */
async function kidSaved(): Promise<void> {
  repo().checks = 'passing'
  const ask: SaveAsk = {
    game: GAME,
    path: LEVEL_PATH,
    value: moved,
    version: blobSha(fixtureFiles[LEVEL_PATH] ?? ''),
    message: 'Move crate-1 in level-1',
  }
  const saved = await api.call<SaveAnswer>('kid', 'POST', '/api/save', ask)
  if (!saved.answer.ok) throw new Error(saved.answer.problem)
}

beforeEach(async () => {
  api.fake.reset()
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
  await kidSaved()
})

test('grandpa sees one waiting change: by kid, not mine, checks passing', async () => {
  const res = await api.call<readonly Waiting[]>('grandpa', 'GET', `/api/waiting${Q}`)
  expect(res.answer).toEqual({
    ok: true,
    value: [{ number: 1, title: 'Move crate-1 in level-1', by: 'kid', mine: false, checks: 'passing' }],
  })
})

test('kid sees it too, as mine', async () => {
  const res = await api.call<readonly Waiting[]>('kid', 'GET', `/api/waiting${Q}`)
  expect(res.answer).toMatchObject({ ok: true, value: [{ by: 'kid', mine: true }] })
})

test('the list is oldest first', async () => {
  api.fake.clock += 60_000
  repo().addPull('automata/stranger', 'Later')
  const res = await api.call<readonly Waiting[]>('grandpa', 'GET', `/api/waiting${Q}`)
  expect(res.answer.ok && res.answer.value.map((w) => w.by)).toEqual(['kid', 'stranger'])
})

test('the change shows the level before and after', async () => {
  const res = await api.call<WaitingChange>('grandpa', 'GET', `/api/change${Q}&number=1`)
  expect(res.answer).toMatchObject({
    ok: true,
    value: {
      number: 1,
      here: true,
      changes: [{ path: LEVEL_PATH, before: fixtureFiles[LEVEL_PATH], after: writeContent('level', moved) }],
    },
  })
})

test("grandpa approves: main has kid's level, the pull is merged, the branch is gone, the merge names grandpa", async () => {
  const res = await api.call('grandpa', 'POST', '/api/approve', { game: GAME, number: 1 })
  expect(res.answer).toEqual({ ok: true, value: true })
  expect(repo().branches.get('main')?.get(LEVEL_PATH)).toBe(writeContent('level', moved))
  expect(repo().pulls[0]?.state).toBe('merged')
  expect(repo().branches.has('automata/kid')).toBe(false)
  expect(repo().commits.at(-1)?.message).toContain('Approved by grandpa.')
})

test('after approval kid opens the game from main, with nothing waiting', async () => {
  await api.call('grandpa', 'POST', '/api/approve', { game: GAME, number: 1 })
  const res = await api.call<OpenAnswer>('kid', 'GET', `/api/game${Q}`)
  expect(res.answer).toMatchObject({ ok: true, value: { branch: 'main', waiting: 0 } })
  expect(res.answer.ok && res.answer.value.mine).toBeUndefined()
})

test('kid cannot approve at all (not-allowed); grandpa cannot approve his own (own-change)', async () => {
  const kid = await api.call('kid', 'POST', '/api/approve', { game: GAME, number: 1 })
  expect([kid.status, problem(kid)]).toEqual([403, 'not-allowed'])
  const ask: SaveAsk = {
    game: GAME,
    path: LEVEL_PATH,
    value: moved,
    version: blobSha(fixtureFiles[LEVEL_PATH] ?? ''),
    message: "Grandpa's change",
  }
  await api.call('grandpa', 'POST', '/api/save', ask)
  const own = await api.call('grandpa', 'POST', '/api/approve', { game: GAME, number: 2 })
  expect([own.status, problem(own)]).toEqual([403, 'own-change'])
  expect(repo().pulls[1]?.state).toBe('open')
})

test('grandma and an edit-level person can approve their own', async () => {
  for (const person of ['grandma', 'stranger'] as const) {
    api.fake.reset()
    repo().put(
      'main',
      'automata.access.toml',
      writeAccess({ format: 1, everyone: 'look', people: [{ github: 'stranger', level: 'edit' }] }),
    )
    repo().checks = 'passing'
    repo().addPull(`automata/${person}`)
    repo().put(`automata/${person}`, LEVEL_PATH, writeContent('level', moved))
    const res = await api.call(person, 'POST', '/api/approve', { game: GAME, number: 1 })
    expect(res.answer).toEqual({ ok: true, value: true })
  }
})

test('checks running: not-ready, and main is untouched; checks failing: checks-failed', async () => {
  repo().checks = 'running'
  const running = await api.call('grandpa', 'POST', '/api/approve', { game: GAME, number: 1 })
  expect([running.status, problem(running)]).toEqual([409, 'not-ready'])
  repo().checks = 'failing'
  const failing = await api.call('grandpa', 'POST', '/api/approve', { game: GAME, number: 1 })
  expect([failing.status, problem(failing)]).toEqual([409, 'checks-failed'])
  expect(repo().branches.get('main')?.get(LEVEL_PATH)).toBe(fixtureFiles[LEVEL_PATH])
  expect(repo().pulls[0]?.state).toBe('open')
})

test('no checks at all: not-ready for the first two minutes, approved after', async () => {
  repo().checks = 'none'
  const young = await api.call('grandpa', 'POST', '/api/approve', { game: GAME, number: 1 })
  expect(problem(young)).toBe('not-ready')
  // A change made three minutes ago: its checks would have started by now.
  api.fake.reset()
  repo().put(
    'main',
    'automata.access.toml',
    writeAccess({ format: 1, everyone: 'look', people: [{ github: 'grandpa', level: 'approve' }] }),
  )
  repo().checks = 'none'
  api.fake.clock = Date.now() - 3 * 60_000
  repo().addPull('automata/kid')
  repo().put('automata/kid', LEVEL_PATH, writeContent('level', moved))
  const old = await api.call('grandpa', 'POST', '/api/approve', { game: GAME, number: 1 })
  expect(old.answer).toEqual({ ok: true, value: true })
})

test('no checks: the two minutes run from the new commit, not from when the pull was opened', async () => {
  api.fake.reset()
  repo().put(
    'main',
    'automata.access.toml',
    writeAccess({ format: 1, everyone: 'look', people: [{ github: 'grandpa', level: 'approve' }] }),
  )
  repo().checks = 'none'
  // A pull opened an hour ago...
  api.fake.clock = Date.now() - 60 * 60_000
  repo().addPull('automata/kid')
  // ...and a commit put on it a moment ago: its checks have not been queued yet.
  api.fake.clock = Date.now() - 10_000
  repo().put('automata/kid', LEVEL_PATH, writeContent('level', moved))
  const fresh = await api.call('grandpa', 'POST', '/api/approve', { game: GAME, number: 1 })
  expect(problem(fresh)).toBe('not-ready')
  expect(repo().pulls[0]?.state).toBe('open')
  // The same pull, with that commit three minutes old, goes in.
  api.fake.clock = Date.now() - 3 * 60_000
  repo().put('automata/kid', LEVEL_PATH, writeContent('level', moved))
  const settled = await api.call('grandpa', 'POST', '/api/approve', { game: GAME, number: 1 })
  expect(settled.answer).toEqual({ ok: true, value: true })
})

test('a change that also edits automata.access.toml: here is false, approve is not-allowed, nothing merges', async () => {
  repo().put(
    'automata/kid',
    'automata.access.toml',
    writeAccess({ format: 1, everyone: 'suggest', people: [{ github: 'kid', level: 'owner' }] }),
  )
  const shown = await api.call<WaitingChange>('grandpa', 'GET', `/api/change${Q}&number=1`)
  expect(shown.answer).toMatchObject({ ok: true, value: { here: false } })
  const res = await api.call('grandpa', 'POST', '/api/approve', { game: GAME, number: 1 })
  expect([res.status, problem(res)]).toEqual([403, 'not-allowed'])
  expect(repo().pulls[0]?.state).toBe('open')
})

test('the same for automata.toml, for a workflow file, and for a file renamed out of content/', async () => {
  for (const path of ['automata.toml', '.github/workflows/ci.yml']) {
    repo().put('automata/kid', path, 'changed\n')
    const res = await api.call('grandpa', 'POST', '/api/approve', { game: GAME, number: 1 })
    expect([path, problem(res)]).toEqual([path, 'not-allowed'])
  }
  repo().rename('automata/kid', LEVEL_PATH, 'elsewhere/level-1.json')
  const renamed = await api.call('grandpa', 'POST', '/api/approve', { game: GAME, number: 1 })
  expect(problem(renamed)).toBe('not-allowed')
  expect(repo().pulls[0]?.state).toBe('open')
})

test('a change whose level is broken on its branch is broken, with the sentence', async () => {
  repo().put('automata/kid', LEVEL_PATH, '{"format":1,"id":"level-1"}\n')
  const res = await api.call('grandpa', 'POST', '/api/approve', { game: GAME, number: 1 })
  expect([res.status, problem(res)]).toEqual([422, 'broken'])
  expect(res.answer.ok === false && (res.answer.details ?? []).length).toBeGreaterThan(0)
  expect(repo().pulls[0]?.state).toBe('open')
})

test('a change whose thing has a character the game lacks is broken', async () => {
  repo().put(
    'automata/kid',
    LEVEL_PATH,
    writeContent('level', { ...moved, things: [{ ...moved.things[0], character: 'dragon' }] }),
  )
  const res = await api.call('grandpa', 'POST', '/api/approve', { game: GAME, number: 1 })
  expect(problem(res)).toBe('broken')
})

test('main changed the same file since: clashes, and nothing merges', async () => {
  repo().put(
    'main',
    LEVEL_PATH,
    writeContent('level', { ...level, things: [{ ...level.things[0], x: 3.5 }] }),
  )
  const res = await api.call('grandpa', 'POST', '/api/approve', { game: GAME, number: 1 })
  expect([res.status, problem(res)]).toEqual([409, 'clashes'])
  expect(repo().pulls[0]?.state).toBe('open')
})

test('the head moved between looking and merging: nothing merges', async () => {
  api.fake.failing = (method, path) => {
    if (method === 'PUT' && path.endsWith('/merge')) {
      // A commit lands on kid's branch after the checks were looked at.
      repo().put(
        'automata/kid',
        LEVEL_PATH,
        writeContent('level', { ...moved, things: [{ ...moved.things[0], x: 1.5 }] }),
      )
    }
    return false
  }
  const res = await api.call('grandpa', 'POST', '/api/approve', { game: GAME, number: 1 })
  expect([res.status, problem(res)]).toEqual([409, 'changed-elsewhere'])
  expect(repo().pulls[0]?.state).toBe('open')
  expect(repo().branches.get('main')?.get(LEVEL_PATH)).toBe(fixtureFiles[LEVEL_PATH])
})

test('a pull that is not an automata/ branch is not-found, to list, to open and to approve', async () => {
  const other = repo().addPull('someones-work')
  const list = await api.call<readonly Waiting[]>('grandpa', 'GET', `/api/waiting${Q}`)
  expect(list.answer.ok && list.answer.value.map((w) => w.number)).toEqual([1])
  const show = await api.call('grandpa', 'GET', `/api/change${Q}&number=${other.number}`)
  const approve = await api.call('grandpa', 'POST', '/api/approve', { game: GAME, number: other.number })
  expect([problem(show), problem(approve)]).toEqual(['not-found', 'not-found'])
})

test('a pull from a fork named automata/kid is not-found', async () => {
  const fork = repo().addForkPull('automata/stranger', 'stranger/crate-game')
  const show = await api.call('grandpa', 'GET', `/api/change${Q}&number=${fork.number}`)
  const approve = await api.call('grandpa', 'POST', '/api/approve', { game: GAME, number: fork.number })
  expect([problem(show), problem(approve)]).toEqual(['not-found', 'not-found'])
})

test("grandpa turns kid's change down: closed, branch gone, main untouched", async () => {
  const res = await api.call('grandpa', 'POST', '/api/turn-down', { game: GAME, number: 1 })
  expect(res.answer).toEqual({ ok: true, value: true })
  expect(repo().pulls[0]?.state).toBe('closed')
  expect(repo().branches.has('automata/kid')).toBe(false)
  expect(repo().branches.get('main')?.get(LEVEL_PATH)).toBe(fixtureFiles[LEVEL_PATH])
})

test('kid takes their own change back; a look-level person cannot turn anything down', async () => {
  repo().put(
    'main',
    'automata.access.toml',
    writeAccess({ format: 1, everyone: 'look', people: [{ github: 'kid', level: 'suggest' }] }),
  )
  const look = await api.call('stranger', 'POST', '/api/turn-down', { game: GAME, number: 1 })
  expect([look.status, problem(look)]).toEqual([403, 'not-allowed'])
  expect(repo().pulls[0]?.state).toBe('open')
  const own = await api.call('kid', 'POST', '/api/turn-down', { game: GAME, number: 1 })
  expect(own.answer).toEqual({ ok: true, value: true })
  expect(repo().pulls[0]?.state).toBe('closed')
})

test('a branch rule that blocks the App: approve is blocked', async () => {
  repo().rule = 'blocks-app'
  const res = await api.call('grandpa', 'POST', '/api/approve', { game: GAME, number: 1 })
  expect([res.status, problem(res)]).toEqual([403, 'blocked'])
  expect(repo().pulls[0]?.state).toBe('open')
})

test('with no token, every route here is signed-out, GitHub is asked nothing and nothing changes', async () => {
  const before = api.fake.log.length
  for (const [method, path, body] of [
    ['GET', `/api/waiting${Q}`, undefined],
    ['GET', `/api/change${Q}&number=1`, undefined],
    ['POST', '/api/approve', { game: GAME, number: 1 }],
    ['POST', '/api/turn-down', { game: GAME, number: 1 }],
  ] as const) {
    const res = await api.call('visitor', method, path, body)
    expect([path, res.status, problem(res)]).toEqual([path, 401, 'signed-out'])
  }
  expect(api.fake.log).toHaveLength(before)
  expect(repo().pulls[0]?.state).toBe('open')
})
