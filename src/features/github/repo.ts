// The App's hands in one repo: read a file, make a commit, open and close a pull, merge one, look at its checks.
// Every call goes through `send`, so a status becomes a problem in one place. The page never reaches this; only
// the service feature does.
import { fromBase64, toBase64 } from '../../lib/base64.ts'
import type { Answer, Checks, GameRef } from '../wire/wire.ts'
import { appJwt } from './app-token.ts'
import { type As, type Deps, type RateWatch, type Reply, send } from './request.ts'

export interface RepoFacts {
  /** The default branch. */
  readonly branch: string
  readonly isPublic: boolean
  readonly ownerLogin: string
  /** True when an organisation owns the repo, whose GitHub admins are its Owners here. */
  readonly ownerIsOrg: boolean
}
export interface FileRead {
  readonly path: string
  readonly text: string
  /** GitHub's blob sha: it changes exactly when the bytes do. */
  readonly version: string
}
export interface Pull {
  readonly number: number
  readonly title: string
  readonly head: string
  readonly headCommit: string
  /** False for a pull from a fork, or one whose fork was deleted. */
  readonly headIsHere: boolean
  readonly base: string
  /** Milliseconds. */
  readonly createdAt: number
}
export interface Author {
  readonly name: string
  readonly email: string
}

export interface Repo {
  readonly facts: RepoFacts
  /** The share of GitHub's allowance still left, from its last answer; undefined until it has said. */
  allowance(): number | undefined
  branchHead(branch: string): Promise<Answer<string>>
  createBranch(branch: string, fromCommit: string): Promise<Answer<true>>
  deleteBranch(branch: string): Promise<Answer<true>>
  readFile(branch: string, path: string): Promise<Answer<FileRead>>
  /** `version` undefined makes a new file. A version that is no longer the file's is 'changed-elsewhere'. */
  saveFile(save: {
    branch: string
    path: string
    text: string
    version: string | undefined
    message: string
    author: Author
  }): Promise<Answer<{ version: string; commit: string }>>
  openPulls(): Promise<Answer<readonly Pull[]>>
  pull(number: number): Promise<Answer<Pull>>
  pullPaths(number: number): Promise<Answer<readonly string[]>>
  createPull(p: { branch: string; title: string; body: string }): Promise<Answer<Pull>>
  mergePull(number: number, m: { title: string; message: string; headCommit: string }): Promise<Answer<true>>
  closePull(number: number): Promise<Answer<true>>
  checks(commit: string): Promise<Answer<Checks>>
  /** When a commit was made, in milliseconds: checks start after it, not after the pull that holds it was opened. */
  commitTime(commit: string): Promise<Answer<number>>
  /** Whether GitHub shows this person (by their own sign-in) as an admin of the repo. Anything else is false. */
  isAdmin(personToken: string): Promise<Answer<boolean>>
  /** Whether a GitHub account of that name exists. Asked as the installation: GitHub refuses the App's own pass here. */
  userExists(login: string): Promise<Answer<boolean>>
}

const enc = (part: string): string => encodeURIComponent(part)
/** A path or branch name, encoded segment by segment so its slashes stay slashes. */
const encPath = (path: string): string => path.split('/').map(enc).join('/')

type Json = Record<string, unknown>
const obj = (value: unknown): Json => (typeof value === 'object' && value !== null ? (value as Json) : {})
const str = (value: unknown): string => (typeof value === 'string' ? value : '')

function toPull(raw: unknown): Pull {
  const pull = obj(raw)
  const head = obj(pull.head)
  const base = obj(pull.base)
  const headRepo = obj(head.repo)
  const baseRepo = obj(base.repo)
  return {
    number: Number(pull.number),
    title: str(pull.title),
    head: str(head.ref),
    headCommit: str(head.sha),
    headIsHere:
      typeof headRepo.full_name === 'string' &&
      headRepo.full_name === baseRepo.full_name &&
      headRepo.full_name !== '',
    base: str(base.ref),
    createdAt: Date.parse(str(pull.created_at)),
  }
}

/** Passes a problem on, or hands the reply to `then`. */
async function ask<T>(reply: Promise<Answer<Reply>>, then: (r: Reply) => T | Promise<T>): Promise<Answer<T>> {
  const got = await reply
  if (!got.ok) return got
  return { ok: true, value: await then(got.value) }
}

/** The App's hands in one repo. 'not-found' when the editor has not been added to that repo. */
export async function openRepo(deps: Deps, ref: GameRef): Promise<Answer<Repo>> {
  const { GITHUB_APP_ID: appId, GITHUB_APP_PRIVATE_KEY: key } = deps.env
  if (!appId || !key) return { ok: false, problem: 'not-set-up' }
  let jwt: string
  try {
    jwt = await appJwt(appId, key, deps.now())
  } catch {
    return { ok: false, problem: 'not-set-up' }
  }
  const app: As = { kind: 'app', token: jwt }
  const root = `/repos/${enc(ref.owner)}/${enc(ref.name)}`

  const installation = await send(deps, { method: 'GET', path: `${root}/installation`, as: app })
  if (!installation.ok) return installation
  const id = obj(installation.value.body).id
  if (typeof id !== 'number') return { ok: false, problem: 'unknown' }

  // The token reaches only this repo, with only the four permissions the App asks for.
  const minted = await send(deps, {
    method: 'POST',
    path: `/app/installations/${id}/access_tokens`,
    as: app,
    body: {
      repositories: [ref.name],
      permissions: { contents: 'write', pull_requests: 'write', checks: 'read', metadata: 'read' },
    },
    pass: [422],
  })
  if (!minted.ok) return minted
  const token = str(obj(minted.value.body).token)
  if (minted.value.status === 422 || token === '') return { ok: false, problem: 'not-found' }
  const as: As = { kind: 'installation', token }
  const rate: RateWatch = {}
  const call = (req: Omit<Parameters<typeof send>[1], 'as'>): Promise<Answer<Reply>> =>
    send(deps, { ...req, as }, rate)

  const info = await call({ method: 'GET', path: root })
  if (!info.ok) return info
  const facts = obj(info.value.body)
  const repoFacts: RepoFacts = {
    branch: str(facts.default_branch),
    isPublic: facts.private === false,
    ownerLogin: str(obj(facts.owner).login),
    ownerIsOrg: str(obj(facts.owner).type) === 'Organization',
  }
  if (repoFacts.branch === '') return { ok: false, problem: 'unknown' }

  /** Whether the file `path` on `branch` is still the version that was sent. */
  const versionOn = async (branch: string, path: string): Promise<string | undefined> => {
    const read = await readFile(branch, path)
    return read.ok ? read.value.version : undefined
  }

  const readFile: Repo['readFile'] = async (branch, path) => {
    const got = await call({
      method: 'GET',
      path: `${root}/contents/${encPath(path)}`,
      query: { ref: branch },
    })
    if (!got.ok) return got
    const file = obj(got.value.body)
    if (file.type !== 'file' || typeof file.content !== 'string') return { ok: false, problem: 'not-found' }
    return { ok: true, value: { path, text: fromBase64(file.content), version: str(file.sha) } }
  }

  const pull: Repo['pull'] = async (number) => {
    const got = await call({ method: 'GET', path: `${root}/pulls/${number}` })
    if (!got.ok) return got
    if (obj(got.value.body).state !== 'open') return { ok: false, problem: 'not-found' }
    return { ok: true, value: toPull(got.value.body) }
  }

  const openPulls: Repo['openPulls'] = (): Promise<Answer<readonly Pull[]>> =>
    ask(
      call({
        method: 'GET',
        path: `${root}/pulls`,
        query: { state: 'open', base: repoFacts.branch, per_page: '100' },
      }),
      (r) => (Array.isArray(r.body) ? r.body.map(toPull) : []),
    )

  const repo: Repo = {
    facts: repoFacts,
    allowance: () =>
      rate.remaining === undefined || rate.limit === undefined || rate.limit === 0
        ? undefined
        : rate.remaining / rate.limit,

    branchHead: (branch) =>
      ask(call({ method: 'GET', path: `${root}/git/ref/heads/${encPath(branch)}` }), (r) =>
        str(obj(obj(r.body).object).sha),
      ),

    createBranch: async (branch, fromCommit) => {
      const got = await call({
        method: 'POST',
        path: `${root}/git/refs`,
        body: { ref: `refs/heads/${branch}`, sha: fromCommit },
        pass: [422],
      })
      if (!got.ok) return got
      return got.value.status === 422
        ? { ok: false, problem: 'changed-elsewhere' }
        : { ok: true, value: true }
    },

    deleteBranch: (branch) =>
      ask(
        call({ method: 'DELETE', path: `${root}/git/refs/heads/${encPath(branch)}`, pass: [422] }),
        () => true as const,
      ),

    readFile,

    saveFile: async ({ branch, path, text, version, message, author }) => {
      const got = await call({
        method: 'PUT',
        path: `${root}/contents/${encPath(path)}`,
        // Only the author is sent: with no committer GitHub signs the commit as the App, which a "signed commits" rule needs.
        body: {
          message,
          content: toBase64(text),
          ...(version === undefined ? {} : { sha: version }),
          branch,
          author,
        },
        pass: [409, 422],
      })
      if (!got.ok) return got
      if (got.value.status === 409 || got.value.status === 422) {
        // Settled by looking, not by reading GitHub's message: if the file is no longer the version that was
        // sent, someone changed it; if it is, a rule refused the App.
        return (await versionOn(branch, path)) === version
          ? { ok: false, problem: 'blocked' }
          : { ok: false, problem: 'changed-elsewhere' }
      }
      const body = obj(got.value.body)
      return { ok: true, value: { version: str(obj(body.content).sha), commit: str(obj(body.commit).sha) } }
    },

    openPulls,
    pull,

    pullPaths: async (number) => {
      const got = await call({
        method: 'GET',
        path: `${root}/pulls/${number}/files`,
        query: { per_page: '100' },
      })
      if (!got.ok) return got
      const files = Array.isArray(got.value.body) ? got.value.body.map(obj) : []
      // A hundred files is too many to judge here, and the list may be cut short.
      if (files.length >= 100) return { ok: false, problem: 'not-allowed' }
      const paths = files.flatMap((f) => [
        str(f.filename),
        ...(typeof f.previous_filename === 'string' ? [f.previous_filename] : []),
      ])
      return { ok: true, value: paths }
    },

    createPull: async ({ branch, title, body }) => {
      const got = await call({
        method: 'POST',
        path: `${root}/pulls`,
        body: { title, body, head: branch, base: repoFacts.branch },
        pass: [422],
      })
      if (!got.ok) return got
      if (got.value.status !== 422) return { ok: true, value: toPull(got.value.body) }
      // A pull for that branch is already open (another device, a retry): that one is the answer.
      const open = await openPulls()
      const existing = open.ok ? open.value.find((p) => p.head === branch && p.headIsHere) : undefined
      return existing === undefined ? { ok: false, problem: 'unknown' } : { ok: true, value: existing }
    },

    mergePull: async (number, { title, message, headCommit }) => {
      const got = await call({
        method: 'PUT',
        path: `${root}/pulls/${number}/merge`,
        body: { merge_method: 'merge', commit_title: title, commit_message: message, sha: headCommit },
        pass: [405, 409],
      })
      if (!got.ok) return got
      if (got.value.status === 409) return { ok: false, problem: 'changed-elsewhere' }
      if (got.value.status === 405) {
        // GitHub's 405 is "cannot be merged": a clash, or a rule the App is not past. Look at the pull to tell which.
        const again = await call({ method: 'GET', path: `${root}/pulls/${number}` })
        const clash = again.ok && obj(again.value.body).mergeable === false
        return { ok: false, problem: clash ? 'clashes' : 'blocked' }
      }
      return { ok: true, value: true }
    },

    closePull: (number) =>
      ask(
        call({ method: 'PATCH', path: `${root}/pulls/${number}`, body: { state: 'closed' } }),
        () => true as const,
      ),

    checks: (commit) =>
      ask(
        call({
          method: 'GET',
          path: `${root}/commits/${enc(commit)}/check-runs`,
          query: { per_page: '100' },
        }),
        (r) => {
          const runs = (
            Array.isArray(obj(r.body).check_runs) ? (obj(r.body).check_runs as unknown[]) : []
          ).map(obj)
          if (runs.length === 0) return 'none' as const
          if (runs.some((run) => run.status !== 'completed')) return 'running' as const
          const fine = ['success', 'neutral', 'skipped']
          return runs.some((run) => !fine.includes(str(run.conclusion)))
            ? ('failing' as const)
            : ('passing' as const)
        },
      ),

    commitTime: (commit) =>
      ask(call({ method: 'GET', path: `${root}/commits/${enc(commit)}` }), (r) => {
        const when = Date.parse(str(obj(obj(obj(r.body).commit).committer).date))
        // A commit with no readable date counts as made just now, so its checks get their full grace.
        return Number.isNaN(when) ? deps.now() : when
      }),

    isAdmin: async (personToken) => {
      // Asked with the person's own sign-in: GitHub shows each person the rights they themselves have here.
      const got = await send(deps, {
        method: 'GET',
        path: root,
        as: { kind: 'person', token: personToken },
        pass: [403, 404],
      })
      if (!got.ok) return got
      return { ok: true, value: obj(obj(got.value.body).permissions).admin === true }
    },

    userExists: async (login) => {
      const got = await call({ method: 'GET', path: `/users/${enc(login)}`, pass: [404] })
      return got.ok ? { ok: true, value: got.value.status !== 404 } : got
    },
  }
  return { ok: true, value: repo }
}

/** The repos this *person* can see on GitHub that the editor has been added to: asked with the person's own token. */
export async function reposOf(deps: Deps, personToken: string): Promise<Answer<readonly GameRef[]>> {
  const as: As = { kind: 'person', token: personToken }
  const installations = await send(deps, { method: 'GET', path: '/user/installations', as })
  if (!installations.ok) return installations
  const list = obj(installations.value.body).installations
  const ids = (Array.isArray(list) ? list : [])
    .map((i) => obj(i).id)
    .filter((id): id is number => typeof id === 'number')
  const games: GameRef[] = []
  for (const id of ids) {
    // The first page of each in M1.
    const repos = await send(deps, {
      method: 'GET',
      path: `/user/installations/${id}/repositories`,
      query: { per_page: '100' },
      as,
    })
    if (!repos.ok) return repos
    const found = obj(repos.value.body).repositories
    for (const raw of Array.isArray(found) ? found : []) {
      const repo = obj(raw)
      const owner = str(obj(repo.owner).login)
      if (owner !== '' && str(repo.name) !== '') games.push({ owner, name: str(repo.name) })
    }
  }
  return { ok: true, value: games }
}
