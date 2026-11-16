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
  /**
   * Every file in one commit, or nothing. `text` undefined takes the file away. `version` is the file's version the
   * person started from (undefined for a new file); any that is no longer true is 'changed-elsewhere', with the paths in
   * `details`, and nothing is written. A branch that moved while the commit was made is 'changed-elsewhere' too.
   */
  commitFiles(change: {
    branch: string
    files: readonly { path: string; text: string | undefined; version: string | undefined }[]
    message: string
    author: Author
  }): Promise<Answer<{ commit: string; versions: Readonly<Record<string, string>> }>>
  /**
   * The newest commits on `branch` that touched anything under `folder` (GitHub's list of commits filters by one path,
   * and a folder matches every file inside it): one call, newest first, at most `limit` (at most 50). A row has who,
   * when and the message, not its files.
   */
  history(
    branch: string,
    folder: string,
    limit: number,
  ): Promise<Answer<readonly { commit: string; by: string; at: number; message: string }[]>>
  /** The paths one commit touched: one call. */
  commitPaths(commit: string): Promise<Answer<readonly string[]>>
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

/** How long to wait before asking GitHub again whether a pull can merge, when it has not worked that out yet. */
const MERGEABLE_WAIT_MS = 1_200

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

    commitFiles: async ({ branch, files, message, author }) => {
      const head = await repo.branchHead(branch)
      if (!head.ok) return head
      // Every version the person started from must still be true, or nothing is written.
      const stale: string[] = []
      for (const file of files)
        if ((await versionOn(branch, file.path)) !== file.version) stale.push(file.path)
      if (stale.length > 0) return { ok: false, problem: 'changed-elsewhere', details: stale }

      const base = await call({ method: 'GET', path: `${root}/git/commits/${enc(head.value)}` })
      if (!base.ok) return base
      const baseTree = str(obj(obj(base.value.body).tree).sha)
      const entries: Json[] = []
      const versions: Record<string, string> = {}
      for (const file of files) {
        if (file.text === undefined) {
          // A file that was never there has nothing to take away.
          if (file.version !== undefined)
            entries.push({ path: file.path, mode: '100644', type: 'blob', sha: null })
          continue
        }
        const blob = await call({
          method: 'POST',
          path: `${root}/git/blobs`,
          body: { content: toBase64(file.text), encoding: 'base64' },
        })
        if (!blob.ok) return blob
        const sha = str(obj(blob.value.body).sha)
        versions[file.path] = sha
        entries.push({ path: file.path, mode: '100644', type: 'blob', sha })
      }
      const tree = await call({
        method: 'POST',
        path: `${root}/git/trees`,
        body: { base_tree: baseTree, tree: entries },
      })
      if (!tree.ok) return tree
      // Only the author is sent: with no committer GitHub signs the commit as the App (see saveFile).
      const made = await call({
        method: 'POST',
        path: `${root}/git/commits`,
        body: { message, tree: str(obj(tree.value.body).sha), parents: [head.value], author },
      })
      if (!made.ok) return made
      const commit = str(obj(made.value.body).sha)
      const moved = await call({
        method: 'PATCH',
        path: `${root}/git/refs/heads/${encPath(branch)}`,
        body: { sha: commit, force: false },
        pass: [409, 422],
      })
      if (!moved.ok) return moved
      if (moved.value.status === 409 || moved.value.status === 422) {
        // Settled by looking: a branch that is not where it was moved under us; one that is, a rule refused the App.
        const now = await repo.branchHead(branch)
        return now.ok && now.value === head.value
          ? { ok: false, problem: 'blocked' }
          : { ok: false, problem: 'changed-elsewhere' }
      }
      return { ok: true, value: { commit, versions } }
    },

    history: (branch, folder, limit) =>
      ask(
        call({
          method: 'GET',
          path: `${root}/commits`,
          query: { sha: branch, path: folder, per_page: String(Math.max(1, Math.min(50, limit))) },
        }),
        (r) =>
          (Array.isArray(r.body) ? r.body.map(obj) : []).map((row) => {
            const made = obj(row.commit)
            const who = obj(made.author)
            return {
              commit: str(row.sha),
              by: str(who.name) || str(obj(row.author).login),
              at: Date.parse(str(who.date)),
              message: str(made.message),
            }
          }),
      ),

    commitPaths: (commit) =>
      ask(call({ method: 'GET', path: `${root}/commits/${enc(commit)}` }), (r) =>
        (Array.isArray(obj(r.body).files) ? (obj(r.body).files as unknown[]).map(obj) : []).flatMap((f) => [
          str(f.filename),
          ...(typeof f.previous_filename === 'string' ? [f.previous_filename] : []),
        ]),
      ),

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
        const look = (): ReturnType<typeof call> => call({ method: 'GET', path: `${root}/pulls/${number}` })
        let again = await look()
        // GitHub works out `mergeable` after it is asked; `null` means "not yet", which is neither a clash nor a rule.
        // Wait a moment and look once more, and if it is still working it out, say so and let the person press again.
        if (again.ok && obj(again.value.body).mergeable === null) {
          await new Promise((done) => setTimeout(done, MERGEABLE_WAIT_MS))
          again = await look()
          if (again.ok && obj(again.value.body).mergeable === null) return { ok: false, problem: 'busy' }
        }
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
