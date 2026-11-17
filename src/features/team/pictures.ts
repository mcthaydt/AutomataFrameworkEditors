// A game's small picture for the list of games: its start level, drawn once. A game is opened only when its row comes
// into view, never more than a few at a time, and only the little picture and what the person may do are kept for the
// visit: never the game.
import type { AccessLevel } from '../access/access.ts'
import type { Api } from '../api/api.ts'
import { openGame } from '../game/game.ts'
import { createStage, type LevelStage as Stage } from '../levels/levels.ts'
import type { GameRef } from '../wire/wire.ts'

export interface Peek {
  /** The start level as a small picture; undefined when it could not be drawn (the row keeps its tile). */
  readonly picture: string | undefined
  /** What this person may do in the game. */
  readonly level: AccessLevel
  /** Who the game says the person is. */
  readonly login: string | undefined
}

export interface Peeker {
  /** The game's small copy, once; undefined for a game that cannot be opened (it keeps its tile). */
  peek(game: GameRef): Promise<Peek | undefined>
}

const keyOf = (game: GameRef): string => `${game.owner}/${game.name}`.toLowerCase()

/** Asks `look` for each game once, at most `limit` at a time, and keeps the answers for the visit. */
export function createPeeker(look: (game: GameRef) => Promise<Peek | undefined>, limit = 2): Peeker {
  const kept = new Map<string, Promise<Peek | undefined>>()
  const line: (() => void)[] = []
  let running = 0

  function next(): void {
    while (running < limit) {
      const go = line.shift()
      if (go === undefined) return
      running += 1
      go()
    }
  }

  return {
    peek(game) {
      const key = keyOf(game)
      const had = kept.get(key)
      if (had !== undefined) return had
      const made = new Promise<Peek | undefined>((resolve) => {
        line.push(() => {
          look(game)
            .catch(() => undefined)
            .then((one) => {
              running -= 1
              resolve(one)
              next()
            })
        })
      })
      kept.set(key, made)
      next()
      return made
    },
  }
}

const WIDTH = 160
const HEIGHT = 96

/** The page's way of looking: open the game, draw its start level small on the one Application, keep the copy. */
export function lookWith(
  api: Api,
  stage: () => Promise<Stage>,
): (game: GameRef) => Promise<Peek | undefined> {
  return async (game) => {
    const opened = await openGame(api, game)
    if (!opened.ok) return undefined
    const { content, pictures, level, login } = {
      content: opened.game.content,
      pictures: opened.game.pictures,
      level: opened.game.content.levels[opened.game.content.project.start],
      login: opened.game.login,
    }
    let picture: string | undefined
    if (level !== undefined) {
      try {
        const drawn = await (await stage()).snapshot(content, pictures, level, { w: WIDTH, h: HEIGHT })
        picture = drawn.toDataURL('image/png')
      } catch {
        picture = undefined
      }
    }
    return { picture, level: opened.game.level, login }
  }
}

/** The one Application the list of games draws with, made when the first row needs it and let go with the page. */
export function lazyStage(): { stage: () => Promise<Stage>; destroy: () => void } {
  let made: Promise<Stage> | undefined
  return {
    stage: () => {
      made ??= createStage()
      return made
    },
    destroy: () => void made?.then((one) => one.destroy()),
  }
}
