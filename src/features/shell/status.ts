// What the top bar says about the person's changes and the game's, in the order a person needs it: no internet first
// (nothing else can be done about it), then problems, then their own changes, then what waits for them.
import type { AccessLevel } from '../access/access.ts'
import type { Waiting } from '../wire/wire.ts'

export type Status =
  | { readonly kind: 'up-to-date' }
  | { readonly kind: 'changes'; readonly count: number }
  | { readonly kind: 'waiting'; readonly by: string }
  | { readonly kind: 'more'; readonly count: number; readonly by: string }
  | { readonly kind: 'to-check'; readonly count: number }
  | { readonly kind: 'offline' }
  | { readonly kind: 'problems'; readonly count: number }

export interface StatusFacts {
  readonly online: boolean
  readonly problems: number
  /** How many changes the person has that are not in the game or sent yet. */
  readonly changes: number
  /** The person's own waiting change, if they sent one. */
  readonly mine: Waiting | undefined
  /** How many changes other people sent for this person to check. */
  readonly toCheck: number
  /** Who the waiting change is with, said by name; empty when the page does not know. */
  readonly approver?: string
}

/** What the top bar says: offline first, then problems, then the person's own changes, then what waits. */
export function statusOf(facts: StatusFacts): readonly Status[] {
  const said: Status[] = []
  if (!facts.online) said.push({ kind: 'offline' })
  if (facts.problems > 0) said.push({ kind: 'problems', count: facts.problems })
  const by = facts.approver ?? ''
  if (facts.mine !== undefined) {
    said.push(facts.changes > 0 ? { kind: 'more', count: facts.changes, by } : { kind: 'waiting', by })
  } else {
    said.push(facts.changes > 0 ? { kind: 'changes', count: facts.changes } : { kind: 'up-to-date' })
  }
  if (facts.toCheck > 0) said.push({ kind: 'to-check', count: facts.toCheck })
  return said
}

/** What the one main button does: put changes in, send them to be checked, or keep a copy. */
export type MainButton = 'put' | 'send' | 'keep' | undefined

export function mainButton(level: AccessLevel, signedIn: boolean, changes: number): MainButton {
  if (changes <= 0) return undefined
  if (!signedIn) return 'keep'
  if (level === 'edit' || level === 'owner') return 'put'
  if (level === 'suggest' || level === 'approve') return 'send'
  return 'keep'
}
