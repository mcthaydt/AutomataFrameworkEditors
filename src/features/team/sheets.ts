// What the sheets for putting changes in are in: which step, and what went wrong when something did.
import type { Clash, Working } from '../game/game.ts'
import type { ProblemKind } from '../wire/wire.ts'

/** Asking, going, could not go, in the game, or sent to be checked. */
export type Phase = 'ask' | 'working' | 'failed' | 'done' | 'sent'

export interface Failure {
  readonly problem: ProblemKind
  /** The framework's sentences when the game would not read. */
  readonly details: readonly string[]
}

/** Where two people changed one thing: each clash, what each side has, and the answers given so far. */
export interface ClashSet {
  readonly list: readonly Clash[]
  /** What the person had before the game's changes came in, and what the game has now. */
  readonly mine: Working
  readonly theirs: Working
  /** By the clash's place in `list`; undefined until answered. */
  readonly answers: Readonly<Record<number, 'mine' | 'theirs' | undefined>>
  /** Who changed it in the game, said by name. */
  readonly by: string
}
