import { beforeAll, expect, test } from 'vitest'
import { openRepo, type Repo, reposOf } from '#src/features/github/github.ts'
import type { Answer } from '#src/features/wire/wire.ts'
import { toBase64 } from '#src/lib/base64.ts'
import { type Call, json, type Routes, recorder, route } from '../../fixtures/fetcher.ts'
import { makeTestKeys } from '../../fixtures/keys.ts'

const REPO = '/repos/grandma/crate-game'
const PULL = {
  number: 3,
  title: 'Move crate-1 in level-1',
  state: 'open',
  created_at: '2026-11-13T12:00:00Z',
  head: { ref: 'automata/kid', sha: 'abc123', repo: { full_name: 'grandma/crate-game' } },
  base: { ref: 'main', repo: { full_name: 'grandma/crate-game' } },
  mergeable: true,
}
const AUTHOR = { name: 'kid', email: '9+kid@users.noreply.github.com' }

let pem = ''
beforeAll(() => {
  pem = makeTestKeys().pkcs1
})

/** The three calls `openRepo` makes, then whatever routes the test adds. */
function harness(extra: Routes = {}, headers: Record<string, string> = {}) {
  const routes: Routes = {
    [`GET ${REPO}/installation`]: () => json({ id: 77 }),
    'POST /app/installations/77/access_tokens': () => json({ token: 'ghs_install' }),
    [`GET ${REPO}`]: () =>
      json({ default_branch: 'main', private: false, owner: { login: 'grandma' } }, 200, headers),
    ...extra,
  }
  const { fetcher, calls } = recorder(route(routes))
  const deps = {
    env: { GITHUB_APP_ID: '12345', GITHUB_APP_PRIVATE_KEY: pem, GITHUB_API_URL: 'http://fake.test' },
    fetcher,
    now: () => Date.UTC(2026, 10, 13, 12),
  }
  const open = async (): Promise<Repo> => {
    const opened = await openRepo(deps, { owner: 'grandma', name: 'crate-game' })
    if (!opened.ok) throw new Error(`openRepo said ${opened.problem}`)
    return opened.value
  }
  return { deps, calls, open }
}

const value = <T>(answer: Answer<T>): T => {
  if (!answer.ok) throw new Error(`expected ok, got ${answer.problem}`)
  return answer.value
}
const problem = <T>(answer: Answer<T>): string => (answer.ok ? 'ok' : answer.problem)
const last = (calls: Call[]): Call => {
  const call = calls.at(-1)
  if (!call) throw new Error('no calls')
  return call
}

test("openRepo asks as the App, then as the installation, and gives the repo's facts", async () => {
  const { calls, open } = harness()
  const repo = await open()
  expect(repo.facts).toEqual({ branch: 'main', isPublic: true, ownerLogin: 'grandma' })
  expect(calls.map((c) => `${c.method} ${new URL(c.url).pathname}`)).toEqual([
    `GET ${REPO}/installation`,
    'POST /app/installations/77/access_tokens',
    `GET ${REPO}`,
  ])
  expect(calls[0]?.headers.get('authorization')).toMatch(/^Bearer [\w-]+\.[\w-]+\.[\w-]+$/)
  expect(calls[1]?.headers.get('authorization')).toBe(calls[0]?.headers.get('authorization'))
  expect(calls[2]?.headers.get('authorization')).toBe('Bearer ghs_install')
})

test("the installation's token is scoped to the one repo, with the four permissions and nothing more", async () => {
  const { calls, open } = harness()
  await open()
  expect(calls[1]?.body).toEqual({
    repositories: ['crate-game'],
    permissions: { contents: 'write', pull_requests: 'write', checks: 'read', metadata: 'read' },
  })
})

test('a repo the editor was not added to is not-found', async () => {
  const { deps } = harness({ [`GET ${REPO}/installation`]: () => json({ message: 'Not Found' }, 404) })
  expect(problem(await openRepo(deps, { owner: 'grandma', name: 'crate-game' }))).toBe('not-found')
})

test('a private repo says so', async () => {
  const { open } = harness({
    [`GET ${REPO}`]: () => json({ default_branch: 'trunk', private: true, owner: { login: 'Grandma' } }),
  })
  expect((await open()).facts).toEqual({ branch: 'trunk', isPublic: false, ownerLogin: 'Grandma' })
})

test('a key or id that is missing is not-set-up and GitHub is never asked', async () => {
  const { deps, calls } = harness()
  const answer = await openRepo(
    { ...deps, env: { GITHUB_API_URL: 'http://fake.test' } },
    { owner: 'o', name: 'n' },
  )
  expect(problem(answer)).toBe('not-set-up')
  expect(calls).toEqual([])
})

test("the installation's token is asked for once per openRepo, not once per call", async () => {
  const { calls, open } = harness({
    [`GET ${REPO}/git/ref/heads/main`]: () => json({ object: { sha: 'c1' } }),
  })
  const repo = await open()
  await repo.branchHead('main')
  await repo.branchHead('main')
  expect(calls.filter((c) => c.url.includes('access_tokens'))).toHaveLength(1)
})

test('branchHead: GET git/ref/heads/{branch}, and not-found for a branch that is not there', async () => {
  const { calls, open } = harness({
    [`GET ${REPO}/git/ref/heads/main`]: () => json({ object: { sha: 'c1' } }),
    [`GET ${REPO}/git/ref/heads/automata/kid`]: () => json({ message: 'Not Found' }, 404),
  })
  const repo = await open()
  expect(value(await repo.branchHead('main'))).toBe('c1')
  expect(last(calls).headers.get('authorization')).toBe('Bearer ghs_install')
  expect(problem(await repo.branchHead('automata/kid'))).toBe('not-found')
})

test('createBranch: POST git/refs, and a branch that already exists is changed-elsewhere', async () => {
  let taken = false
  const { calls, open } = harness({
    [`POST ${REPO}/git/refs`]: () =>
      taken ? json({ message: 'Reference already exists' }, 422) : json({}, 201),
  })
  const repo = await open()
  expect(value(await repo.createBranch('automata/kid', 'c1'))).toBe(true)
  expect(last(calls).body).toEqual({ ref: 'refs/heads/automata/kid', sha: 'c1' })
  taken = true
  expect(problem(await repo.createBranch('automata/kid', 'c1'))).toBe('changed-elsewhere')
})

test('deleteBranch: DELETE git/refs/heads/{branch}', async () => {
  const { calls, open } = harness({
    [`DELETE ${REPO}/git/refs/heads/automata/kid`]: () => new Response(null, { status: 204 }),
  })
  const repo = await open()
  expect(value(await repo.deleteBranch('automata/kid'))).toBe(true)
  expect(last(calls).method).toBe('DELETE')
})

test('readFile: the text is the decoded content, the version is the sha, on the branch asked for', async () => {
  const text = '{"id":"level-1"}\n'
  const wire = toBase64(text).replace(/(.{10})/g, '$1\n')
  const { calls, open } = harness({
    [`GET ${REPO}/contents/content/levels/level-1.json`]: () =>
      json({ type: 'file', content: wire, encoding: 'base64', sha: 'blob1' }),
    [`GET ${REPO}/contents/content`]: () => json([{ name: 'levels' }]),
    [`GET ${REPO}/contents/missing.json`]: () => json({ message: 'Not Found' }, 404),
  })
  const repo = await open()
  expect(value(await repo.readFile('main', 'content/levels/level-1.json'))).toEqual({
    path: 'content/levels/level-1.json',
    text,
    version: 'blob1',
  })
  expect(new URL(last(calls).url).searchParams.get('ref')).toBe('main')
  expect(problem(await repo.readFile('main', 'content'))).toBe('not-found')
  expect(problem(await repo.readFile('main', 'missing.json'))).toBe('not-found')
})

test('a path or branch with a space, # or / in it is encoded segment by segment', async () => {
  const { calls, open } = harness({
    [`GET ${REPO}/contents/content/my%20level%231.json`]: () =>
      json({ type: 'file', content: '', encoding: 'base64', sha: 's' }),
    [`GET ${REPO}/git/ref/heads/automata/grandma`]: () => json({ object: { sha: 'c' } }),
  })
  const repo = await open()
  await repo.readFile('main', 'content/my level#1.json')
  expect(new URL(last(calls).url).pathname).toBe(`${REPO}/contents/content/my%20level%231.json`)
  await repo.branchHead('automata/grandma')
  expect(new URL(last(calls).url).pathname).toBe(`${REPO}/git/ref/heads/automata/grandma`)
})

test('saveFile: PUT contents with the bytes, the version, the branch and the person as author only', async () => {
  const { calls, open } = harness({
    [`PUT ${REPO}/contents/content/levels/level-1.json`]: () =>
      json({ content: { sha: 'blob2' }, commit: { sha: 'commit2' } }, 200),
  })
  const repo = await open()
  const saved = await repo.saveFile({
    branch: 'automata/kid',
    path: 'content/levels/level-1.json',
    text: 'héllo\n',
    version: 'blob1',
    message: 'Move crate-1 in level-1',
    author: AUTHOR,
  })
  expect(value(saved)).toEqual({ version: 'blob2', commit: 'commit2' })
  expect(last(calls).body).toEqual({
    message: 'Move crate-1 in level-1',
    content: toBase64('héllo\n'),
    sha: 'blob1',
    branch: 'automata/kid',
    author: AUTHOR,
  })
  expect(last(calls).body).not.toHaveProperty('committer')
})

test('saveFile with no version makes a new file: no sha is sent', async () => {
  const { calls, open } = harness({
    [`PUT ${REPO}/contents/new.json`]: () => json({ content: { sha: 'b' }, commit: { sha: 'c' } }, 201),
  })
  const repo = await open()
  await repo.saveFile({
    branch: 'main',
    path: 'new.json',
    text: '{}',
    version: undefined,
    message: 'm',
    author: AUTHOR,
  })
  expect(last(calls).body).not.toHaveProperty('sha')
})

// A 409 or 422 on a save is settled by looking: is the file still the version that was sent?
test.each([409, 422])(
  'saveFile %i: a file that moved on is changed-elsewhere; the same file means a rule refused the App',
  async (status) => {
    let onBranch = 'blob9'
    const { open } = harness({
      [`PUT ${REPO}/contents/f.json`]: () => json({ message: 'nope' }, status),
      [`GET ${REPO}/contents/f.json`]: () =>
        json({ type: 'file', content: '', encoding: 'base64', sha: onBranch }),
    })
    const repo = await open()
    const ask = { branch: 'main', path: 'f.json', text: 'x', version: 'blob1', message: 'm', author: AUTHOR }
    expect(problem(await repo.saveFile(ask))).toBe('changed-elsewhere')
    onBranch = 'blob1'
    expect(problem(await repo.saveFile(ask))).toBe('blocked')
  },
)

test('openPulls: open pulls into the default branch, in the shape the API uses', async () => {
  const { calls, open } = harness({ [`GET ${REPO}/pulls`]: () => json([PULL]) })
  const repo = await open()
  expect(value(await repo.openPulls())).toEqual([
    {
      number: 3,
      title: 'Move crate-1 in level-1',
      head: 'automata/kid',
      headCommit: 'abc123',
      headIsHere: true,
      base: 'main',
      createdAt: Date.UTC(2026, 10, 13, 12),
    },
  ])
  const query = new URL(last(calls).url).searchParams
  expect([query.get('state'), query.get('base'), query.get('per_page')]).toEqual(['open', 'main', '100'])
})

test('a pull from a fork is not here, and so is one whose fork was deleted', async () => {
  const fork = { ...PULL, head: { ...PULL.head, repo: { full_name: 'kid/crate-game' } } }
  const gone = { ...PULL, number: 4, head: { ...PULL.head, repo: null } }
  const { open } = harness({ [`GET ${REPO}/pulls`]: () => json([PULL, fork, gone]) })
  const repo = await open()
  expect(value(await repo.openPulls()).map((p) => p.headIsHere)).toEqual([true, false, false])
})

test('pull: one pull, and not-found for one that is closed, merged or unknown', async () => {
  const { open } = harness({
    [`GET ${REPO}/pulls/3`]: () => json(PULL),
    [`GET ${REPO}/pulls/4`]: () => json({ ...PULL, number: 4, state: 'closed' }),
    [`GET ${REPO}/pulls/5`]: () => json({ message: 'Not Found' }, 404),
  })
  const repo = await open()
  expect(value(await repo.pull(3)).number).toBe(3)
  expect(problem(await repo.pull(4))).toBe('not-found')
  expect(problem(await repo.pull(5))).toBe('not-found')
})

test('pullPaths: every path it changes, old names included; a hundred or more is too big to judge', async () => {
  let files: { filename: string; previous_filename?: string }[] = [
    { filename: 'content/levels/level-1.json' },
    { filename: 'new.json', previous_filename: 'content/levels/old.json' },
  ]
  const { calls, open } = harness({ [`GET ${REPO}/pulls/3/files`]: () => json(files) })
  const repo = await open()
  expect(value(await repo.pullPaths(3))).toEqual([
    'content/levels/level-1.json',
    'new.json',
    'content/levels/old.json',
  ])
  expect(new URL(last(calls).url).searchParams.get('per_page')).toBe('100')
  files = Array.from({ length: 100 }, (_, i) => ({ filename: `f${i}` }))
  expect(problem(await repo.pullPaths(3))).toBe('not-allowed')
})

test('createPull: POST pulls from the branch into the default branch', async () => {
  const { calls, open } = harness({ [`POST ${REPO}/pulls`]: () => json(PULL, 201) })
  const repo = await open()
  expect(value(await repo.createPull({ branch: 'automata/kid', title: 'T', body: 'B' })).number).toBe(3)
  expect(last(calls).body).toEqual({ title: 'T', body: 'B', head: 'automata/kid', base: 'main' })
})

test('createPull when one is already open for that branch gives that one', async () => {
  const { open } = harness({
    [`POST ${REPO}/pulls`]: () => json({ message: 'A pull request already exists' }, 422),
    [`GET ${REPO}/pulls`]: () => json([PULL]),
  })
  const repo = await open()
  expect(value(await repo.createPull({ branch: 'automata/kid', title: 'T', body: 'B' })).number).toBe(3)
})

test('mergePull: PUT merge with a merge commit and the head that was judged', async () => {
  const { calls, open } = harness({ [`PUT ${REPO}/pulls/3/merge`]: () => json({ merged: true }) })
  const repo = await open()
  const merged = await repo.mergePull(3, {
    title: 'Approve: T',
    message: 'Approved by grandpa.',
    headCommit: 'abc123',
  })
  expect(value(merged)).toBe(true)
  expect(last(calls).body).toEqual({
    merge_method: 'merge',
    commit_title: 'Approve: T',
    commit_message: 'Approved by grandpa.',
    sha: 'abc123',
  })
})

// B7: GitHub's 405 means "cannot be merged": a clash, or a rule the App is not past. Settle it by looking.
test('mergePull 405: a pull that cannot merge cleanly is clashes; otherwise a rule refused the App', async () => {
  let mergeable: boolean | null = false
  const { open } = harness({
    [`PUT ${REPO}/pulls/3/merge`]: () => json({ message: 'not mergeable' }, 405),
    [`GET ${REPO}/pulls/3`]: () => json({ ...PULL, mergeable }),
  })
  const repo = await open()
  const ask = { title: 't', message: 'm', headCommit: 'abc123' }
  expect(problem(await repo.mergePull(3, ask))).toBe('clashes')
  mergeable = true
  expect(problem(await repo.mergePull(3, ask))).toBe('blocked')
  mergeable = null
  expect(problem(await repo.mergePull(3, ask))).toBe('blocked')
})

test('mergePull 409 is a head that moved: changed-elsewhere', async () => {
  const { open } = harness({
    [`PUT ${REPO}/pulls/3/merge`]: () => json({ message: 'Head branch was modified' }, 409),
  })
  const repo = await open()
  expect(problem(await repo.mergePull(3, { title: 't', message: 'm', headCommit: 'old' }))).toBe(
    'changed-elsewhere',
  )
})

test('closePull: PATCH the pull to closed', async () => {
  const { calls, open } = harness({ [`PATCH ${REPO}/pulls/3`]: () => json({ ...PULL, state: 'closed' }) })
  const repo = await open()
  expect(value(await repo.closePull(3))).toBe(true)
  expect(last(calls).body).toEqual({ state: 'closed' })
})

test.each([
  ['no runs', [], 'none'],
  [
    'one still going',
    [
      { status: 'in_progress', conclusion: null },
      { status: 'completed', conclusion: 'success' },
    ],
    'running',
  ],
  [
    'one failed',
    [
      { status: 'completed', conclusion: 'failure' },
      { status: 'completed', conclusion: 'success' },
    ],
    'failing',
  ],
  [
    'all fine, some skipped or neutral',
    [
      { status: 'completed', conclusion: 'success' },
      { status: 'completed', conclusion: 'skipped' },
      { status: 'completed', conclusion: 'neutral' },
    ],
    'passing',
  ],
])('checks: %s is %s', async (_name, runs, want) => {
  const { calls, open } = harness({
    [`GET ${REPO}/commits/abc123/check-runs`]: () => json({ total_count: runs.length, check_runs: runs }),
  })
  const repo = await open()
  expect(value(await repo.checks('abc123'))).toBe(want)
  expect(new URL(last(calls).url).searchParams.get('per_page')).toBe('100')
})

// B5: GET /users/{login} is for an installation's token. A JWT would be refused by the real GitHub.
test("userExists: asked with the installation's token, true for 200 and false for 404", async () => {
  const harnessed = harness({
    'GET /users/grandpa': () => json({ login: 'grandpa' }),
    'GET /users/nobody': () => json({ message: 'Not Found' }, 404),
  })
  const repo = await harnessed.open()
  expect(value(await repo.userExists('grandpa'))).toBe(true)
  expect(last(harnessed.calls).headers.get('authorization')).toBe('Bearer ghs_install')
  expect(value(await repo.userExists('nobody'))).toBe(false)
})

test('the allowance left is read from what GitHub says, as a share of the whole', async () => {
  const { open } = harness({}, { 'x-ratelimit-remaining': '1000', 'x-ratelimit-limit': '5000' })
  expect((await open()).allowance()).toBeCloseTo(0.2)
  const quiet = harness()
  expect((await quiet.open()).allowance()).toBeUndefined()
})

test("reposOf asks with the person's own token: the installations, then each one's repos", async () => {
  const { fetcher, calls } = recorder(
    route({
      'GET /user/installations': () => json({ installations: [{ id: 77 }, { id: 78 }] }),
      'GET /user/installations/77/repositories': () =>
        json({ repositories: [{ name: 'crate-game', owner: { login: 'grandma' } }] }),
      'GET /user/installations/78/repositories': () =>
        json({ repositories: [{ name: 'other', owner: { login: 'grandpa' } }] }),
    }),
  )
  const deps = { env: { GITHUB_API_URL: 'http://fake.test' }, fetcher, now: () => 0 }
  expect(value(await reposOf(deps, 'ghu_person'))).toEqual([
    { owner: 'grandma', name: 'crate-game' },
    { owner: 'grandpa', name: 'other' },
  ])
  for (const call of calls) expect(call.headers.get('authorization')).toBe('Bearer ghu_person')
  expect(new URL(calls[1]?.url ?? '').searchParams.get('per_page')).toBe('100')
})

test('reposOf with a token GitHub refuses is signed-out', async () => {
  const { fetcher } = recorder(
    route({ 'GET /user/installations': () => json({ message: 'Bad credentials' }, 401) }),
  )
  const answer = await reposOf(
    { env: { GITHUB_API_URL: 'http://fake.test' }, fetcher, now: () => 0 },
    'ghu_old',
  )
  expect(problem(answer)).toBe('signed-out')
})

test('no token and no key appears in any returned value or thrown message', async () => {
  const { open } = harness({
    [`GET ${REPO}/git/ref/heads/x`]: () => json({ message: 'ghs_install is bad' }, 418),
  })
  const repo = await open()
  const answer = await repo.branchHead('x')
  const seen = JSON.stringify([repo.facts, answer])
  expect(seen).not.toContain('ghs_install')
  expect(seen).not.toContain('PRIVATE KEY')
  const badKey = await openRepo(
    {
      env: { GITHUB_APP_ID: '1', GITHUB_APP_PRIVATE_KEY: 'not a key', GITHUB_API_URL: 'http://fake.test' },
      fetcher: recorder(route({})).fetcher,
      now: () => 0,
    },
    { owner: 'o', name: 'n' },
  )
  expect(JSON.stringify(badKey)).not.toContain('not a key')
})
