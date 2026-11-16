// A game as the page holds it, opened through the real `openGame` from files given as text (a path with no text is
// left out), without any API: for the tests of what a person holds and does with an open game.
import type { Api } from '#src/features/api/api.ts'
import { type OpenGame, openGame } from '#src/features/game/game.ts'
import type { Answer, GameRef, OpenAnswer } from '#src/features/wire/wire.ts'
import { blobSha } from './fake-github/repos.ts'

export const OPEN_REF: GameRef = { owner: 'grandma', name: 'links-game' }

export async function openedGame(
  files: Readonly<Record<string, string | undefined>>,
  over: Partial<OpenAnswer> = {},
  ref: GameRef = OPEN_REF,
): Promise<OpenGame> {
  const wire = Object.entries(files).flatMap(([path, text]) =>
    text === undefined ? [] : [{ path, text, version: blobSha(text) }],
  )
  const api = {
    open: async (): Promise<Answer<OpenAnswer>> => ({
      ok: true,
      value: {
        game: ref,
        login: 'grandma',
        level: 'owner',
        branch: 'main',
        mine: undefined,
        waiting: 0,
        turnedDown: undefined,
        files: wire,
        editors: { format: 1, problems: 'warn' },
        people: [],
        pictures: [],
        ...over,
      },
    }),
  } as unknown as Api
  const result = await openGame(api, ref)
  if (!result.ok) throw new Error(`did not open: ${result.problem}`)
  return result.game
}
