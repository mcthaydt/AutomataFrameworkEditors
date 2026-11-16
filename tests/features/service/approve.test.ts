// Looking at and approving a waiting change of several files: a new level, its lines in automata.toml, the world file.
import { PROJECT_FILE, writeContent } from '@automataframework/framework/headless'
import { afterAll, beforeAll, beforeEach, expect, test } from 'vitest'
import { writeAccess } from '#src/features/access/access.ts'
import { changeProject } from '#src/features/files/files.ts'
import type { Answer, PutAnswer, WaitingChange } from '#src/features/wire/wire.ts'
import { LINKS, startTestApi, type TestApi } from '../../fixtures/api.ts'
import {
  ask,
  data,
  GAME,
  only,
  PROJECT_CHANGE,
  ROOM_3,
  ROOM_4,
  text,
  version,
  WORLD,
} from '../../fixtures/links-put.ts'

let api: TestApi
beforeAll(async () => {
  api = await startTestApi()
})
afterAll(() => api.close())
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
      ],
    }),
  )
  // kid suggests a fourth room, its world file and its lines in automata.toml, in one change.
  const put = await api.call<PutAnswer>('kid', 'POST', '/api/put', ask())
  if (!put.answer.ok) throw new Error(put.answer.problem)
})

const repo = () => api.fake.repos.get(LINKS)!
const main = () => repo().branches.get('main')!
const Q = '?owner=grandma&name=links-game'
const problem = (r: { answer: Answer<unknown> }): string | undefined =>
  r.answer.ok ? undefined : r.answer.problem
const look = () => api.call<WaitingChange>('grandpa', 'GET', `/api/change${Q}&number=1`)
const approve = () => api.call('grandpa', 'POST', '/api/approve', { game: GAME, number: 1 })
const STOP = 'format = 1\nproblems = "stop"\n'

test('a change with a new level, automata.toml and the world file can be looked at, and is here', async () => {
  const shown = await look()
  expect(shown.answer).toMatchObject({ ok: true, value: { number: 1, by: 'kid', here: true } })
  if (!shown.answer.ok) return
  const paths = shown.answer.value.changes.map((c) => c.path).sort()
  expect(paths).toEqual([PROJECT_FILE, ROOM_3, ROOM_4, WORLD].sort())
  const toml = shown.answer.value.changes.find((c) => c.path === PROJECT_FILE)
  expect(toml?.before).toBe(text(PROJECT_FILE))
  expect(toml?.after).toBe(changeProject(text(PROJECT_FILE), PROJECT_CHANGE))
  // The new level is not in the game yet.
  expect(shown.answer.value.changes.find((c) => c.path === ROOM_4)?.before).toBeUndefined()
})

test('it approves: the new level, its lines and the world file are in the game, the branch is gone', async () => {
  const res = await approve()
  expect(res.answer).toEqual({ ok: true, value: true })
  expect(repo().pulls[0]?.state).toBe('merged')
  expect(main().has(ROOM_4)).toBe(true)
  expect(main().get(PROJECT_FILE)).toBe(changeProject(text(PROJECT_FILE), PROJECT_CHANGE))
  expect(repo().branches.has('automata/kid')).toBe(false)
})

test('with stop it approves too: the game is loaded with the project file of the change itself', async () => {
  repo().put('main', 'automata.editors.toml', STOP)
  expect((await approve()).answer).toEqual({ ok: true, value: true })
  expect(main().has(ROOM_4)).toBe(true)
})

test('a change that also touches src/main.ts is not here, and cannot be approved', async () => {
  repo().put('automata/kid', 'src/main.ts', 'alert(1)\n')
  expect((await look()).answer).toMatchObject({ ok: true, value: { here: false } })
  expect(problem(await approve())).toBe('not-allowed')
  expect(repo().pulls[0]?.state).toBe('open')
})

test('a change to the project file that is more than level lines is not here', async () => {
  const toml = repo().branches.get('automata/kid')?.get(PROJECT_FILE) ?? ''
  repo().put('automata/kid', PROJECT_FILE, toml.replace('name = "Links Game"', 'name = "Mine Now"'))
  expect((await look()).answer).toMatchObject({ ok: true, value: { here: false } })
  expect(problem(await approve())).toBe('not-allowed')
})

test('a new level in the wrong place is not here', async () => {
  repo().rename('automata/kid', ROOM_4, 'content/characters/room-4.json')
  expect((await look()).answer).toMatchObject({ ok: true, value: { here: false } })
  expect(problem(await approve())).toBe('not-allowed')
})

test('a door into a missing level is approved by default and broken when the game says stop', async () => {
  const back = { ...data(ROOM_3).things[1], values: { to: { level: 'room-9', thing: 'exit' } } }
  const broken = { ...data(ROOM_3), things: [data(ROOM_3).things[0], back] }
  // kid sends it by hand on their own branch, as another tool might.
  repo().put('automata/kid', ROOM_3, writeContent('level', broken as never))
  repo().put('main', 'automata.editors.toml', STOP)
  const stopped = await approve()
  expect([stopped.status, problem(stopped)]).toEqual([422, 'broken'])
  expect(repo().pulls[0]?.state).toBe('open')
  repo().put('main', 'automata.editors.toml', 'format = 1\nproblems = "warn"\n')
  expect((await approve()).answer).toEqual({ ok: true, value: true })
})

test('a second put from a page that is behind writes nothing', async () => {
  const stale = only([{ path: ROOM_3, value: data(ROOM_3), version: version(ROOM_3) }])
  const again = await api.call('kid', 'POST', '/api/put', stale)
  expect(problem(again)).toBe('changed-elsewhere')
  expect(repo().commits.filter((c) => c.branch === 'automata/kid')).toHaveLength(1)
})
