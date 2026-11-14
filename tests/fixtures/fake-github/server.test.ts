import { createHash } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, expect, test } from 'vitest'
import { appJwt, openRepo, reposOf } from '#src/features/github/github.ts'
import { fromBase64 } from '#src/lib/base64.ts'
import { fixtureFiles, LEVEL_PATH } from '../game/read.ts'
import { makeKeys } from './keys.ts'
import { type FakeGitHub, PEOPLE, startFakeGitHub } from './server.ts'

const SITE = 'http://site.test'
const REPO = '/repos/grandma/crate-game'
let fake: FakeGitHub

beforeAll(async () => {
  fake = await startFakeGitHub(0, SITE)
})
afterAll(() => fake.close())
beforeEach(() => fake.reset())

const blobSha = (text: string): string =>
  createHash('sha1')
    .update(`blob ${Buffer.byteLength(text)}\0`)
    .update(text)
    .digest('hex')

interface Ask {
  method?: string
  as?: string
  body?: unknown
  query?: string
  headers?: Record<string, string>
}
async function gh(path: string, ask: Ask = {}): Promise<{ status: number; body: any; headers: Headers }> {
  const res = await fetch(`${fake.url}${path}${ask.query ?? ''}`, {
    method: ask.method ?? 'GET',
    redirect: 'manual',
    headers: {
      ...(ask.as ? { authorization: `Bearer ${ask.as}` } : {}),
      ...(ask.body === undefined ? {} : { 'content-type': 'application/json' }),
      ...ask.headers,
    },
    ...(ask.body === undefined ? {} : { body: JSON.stringify(ask.body) }),
  })
  const text = await res.text()
  let body: unknown
  try {
    body = text === '' ? undefined : JSON.parse(text)
  } catch {
    body = text
  }
  return { status: res.status, body, headers: res.headers }
}

const jwt = (): Promise<string> =>
  appJwt(fake.env.GITHUB_APP_ID ?? '', fake.env.GITHUB_APP_PRIVATE_KEY ?? '', Date.now())
async function installation(repo = 'crate-game'): Promise<string> {
  const minted = await gh('/app/installations/1/access_tokens', {
    method: 'POST',
    as: await jwt(),
    body: { repositories: [repo], permissions: { contents: 'write' } },
  })
  return minted.body.token
}
const main = () => {
  const repo = fake.repos.get('grandma/crate-game')
  if (!repo) throw new Error('no crate-game')
  return repo
}
const level = (): string => fixtureFiles[LEVEL_PATH] ?? ''
const moved = (): string => level().replace('"x": 6.5', '"x": 8.5')

// ---- sign-in -------------------------------------------------------------------------------------------------

test('authorize: allow sends the person back with a code and the same state', async () => {
  const res = await gh('/login/oauth/authorize', {
    query: '?client_id=fake-client&redirect_uri=http://site.test/&state=abc',
  })
  expect(res.status).toBe(302)
  const to = new URL(res.headers.get('location') ?? '')
  expect(to.origin + to.pathname).toBe('http://site.test/')
  expect(to.searchParams.get('state')).toBe('abc')
  expect(to.searchParams.get('code')).toBeTruthy()
})

test('authorize: deny sends them back with access_denied and the state', async () => {
  fake.signIn = 'deny'
  const res = await gh('/login/oauth/authorize', {
    query: '?client_id=fake-client&redirect_uri=http://site.test/&state=abc',
  })
  const to = new URL(res.headers.get('location') ?? '')
  expect(to.searchParams.get('error')).toBe('access_denied')
  expect(to.searchParams.get('state')).toBe('abc')
  expect(to.searchParams.get('code')).toBeNull()
})

async function signInAs(person: string): Promise<{ code: string }> {
  fake.person = person as (typeof PEOPLE)[number]
  const res = await gh('/login/oauth/authorize', {
    query: '?client_id=fake-client&redirect_uri=http://site.test/&state=s',
  })
  return { code: new URL(res.headers.get('location') ?? '').searchParams.get('code') ?? '' }
}
const swap = (body: Record<string, string>) =>
  gh('/login/oauth/access_token', {
    method: 'POST',
    body: { client_id: 'fake-client', client_secret: 'fake-secret', ...body },
  })

test('access_token: a code gives tokens, and works once', async () => {
  const { code } = await signInAs('grandpa')
  const first = await swap({ code })
  expect(first.status).toBe(200)
  expect(first.body.access_token).toMatch(/^ghu_/)
  expect(first.body.refresh_token).toMatch(/^ghr_/)
  expect((await swap({ code })).body).toMatchObject({ error: 'bad_verification_code' })
})

test('access_token: the wrong secret or a made-up code is a 200 with an error, as GitHub does it', async () => {
  const { code } = await signInAs('grandpa')
  const wrong = await gh('/login/oauth/access_token', {
    method: 'POST',
    body: { client_id: 'fake-client', client_secret: 'no', code },
  })
  expect(wrong.status).toBe(200)
  expect(wrong.body.error).toBeTruthy()
  expect((await swap({ code: 'made-up' })).body.error).toBe('bad_verification_code')
})

test('access_token: a refresh token gives a new pair, once', async () => {
  const first = (await swap({ code: (await signInAs('kid')).code })).body
  const next = await swap({ grant_type: 'refresh_token', refresh_token: first.refresh_token })
  expect(next.body.access_token).toMatch(/^ghu_/)
  expect(next.body.access_token).not.toBe(first.access_token)
  expect((await swap({ grant_type: 'refresh_token', refresh_token: first.refresh_token })).body.error).toBe(
    'bad_refresh_token',
  )
})

const basic = (id: string, secret: string) => ({ authorization: `Basic ${btoa(`${id}:${secret}`)}` })
const who = (token: string, creds = basic('fake-client', 'fake-secret')) =>
  gh('/applications/fake-client/token', { method: 'POST', headers: creds, body: { access_token: token } })

test('applications/{id}/token: the person a working token belongs to; 404 otherwise', async () => {
  const token = fake.tokenFor('grandpa')
  const ok = await who(token)
  expect(ok.status).toBe(200)
  expect(ok.body.user.login).toBe('grandpa')
  expect(typeof ok.body.user.id).toBe('number')
  expect((await who('ghu_nope')).status).toBe(404)
  expect((await who(token, basic('fake-client', 'wrong'))).status).toBe(401)
})

test('installations/new: marks the repos the person owns as installed and sends them back to the site', async () => {
  main().installed = false
  fake.person = 'grandma'
  const res = await gh('/apps/journey-editor/installations/new')
  expect(res.status).toBe(302)
  expect(res.headers.get('location')).toBe(`${SITE}/?setup_action=install&installation_id=1`)
  expect(main().installed).toBe(true)
})

test('user/installations: the installed repos the person can reach, theirs and ones they were let into', async () => {
  const mine = fake.tokenFor('grandma')
  const list = await gh('/user/installations', { as: mine })
  expect(list.status).toBe(200)
  const owner = list.body.installations[0].id
  const repos = await gh(`/user/installations/${owner}/repositories`, { as: mine, query: '?per_page=100' })
  expect(repos.body.repositories.map((r: any) => `${r.owner.login}/${r.name}`).sort()).toEqual([
    'grandma/crate-game',
    'grandma/not-a-game',
    'grandma/other-game',
  ])
  // grandpa is a collaborator on crate-game only, and kid on nothing.
  main().collaborators.add('grandpa')
  const his = fake.tokenFor('grandpa')
  const theirs = await gh('/user/installations', { as: his })
  const id = theirs.body.installations[0].id
  const seen = await gh(`/user/installations/${id}/repositories`, { as: his })
  expect(seen.body.repositories.map((r: any) => r.name)).toEqual(['crate-game'])
  expect((await gh('/user/installations', { as: fake.tokenFor('kid') })).body.installations).toEqual([])
})

test('a repo that is not installed is not listed', async () => {
  main().installed = false
  const list = await gh('/user/installations', { as: fake.tokenFor('grandma') })
  const repos = await gh(`/user/installations/${list.body.installations[0].id}/repositories`, {
    as: fake.tokenFor('grandma'),
  })
  expect(repos.body.repositories.map((r: any) => r.name)).not.toContain('crate-game')
})

// ---- the App and its installation ----------------------------------------------------------------------------

test('repos/{o}/{n}/installation (App): the installation; 404 when not installed', async () => {
  expect((await gh(`${REPO}/installation`, { as: await jwt() })).status).toBe(200)
  main().installed = false
  expect((await gh(`${REPO}/installation`, { as: await jwt() })).status).toBe(404)
})

test('a pass signed with some other key, or run out, is 401', async () => {
  const other = makeKeys()
  const stranger = await appJwt('4242', other.privatePem, Date.now())
  expect((await gh(`${REPO}/installation`, { as: stranger })).status).toBe(401)
  const old = await appJwt(
    fake.env.GITHUB_APP_ID ?? '',
    fake.env.GITHUB_APP_PRIVATE_KEY ?? '',
    Date.now() - 3_600_000,
  )
  expect((await gh(`${REPO}/installation`, { as: old })).status).toBe(401)
})

// B5: GitHub accepts the App's own pass on the App's own calls only. The pretend one does the same.
test("the App's pass is refused everywhere but its own two kinds of call", async () => {
  const pass = await jwt()
  for (const path of ['/users/grandpa', REPO, `${REPO}/contents/automata.toml`, '/user/installations']) {
    expect((await gh(path, { as: pass })).status, path).toBe(401)
  }
})

test('access_tokens: a token for the repo asked for, and only that repo', async () => {
  const token = await installation('crate-game')
  expect(token).toMatch(/^ghs_/)
  expect((await gh(REPO, { as: token })).status).toBe(200)
  expect((await gh('/repos/grandma/other-game', { as: token })).status).toBe(404)
})

test('access_tokens: the repo must be named, and must be installed', async () => {
  expect(
    (await gh('/app/installations/1/access_tokens', { method: 'POST', as: await jwt(), body: {} })).status,
  ).toBe(422)
  main().installed = false
  expect(
    (
      await gh('/app/installations/1/access_tokens', {
        method: 'POST',
        as: await jwt(),
        body: { repositories: ['crate-game'] },
      })
    ).status,
  ).toBe(422)
})

test("a person's token is refused where an installation's is wanted, and the other way round", async () => {
  expect((await gh(REPO, { as: fake.tokenFor('grandma') })).status).toBe(401)
  expect((await gh('/user/installations', { as: await installation() })).status).toBe(401)
})

test('users/{login} (installation): 200 for one of the people, 404 for anyone else', async () => {
  const token = await installation()
  for (const person of PEOPLE) expect((await gh(`/users/${person}`, { as: token })).status).toBe(200)
  expect((await gh('/users/nobody', { as: token })).status).toBe(404)
})

test('repos/{o}/{n}: the default branch, whether it is private, and the owner', async () => {
  const token = await installation()
  expect((await gh(REPO, { as: token })).body).toMatchObject({
    default_branch: 'main',
    private: false,
    owner: { login: 'grandma' },
  })
  main().isPublic = false
  expect((await gh(REPO, { as: token })).body.private).toBe(true)
})

// ---- branches, files, pulls ----------------------------------------------------------------------------------

test('git refs: read a branch, make one, delete one; 422 for one that exists or does not', async () => {
  const token = await installation()
  const head = (await gh(`${REPO}/git/ref/heads/main`, { as: token })).body.object.sha
  expect(head).toMatch(/^[0-9a-f]{40}$/)
  expect((await gh(`${REPO}/git/ref/heads/automata/kid`, { as: token })).status).toBe(404)
  const made = await gh(`${REPO}/git/refs`, {
    method: 'POST',
    as: token,
    body: { ref: 'refs/heads/automata/kid', sha: head },
  })
  expect(made.status).toBe(201)
  expect(main().branches.get('automata/kid')).toEqual(main().branches.get('main'))
  expect(
    (
      await gh(`${REPO}/git/refs`, {
        method: 'POST',
        as: token,
        body: { ref: 'refs/heads/automata/kid', sha: head },
      })
    ).status,
  ).toBe(422)
  expect((await gh(`${REPO}/git/refs/heads/automata/kid`, { method: 'DELETE', as: token })).status).toBe(204)
  expect(main().branches.has('automata/kid')).toBe(false)
  expect((await gh(`${REPO}/git/refs/heads/automata/kid`, { method: 'DELETE', as: token })).status).toBe(422)
})

test('contents: base64 with a line break every 60 characters, the blob sha, 404 for what is not there', async () => {
  const token = await installation()
  const got = await gh(`${REPO}/contents/${LEVEL_PATH}`, { as: token, query: '?ref=main' })
  expect(got.body.encoding).toBe('base64')
  expect(got.body.sha).toBe(blobSha(level()))
  expect(fromBase64(got.body.content)).toBe(level())
  for (const line of String(got.body.content).trimEnd().split('\n').slice(0, -1))
    expect(line).toHaveLength(60)
  expect((await gh(`${REPO}/contents/nope.json`, { as: token, query: '?ref=main' })).status).toBe(404)
  expect((await gh(`${REPO}/contents/${LEVEL_PATH}`, { as: token, query: '?ref=nobranch' })).status).toBe(404)
  expect(Array.isArray((await gh(`${REPO}/contents/content`, { as: token, query: '?ref=main' })).body)).toBe(
    true,
  )
})

const put = (token: string, branch: string, text: string, sha: string | undefined, path = LEVEL_PATH) =>
  gh(`${REPO}/contents/${path}`, {
    method: 'PUT',
    as: token,
    body: {
      message: 'Move crate-1',
      content: Buffer.from(text).toString('base64'),
      branch,
      ...(sha ? { sha } : {}),
      author: { name: 'kid', email: 'k@x' },
    },
  })

test('contents PUT: a new commit on the branch with the author sent', async () => {
  const token = await installation()
  const res = await put(token, 'main', moved(), blobSha(level()))
  expect(res.status).toBe(200)
  expect(res.body.content.sha).toBe(blobSha(moved()))
  expect(main().branches.get('main')?.get(LEVEL_PATH)).toBe(moved())
  expect(main().commits).toEqual([
    expect.objectContaining({
      branch: 'main',
      path: LEVEL_PATH,
      message: 'Move crate-1',
      author: 'kid',
      text: moved(),
    }),
  ])
})

test("contents PUT: a second PUT with the first one's old sha is 409", async () => {
  const token = await installation()
  await put(token, 'main', moved(), blobSha(level()))
  expect((await put(token, 'main', level(), blobSha(level()))).status).toBe(409)
  expect(main().branches.get('main')?.get(LEVEL_PATH)).toBe(moved())
})

test('contents PUT: a sha for a file that is not there, or none for one that is, is 409; a new file is 201', async () => {
  const token = await installation()
  expect((await put(token, 'main', 'x', 'abc', 'new.json')).status).toBe(409)
  expect((await put(token, 'main', moved(), undefined)).status).toBe(409)
  expect((await put(token, 'main', 'x', undefined, 'new.json')).status).toBe(201)
})

test('contents PUT: to a branch that is not there is 404', async () => {
  expect((await put(await installation(), 'automata/none', moved(), blobSha(level()))).status).toBe(404)
})

test('a branch rule: app-bypasses lets the App write to main; blocks-app is 409 and main is unchanged', async () => {
  const token = await installation()
  main().rule = 'app-bypasses'
  expect((await put(token, 'main', moved(), blobSha(level()))).status).toBe(200)
  fake.reset()
  main().rule = 'blocks-app'
  expect((await put(await installation(), 'main', moved(), blobSha(level()))).status).toBe(409)
  expect(main().branches.get('main')?.get(LEVEL_PATH)).toBe(level())
})

async function kidsPull(token: string): Promise<number> {
  const head = (await gh(`${REPO}/git/ref/heads/main`, { as: token })).body.object.sha
  await gh(`${REPO}/git/refs`, {
    method: 'POST',
    as: token,
    body: { ref: 'refs/heads/automata/kid', sha: head },
  })
  await put(token, 'automata/kid', moved(), blobSha(level()))
  const made = await gh(`${REPO}/pulls`, {
    method: 'POST',
    as: token,
    body: { title: 'Move crate-1', body: 'b', head: 'automata/kid', base: 'main' },
  })
  expect(made.status).toBe(201)
  return made.body.number
}

test('pulls: make one, list it, read it, see its files', async () => {
  const token = await installation()
  const number = await kidsPull(token)
  expect(main().pulls).toEqual([
    { number, title: 'Move crate-1', head: 'automata/kid', base: 'main', state: 'open' },
  ])
  const list = await gh(`${REPO}/pulls`, { as: token, query: '?state=open&base=main&per_page=100' })
  expect(list.body).toHaveLength(1)
  expect(list.body[0]).toMatchObject({
    number,
    state: 'open',
    head: { ref: 'automata/kid', repo: { full_name: 'grandma/crate-game' } },
    base: { ref: 'main' },
  })
  const one = await gh(`${REPO}/pulls/${number}`, { as: token })
  expect(one.body.head.sha).toBe(
    (await gh(`${REPO}/git/ref/heads/automata/kid`, { as: token })).body.object.sha,
  )
  expect(one.body.mergeable).toBe(true)
  expect(Date.parse(one.body.created_at)).toBe(fake.clock)
  const files = await gh(`${REPO}/pulls/${number}/files`, { as: token, query: '?per_page=100' })
  expect(files.body).toEqual([expect.objectContaining({ filename: LEVEL_PATH })])
})

test('pulls: a second pull for the same branch, or one with nothing new, is 422', async () => {
  const token = await installation()
  await kidsPull(token)
  const again = await gh(`${REPO}/pulls`, {
    method: 'POST',
    as: token,
    body: { title: 't', body: 'b', head: 'automata/kid', base: 'main' },
  })
  expect(again.status).toBe(422)
  const head = (await gh(`${REPO}/git/ref/heads/main`, { as: token })).body.object.sha
  await gh(`${REPO}/git/refs`, {
    method: 'POST',
    as: token,
    body: { ref: 'refs/heads/automata/empty', sha: head },
  })
  const empty = await gh(`${REPO}/pulls`, {
    method: 'POST',
    as: token,
    body: { title: 't', body: 'b', head: 'automata/empty', base: 'main' },
  })
  expect(empty.status).toBe(422)
})

test('pulls: PATCH closes one, and a closed pull is not listed', async () => {
  const token = await installation()
  const number = await kidsPull(token)
  expect(
    (await gh(`${REPO}/pulls/${number}`, { method: 'PATCH', as: token, body: { state: 'closed' } })).body
      .state,
  ).toBe('closed')
  expect(main().pulls[0]?.state).toBe('closed')
  expect((await gh(`${REPO}/pulls`, { as: token, query: '?state=open' })).body).toEqual([])
})

test("merge: the branch's files become main's, one more commit, the pull is merged", async () => {
  const token = await installation()
  const number = await kidsPull(token)
  const sha = (await gh(`${REPO}/git/ref/heads/automata/kid`, { as: token })).body.object.sha
  const done = await gh(`${REPO}/pulls/${number}/merge`, {
    method: 'PUT',
    as: token,
    body: {
      merge_method: 'merge',
      commit_title: 'Approve: Move',
      commit_message: 'Approved by grandpa.',
      sha,
    },
  })
  expect(done.status).toBe(200)
  expect(main().branches.get('main')?.get(LEVEL_PATH)).toBe(moved())
  expect(main().pulls[0]?.state).toBe('merged')
  expect(main().commits.at(-1)?.message).toContain('Approved by grandpa.')
})

test('merge: a sha that is not the head is 409 and nothing merges', async () => {
  const token = await installation()
  const number = await kidsPull(token)
  const res = await gh(`${REPO}/pulls/${number}/merge`, {
    method: 'PUT',
    as: token,
    body: { merge_method: 'merge', commit_title: 't', commit_message: 'm', sha: 'old' },
  })
  expect(res.status).toBe(409)
  expect(main().branches.get('main')?.get(LEVEL_PATH)).toBe(level())
})

test('merge: a rule that blocks the App is 405 (not 409), and nothing merges', async () => {
  const token = await installation()
  const number = await kidsPull(token)
  main().rule = 'blocks-app'
  const sha = (await gh(`${REPO}/git/ref/heads/automata/kid`, { as: token })).body.object.sha
  const res = await gh(`${REPO}/pulls/${number}/merge`, {
    method: 'PUT',
    as: token,
    body: { merge_method: 'merge', commit_title: 't', commit_message: 'm', sha },
  })
  expect(res.status).toBe(405)
  expect(main().pulls[0]?.state).toBe('open')
  expect((await gh(`${REPO}/pulls/${number}`, { as: token })).body.mergeable).toBe(true)
})

test('merge: a file changed on both sides is 405, the pull says mergeable false, and nothing changes', async () => {
  const token = await installation()
  const number = await kidsPull(token)
  main().put('main', LEVEL_PATH, level().replace('"x": 2.5', '"x": 3.5'))
  const sha = (await gh(`${REPO}/git/ref/heads/automata/kid`, { as: token })).body.object.sha
  const res = await gh(`${REPO}/pulls/${number}/merge`, {
    method: 'PUT',
    as: token,
    body: { merge_method: 'merge', commit_title: 't', commit_message: 'm', sha },
  })
  expect(res.status).toBe(405)
  expect(main().branches.get('main')?.get(LEVEL_PATH)).toBe(level().replace('"x": 2.5', '"x": 3.5'))
  expect((await gh(`${REPO}/pulls/${number}`, { as: token })).body.mergeable).toBe(false)
})

test('check-runs: one run that matches what the repo says, none for none', async () => {
  const token = await installation()
  const sha = (await gh(`${REPO}/git/ref/heads/main`, { as: token })).body.object.sha
  const runs = async () =>
    (await gh(`${REPO}/commits/${sha}/check-runs`, { as: token, query: '?per_page=100' })).body.check_runs
  main().checks = 'none'
  expect(await runs()).toEqual([])
  main().checks = 'passing'
  expect(await runs()).toEqual([expect.objectContaining({ status: 'completed', conclusion: 'success' })])
  main().checks = 'running'
  expect(await runs()).toEqual([expect.objectContaining({ status: 'in_progress', conclusion: null })])
  main().checks = 'failing'
  expect(await runs()).toEqual([expect.objectContaining({ status: 'completed', conclusion: 'failure' })])
})

// ---- the server's own behaviour ------------------------------------------------------------------------------

test('a token of the wrong kind, or none, or one that no longer works, is 401', async () => {
  expect((await gh(REPO)).status).toBe(401)
  expect((await gh(REPO, { as: 'ghs_made-up' })).status).toBe(401)
})

test('after tokensRunOut() the old sign-in token fails and a refresh gives one that works', async () => {
  const pair = (await swap({ code: (await signInAs('grandpa')).code })).body
  expect((await who(pair.access_token)).status).toBe(200)
  fake.tokensRunOut()
  expect((await who(pair.access_token)).status).toBe(404)
  const next = (await swap({ grant_type: 'refresh_token', refresh_token: pair.refresh_token })).body
  expect((await who(next.access_token)).status).toBe(200)
})

test('after signedOutEverywhere() neither the token nor the refresh works', async () => {
  const pair = (await swap({ code: (await signInAs('grandpa')).code })).body
  fake.signedOutEverywhere()
  expect((await who(pair.access_token)).status).toBe(404)
  expect((await swap({ grant_type: 'refresh_token', refresh_token: pair.refresh_token })).body.error).toBe(
    'bad_refresh_token',
  )
})

test('down: every call is dropped', async () => {
  fake.down = true
  await expect(gh(REPO)).rejects.toThrow()
  fake.down = false
  expect((await gh(REPO)).status).toBe(401)
})

test('the log keeps every request, oldest first, and reset() empties it', async () => {
  await gh(REPO)
  await gh('/users/x')
  expect(fake.log.map((r) => `${r.method} ${r.path}`)).toEqual([`GET ${REPO}`, 'GET /users/x'])
  fake.reset()
  expect(fake.log).toEqual([])
})

test('reset() puts the crate back, and the game, the not-a-game and the other game are there', async () => {
  const token = await installation()
  await put(token, 'main', moved(), blobSha(level()))
  fake.reset()
  expect(main().branches.get('main')?.get(LEVEL_PATH)).toBe(level())
  expect(main().commits).toEqual([])
  expect([...fake.repos.keys()].sort()).toEqual([
    'grandma/crate-game',
    'grandma/not-a-game',
    'grandma/other-game',
  ])
  expect(fake.person).toBe('grandma')
  expect(fake.signIn).toBe('allow')
  expect(fake.down).toBe(false)
})

test('the pretend GitHub sends no CORS headers: only the API calls GitHub', async () => {
  const res = await gh(REPO)
  expect(res.headers.get('access-control-allow-origin')).toBeNull()
})

test('it says how much of the allowance is left on every answer', async () => {
  const res = await gh(REPO, { as: await installation() })
  expect(Number(res.headers.get('x-ratelimit-remaining'))).toBeGreaterThan(0)
  expect(Number(res.headers.get('x-ratelimit-limit'))).toBeGreaterThan(0)
  fake.rate = { remaining: 100, limit: 5000 }
  expect((await gh(REPO, { as: await installation() })).headers.get('x-ratelimit-remaining')).toBe('100')
})

// ---- the real code against it: the two halves must agree ---------------------------------------------------

test('the real openRepo and each Repo method work against the pretend GitHub', async () => {
  const deps = { env: fake.env, fetcher: fetch, now: () => Date.now() }
  const opened = await openRepo(deps, { owner: 'grandma', name: 'crate-game' })
  if (!opened.ok) throw new Error(opened.problem)
  const repo = opened.value
  expect(repo.facts).toEqual({ branch: 'main', isPublic: true, ownerLogin: 'grandma', ownerIsOrg: false })
  const head = await repo.branchHead('main')
  if (!head.ok) throw new Error(head.problem)
  const file = await repo.readFile('main', LEVEL_PATH)
  if (!file.ok) throw new Error(file.problem)
  expect(file.value).toEqual({ path: LEVEL_PATH, text: level(), version: blobSha(level()) })
  expect((await repo.userExists('grandpa')).ok).toBe(true)
  expect(await repo.userExists('nobody')).toEqual({ ok: true, value: false })
  expect(await repo.createBranch('automata/kid', head.value)).toEqual({ ok: true, value: true })
  expect(await repo.createBranch('automata/kid', head.value)).toEqual({
    ok: false,
    problem: 'changed-elsewhere',
  })
  const author = { name: 'kid', email: 'k@x' }
  const saved = await repo.saveFile({
    branch: 'automata/kid',
    path: LEVEL_PATH,
    text: moved(),
    version: file.value.version,
    message: 'm',
    author,
  })
  expect(saved).toMatchObject({ ok: true, value: { version: blobSha(moved()) } })
  expect(
    await repo.saveFile({
      branch: 'automata/kid',
      path: LEVEL_PATH,
      text: level(),
      version: file.value.version,
      message: 'm',
      author,
    }),
  ).toEqual({ ok: false, problem: 'changed-elsewhere' })
  const made = await repo.createPull({ branch: 'automata/kid', title: 'Move', body: 'b' })
  if (!made.ok) throw new Error(made.problem)
  expect(made.value).toMatchObject({ head: 'automata/kid', base: 'main', headIsHere: true })
  expect(await repo.pullPaths(made.value.number)).toEqual({ ok: true, value: [LEVEL_PATH] })
  expect(await repo.openPulls()).toMatchObject({ ok: true, value: [{ number: made.value.number }] })
  fake.repos.get('grandma/crate-game')!.checks = 'passing'
  expect(await repo.checks(made.value.headCommit)).toEqual({ ok: true, value: 'passing' })
  expect(
    await repo.mergePull(made.value.number, {
      title: 'Approve',
      message: 'ok',
      headCommit: made.value.headCommit,
    }),
  ).toEqual({ ok: true, value: true })
  expect(await repo.deleteBranch('automata/kid')).toEqual({ ok: true, value: true })
  expect(main().branches.get('main')?.get(LEVEL_PATH)).toBe(moved())
  const second = await repo.createPull({ branch: 'automata/none', title: 'x', body: 'y' })
  expect(second.ok).toBe(false)
  const listed = await reposOf(deps, fake.tokenFor('grandma'))
  expect(listed).toEqual({
    ok: true,
    value: expect.arrayContaining([{ owner: 'grandma', name: 'crate-game' }]),
  })
})

test("a person's own token sees a repo's owner type and whether they are an admin, as GitHub shows each person", async () => {
  const repo = fake.repos.get('grandma/crate-game')!
  repo.ownerType = 'Organization'
  repo.admins.add('grandpa')
  const deps = { env: fake.env, fetcher: fetch, now: () => Date.now() }
  const opened = await openRepo(deps, { owner: 'grandma', name: 'crate-game' })
  if (!opened.ok) throw new Error(opened.problem)
  expect(opened.value.facts.ownerIsOrg).toBe(true)
  expect(await opened.value.isAdmin(fake.tokenFor('grandpa'))).toEqual({ ok: true, value: true })
  expect(await opened.value.isAdmin(fake.tokenFor('kid'))).toEqual({ ok: true, value: false })
  // grandma owns it as a person's account would; as an organisation's, she is no admin unless listed.
  expect(await opened.value.isAdmin(fake.tokenFor('grandma'))).toEqual({ ok: true, value: false })
})
