// What the sheets for putting changes in are in: which step, and what went wrong when something did.
import type { ProblemKind } from '../wire/wire.ts'

/** Asking, going, could not go, in the game, or sent to be checked. */
export type Phase = 'ask' | 'working' | 'failed' | 'done' | 'sent'

export interface Failure {
  readonly problem: ProblemKind
  /** The framework's sentences when the game would not read. */
  readonly details: readonly string[]
}
