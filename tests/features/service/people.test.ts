import { afterAll, beforeAll, beforeEach, expect, test } from 'vitest'
import { type AccessFile, writeAccess } from '#src/features/access/access.ts'
import type { Answer, OpenAnswer, SaveAsk, SharingAnswer } from '#src/features/wire/wire.ts'
import { startTestApi, type TestApi } from '../../fixtures/api.ts'
import { blobSha } from '../../fixtures/fake-github/repos.ts'
import { fixtureFiles, LEVEL_PATH } from '../../fixtures/game/read.ts'

let api: TestApi
beforeAll(async () => {
  api = await startTestApi()
})
afterAll(() => api.close())
beforeEach(() => api.fake.reset())

const repo = () => api.fake.repos.get('grandma/crate-game')!
const GAME = { owner: 'grandma', name: 'crate-game' }
const Q = '?owner=grandma&name=crate-game'
const FILE = 'automata.access.toml'
const problem = (r: { answer: Answer<unknown> }): string | undefined =>
  r.answer.ok ? undefined : r.answer.problem
const read = (person: Parameters<TestApi['call']>[0]) =>
  api.call<SharingAnswer>(person, 'GET', `/api/sharing${Q}`)
const write = (person: Parameters<TestApi['call']>[0], access: unknown, version?: string) =>
  api.call<SharingAnswer>(person, 'POST', '/api/sharing', { game: GAME, access, version })
const list = (people: AccessFile['people'], everyone: AccessFile['everyone'] = 'look'): AccessFile => ({
  format: 1,
  everyone,
  people,
})
const level = JSON.parse(fixtureFiles[LEVEL_PATH] ?? '{}')
const moved = { ...level, things: [{ ...level.things[0], x: 8.5, y: 7.5 }] }
const saveAsk = (): SaveAsk => ({
  game: GAME,
  path: LEVEL_PATH,
  value: moved,
  version: blobSha(fixtureFiles[LEVEL_PATH] ?? ''),
  message: 'Move a crate',
})

test('grandma reads the sharing of a game with no file: everyone look, nobody listed, version undefined', async () => {
  const res = await read('grandma')
  expect(res.answer).toEqual({
    ok: true,
    value: {
      access: { format: 1, everyone: 'look', people: [] },
      version: undefined,
      owner: 'grandma',
      broken: false,
    },
  })
})

test("grandma adds grandpa as approve: one commit on main, the plan's example file byte for byte", async () => {
  const res = await write('grandma', list([{ github: 'grandpa', level: 'approve' }]))
  expect(res.answer).toMatchObject({ ok: true, value: { owner: 'grandma', broken: false } })
  expect(repo().commits).toEqual([
    expect.objectContaining({
      branch: 'main',
      path: FILE,
      message: 'Change who can help with this game',
      author: 'grandma',
    }),
  ])
  expect(repo().branches.get('main')?.get(FILE)).toBe(
    'format = 1\neveryone = "look"\n\n[[people]]\ngithub = "grandpa"\nlevel = "approve"\n',
  )
})

test("from then on grandpa's level is approve", async () => {
  await write('grandma', list([{ github: 'grandpa', level: 'approve' }], 'nothing'))
  const res = await api.call<OpenAnswer>('grandpa', 'GET', `/api/game${Q}`)
  expect(res.answer).toMatchObject({ ok: true, value: { level: 'approve' } })
})

test('grandma sets everyone to suggest: kid can now save', async () => {
  const before = await api.call('kid', 'POST', '/api/save', saveAsk())
  expect(problem(before)).toBe('not-allowed')
  await write('grandma', list([], 'suggest'))
  const after = await api.call<{ how: string }>('kid', 'POST', '/api/save', saveAsk())
  expect(after.answer).toMatchObject({ ok: true, value: { how: 'suggestion' } })
})

test('grandma sets everyone to nothing: stranger now gets not-found', async () => {
  expect((await api.call('stranger', 'GET', `/api/game${Q}`)).answer.ok).toBe(true)
  await write('grandma', list([], 'nothing'))
  expect(problem(await api.call('stranger', 'GET', `/api/game${Q}`))).toBe('not-found')
})

test('grandma lowers grandpa to look: his next save is refused', async () => {
  await write('grandma', list([{ github: 'grandpa', level: 'edit' }]))
  const first = await read('grandma')
  if (!first.answer.ok) throw new Error(first.answer.problem)
  await write('grandma', list([{ github: 'grandpa', level: 'look' }]), first.answer.value.version)
  expect(problem(await api.call('grandpa', 'POST', '/api/save', saveAsk()))).toBe('not-allowed')
})

test('grandma removes grandpa: he is back to what everyone gets', async () => {
  await write('grandma', list([{ github: 'grandpa', level: 'edit' }]))
  const first = await read('grandma')
  if (!first.answer.ok) throw new Error(first.answer.problem)
  await write('grandma', list([]), first.answer.value.version)
  const res = await api.call<OpenAnswer>('grandpa', 'GET', `/api/game${Q}`)
  expect(res.answer).toMatchObject({ ok: true, value: { level: 'look' } })
})

test('a second Owner (listed as owner) can change the list too', async () => {
  await write('grandma', list([{ github: 'grandpa', level: 'owner' }]))
  const seen = await read('grandpa')
  if (!seen.answer.ok) throw new Error(seen.answer.problem)
  const res = await write(
    'grandpa',
    list([
      { github: 'grandpa', level: 'owner' },
      { github: 'kid', level: 'suggest' },
    ]),
    seen.answer.value.version,
  )
  expect(res.answer.ok).toBe(true)
  expect(repo().commits.at(-1)?.author).toBe('grandpa')
})

test('anyone below owner is refused, to read and to write, and nothing is written', async () => {
  await write(
    'grandma',
    list([
      { github: 'grandpa', level: 'edit' },
      { github: 'kid', level: 'approve' },
    ]),
  )
  const commits = repo().commits.length
  for (const person of ['grandpa', 'kid', 'stranger'] as const) {
    const r = await read(person)
    const w = await write(person, list([{ github: person, level: 'owner' }]))
    expect([person, problem(r), problem(w)]).toEqual([person, 'not-allowed', 'not-allowed'])
  }
  expect(repo().commits).toHaveLength(commits)
})

test('listing the repo owner is quietly dropped; she is still Owner', async () => {
  const res = await write(
    'grandma',
    list([
      { github: 'Grandma', level: 'look' },
      { github: 'kid', level: 'suggest' },
    ]),
  )
  expect(res.answer).toMatchObject({
    ok: true,
    value: { access: { people: [{ github: 'kid', level: 'suggest' }] } },
  })
  expect(repo().branches.get('main')?.get(FILE)).not.toContain('randma')
  expect((await api.call<OpenAnswer>('grandma', 'GET', `/api/game${Q}`)).answer).toMatchObject({
    ok: true,
    value: { level: 'owner' },
  })
})

test('a name GitHub does not know is not-found, names it, and nothing is written', async () => {
  const res = await write(
    'grandma',
    list([
      { github: 'kid', level: 'look' },
      { github: 'nobody-here', level: 'look' },
    ]),
  )
  expect(res.answer).toEqual({ ok: false, problem: 'not-found', details: ['nobody-here'] })
  expect(repo().commits).toEqual([])
})

test('a list that breaks the rules (a level "god", everyone "owner", 101 people) is bad-request', async () => {
  const many = Array.from({ length: 101 }, (_, i) => ({ github: `person-${i}`, level: 'look' }))
  for (const access of [
    { format: 1, everyone: 'look', people: [{ github: 'kid', level: 'god' }] },
    { format: 1, everyone: 'owner', people: [] },
    { format: 1, everyone: 'look', people: many },
    { format: 1, everyone: 'look', people: [{ github: 'a b', level: 'look' }] },
    'not even an object',
  ]) {
    const res = await write('grandma', access)
    expect(problem(res)).toBe('bad-request')
  }
  expect(repo().commits).toEqual([])
})

test('two Owners at once: the second write is changed-elsewhere, and the first stands', async () => {
  await write('grandma', list([{ github: 'grandpa', level: 'owner' }]))
  const a = await read('grandma')
  const b = await read('grandpa')
  if (!a.answer.ok || !b.answer.ok) throw new Error('read failed')
  const first = await write(
    'grandma',
    list([
      { github: 'grandpa', level: 'owner' },
      { github: 'kid', level: 'look' },
    ]),
    a.answer.value.version,
  )
  expect(first.answer.ok).toBe(true)
  const second = await write(
    'grandpa',
    list([
      { github: 'grandpa', level: 'owner' },
      { github: 'kid', level: 'edit' },
    ]),
    b.answer.value.version,
  )
  expect([second.status, problem(second)]).toEqual([409, 'changed-elsewhere'])
  expect(repo().branches.get('main')?.get(FILE)).toContain('level = "look"')
})

test('saving the same list again makes no commit', async () => {
  const people = [{ github: 'grandpa', level: 'approve' as const }]
  const first = await write('grandma', list(people))
  if (!first.answer.ok) throw new Error(first.answer.problem)
  const again = await write('grandma', list(people), first.answer.value.version)
  expect(again.answer).toMatchObject({ ok: true, value: { version: first.answer.value.version } })
  expect(repo().commits).toHaveLength(1)
})

test('a broken file on main reads as broken with an empty list, and saving mends it', async () => {
  repo().put('main', FILE, '= = =')
  const res = await read('grandma')
  expect(res.answer).toMatchObject({ ok: true, value: { broken: true, access: { people: [] } } })
  if (!res.answer.ok) throw new Error(res.answer.problem)
  const mended = await write(
    'grandma',
    list([{ github: 'grandpa', level: 'look' }]),
    res.answer.value.version,
  )
  expect(mended.answer).toMatchObject({ ok: true, value: { broken: false } })
  expect(repo().branches.get('main')?.get(FILE)).toBe(
    writeAccess(list([{ github: 'grandpa', level: 'look' }])),
  )
})

test('a branch rule that blocks the App: blocked', async () => {
  repo().rule = 'blocks-app'
  const res = await write('grandma', list([{ github: 'grandpa', level: 'look' }]))
  expect([res.status, problem(res)]).toEqual([403, 'blocked'])
  expect(repo().commits).toEqual([])
})

test('an organisation game: a GitHub admin shares it, and the organisation is the owner shown', async () => {
  repo().ownerType = 'Organization'
  repo().admins.add('grandpa')
  const res = await read('grandpa')
  expect(res.answer).toMatchObject({ ok: true, value: { owner: 'grandma' } })
})

test('with no token, both routes are signed-out, GitHub is asked nothing and nothing changes', async () => {
  const get = await api.call('visitor', 'GET', `/api/sharing${Q}`)
  const post = await api.call('visitor', 'POST', '/api/sharing', { game: GAME, access: list([]) })
  expect([get.status, problem(get), post.status, problem(post)]).toEqual([
    401,
    'signed-out',
    401,
    'signed-out',
  ])
  expect(api.fake.log).toEqual([])
  expect(repo().commits).toEqual([])
})
