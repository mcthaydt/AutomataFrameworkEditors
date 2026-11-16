// Repo's several-files-in-one-commit calls, against the pretend GitHub (which learned blobs, trees, commits and a ref
// update): the real request code, a real answer from the pretend server.
import { afterAll, beforeAll, beforeEach, expect, test } from 'vitest'
import { openRepo, type Repo } from '#src/features/github/github.ts'
import type { Answer } from '#src/features/wire/wire.ts'
import { blobSha } from '../../fixtures/fake-github/repos.ts'
import { type FakeGitHub, startFakeGitHub } from '../../fixtures/fake-github/server.ts'
import { fixtureFiles, LEVEL_PATH } from '../../fixtures/game/read.ts'

let fake: FakeGitHub
beforeAll(async () => {
  fake = await startFakeGitHub(0, 'http://site.test')
})
afterAll(() => fake.close())
beforeEach(() => fake.reset())

const AUTHOR = { name: 'kid', email: '9+kid@users.noreply.github.com' }
const NEW_PATH = 'content/levels/level-2.json'
const GONE_PATH = 'content/tunings/hero-moves.json'
const crate = () => {
  const repo = fake.repos.get('grandma/crate-game')
  if (repo === undefined) throw new Error('no crate game')
  return repo
}
const value = <T>(answer: Answer<T>): T => {
  if (!answer.ok) throw new Error(`expected ok, got ${answer.problem}`)
  return answer.value
}

/** `beforeRequest` runs before each call reaches the pretend GitHub: a way to change things in between. */
async function open(beforeRequest?: (method: string, url: string) => void): Promise<Repo> {
  const fetcher: typeof fetch = async (input, init) => {
    beforeRequest?.(init?.method ?? 'GET', String(input))
    return fetch(input, init)
  }
  const opened = await openRepo(
    { env: fake.env, fetcher, now: () => Date.now() },
    { owner: 'grandma', name: 'crate-game' },
  )
  return value(opened)
}
const versionOf = async (repo: Repo, path: string) => value(await repo.readFile('main', path)).version

test('three files, one changed, one new, one taken away, land in one commit', async () => {
  const repo = await open()
  const done = value(
    await repo.commitFiles({
      branch: 'main',
      files: [
        { path: LEVEL_PATH, text: '{"changed":true}\n', version: await versionOf(repo, LEVEL_PATH) },
        { path: NEW_PATH, text: '{"new":true}\n', version: undefined },
        { path: GONE_PATH, text: undefined, version: await versionOf(repo, GONE_PATH) },
      ],
      message: 'Three files',
      author: AUTHOR,
    }),
  )
  const files = crate().branches.get('main')
  expect(files?.get(LEVEL_PATH)).toBe('{"changed":true}\n')
  expect(files?.get(NEW_PATH)).toBe('{"new":true}\n')
  expect(files?.has(GONE_PATH)).toBe(false)
  expect(files?.get('automata.toml')).toBe(fixtureFiles['automata.toml'])
  expect(crate().commits).toHaveLength(1)
  expect(crate().commits[0]).toMatchObject({ branch: 'main', message: 'Three files', author: 'kid' })
  expect(
    crate()
      .commits[0]?.files.map((f) => f.path)
      .sort(),
  ).toEqual([GONE_PATH, LEVEL_PATH, NEW_PATH])
  expect(crate().heads.get('main')).toBe(done.commit)
  expect(done.versions).toEqual({
    [LEVEL_PATH]: blobSha('{"changed":true}\n'),
    [NEW_PATH]: blobSha('{"new":true}\n'),
  })
  // The version it gives is the version GitHub reads back.
  expect(await versionOf(repo, NEW_PATH)).toBe(done.versions[NEW_PATH])
})

test('one stale version writes nothing and names that path', async () => {
  const repo = await open()
  const started = await versionOf(repo, LEVEL_PATH)
  crate().put('main', LEVEL_PATH, '{"someone":"else"}\n')
  const before = crate().heads.get('main')
  const answer = await repo.commitFiles({
    branch: 'main',
    files: [
      { path: NEW_PATH, text: '{"new":true}\n', version: undefined },
      { path: LEVEL_PATH, text: '{"mine":true}\n', version: started },
    ],
    message: 'Stale',
    author: AUTHOR,
  })
  expect(answer).toEqual({ ok: false, problem: 'changed-elsewhere', details: [LEVEL_PATH] })
  expect(crate().commits).toEqual([])
  expect(crate().heads.get('main')).toBe(before)
  expect(crate().branches.get('main')?.has(NEW_PATH)).toBe(false)
})

test('a new file that appeared meanwhile is also changed-elsewhere', async () => {
  const repo = await open()
  crate().put('main', NEW_PATH, 'theirs\n')
  const answer = await repo.commitFiles({
    branch: 'main',
    files: [{ path: NEW_PATH, text: 'mine\n', version: undefined }],
    message: 'Clash',
    author: AUTHOR,
  })
  expect(answer).toEqual({ ok: false, problem: 'changed-elsewhere', details: [NEW_PATH] })
  expect(crate().branches.get('main')?.get(NEW_PATH)).toBe('theirs\n')
})

test('a branch that moved between reading and writing writes nothing', async () => {
  const repo = await open((method, url) => {
    if (method === 'POST' && url.endsWith('/git/commits')) {
      crate().put('main', 'README.md', 'someone moved main\n')
    }
  })
  const before = crate().branches.get('main')?.get(LEVEL_PATH)
  const answer = await repo.commitFiles({
    branch: 'main',
    files: [{ path: LEVEL_PATH, text: '{"mine":true}\n', version: await versionOf(repo, LEVEL_PATH) }],
    message: 'Raced',
    author: AUTHOR,
  })
  expect(answer).toMatchObject({ ok: false, problem: 'changed-elsewhere' })
  expect(crate().branches.get('main')?.get(LEVEL_PATH)).toBe(before)
  expect(crate().commits).toEqual([])
})

test('a rule that refuses the App is blocked, and writes nothing', async () => {
  const repo = await open()
  crate().rule = 'blocks-app'
  const answer = await repo.commitFiles({
    branch: 'main',
    files: [{ path: NEW_PATH, text: 'x\n', version: undefined }],
    message: 'Refused',
    author: AUTHOR,
  })
  expect(answer).toEqual({ ok: false, problem: 'blocked' })
  expect(crate().branches.get('main')?.has(NEW_PATH)).toBe(false)
})

test('history: newest first, only commits under the folder, in one request', async () => {
  const repo = await open()
  const commit = async (path: string, text: string, message: string) => {
    const there = crate().branches.get('main')?.has(path) === true
    const version = there ? await versionOf(repo, path) : undefined
    return value(
      await repo.commitFiles({
        branch: 'main',
        files: [{ path, text, version }],
        message,
        author: AUTHOR,
      }),
    )
  }
  await commit('content/levels/a.json', '1\n', 'first level')
  await commit('content/tunings/t.json', '1\n', 'a tuning')
  const third = await commit('content/levels/b.json', '2\n', 'second level')
  const before = fake.log.length
  const rows = value(await repo.history('main', 'content/levels', 10))
  expect(fake.log.slice(before).filter((r) => r.path.endsWith('/commits'))).toHaveLength(1)
  expect(fake.log.length - before).toBe(1)
  expect(rows.map((r) => r.message)).toEqual(['second level', 'first level'])
  expect(rows[0]).toMatchObject({ commit: third.commit, by: 'kid' })
  expect(Math.abs((rows[0]?.at ?? 0) - Date.now())).toBeLessThan(60_000)
  expect(value(await repo.history('main', 'content/levels', 1))).toHaveLength(1)
  expect(value(await repo.history('main', 'src', 10))).toEqual([])
})

test('commitPaths gives the paths one commit touched, in one request', async () => {
  const repo = await open()
  const done = value(
    await repo.commitFiles({
      branch: 'main',
      files: [
        { path: NEW_PATH, text: 'x\n', version: undefined },
        { path: GONE_PATH, text: undefined, version: await versionOf(repo, GONE_PATH) },
      ],
      message: 'Two',
      author: AUTHOR,
    }),
  )
  const before = fake.log.length
  expect(value(await repo.commitPaths(done.commit)).sort()).toEqual([GONE_PATH, NEW_PATH])
  expect(fake.log.length - before).toBe(1)
})

test('a commit on a waiting branch leaves main alone', async () => {
  const repo = await open()
  const head = value(await repo.branchHead('main'))
  value(await repo.createBranch('automata/kid', head))
  value(
    await repo.commitFiles({
      branch: 'automata/kid',
      files: [{ path: NEW_PATH, text: 'x\n', version: undefined }],
      message: 'Suggest',
      author: AUTHOR,
    }),
  )
  expect(crate().branches.get('automata/kid')?.has(NEW_PATH)).toBe(true)
  expect(crate().branches.get('main')?.has(NEW_PATH)).toBe(false)
  expect(value(await repo.history('automata/kid', 'content', 5)).map((r) => r.message)).toEqual(['Suggest'])
})
