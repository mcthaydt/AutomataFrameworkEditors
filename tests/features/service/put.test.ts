import { PROJECT_FILE, writeContent } from '@automataframework/framework/headless'
import { afterAll, beforeAll, beforeEach, expect, test } from 'vitest'
import { writeAccess } from '#src/features/access/access.ts'
import { changeProject } from '#src/features/files/files.ts'
import type { Answer, PutAnswer, PutAsk } from '#src/features/wire/wire.ts'
import { LINKS, startTestApi, type TestApi } from '../../fixtures/api.ts'
import { blobSha } from '../../fixtures/fake-github/repos.ts'
import { linksFiles } from '../../fixtures/links-game/links.ts'

let api: TestApi
beforeAll(async () => {
  api = await startTestApi()
})
afterAll(() => api.close())
beforeEach(() => {
  api.fake.reset()
  // grandpa approves, kid suggests, stranger edits; anyone else may look. (grandma owns the game.)
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

const repo = () => api.fake.repos.get(LINKS)!
const main = () => repo().branches.get('main')!
const GAME = { owner: 'grandma', name: 'links-game' }
const FILES = linksFiles()
const text = (path: string): string => FILES[path] ?? ''
const data = (path: string): Record<string, any> => JSON.parse(text(path))
const ROOM_3 = 'content/levels/room-3.json'
const ROOM_4 = 'content/levels/room-4.json'
const WORLD = 'content/worlds/world.json'
const version = (path: string): string => blobSha(text(path))

const room3 = { ...data(ROOM_3), things: [{ ...data(ROOM_3).things[0], x: 12.5 }, data(ROOM_3).things[1]] }
const room4 = { ...data(ROOM_3), id: 'room-4' }
const world = { ...data(WORLD), levels: [...data(WORLD).levels, { level: 'room-4', at: { x: 100, y: 0 } }] }
const PROJECT_CHANGE = { add: [{ type: 'level' as const, path: ROOM_4 }] }

/** A level, a new level, the world file and the project file's line for the new level, in one ask. */
const ask = (over: Partial<PutAsk> = {}): PutAsk => ({
  game: GAME,
  files: [
    { path: ROOM_3, value: room3, version: version(ROOM_3) },
    { path: ROOM_4, value: room4, version: undefined },
    { path: WORLD, value: world, version: version(WORLD) },
  ],
  project: PROJECT_CHANGE,
  projectVersion: version(PROJECT_FILE),
  message: 'A fourth room',
  ...over,
})
/** Only these files, and no change to the project file. */
const only = (files: PutAsk['files']): PutAsk => ask({ files, project: undefined })
const room3As = (value: unknown) => ({ path: ROOM_3, value, version: version(ROOM_3) })
const put = (person: Parameters<TestApi['call']>[0], body: unknown) =>
  api.call<PutAnswer>(person, 'POST', '/api/put', body)
const problem = (r: { answer: Answer<unknown> }): string | undefined =>
  r.answer.ok ? undefined : r.answer.problem
const details = (r: { answer: Answer<unknown> }): readonly string[] =>
  r.answer.ok ? [] : (r.answer.details ?? [])
const untouched = () => {
  expect(repo().commits).toEqual([])
  expect(repo().pulls).toEqual([])
  expect([...repo().branches.keys()]).toEqual(['main'])
  expect(main().get(ROOM_3)).toBe(text(ROOM_3))
  expect(main().has(ROOM_4)).toBe(false)
}
const NEW_TOML = changeProject(text(PROJECT_FILE), PROJECT_CHANGE) ?? ''

test('an owner: a level, a new level, the world file and the project lines land in one commit on main', async () => {
  const res = await put('grandma', ask())
  expect(res.answer).toMatchObject({ ok: true, value: { how: 'direct', mine: undefined } })
  expect(repo().commits).toHaveLength(1)
  expect(repo().commits[0]).toMatchObject({ branch: 'main', author: 'grandma', message: 'A fourth room' })
  const touched = repo().commits[0]?.files.map((f) => f.path)
  expect(touched?.sort()).toEqual([PROJECT_FILE, ROOM_3, ROOM_4, WORLD].sort())
  expect([...repo().branches.keys()]).toEqual(['main'])
  expect(repo().pulls).toEqual([])
  expect(main().get(ROOM_3)).toBe(writeContent('level', room3 as never))
  expect(main().get(ROOM_4)).toBe(writeContent('level', room4 as never))
  expect(main().get(WORLD)).toBe(writeContent('world', world as never))
  expect(main().get(PROJECT_FILE)).toBe(NEW_TOML)
  if (!res.answer.ok) throw new Error(res.answer.problem)
  expect(res.answer.value.versions).toEqual({
    [ROOM_3]: blobSha(writeContent('level', room3 as never)),
    [ROOM_4]: blobSha(writeContent('level', room4 as never)),
    [WORLD]: blobSha(writeContent('world', world as never)),
  })
  expect(res.answer.value.project).toEqual({
    path: PROJECT_FILE,
    text: NEW_TOML,
    version: blobSha(NEW_TOML),
  })
})

test('someone who suggests: the same ask is one waiting change, and main is untouched', async () => {
  const res = await put('kid', ask())
  expect(res.answer).toMatchObject({
    ok: true,
    value: { how: 'suggestion', mine: { number: 1, by: 'kid', mine: true } },
  })
  expect(repo().commits).toHaveLength(1)
  expect(repo().commits[0]).toMatchObject({ branch: 'automata/kid', author: 'kid' })
  expect(repo().pulls).toEqual([
    { number: 1, title: 'A fourth room', head: 'automata/kid', base: 'main', state: 'open' },
  ])
  const waiting = repo().branches.get('automata/kid')!
  expect(waiting.get(ROOM_4)).toBe(writeContent('level', room4 as never))
  expect(waiting.get(PROJECT_FILE)).toBe(NEW_TOML)
  expect(main().get(PROJECT_FILE)).toBe(text(PROJECT_FILE))
  expect(main().has(ROOM_4)).toBe(false)
})

test('a second put by the same person goes on their waiting change, whose new level it may then change', async () => {
  await put('kid', ask())
  const again = { ...room4, things: [{ ...room4.things[0], x: 11.5 }, room4.things[1]] }
  const res = await put('kid', {
    game: GAME,
    files: [{ path: ROOM_4, value: again, version: blobSha(writeContent('level', room4 as never)) }],
    message: 'Move the goal',
  })
  expect(res.answer).toMatchObject({ ok: true, value: { how: 'suggestion', mine: { number: 1 } } })
  expect(repo().commits.map((c) => c.branch)).toEqual(['automata/kid', 'automata/kid'])
  expect(repo().pulls.filter((p) => p.state === 'open')).toHaveLength(1)
  expect(repo().branches.get('automata/kid')?.get(ROOM_4)).toBe(writeContent('level', again as never))
})

test.each([
  ['automata.access.toml'],
  ['src/main.ts'],
  ['content/characters/crate.json'],
  ['content/levels/../../automata.access.toml'],
  ['content/levels/not-listed.json'],
  [PROJECT_FILE],
])('%s is not allowed, and nothing is written, even with other good files beside it', async (path) => {
  const res = await put('grandma', only([room3As(room3), { path, value: room3, version: undefined }]))
  expect([res.status, problem(res)]).toEqual([403, 'not-allowed'])
  untouched()
})

test('the project change may add only a level or world file in its own folder, and take out only a listed one', async () => {
  for (const project of [
    { add: [{ type: 'level' as const, path: 'content/characters/new.json' }] },
    { remove: ['content/characters/crate.json'] },
    { remove: ['content/levels/not-listed.json'] },
  ]) {
    const res = await put('grandma', ask({ files: [], project }))
    expect(problem(res)).toBe('not-allowed')
  }
  untouched()
})

test("a value that is not a level is broken, with the framework's sentence, and nothing is written", async () => {
  const res = await put('grandma', only([room3As({ format: 1, id: 'room-3' })]))
  expect([res.status, problem(res)]).toEqual([422, 'broken'])
  expect(details(res).length).toBeGreaterThan(0)
  untouched()
})

test("a level whose id is not the file's name is broken", async () => {
  const res = await put('grandma', only([room3As({ ...room3, id: 'room-9' })]))
  expect(problem(res)).toBe('broken')
  untouched()
})

test('one stale version is changed-elsewhere, names that path, and nothing is written', async () => {
  repo().put('main', ROOM_3, writeContent('level', { ...data(ROOM_3), things: [] } as never))
  const theirs = main().get(ROOM_3)
  const res = await put('grandma', ask())
  expect([res.status, problem(res)]).toEqual([409, 'changed-elsewhere'])
  expect(details(res)).toEqual([ROOM_3])
  expect(repo().commits).toEqual([])
  expect(main().get(ROOM_3)).toBe(theirs)
  expect(main().has(ROOM_4)).toBe(false)
})

test('a project file that changed since it was opened is changed-elsewhere, and it is the one named', async () => {
  repo().put('main', PROJECT_FILE, `${text(PROJECT_FILE)}# a note\n`)
  const res = await put('grandma', ask())
  expect(problem(res)).toBe('changed-elsewhere')
  expect(details(res)).toEqual([PROJECT_FILE])
  expect(repo().commits).toEqual([])
})

/** room-3's door, pointing at a level the game does not have. */
const brokenDoor = (): Record<string, any> => {
  const back = { ...data(ROOM_3).things[1], values: { to: { level: 'room-9', thing: 'exit' } } }
  return { ...data(ROOM_3), things: [data(ROOM_3).things[0], back] }
}
const doorAsk = () => only([room3As(brokenDoor())])

test('with the default settings a door into a missing level is still written', async () => {
  const res = await put('grandma', doorAsk())
  expect(res.answer).toMatchObject({ ok: true, value: { how: 'direct' } })
  expect(main().get(ROOM_3)).toBe(writeContent('level', brokenDoor() as never))
})

test('with problems = "stop" the same ask is broken, with the sentences, and nothing is written', async () => {
  repo().put('main', 'automata.editors.toml', 'format = 1\nproblems = "stop"\n')
  const res = await put('grandma', doorAsk())
  expect([res.status, problem(res)]).toEqual([422, 'broken'])
  expect(details(res).join(' ')).toContain('room-9')
  expect(repo().commits).toEqual([])
  expect(main().get(ROOM_3)).toBe(text(ROOM_3))
})

test('with problems = "stop" the good ask of a new level, its world file and its project lines is written', async () => {
  repo().put('main', 'automata.editors.toml', 'format = 1\nproblems = "stop"\n')
  const res = await put('grandma', ask())
  expect(res.answer).toMatchObject({ ok: true, value: { how: 'direct' } })
  expect(main().get(ROOM_4)).toBe(writeContent('level', room4 as never))
})

test('taking a level away: its file and its lines go in one commit', async () => {
  const res = await put(
    'grandma',
    ask({
      files: [{ path: ROOM_3, value: undefined, version: version(ROOM_3) }],
      project: { remove: [ROOM_3] },
    }),
  )
  expect(res.answer).toMatchObject({ ok: true, value: { how: 'direct' } })
  expect(main().has(ROOM_3)).toBe(false)
  expect(main().get(PROJECT_FILE)).not.toContain('room-3')
  expect(repo().commits).toHaveLength(1)
})

test('taking the start level away is broken', async () => {
  const res = await put('grandma', ask({ files: [], project: { remove: ['content/levels/room-1.json'] } }))
  expect(problem(res)).toBe('broken')
  untouched()
})

test('the commit message is one line of at most 72 characters, and empty becomes "Change <path>"', async () => {
  await put('kid', ask({ message: 'long words\n'.repeat(40) }))
  const title = repo().pulls[0]?.title ?? ''
  expect(title.length).toBeLessThanOrEqual(72)
  expect(title).not.toContain('\n')
  api.fake.reset()
  await put('grandma', ask({ message: '  ' }))
  expect(repo().commits[0]?.message).toBe(`Change ${ROOM_3}`)
})

test('someone who may only look is not allowed, a stranger is not found', async () => {
  repo().put('main', 'automata.access.toml', writeAccess({ format: 1, everyone: 'look', people: [] }))
  const kid = await put('kid', ask())
  expect([kid.status, problem(kid)]).toEqual([403, 'not-allowed'])
  repo().put('main', 'automata.access.toml', writeAccess({ format: 1, everyone: 'nothing', people: [] }))
  expect(problem(await put('stranger', ask()))).toBe('not-found')
  expect(repo().commits).toEqual([])
})

test('a visitor is signed-out and GitHub is asked nothing', async () => {
  const res = await put('visitor', ask())
  expect([res.status, problem(res)]).toEqual([401, 'signed-out'])
  expect(api.fake.log).toEqual([])
})

test('a body that is not a PutAsk is bad-request', async () => {
  for (const body of [
    {},
    { game: GAME },
    { ...ask(), files: 'x' },
    { ...ask(), message: 3 },
    { ...ask(), files: [{ path: 3 }] },
    { ...ask(), files: [{ path: ROOM_3, version: 3 }] },
    { ...ask(), project: { add: [{ type: 'character', path: ROOM_4 }] } },
    { ...ask(), projectVersion: undefined },
    only([]),
    only([
      { path: ROOM_3, value: room3, version: undefined },
      { path: ROOM_3, value: room3, version: undefined },
    ]),
    [],
    'x',
  ]) {
    expect(problem(await put('grandma', body))).toBe('bad-request')
  }
  untouched()
})

test("a branch rule that blocks the App on main: an owner's put is blocked, and nothing is written", async () => {
  repo().rule = 'blocks-app'
  const res = await put('grandma', ask())
  expect([res.status, problem(res)]).toEqual([403, 'blocked'])
  untouched()
})

test('the pull could not be made: the next put makes one commit and one pull, not two', async () => {
  api.fake.failing = (method, path) => method === 'POST' && path.endsWith('/pulls')
  const first = await put('kid', ask())
  expect([first.status, problem(first)]).toEqual([503, 'busy'])
  api.fake.failing = undefined
  const second = await put('kid', ask())
  expect(second.answer).toMatchObject({ ok: true, value: { how: 'suggestion' } })
  expect(repo().pulls.filter((p) => p.state === 'open')).toHaveLength(1)
})

test('a stale version on a suggestion leaves no branch behind', async () => {
  repo().put('main', ROOM_3, writeContent('level', { ...data(ROOM_3), things: [] } as never))
  const res = await put('kid', ask())
  expect(problem(res)).toBe('changed-elsewhere')
  expect(repo().branches.has('automata/kid')).toBe(false)
  expect(repo().pulls).toEqual([])
})
