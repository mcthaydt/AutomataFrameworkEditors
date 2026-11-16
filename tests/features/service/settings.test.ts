import { afterAll, beforeAll, beforeEach, expect, test } from 'vitest'
import { writeAccess } from '#src/features/access/access.ts'
import { EDITORS_FILE, type EditorsFile, writeEditors } from '#src/features/files/files.ts'
import type { Answer, OpenAnswer } from '#src/features/wire/wire.ts'
import { DEMO, startTestApi, type TestApi } from '../../fixtures/api.ts'
import { blobSha, type FakeRepo } from '../../fixtures/fake-github/repos.ts'

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

const GAME = { owner: 'grandma', name: 'crate-game' }
const repo = (): FakeRepo => api.fake.repos.get(DEMO)!
type Person = Parameters<TestApi['call']>[0]
const STOP: EditorsFile = { format: 1, problems: 'stop' }
const settings = (person: Person, editors: unknown, version?: string) =>
  api.call<EditorsFile>(person, 'POST', '/api/settings', {
    game: GAME,
    editors,
    ...(version === undefined ? {} : { version }),
  })
const problem = (r: { answer: Answer<unknown> }): string | undefined =>
  r.answer.ok ? undefined : r.answer.problem

test('the Owner changes how strict the editors are: one commit of the settings file on the default branch', async () => {
  const res = await settings('grandma', STOP)
  expect(res.answer).toEqual({ ok: true, value: STOP })
  expect(repo().commits).toHaveLength(1)
  expect(repo().commits[0]).toMatchObject({ branch: 'main', author: 'grandma' })
  expect(repo().commits[0]?.files.map((f) => f.path)).toEqual([EDITORS_FILE])
  expect(repo().branches.get('main')?.get(EDITORS_FILE)).toBe(writeEditors(STOP))
  expect(repo().pulls).toEqual([])
})

test('a person who approves, edits, suggests or looks may not, and nothing is written', async () => {
  for (const person of ['grandpa', 'stranger', 'kid'] as const) {
    expect(problem(await settings(person, STOP))).toBe('not-allowed')
  }
  expect(repo().commits).toEqual([])
  expect(repo().branches.get('main')?.has(EDITORS_FILE)).toBe(false)
})

test('a visitor is signed-out', async () => {
  expect(problem(await settings('visitor', STOP))).toBe('signed-out')
  expect(repo().commits).toEqual([])
})

test('a file that is already there is changed on the version the Owner started from', async () => {
  repo().put('main', EDITORS_FILE, writeEditors({ format: 1, problems: 'warn' }))
  const was = blobSha(writeEditors({ format: 1, problems: 'warn' }))
  const res = await settings('grandma', STOP, was)
  expect(res.answer.ok).toBe(true)
  expect(repo().branches.get('main')?.get(EDITORS_FILE)).toBe(writeEditors(STOP))
})

test("a version that is not the file's any more is changed-elsewhere, and nothing is written", async () => {
  repo().put('main', EDITORS_FILE, writeEditors({ format: 1, problems: 'warn' }))
  const commits = repo().commits.length
  expect(problem(await settings('grandma', STOP, blobSha('something else')))).toBe('changed-elsewhere')
  expect(problem(await settings('grandma', STOP))).toBe('changed-elsewhere')
  expect(repo().commits).toHaveLength(commits)
})

test('settings the file could not hold are bad-request', async () => {
  expect(problem(await settings('grandma', { format: 1, problems: 'sometimes' }))).toBe('bad-request')
  expect(problem(await settings('grandma', { format: 2, problems: 'stop' }))).toBe('bad-request')
  expect(problem(await settings('grandma', { format: 1 }))).toBe('bad-request')
  expect(problem(await settings('grandma', { format: 1, problems: 'stop', more: true }))).toBe('bad-request')
  expect(problem(await settings('grandma', 'stop'))).toBe('bad-request')
  const lost = await api.call('grandma', 'POST', '/api/settings', { game: 'nope', editors: STOP })
  expect(problem(lost)).toBe('bad-request')
  expect(repo().commits).toEqual([])
})

test('the same settings again write nothing', async () => {
  repo().put('main', EDITORS_FILE, writeEditors(STOP))
  const commits = repo().commits.length
  const res = await settings('grandma', STOP, blobSha(writeEditors(STOP)))
  expect(res.answer).toEqual({ ok: true, value: STOP })
  expect(repo().commits).toHaveLength(commits)
})

const open = async (person: Person): Promise<OpenAnswer> => {
  const res = await api.call<OpenAnswer>(person, 'GET', '/api/game?owner=grandma&name=crate-game')
  if (!res.answer.ok) throw new Error(`not opened: ${res.answer.problem}`)
  return res.answer.value
}

test('opening a game gives everyone its settings: the default with no file, the file when there is one', async () => {
  expect((await open('kid')).editors).toEqual({ format: 1, problems: 'warn' })
  repo().put('main', EDITORS_FILE, writeEditors(STOP))
  expect((await open('kid')).editors).toEqual(STOP)
  expect((await open('stranger')).editors).toEqual(STOP)
  expect((await open('visitor')).editors).toEqual(STOP)
})

test('a settings file that cannot be read opens as the default, and the game still opens', async () => {
  repo().put('main', EDITORS_FILE, 'problems = "stop"\n')
  expect((await open('kid')).editors).toEqual({ format: 1, problems: 'warn' })
})
