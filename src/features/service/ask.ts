// Asking for a change, and turning one down. Both are a comment the App writes on the waiting change (an ordinary pull
// request): GitHub will not let the App, which opened it, request changes on it. The first line of the comment is fixed,
// so an agent reading the pull request sees the same words, and this file is the one place that writes and reads them.
import type { Pull, Repo } from '../github/github.ts'
import type { Waiting } from '../wire/wire.ts'
import { suggestionBranch } from './enter.ts'

/** The first line of "ask for a change": this, the person's login, then a blank line, then the words. */
export const ASKED = 'Change asked for by '
/** The first line of "turned down": this, and the login of the person who turned it down. */
export const NOT_PUT_IN = 'Not put in by '

/** The most characters of what a person asks for. */
export const MOST_WORDS = 500

export const askedText = (login: string, words: string): string => `${ASKED}${login}\n\n${words}`
export const notPutInText = (login: string): string => `${NOT_PUT_IN}${login}`

/** What a comment of the App's says, when it is one of the two kinds; anything else is nobody's business here. */
export function readComment(
  text: string,
): { kind: 'asked'; by: string; words: string } | { kind: 'not-put-in'; by: string } | undefined {
  const [first = '', ...rest] = text.split(/\r?\n/)
  if (first.startsWith(ASKED)) {
    const by = first.slice(ASKED.length).trim()
    const words = rest.join('\n').trim()
    return by === '' || words === '' ? undefined : { kind: 'asked', by, words }
  }
  if (first.startsWith(NOT_PUT_IN)) {
    const by = first.slice(NOT_PUT_IN.length).trim()
    return by === '' ? undefined : { kind: 'not-put-in', by }
  }
  return undefined
}

/**
 * What was asked of this change: the newest ask that is not older than the change's last commit. When its author
 * sends again, it is answered and gone. A comment that cannot be read is no ask, not a problem.
 */
export async function askedOf(repo: Repo, pull: Pull): Promise<Waiting['asked']> {
  const comments = await repo.comments(pull.number)
  if (!comments.ok) return undefined
  for (const comment of comments.value) {
    const read = readComment(comment.text)
    if (read?.kind !== 'asked') continue
    const made = await repo.commitTime(pull.headCommit)
    if (made.ok && comment.at < made.value) return undefined
    return { by: read.by, words: read.words, at: comment.at }
  }
  return undefined
}

/** The same change with what was asked of it, when something was. */
export async function withAsked(repo: Repo, waiting: Waiting, pull: Pull): Promise<Waiting> {
  const asked = await askedOf(repo, pull)
  return asked === undefined ? waiting : { ...waiting, asked }
}

/** Who turned this person's last change down, and when: nothing when it was not turned down, or it was started again. */
export async function turnedDownOf(
  repo: Repo,
  login: string,
): Promise<{ by: string; at: number } | undefined> {
  const branch = suggestionBranch(login)
  if (!(await repo.branchHead(branch)).ok) return undefined
  const closed = await repo.closedPull(branch)
  if (!closed.ok || closed.value === undefined) return undefined
  const comments = await repo.comments(closed.value.number)
  if (!comments.ok) return undefined
  for (const comment of comments.value) {
    const read = readComment(comment.text)
    if (read?.kind === 'not-put-in') return { by: read.by, at: comment.at }
  }
  return undefined
}
