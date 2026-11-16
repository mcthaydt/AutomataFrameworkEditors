// The App's calls that put several files in one commit and read a branch's history. They are made with GitHub's blobs,
// trees, commits and a ref update that is never forced (the App's contents permission covers all four), so a change of
// many files is one commit or nothing. `repo.ts` hands them the one way it has of calling GitHub.
import { toBase64 } from '../../lib/base64.ts'
import type { Answer } from '../wire/wire.ts'
import type { Reply, Req } from './request.ts'

export interface Author {
  readonly name: string
  readonly email: string
}

export interface CommitCalls {
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
}

/** What these calls need from the repo they are made in. */
export interface Hands {
  /** One call to GitHub as the installation. */
  readonly call: (req: Omit<Req, 'as'>) => Promise<Answer<Reply>>
  /** `/repos/<owner>/<name>`. */
  readonly root: string
  readonly branchHead: (branch: string) => Promise<Answer<string>>
  /** The version of the file `path` on `branch`; undefined when there is none. */
  readonly versionOn: (branch: string, path: string) => Promise<string | undefined>
}

type Json = Record<string, unknown>
const obj = (value: unknown): Json => (typeof value === 'object' && value !== null ? (value as Json) : {})
const str = (value: unknown): string => (typeof value === 'string' ? value : '')
const enc = (part: string): string => encodeURIComponent(part)
/** A branch name, encoded segment by segment so its slashes stay slashes. */
const encPath = (path: string): string => path.split('/').map(enc).join('/')

/** Passes a problem on, or hands the reply to `then`. */
async function ask<T>(reply: Promise<Answer<Reply>>, then: (r: Reply) => T): Promise<Answer<T>> {
  const got = await reply
  return got.ok ? { ok: true, value: then(got.value) } : got
}

export function commitCalls(h: Hands): CommitCalls {
  return {
    commitFiles: async ({ branch, files, message, author }) => {
      const head = await h.branchHead(branch)
      if (!head.ok) return head
      // Every version the person started from must still be true, or nothing is written.
      const stale: string[] = []
      for (const file of files) {
        if ((await h.versionOn(branch, file.path)) !== file.version) stale.push(file.path)
      }
      if (stale.length > 0) return { ok: false, problem: 'changed-elsewhere', details: stale }

      const base = await h.call({ method: 'GET', path: `${h.root}/git/commits/${enc(head.value)}` })
      if (!base.ok) return base
      const baseTree = str(obj(obj(base.value.body).tree).sha)
      const entries: Json[] = []
      const versions: Record<string, string> = {}
      for (const file of files) {
        if (file.text === undefined) {
          // A file that was never there has nothing to take away.
          if (file.version !== undefined) {
            entries.push({ path: file.path, mode: '100644', type: 'blob', sha: null })
          }
          continue
        }
        const blob = await h.call({
          method: 'POST',
          path: `${h.root}/git/blobs`,
          body: { content: toBase64(file.text), encoding: 'base64' },
        })
        if (!blob.ok) return blob
        const sha = str(obj(blob.value.body).sha)
        versions[file.path] = sha
        entries.push({ path: file.path, mode: '100644', type: 'blob', sha })
      }
      const tree = await h.call({
        method: 'POST',
        path: `${h.root}/git/trees`,
        body: { base_tree: baseTree, tree: entries },
      })
      if (!tree.ok) return tree
      // Only the author is sent: with no committer GitHub signs the commit as the App (see saveFile).
      const made = await h.call({
        method: 'POST',
        path: `${h.root}/git/commits`,
        body: { message, tree: str(obj(tree.value.body).sha), parents: [head.value], author },
      })
      if (!made.ok) return made
      const commit = str(obj(made.value.body).sha)
      const moved = await h.call({
        method: 'PATCH',
        path: `${h.root}/git/refs/heads/${encPath(branch)}`,
        body: { sha: commit, force: false },
        pass: [409, 422],
      })
      if (!moved.ok) return moved
      if (moved.value.status === 409 || moved.value.status === 422) {
        // Settled by looking: a branch that is not where it was moved under us; one that is, a rule refused the App.
        const now = await h.branchHead(branch)
        return now.ok && now.value === head.value
          ? { ok: false, problem: 'blocked' }
          : { ok: false, problem: 'changed-elsewhere' }
      }
      return { ok: true, value: { commit, versions } }
    },

    history: (branch, folder, limit) =>
      ask(
        h.call({
          method: 'GET',
          path: `${h.root}/commits`,
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
      ask(h.call({ method: 'GET', path: `${h.root}/commits/${enc(commit)}` }), (r) =>
        (Array.isArray(obj(r.body).files) ? (obj(r.body).files as unknown[]).map(obj) : []).flatMap((f) => [
          str(f.filename),
          ...(typeof f.previous_filename === 'string' ? [f.previous_filename] : []),
        ]),
      ),
  }
}
