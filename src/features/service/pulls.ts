// What counts as a waiting change, and how one is told to the page. Used by opening a game, saving and the waiting
// screens, so that all of them mean the same thing.
import type { Pull, Repo } from '../github/github.ts'
import type { Waiting } from '../wire/wire.ts'
import { SUGGESTION_PREFIX, suggestionBranch } from './enter.ts'

/** A waiting change is an open pull into the default branch from an `automata/` branch in this same repo. */
export const isWaiting = (pull: Pull): boolean => pull.headIsHere && pull.head.startsWith(SUGGESTION_PREFIX)

/** The person's own waiting change among `pulls`, if they have one. */
export const ownPull = (pulls: readonly Pull[], login: string): Pull | undefined =>
  pulls.find((pull) => isWaiting(pull) && pull.head === suggestionBranch(login))

/** How the page is told of a waiting change: who from, and what its checks say. */
export async function toWaiting(repo: Repo, pull: Pull, login: string | undefined): Promise<Waiting> {
  const checks = await repo.checks(pull.headCommit)
  return {
    number: pull.number,
    title: pull.title,
    by: pull.head.slice(SUGGESTION_PREFIX.length),
    mine: login !== undefined && pull.head === suggestionBranch(login),
    checks: checks.ok ? checks.value : 'none',
  }
}
