// The pretend GitHub's repos: git as far as the editor uses it. A repo is some branches, each a map from path to
// text, the commits made through the API, and the pulls. There are no trees or blobs on the outside; a file's
// `sha` is git's blob sha, so it changes exactly when the bytes do.
import { createHash } from 'node:crypto'
import { fixtureBytes, fixtureMap } from '../game/read.ts'
import { linksMap } from '../links-game/read.ts'

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
  /** Whether a person or an organisation owns it. */
  ownerType: 'User' | 'Organization'
  /** People GitHub shows as admins of the repo besides its owner (an organisation's admins, say). */
  readonly admins: Set<string>
  /** Has the editor been added to this repo? */
  installed: boolean
  /** The branch rule on the default branch. */
  rule: 'none' | 'app-bypasses' | 'blocks-app'
  /** What every commit's checks say. */
  checks: 'passing' | 'running' | 'failing' | 'none'
  /** People other than the owner who can reach the repo on GitHub (collaborators). */
  readonly collaborators: Set<string>
  readonly branches: Map<string, Map<string, string>>
  /**
   * Files that are bytes, not text (a tileset's picture), by path. They are the same on every branch: no test changes
   * one. Contents answers give them as base64, or as the raw bytes when the raw media type is asked for.
   */
  readonly bytes: Map<string, Uint8Array>
  readonly commits: FakeCommit[]
  readonly pulls: FakePull[]
  /** The time, for new pulls. The server sets it to its own clock. */
  clock: () => number
  readonly heads: Map<string, string>
  /** When each commit was made, stamped by the repo's clock whenever a head moves; a test may set one by hand. */
  readonly commitDates: Map<string, number>
  readonly bases: Map<string, Map<string, string>>
  readonly pullFacts: Map<number, PullFacts>
  /** `branch` -> new path -> old path, for files a pull renamed. */
  readonly renames: Map<string, Map<string, string>>
  /** Adds a file that is bytes. */
  putBytes(path: string, bytes: Uint8Array): void
  /** As when someone else changes the game: writes a file on a branch without going through the API. */
  put(branch: string, path: string, text: string): void
  /** As when a suggestion was saved: a branch from `main`, with a pull open for it. */
  addPull(head: string, title?: string): FakePull
  /** Makes a pull from a fork, named like a suggestion's branch. */
  addForkPull(head: string, fork: string): FakePull
  /** Moves a file on a branch to a new path, so a pull shows it as renamed. */
  rename(branch: string, from: string, to: string): void
}

/** Git's blob sha: the SHA-1 of `blob <bytes>\0<content>`. A string is its UTF-8 bytes. */
export function blobSha(content: string | Uint8Array): string {
  const length = typeof content === 'string' ? Buffer.byteLength(content) : content.byteLength
  return createHash('sha1').update(`blob ${length}\0`).update(content).digest('hex')
}

let counter = 0
/** A commit sha: not git's, but 40 hex characters and never the same twice. */
export function nextSha(seed: string): string {
  counter++
  return createHash('sha1').update(`${counter}:${seed}`).digest('hex')
}

function makeRepo(
  owner: string,
  name: string,
  files: Map<string, string>,
  bytes: Record<string, Uint8Array> = {},
): FakeRepo {
  const defaultBranch = 'main'
  const commitDates = new Map<string, number>()
  const first = nextSha(`${owner}/${name}`)
  const heads = new Map<string, string>([[defaultBranch, first]])
  commitDates.set(first, Date.now())
  // Every later move of a head is a commit: remember when, so a commit's date can be asked for.
  const move = heads.set.bind(heads)
  heads.set = (branch, sha) => {
    commitDates.set(sha, repo.clock())
    return move(branch, sha)
  }
  const openPull = (head: string, title: string, fork: string | undefined): FakePull => {
    const pull: FakePull = { number: repo.pulls.length + 1, title, head, base: defaultBranch, state: 'open' }
    repo.pulls.push(pull)
    repo.pullFacts.set(pull.number, { createdAt: repo.clock(), body: '', fork })
    repo.branches.set(head, new Map(files))
    repo.bases.set(head, new Map(files))
    heads.set(head, nextSha(`${fork === undefined ? 'pull' : 'fork'}:${head}`))
    return pull
  }
  const repo: FakeRepo = {
    owner,
    name,
    defaultBranch,
    isPublic: true,
    ownerType: 'User',
    admins: new Set(),
    installed: true,
    rule: 'none',
    checks: 'passing',
    collaborators: new Set(),
    branches: new Map([[defaultBranch, files]]),
    bytes: new Map(Object.entries(bytes)),
    commits: [],
    pulls: [],
    clock: () => Date.now(),
    heads,
    commitDates,
    bases: new Map(),
    pullFacts: new Map(),
    renames: new Map(),
    putBytes(path, content) {
      repo.bytes.set(path, content)
    },
    put(branch, path, text) {
      const files = repo.branches.get(branch)
      if (files === undefined) throw new Error(`no branch ${branch}`)
      files.set(path, text)
      heads.set(branch, nextSha(`put:${branch}:${path}`))
    },
    addPull(head, title = head) {
      return openPull(head, title, undefined)
    },
    addForkPull(head, fork) {
      return openPull(head, head, fork)
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

/** A game on `main`, owned by `owner`, public, with the editor added. Its files are text; a picture is bytes. */
export function addGame(
  owner: string,
  name: string,
  files: Map<string, string>,
  bytes: Record<string, Uint8Array> = {},
): FakeRepo {
  return makeRepo(owner, name, files, bytes)
}

/** The Crate Game (the fixture game, with its tileset's picture) on `main`, owned by `grandma`. */
export function gameRepo(name: string): FakeRepo {
  return addGame('grandma', name, fixtureMap(), { ...fixtureBytes() })
}

/** The links game: three rooms whose doors and edges join, owned by `grandma`. */
export function linksRepo(name: string): FakeRepo {
  return addGame('grandma', name, linksMap())
}

/** A repo with a README.md and nothing else. */
export function notAGameRepo(name: string): FakeRepo {
  return makeRepo('grandma', name, new Map([['README.md', '# Not a game\n']]))
}
