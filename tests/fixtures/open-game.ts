// A game as the page holds it, opened through the real `openGame` from files given as text (a path with no text is
// left out), without any API: for the tests of what a person holds and does with an open game.
import type { OpenGame } from '#src/features/game/game.ts'
import type { GameRef, OpenAnswer } from '#src/features/wire/wire.ts'
import { blobSha } from './fake-github/repos.ts'
import { OPEN_REF, openedGameWith } from './open-game-with.ts'

export const openedGame = (
  files: Readonly<Record<string, string | undefined>>,
  over: Partial<OpenAnswer> = {},
  ref: GameRef = OPEN_REF,
): Promise<OpenGame> => openedGameWith(blobSha, files, over, ref)
