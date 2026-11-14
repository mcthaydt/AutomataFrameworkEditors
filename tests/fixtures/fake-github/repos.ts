// The pretend GitHub's repos: git as far as the editor uses it. A repo is some branches, each a map from path to
// text, the commits made through the API, and the pulls. There are no trees or blobs on the outside; a file's
// `sha` is git's blob sha, so it changes exactly when the bytes do.
import { createHash } from 'node:crypto'
import { fixtureMap } from '../game/read.ts'

export interface FakeCommit {
  readonly sha: string
  readonly branch: string
  readonly message: string
  readonly path: string
  readonly text: string
  readonly author: string
}
export interface FakePull {
  readonly number: number
  readonly title: string
  readonly head: string
  readonly base: string
  state: 'open' | 'merged' | 'closed'
}

/** What the repo knows about a pull that the pull itself does not show. */
export interface PullFacts {
  readonly createdAt: number
  readonly body: string
  /** Set for a pull from a fork: the fork's full name. */
  readonly fork: string | undefined
}

export interface FakeRepo {
  readonly owner: string
  readonly name: string
  readonly defaultBranch: string
  isPublic: boolean
  /** Has the editor been added to this repo? */
  installed: boolean
  /** The branch rule on the default branch. */
  rule: 'none' | 'app-bypasses' | 'blocks-app'
  /** What every commit's checks say. */
  checks: 'passing' | 'running' | 'failing' | 'none'
  /** People other than the owner who can reach the repo on GitHub (collaborators). */
  readonly collaborators: Set<string>
  readonly branches: Map<string, Map<string, string>>
  readonly commits: FakeCommit[]
  readonly pulls: FakePull[]
  /** The time, for new pulls. The server sets it to its own clock. */
  clock: () => number
  readonly heads: Map<string, string>
  readonly bases: Map<string, Map<string, string>>
  readonly pullFacts: Map<number, PullFacts>
  /** `branch` -> new path -> old path, for files a pull renamed. */
  readonly renames: Map<string, Map<string, string>>
  /** As when someone else changes the game: writes a file on a branch without going through the API. */
  put(branch: string, path: string, text: string): void
  /** Makes a pull from a fork, named like a suggestion's branch. */
  addForkPull(head: string, fork: string): FakePull
  /** Moves a file on a branch to a new path, so a pull shows it as renamed. */
  rename(branch: string, from: string, to: string): void
}

/** Git's blob sha: the SHA-1 of `blob <bytes>\0<content>`. */
export function blobSha(text: string): string {
  return createHash('sha1')
    .update(`blob ${Buffer.byteLength(text)}\0`)
    .update(text)
    .digest('hex')
}

let counter = 0
/** A commit sha: not git's, but 40 hex characters and never the same twice. */
export function nextSha(seed: string): string {
  counter++
  return createHash('sha1').update(`${counter}:${seed}`).digest('hex')
}

function makeRepo(owner: string, name: string, files: Map<string, string>): FakeRepo {
  const defaultBranch = 'main'
  const heads = new Map<string, string>([[defaultBranch, nextSha(`${owner}/${name}`)]])
  const repo: FakeRepo = {
    owner,
    name,
    defaultBranch,
    isPublic: true,
    installed: true,
    rule: 'none',
    checks: 'passing',
    collaborators: new Set(),
    branches: new Map([[defaultBranch, files]]),
    commits: [],
    pulls: [],
    clock: () => Date.now(),
    heads,
    bases: new Map(),
    pullFacts: new Map(),
    renames: new Map(),
    put(branch, path, text) {
      const files = repo.branches.get(branch)
      if (files === undefined) throw new Error(`no branch ${branch}`)
      files.set(path, text)
      heads.set(branch, nextSha(`put:${branch}:${path}`))
    },
    addForkPull(head, fork) {
      const pull: FakePull = {
        number: repo.pulls.length + 1,
        title: head,
        head,
        base: defaultBranch,
        state: 'open',
      }
      repo.pulls.push(pull)
      repo.pullFacts.set(pull.number, { createdAt: repo.clock(), body: '', fork })
      repo.branches.set(head, new Map(files))
      repo.bases.set(head, new Map(files))
      heads.set(head, nextSha(`fork:${head}`))
      return pull
    },
    rename(branch, from, to) {
      const files = repo.branches.get(branch)
      const text = files?.get(from)
      if (files === undefined || text === undefined) throw new Error(`no ${from} on ${branch}`)
      files.delete(from)
      files.set(to, text)
      const moves = repo.renames.get(branch) ?? new Map<string, string>()
      moves.set(to, moves.get(from) ?? from)
      repo.renames.set(branch, moves)
      heads.set(branch, nextSha(`rename:${branch}:${to}`))
    },
  }
  return repo
}

/** The fixture game on `main`, owned by `grandma`, public, with the editor added. */
export function gameRepo(name: string): FakeRepo {
  return makeRepo('grandma', name, fixtureMap())
}

/** A repo with a README.md and nothing else. */
export function notAGameRepo(name: string): FakeRepo {
  return makeRepo('grandma', name, new Map([['README.md', '# Not a game\n']]))
}
