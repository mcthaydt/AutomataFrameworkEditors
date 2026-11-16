// The same as `open-game.ts`, with the version of each file given by the test, so a test that runs in a browser (which
// has no `node:crypto`) can open a game too.
import type { Api } from '#src/features/api/api.ts'
import { type OpenGame, openGame } from '#src/features/game/game.ts'
import type { Answer, GameRef, OpenAnswer } from '#src/features/wire/wire.ts'

/** The game the tests open when they say nothing. */
export const OPEN_REF: GameRef = { owner: 'grandma', name: 'links-game' }

export async function openedGameWith(
  version: (text: string) => string,
  files: Readonly<Record<string, string | undefined>>,
  over: Partial<OpenAnswer> = {},
  ref: GameRef = OPEN_REF,
): Promise<OpenGame> {
  const wire = Object.entries(files).flatMap(([path, text]) =>
    text === undefined ? [] : [{ path, text, version: version(text) }],
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
