// Playing a level where it is drawn: the framework's own `startGame`, on the game as it is being edited, in the box the
// level fills. What plays is the game's content, never its code, and nothing is kept: the game's settings live in memory,
// so a Play leaves nothing on the device and no file changes.
import {
  createLocale,
  type Frames,
  formatDiagnostic,
  type Game,
  type Language,
  languagesOf,
  loadGame,
  memoryStore,
  openSettings,
  startGame,
  webHost,
} from '@automataframework/framework'
import type { GameContent } from '@automataframework/framework/headless'
import { type Edits, type OpenGame, readerOf } from '../game/game.ts'
import { readPictureOf } from '../levels/levels.ts'

export interface PlayOptions {
  /** The box the game fills: its canvas, and its touch buttons on a touch screen. */
  readonly mount: HTMLElement
  readonly game: OpenGame
  readonly edits: Edits
  readonly level: string
  /** The person's language: the game plays in it when the game has its words, else in the game's own language. */
  readonly lang: string
  /** Only for tests: the frames the game is given. */
  readonly frames?: Frames
}

export interface Playing {
  pause(): void
  resume(): void
  paused(): boolean
  /** Stops and starts the same level from its start. */
  again(): Promise<void>
  stop(): void
  /** The tick the game is at. */
  tick(): number
}

/** A level that cannot be played: the first sentence, and every sentence that says what is wrong. */
export class CannotPlay extends Error {
  readonly lines: readonly string[]
  constructor(lines: readonly string[]) {
    super(lines[0] ?? '')
    this.name = 'CannotPlay'
    this.lines = lines
  }
}

/** The language a game plays in: the person's when the game has its words, else the game's own (English if it names none). */
export function playLanguage(content: GameContent, lang: string): Language {
  const has = languagesOf(content).find((one) => one === lang)
  return has ?? content.project.source ?? 'en'
}

/** Starts the framework's `startGame` on the edited content in `mount`. Rejects with a `CannotPlay` when the level cannot be built. */
export async function play(options: PlayOptions): Promise<Playing> {
  const { mount, game, edits, level, lang, frames } = options
  const loaded = await loadGame(readerOf(game, edits))
  if (!loaded.ok) throw new CannotPlay(loaded.diagnostics.map(formatDiagnostic))
  const content = loaded.value
  // A host of the page whose saves are in memory: nothing a game keeps (its language, its keys) reaches the device.
  const host = { ...webHost(), store: memoryStore() }
  const settings = await openSettings({ game: 'play-in-place', store: host.store })
  const locale = createLocale({ content, host, settings })
  await locale.set(playLanguage(content, lang))
  const readPicture = readPictureOf(content, game.pictures)

  const begin = async (): Promise<Game> => {
    try {
      return await startGame({
        content,
        locale,
        mount,
        host,
        level,
        readPicture,
        ...(frames === undefined ? {} : { frames }),
      })
    } catch (error) {
      throw new CannotPlay([error instanceof Error ? error.message : String(error)])
    }
  }
  let running = await begin()
  return {
    pause: () => running.pause(),
    resume: () => running.resume(),
    paused: () => running.paused(),
    async again() {
      running.stop()
      running = await begin()
    },
    stop: () => running.stop(),
    tick: () => running.sim.tick,
  }
}
