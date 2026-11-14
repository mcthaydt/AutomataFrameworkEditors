// A small pretend GitHub: a Node HTTP server that keeps repos in memory and answers the calls the API makes, the
// way GitHub's REST description says GitHub answers them (statuses included), and checks the App's signed pass with
// the test's public key. Tests never touch the real GitHub. It is also what the journeys' API talks to.

import { verify } from 'node:crypto'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import type { AppEnv } from '#src/features/github/github.ts'
import { fromBase64, toBase64 } from '#src/lib/base64.ts'
import { makeKeys } from './keys.ts'
import {
  blobSha,
  type FakePull,
  type FakeRepo,
  gameRepo,
  nextSha,
  notAGameRepo,
  type PullFacts,
} from './repos.ts'

export const PEOPLE = ['grandma', 'grandpa', 'kid', 'stranger'] as const
export type Person = (typeof PEOPLE)[number]

export interface FakeGitHub {
  readonly url: string
  /** What the real API code needs to reach this server: ids, secret, key, the two addresses. */
  readonly env: AppEnv
  /** By `owner/name`. */
  readonly repos: Map<string, FakeRepo>
  /** Who is at the keyboard: who the next sign-in is. */
  person: Person
  signIn: 'allow' | 'deny'
  /** A sign-in token for that person, as if they had signed in. */
  tokenFor(person: Person): string
  /** Every sign-in token stops working; a refresh gives a new one. */
  tokensRunOut(): void
  /** Tokens and refreshes all stop working. */
  signedOutEverywhere(): void
  /** True: every call is dropped. */
  down: boolean
  /** When it says true for a call (method and path), that one call fails with a 503 and changes nothing. */
  failing: ((method: string, path: string) => boolean) | undefined
  /** Every request it was sent, oldest first; emptied by `reset()`. */
  readonly log: readonly { readonly method: string; readonly path: string }[]
  /** Milliseconds: the time on new pulls. It starts at the real time, so a pull is as young as it really is. */
  clock: number
  /** What it says is left of GitHub's allowance, on every answer. */
  rate: { remaining: number; limit: number }
  /** Back to: grandma, allow, up, and the repos crate-game, not-a-game and other-game. */
  reset(): void
  close(): Promise<void>
}

const CLIENT_ID = 'fake-client'
const CLIENT_SECRET = 'fake-secret'
const APP_ID = '4242'

type Json = Record<string, unknown>
const obj = (value: unknown): Json => (typeof value === 'object' && value !== null ? (value as Json) : {})
const str = (value: unknown): string => (typeof value === 'string' ? value : '')

/** What is behind a token the server issued. */
type Principal =
  | { readonly kind: 'app' }
  | { readonly kind: 'installation'; readonly repos: ReadonlySet<string> }
  | { readonly kind: 'person'; readonly person: Person }

interface Reply {
  readonly status: number
  readonly body?: unknown
  readonly headers?: Record<string, string>
}
const send = (status: number, body?: unknown, headers?: Record<string, string>): Reply => ({
  status,
  ...(body === undefined ? {} : { body }),
  ...(headers === undefined ? {} : { headers }),
})
const NOT_FOUND = send(404, { message: 'Not Found' })
const BAD_CREDENTIALS = send(401, { message: 'Bad credentials' })

/** The paths a pull changes on its branch, against the branch's base. */
interface Change {
  readonly filename: string
  readonly status: 'added' | 'modified' | 'removed' | 'renamed'
  readonly previous?: string
}

export async function startFakeGitHub(port: number, site: string): Promise<FakeGitHub> {
  const keys = makeKeys()
  const repos = new Map<string, FakeRepo>()
  const log: { method: string; path: string }[] = []
  const state = { clock: Date.now(), rate: { remaining: 4900, limit: 5000 } }
  let person: Person = 'grandma'
  let signIn: 'allow' | 'deny' = 'allow'
  let down = false
  let failing: FakeGitHub['failing']
  let counter = 0
  const codes = new Map<string, Person>()
  const refreshes = new Map<string, Person>()
  const access = new Map<string, Person>()
  const live = new Set<string>()
  const installTokens = new Map<string, ReadonlySet<string>>()
  const next = (prefix: string): string => `${prefix}_${++counter}_${Math.random().toString(36).slice(2, 8)}`

  const add = (repo: FakeRepo): void => {
    repo.clock = () => state.clock
    repos.set(`${repo.owner}/${repo.name}`, repo)
  }
  const reset = (): void => {
    repos.clear()
    add(gameRepo('crate-game'))
    add(notAGameRepo('not-a-game'))
    add(gameRepo('other-game'))
    log.length = 0
    person = 'grandma'
    signIn = 'allow'
    down = false
    failing = undefined
    state.clock = Date.now()
    state.rate = { remaining: 4900, limit: 5000 }
    for (const store of [codes, refreshes, access, installTokens]) store.clear()
    live.clear()
  }

  const issue = (who: Person): { access: string; refresh: string } => {
    const token = next('ghu')
    const refresh = next('ghr')
    access.set(token, who)
    live.add(token)
    refreshes.set(refresh, who)
    return { access: token, refresh }
  }

  // ---- who is asking --------------------------------------------------------------------------------------------

  const appPass = (token: string): boolean => {
    const parts = token.split('.')
    if (parts.length !== 3) return false
    const [head, body, signature] = parts as [string, string, string]
    try {
      const good = verify(
        'RSA-SHA256',
        Buffer.from(`${head}.${body}`),
        keys.publicKey,
        Buffer.from(signature, 'base64url'),
      )
      const claims = obj(JSON.parse(Buffer.from(body, 'base64url').toString('utf8')))
      return good && claims.iss === APP_ID && typeof claims.exp === 'number' && claims.exp * 1000 > Date.now()
    } catch {
      return false
    }
  }
  const principal = (request: IncomingMessage): Principal | undefined => {
    const header = request.headers.authorization ?? ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : ''
    if (token.includes('.')) return appPass(token) ? { kind: 'app' } : undefined
    const repos = installTokens.get(token)
    if (repos !== undefined) return { kind: 'installation', repos }
    const who = access.get(token)
    if (who !== undefined && live.has(token)) return { kind: 'person', person: who }
    return undefined
  }

  // ---- git, as far as the editor goes ---------------------------------------------------------------------------

  const installationId = (owner: string): number => PEOPLE.indexOf(owner as Person) + 1
  const ownerOf = (id: number): string | undefined => PEOPLE[id - 1]
  const reachable = (repo: FakeRepo, who: Person): boolean =>
    repo.installed && (repo.owner === who || repo.collaborators.has(who) || repo.admins.has(who))

  /** What a pull changes: its branch's files against the files the branch started from. */
  const changesOf = (repo: FakeRepo, branch: string): Change[] => {
    const files = repo.branches.get(branch) ?? new Map<string, string>()
    const base = repo.bases.get(branch) ?? new Map<string, string>()
    const moves = repo.renames.get(branch) ?? new Map<string, string>()
    const movedAway = new Set(moves.values())
    const changes: Change[] = []
    for (const [path, text] of files) {
      const was = base.get(path)
      if (was === text) continue
      const from = moves.get(path)
      changes.push(
        from !== undefined
          ? { filename: path, status: 'renamed', previous: from }
          : { filename: path, status: was === undefined ? 'added' : 'modified' },
      )
    }
    for (const path of base.keys())
      if (!files.has(path) && !movedAway.has(path)) changes.push({ filename: path, status: 'removed' })
    return changes
  }
  /** A file changed on both the branch and the default branch since the branch was made. */
  const clashes = (repo: FakeRepo, branch: string): boolean => {
    const base = repo.bases.get(branch) ?? new Map<string, string>()
    const main = repo.branches.get(repo.defaultBranch) ?? new Map<string, string>()
    return changesOf(repo, branch).some((change) =>
      [change.filename, change.previous].some(
        (path) => path !== undefined && main.get(path) !== base.get(path),
      ),
    )
  }
  const pullJson = (repo: FakeRepo, pull: FakePull, single: boolean): Json => {
    const facts: PullFacts = repo.pullFacts.get(pull.number) ?? {
      createdAt: state.clock,
      body: '',
      fork: undefined,
    }
    const own = `${repo.owner}/${repo.name}`
    return {
      number: pull.number,
      title: pull.title,
      state: pull.state === 'open' ? 'open' : 'closed',
      merged: pull.state === 'merged',
      created_at: new Date(facts.createdAt).toISOString(),
      head: { ref: pull.head, sha: repo.heads.get(pull.head) ?? '', repo: { full_name: facts.fork ?? own } },
      base: { ref: pull.base, repo: { full_name: own } },
      ...(single ? { mergeable: !clashes(repo, pull.head) } : {}),
    }
  }

  // ---- the routes -----------------------------------------------------------------------------------------------

  const handle = (method: string, url: URL, body: Json, request: IncomingMessage): Reply => {
    const path = url.pathname
    const who = principal(request)
    let m: RegExpExecArray | null

    // Sign-in and adding the editor: the pages a browser is sent to.
    if (method === 'GET' && path === '/login/oauth/authorize') {
      const back = new URL(url.searchParams.get('redirect_uri') ?? site)
      const state = url.searchParams.get('state')
      if (state !== null) back.searchParams.set('state', state)
      if (signIn === 'deny') back.searchParams.set('error', 'access_denied')
      else {
        const code = next('code')
        codes.set(code, person)
        back.searchParams.set('code', code)
      }
      return send(302, undefined, { location: back.toString() })
    }
    if (method === 'GET' && (m = /^\/apps\/([^/]+)\/installations\/new$/.exec(path))) {
      for (const repo of repos.values()) if (repo.owner === person) repo.installed = true
      return send(302, undefined, { location: `${site}/?setup_action=install&installation_id=1` })
    }
    if (method === 'POST' && path === '/login/oauth/access_token') {
      if (str(body.client_id) !== CLIENT_ID || str(body.client_secret) !== CLIENT_SECRET) {
        return send(200, { error: 'incorrect_client_credentials' })
      }
      if (body.grant_type === 'refresh_token') {
        const owner = refreshes.get(str(body.refresh_token))
        if (owner === undefined) return send(200, { error: 'bad_refresh_token' })
        refreshes.delete(str(body.refresh_token))
        const pair = issue(owner)
        return send(200, {
          access_token: pair.access,
          refresh_token: pair.refresh,
          expires_in: 28800,
          token_type: 'bearer',
        })
      }
      const owner = codes.get(str(body.code))
      if (owner === undefined) return send(200, { error: 'bad_verification_code' })
      codes.delete(str(body.code))
      const pair = issue(owner)
      return send(200, {
        access_token: pair.access,
        refresh_token: pair.refresh,
        expires_in: 28800,
        token_type: 'bearer',
      })
    }
    if (method === 'POST' && (m = /^\/applications\/([^/]+)\/token$/.exec(path))) {
      const basic = (request.headers.authorization ?? '').replace(/^Basic /, '')
      if (m[1] !== CLIENT_ID || Buffer.from(basic, 'base64').toString() !== `${CLIENT_ID}:${CLIENT_SECRET}`)
        return BAD_CREDENTIALS
      const token = str(body.access_token)
      const owner = access.get(token)
      if (owner === undefined || !live.has(token)) return NOT_FOUND
      return send(200, { user: { login: owner, id: 100 + PEOPLE.indexOf(owner) } })
    }

    // The App itself: only these two calls take its pass.
    if (method === 'GET' && (m = /^\/repos\/([^/]+)\/([^/]+)\/installation$/.exec(path))) {
      if (who?.kind !== 'app') return BAD_CREDENTIALS
      const repo = repos.get(`${m[1]}/${m[2]}`)
      return repo?.installed ? send(200, { id: installationId(repo.owner) }) : NOT_FOUND
    }
    if (method === 'POST' && (m = /^\/app\/installations\/(\d+)\/access_tokens$/.exec(path))) {
      if (who?.kind !== 'app') return BAD_CREDENTIALS
      const owner = ownerOf(Number(m[1]))
      const named = Array.isArray(body.repositories) ? body.repositories.map(str).filter((n) => n !== '') : []
      if (owner === undefined || named.length === 0) return send(422, { message: 'Validation Failed' })
      const scope = new Set(named.map((name) => `${owner}/${name}`))
      for (const full of scope)
        if (repos.get(full)?.installed !== true) return send(422, { message: 'Validation Failed' })
      const token = next('ghs')
      installTokens.set(token, scope)
      return send(201, { token, expires_at: new Date(Date.now() + 3_600_000).toISOString() })
    }

    // A person's own view: what they can reach.
    if (path.startsWith('/user/installations')) {
      if (who?.kind !== 'person') return BAD_CREDENTIALS
      if (method === 'GET' && path === '/user/installations') {
        const owners = new Set(
          [...repos.values()].filter((r) => reachable(r, who.person)).map((r) => r.owner),
        )
        return send(200, {
          total_count: owners.size,
          installations: [...owners].map((o) => ({ id: installationId(o) })),
        })
      }
      if (method === 'GET' && (m = /^\/user\/installations\/(\d+)\/repositories$/.exec(path))) {
        const owner = ownerOf(Number(m[1]))
        const list = [...repos.values()].filter((r) => r.owner === owner && reachable(r, who.person))
        return send(200, {
          total_count: list.length,
          repositories: list.map((r) => ({ name: r.name, owner: { login: r.owner } })),
        })
      }
      return NOT_FOUND
    }

    // A person's own view of one repo: what they may do there, as GitHub shows each person (the one call a person's
    // token makes on a repo).
    if (method === 'GET' && who?.kind === 'person' && (m = /^\/repos\/([^/]+)\/([^/]+)$/.exec(path))) {
      const repo = repos.get(`${m[1]}/${m[2]}`)
      if (repo === undefined || !reachable(repo, who.person)) return NOT_FOUND
      return send(200, {
        default_branch: repo.defaultBranch,
        private: !repo.isPublic,
        owner: { login: repo.owner, type: repo.ownerType },
        permissions: {
          admin: repo.admins.has(who.person) || (repo.ownerType === 'User' && repo.owner === who.person),
        },
      })
    }

    // Everything else is the installation's.
    if (method === 'GET' && (m = /^\/users\/([^/]+)$/.exec(path))) {
      if (who?.kind !== 'installation') return BAD_CREDENTIALS
      const login = decodeURIComponent(m[1] ?? '')
      return (PEOPLE as readonly string[]).includes(login) ? send(200, { login }) : NOT_FOUND
    }
    if ((m = /^\/repos\/([^/]+)\/([^/]+)(\/.*)?$/.exec(path))) {
      if (who?.kind !== 'installation') return BAD_CREDENTIALS
      const repo = repos.get(`${m[1]}/${m[2]}`)
      if (repo === undefined || !repo.installed || !who.repos.has(`${repo.owner}/${repo.name}`))
        return NOT_FOUND
      return handleRepo(repo, method, m[3] ?? '', url, body)
    }
    return NOT_FOUND
  }

  const handleRepo = (repo: FakeRepo, method: string, rest: string, url: URL, body: Json): Reply => {
    const main = repo.defaultBranch
    let m: RegExpExecArray | null
    if (method === 'GET' && rest === '') {
      return send(200, {
        default_branch: main,
        private: !repo.isPublic,
        owner: { login: repo.owner, type: repo.ownerType },
      })
    }

    if (method === 'GET' && (m = /^\/git\/ref\/heads\/(.+)$/.exec(rest))) {
      const sha = repo.heads.get(decodeURIComponent(m[1] ?? ''))
      return sha === undefined
        ? NOT_FOUND
        : send(200, { ref: `refs/heads/${decodeURIComponent(m[1] ?? '')}`, object: { sha } })
    }
    if (method === 'POST' && rest === '/git/refs') {
      const branch = str(body.ref).replace(/^refs\/heads\//, '')
      const sha = str(body.sha)
      if (branch === '' || repo.branches.has(branch))
        return send(422, { message: 'Reference already exists' })
      const source = [...repo.heads].find(([, head]) => head === sha)?.[0]
      const files = source === undefined ? undefined : repo.branches.get(source)
      if (files === undefined) return send(422, { message: 'Object does not exist' })
      repo.branches.set(branch, new Map(files))
      repo.bases.set(branch, new Map(files))
      repo.heads.set(branch, sha)
      return send(201, { ref: `refs/heads/${branch}`, object: { sha } })
    }
    if (method === 'DELETE' && (m = /^\/git\/refs\/heads\/(.+)$/.exec(rest))) {
      const branch = decodeURIComponent(m[1] ?? '')
      if (branch === main || !repo.branches.has(branch))
        return send(422, { message: 'Reference does not exist' })
      repo.branches.delete(branch)
      repo.heads.delete(branch)
      repo.bases.delete(branch)
      repo.renames.delete(branch)
      return send(204)
    }

    if ((m = /^\/contents\/(.+)$/.exec(rest))) {
      const path = decodeURIComponent(m[1] ?? '')
      if (method === 'GET') {
        const files = repo.branches.get(url.searchParams.get('ref') ?? main)
        if (files === undefined) return NOT_FOUND
        const text = files.get(path)
        if (text !== undefined) {
          return send(200, {
            type: 'file',
            path,
            sha: blobSha(text),
            encoding: 'base64',
            content: toBase64(text).replace(/(.{60})/g, '$1\n'),
          })
        }
        const inside = [...files.keys()].filter((p) => p.startsWith(`${path}/`))
        return inside.length === 0
          ? NOT_FOUND
          : send(
              200,
              inside.map((p) => ({ type: 'file', path: p, name: p.split('/').pop() })),
            )
      }
      if (method === 'PUT') {
        const branch = str(body.branch) || main
        const files = repo.branches.get(branch)
        if (files === undefined) return NOT_FOUND
        if (branch === main && repo.rule === 'blocks-app')
          return send(409, { message: 'Repository rule violations found' })
        const current = files.get(path)
        const sha = typeof body.sha === 'string' ? body.sha : undefined
        if (
          (current === undefined && sha !== undefined) ||
          (current !== undefined && sha !== blobSha(current))
        ) {
          return send(409, { message: `${path} does not match ${sha ?? 'nothing'}` })
        }
        const text = fromBase64(str(body.content))
        files.set(path, text)
        const commit = nextSha(`${branch}:${path}`)
        repo.heads.set(branch, commit)
        repo.commits.push({
          sha: commit,
          branch,
          message: str(body.message),
          path,
          text,
          author: str(obj(body.author).name),
        })
        return send(current === undefined ? 201 : 200, {
          content: { path, sha: blobSha(text) },
          commit: { sha: commit },
        })
      }
    }

    if (rest === '/pulls' && method === 'GET') {
      const wanted = url.searchParams.get('state') ?? 'open'
      const base = url.searchParams.get('base') ?? main
      const list = repo.pulls.filter((p) => (wanted === 'all' || p.state === wanted) && p.base === base)
      return send(
        200,
        list.map((p) => pullJson(repo, p, false)),
      )
    }
    if (rest === '/pulls' && method === 'POST') {
      const head = str(body.head)
      const files = repo.branches.get(head)
      const taken = repo.pulls.some((p) => p.head === head && p.state === 'open')
      if (files === undefined || taken || changesOf(repo, head).length === 0)
        return send(422, { message: 'Validation Failed' })
      const pull: FakePull = {
        number: repo.pulls.length + 1,
        title: str(body.title),
        head,
        base: str(body.base) || main,
        state: 'open',
      }
      repo.pulls.push(pull)
      repo.pullFacts.set(pull.number, { createdAt: state.clock, body: str(body.body), fork: undefined })
      return send(201, pullJson(repo, pull, true))
    }
    if ((m = /^\/pulls\/(\d+)(\/files|\/merge)?$/.exec(rest))) {
      const pull = repo.pulls.find((p) => p.number === Number(m?.[1]))
      if (pull === undefined) return NOT_FOUND
      if (m[2] === undefined && method === 'GET') return send(200, pullJson(repo, pull, true))
      if (m[2] === undefined && method === 'PATCH') {
        if (body.state === 'closed' && pull.state === 'open') pull.state = 'closed'
        return send(200, pullJson(repo, pull, true))
      }
      if (m[2] === '/files' && method === 'GET') {
        return send(
          200,
          changesOf(repo, pull.head).map((c) => ({
            filename: c.filename,
            status: c.status,
            ...(c.previous === undefined ? {} : { previous_filename: c.previous }),
          })),
        )
      }
      if (m[2] === '/merge' && method === 'PUT') return merge(repo, pull, body)
    }

    if (method === 'GET' && (m = /^\/commits\/([^/]+)$/.exec(rest))) {
      const made = repo.commitDates.get(m[1] ?? '')
      if (made === undefined) return NOT_FOUND
      return send(200, { sha: m[1], commit: { committer: { date: new Date(made).toISOString() } } })
    }

    if (method === 'GET' && (m = /^\/commits\/([^/]+)\/check-runs$/.exec(rest))) {
      const runs = {
        none: [],
        passing: [{ name: 'ci', status: 'completed', conclusion: 'success' }],
        running: [{ name: 'ci', status: 'in_progress', conclusion: null }],
        failing: [{ name: 'ci', status: 'completed', conclusion: 'failure' }],
      }[repo.checks]
      return send(200, { total_count: runs.length, check_runs: runs })
    }
    return NOT_FOUND
  }

  const merge = (repo: FakeRepo, pull: FakePull, body: Json): Reply => {
    if (pull.state !== 'open') return send(405, { message: 'Pull Request is not mergeable' })
    // GitHub: 409 when the sha is not the head; 405 when it cannot be merged (a clash, or a rule the App is not past).
    if (str(body.sha) !== repo.heads.get(pull.head))
      return send(409, { message: 'Head branch was modified. Review and try the merge again.' })
    if (repo.rule === 'blocks-app' || clashes(repo, pull.head))
      return send(405, { message: 'Pull Request is not mergeable' })
    const main = repo.branches.get(repo.defaultBranch)
    const files = repo.branches.get(pull.head)
    if (main === undefined || files === undefined) return NOT_FOUND
    for (const change of changesOf(repo, pull.head)) {
      if (change.previous !== undefined) main.delete(change.previous)
      if (change.status === 'removed') main.delete(change.filename)
      else main.set(change.filename, files.get(change.filename) ?? '')
    }
    const commit = nextSha(`merge:${pull.number}`)
    repo.heads.set(repo.defaultBranch, commit)
    repo.commits.push({
      sha: commit,
      branch: repo.defaultBranch,
      message: `${str(body.commit_title)}\n\n${str(body.commit_message)}`,
      path: '',
      text: '',
      author: 'automata-editors[bot]',
    })
    pull.state = 'merged'
    return send(200, { merged: true, sha: commit })
  }

  // ---- the server ----------------------------------------------------------------------------------------------

  const readBody = async (request: IncomingMessage): Promise<Json> => {
    const chunks: Buffer[] = []
    for await (const chunk of request) chunks.push(chunk as Buffer)
    const text = Buffer.concat(chunks).toString('utf8')
    if (text === '') return {}
    try {
      return obj(JSON.parse(text))
    } catch {
      return Object.fromEntries(new URLSearchParams(text))
    }
  }

  const server = createServer((request: IncomingMessage, response: ServerResponse) => {
    if (down) {
      request.socket.destroy()
      return
    }
    void (async () => {
      const url = new URL(request.url ?? '/', 'http://pretend.github')
      const method = request.method ?? 'GET'
      log.push({ method, path: url.pathname })
      const asked = await readBody(request)
      const reply =
        failing?.(method, url.pathname) === true
          ? send(503, { message: 'Service Unavailable' })
          : handle(method, url, asked, request)
      response.writeHead(reply.status, {
        ...(reply.body === undefined ? {} : { 'content-type': 'application/json; charset=utf-8' }),
        'x-ratelimit-remaining': String(state.rate.remaining),
        'x-ratelimit-limit': String(state.rate.limit),
        ...reply.headers,
      })
      response.end(reply.body === undefined ? undefined : JSON.stringify(reply.body))
    })()
  })
  await new Promise<void>((done) => server.listen(port, '127.0.0.1', done))
  const address = server.address()
  const origin = `http://127.0.0.1:${typeof address === 'object' && address !== null ? address.port : port}`
  reset()

  const fake: FakeGitHub = {
    url: origin,
    env: {
      GITHUB_CLIENT_ID: CLIENT_ID,
      GITHUB_CLIENT_SECRET: CLIENT_SECRET,
      GITHUB_APP_ID: APP_ID,
      GITHUB_APP_PRIVATE_KEY: keys.privatePem,
      GITHUB_WEB_URL: origin,
      GITHUB_API_URL: origin,
    },
    repos,
    get person() {
      return person
    },
    set person(value) {
      person = value
    },
    get signIn() {
      return signIn
    },
    set signIn(value) {
      signIn = value
    },
    get down() {
      return down
    },
    set down(value) {
      down = value
    },
    get failing() {
      return failing
    },
    set failing(value) {
      failing = value
    },
    get clock() {
      return state.clock
    },
    set clock(value) {
      state.clock = value
    },
    get rate() {
      return state.rate
    },
    set rate(value) {
      state.rate = value
    },
    log,
    tokenFor(who) {
      const token = next('ghu')
      access.set(token, who)
      live.add(token)
      return token
    },
    tokensRunOut() {
      live.clear()
    },
    signedOutEverywhere() {
      live.clear()
      refreshes.clear()
      codes.clear()
    },
    reset,
    close: () =>
      new Promise<void>((done) => {
        server.closeAllConnections()
        server.close(() => done())
      }),
  }
  return fake
}
