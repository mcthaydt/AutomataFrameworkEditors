// Playing a level where it is drawn: the framework's own `startGame`, on the game as it is being edited, in the box the
// level fills. What plays is the game's content, never its code, and nothing is kept: the game's settings live in memory,
// so a Play leaves nothing on the device and no file changes.
import {
  createLocale,
  type Frames,
  type Game,
  type Language,
  languagesOf,
  memoryStore,
  openSettings,
  startGame,
  webHost,
} from '@automataframework/framework'
import {
  type Arrive,
  doorTaken,
  type GameContent,
  readGame,
  type Way,
} from '@automataframework/framework/headless'
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
  /** Where the hero comes in: beside a thing (a door it came through) or at a spot of the level. Left out: its own start. */
  readonly arrive?: Arrive
  /** A hero went through a door that leads to another level; told once, and the play goes on until it is answered. */
  readonly ondoor?: (way: Way) => void
  /** Only for tests: the frames the game is given. */
  readonly frames?: Frames
}

const LOST_CHARACTER = /^things\[\d+\]\.character$/
const LEVEL_FILE = /^content\/levels\/([^/]+)\.json$/

/** The last seconds of play that can be gone back through. */
const KEEP_SECONDS = 30

export interface Playing {
  pause(): void
  resume(): void
  paused(): boolean
  /** Stops and starts the same level from its start. */
  again(): Promise<void>
  stop(): void
  /** The tick the game is at. */
  tick(): number
  /** Ticks in a second of play. */
  readonly hz: number
  /** While paused: takes one step. */
  step(): void
  /** How fast time passes: 1, 0.5 or 0.25. */
  speed(): number
  setSpeed(rate: number): void
  /** The ticks that can be gone back to: `from` is the oldest, `to` is now. */
  kept(): { readonly from: number; readonly to: number }
  /** While paused: the play as it was at `tick`. */
  backTo(tick: number): void
  /** Stops and starts from a spot of the level (tiles, the level's own), or from beside a thing. */
  from(arrive: Arrive): Promise<void>
  /** Doors are not followed in this play: the world file has a problem, so where they lead is not known. */
  readonly doorsShut: boolean
  /** Every hero as its box in the game's picture, as of the last picture drawn. */
  heroes(): ReturnType<Game['heroes']>
  /** The level under a point of the mount (CSS pixels) and where in it, as drawn; undefined where no level is drawn. */
  levelAt(x: number, y: number): ReturnType<Game['levelAt']>
  /** What the game holds now: every thing with its parts, for a test or an agent to read. */
  view(): ReturnType<Game['sim']['describeSnapshot']>
}

/** A level that cannot be played: the framework's own sentences, one for each thing that is wrong, with no file or place. */
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

/** The content with every thing left out whose character the game does not have: the problem stays in the list, the play goes on. */
function withoutLostThings(content: GameContent): GameContent {
  const levels = Object.fromEntries(
    Object.entries(content.levels).map(([id, level]) => [
      id,
      { ...level, things: level.things.filter((thing) => content.characters[thing.character] !== undefined) },
    ]),
  )
  return { ...content, levels }
}

/** Starts the framework's `startGame` on the edited content in `mount`. Rejects with a `CannotPlay` when the level cannot be built. */
export async function play(options: PlayOptions): Promise<Playing> {
  const { mount, game, edits, level, lang, frames, ondoor } = options
  // A game with problems plays when the framework can still build the level; what it cannot read stops the play.
  const read = await readGame(readerOf(game, edits))
  if (read.content === undefined) throw new CannotPlay(read.diagnostics.map((one) => one.message))
  const content = withoutLostThings(read.content)
  // What the play can go on with: a thing whose character is gone (left out above), a problem in the world file (the level
  // plays alone, and where its doors lead is not known, so they stay shut) and a problem in a level that is not this one.
  const doorsShut = read.diagnostics.some((one) => one.file === game.worldPath)
  const stopping = read.diagnostics.filter(
    (one) =>
      !LOST_CHARACTER.test(one.path) &&
      one.file !== game.worldPath &&
      (LEVEL_FILE.exec(one.file)?.[1] ?? level) === level,
  )
  if (stopping.length > 0) throw new CannotPlay(stopping.map((one) => one.message))
  // A host of the page whose saves are in memory: nothing a game keeps (its language, its keys) reaches the device.
  const host = { ...webHost(), store: memoryStore() }
  const settings = await openSettings({ game: 'play-in-place', store: host.store })
  const locale = createLocale({ content, host, settings })
  await locale.set(playLanguage(content, lang))
  const readPicture = readPictureOf(content, game.pictures)

  let speed = 1
  let arrive = options.arrive
  let stopDoor: (() => void) | undefined
  const begin = async (): Promise<Game> => {
    try {
      const started = await startGame({
        content,
        locale,
        mount,
        host,
        level,
        readPicture,
        keepSeconds: KEEP_SECONDS,
        ...(arrive === undefined ? {} : { arrive }),
        ...(frames === undefined ? {} : { frames }),
      })
      if (speed !== 1) started.setSpeed(speed)
      stopDoor?.()
      if (ondoor !== undefined && !doorsShut) {
        let told = false
        stopDoor = started.onStep((step) => {
          const way = told ? undefined : doorTaken(content, level, step.events)
          if (way === undefined) return
          told = true
          ondoor(way)
        })
      }
      return started
    } catch (error) {
      throw new CannotPlay([error instanceof Error ? error.message : String(error)])
    }
  }
  let running = await begin()
  const restart = async (): Promise<void> => {
    running.stop()
    running = await begin()
  }
  return {
    pause: () => running.pause(),
    resume: () => running.resume(),
    paused: () => running.paused(),
    again() {
      arrive = undefined
      return restart()
    },
    from(spot) {
      arrive = spot
      return restart()
    },
    stop: () => {
      stopDoor?.()
      running.stop()
    },
    tick: () => running.sim.tick,
    hz: running.sim.tickHz,
    step: () => running.step(),
    speed: () => speed,
    setSpeed(rate) {
      speed = rate
      running.setSpeed(rate)
    },
    kept: () => running.kept(),
    backTo: (tick) => running.backTo(tick),
    doorsShut,
    heroes: () => running.heroes(),
    levelAt: (x, y) => running.levelAt(x, y),
    view: () => running.sim.describeSnapshot(),
  }
}
