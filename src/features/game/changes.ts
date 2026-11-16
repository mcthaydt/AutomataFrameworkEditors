// Everything a person has changed in a game, with one history. A level, the world file and the project file are
// held as plain data, step by step, so one undo walks back over a move in one level and a level made in another. Pure:
// no page, no device, no API. What would be put in is worked out from what differs from the game as it was opened.
import {
  type Level,
  PROJECT_FILE,
  parseProject,
  type WorldFile,
  writeContent,
} from '@automataframework/framework/headless'
import { same } from '../../lib/same.ts'
import { changeProject, type ProjectChange } from '../files/files.ts'
import type { PutAnswer, PutFile } from '../wire/wire.ts'
import { levelPath, type OpenGame } from './open.ts'

/** All the editable files of a game at one moment. */
export interface Working {
  readonly levels: Readonly<Record<string, Level>>
  /** Undefined: the game has no world file (yet). */
  readonly world: WorldFile | undefined
  /** automata.toml's text. */
  readonly project: string
}

/**
 * What a person has done. `base` is the game as it was opened (or last put in), `now` is what is on the screen, and
 * `past` and `future` are the steps undo and redo walk over, nearest last and first.
 */
export interface Edits {
  readonly base: Working
  readonly now: Working
  readonly past: readonly Working[]
  readonly future: readonly Working[]
}

/** How many steps back a person can go. */
export const HISTORY = 200

/** Where a level or a world file made here is put, as the framework's `create` and the editors always name them. */
const LEVEL_FOLDER = 'content/levels'
const WORLD_FOLDER = 'content/worlds'

const worldIn = (game: OpenGame): WorldFile | undefined =>
  game.worldPath === undefined ? undefined : Object.values(game.content.worlds ?? {})[0]

export function startEdits(game: OpenGame): Edits {
  const working: Working = {
    levels: game.content.levels,
    world: worldIn(game),
    project: game.files.get(PROJECT_FILE)?.text ?? '',
  }
  return { base: working, now: working, past: [], future: [] }
}

/** A new step. The same `Edits` when `next` equals `now` by value; drops the oldest step past HISTORY; empties `future`. */
export function change(edits: Edits, next: Working): Edits {
  if (same(edits.now, next)) return edits
  return { ...edits, now: next, past: [...edits.past, edits.now].slice(-HISTORY), future: [] }
}

export function undo(edits: Edits): Edits {
  const back = edits.past.at(-1)
  if (back === undefined) return edits
  return { ...edits, now: back, past: edits.past.slice(0, -1), future: [edits.now, ...edits.future] }
}

export function redo(edits: Edits): Edits {
  const [next, ...rest] = edits.future
  if (next === undefined) return edits
  return { ...edits, now: next, past: [...edits.past, edits.now].slice(-HISTORY), future: rest }
}

export const isChanged = (edits: Edits): boolean => !same(edits.base, edits.now)

/** One level changed by a pure function; the same `Edits` when the function gives the same level back. */
export function inLevel(edits: Edits, levelId: string, fn: (level: Level) => Level): Edits {
  const level = edits.now.levels[levelId]
  if (level === undefined) return edits
  const next = fn(level)
  if (same(level, next)) return edits
  return change(edits, { ...edits.now, levels: { ...edits.now.levels, [levelId]: next } })
}

interface Planned extends PutFile {
  readonly kind: 'level' | 'world'
}

/** Every file that differs from `base`, in a fixed order: changed and new levels, taken-away levels, then the world. */
function plan(
  game: OpenGame,
  edits: Edits,
): { readonly files: readonly Planned[]; readonly project: ProjectChange | undefined } {
  const { base, now } = edits
  const files: Planned[] = []
  const add: { type: 'level' | 'world'; path: string }[] = []
  const remove: string[] = []
  const version = (path: string): string | undefined => game.files.get(path)?.version

  for (const [id, level] of Object.entries(now.levels)) {
    const was = base.levels[id]
    if (was === undefined) {
      const path = `${LEVEL_FOLDER}/${id}.json`
      files.push({ kind: 'level', path, value: level, version: undefined })
      add.push({ type: 'level', path })
    } else if (!same(was, level)) {
      const path = levelPath(game, id)
      if (path !== undefined) files.push({ kind: 'level', path, value: level, version: version(path) })
    }
  }
  for (const id of Object.keys(base.levels)) {
    if (now.levels[id] !== undefined) continue
    const path = levelPath(game, id)
    if (path === undefined) continue
    files.push({ kind: 'level', path, value: undefined, version: version(path) })
    remove.push(path)
  }

  if (!same(base.world, now.world)) {
    const at = game.worldPath
    if (now.world === undefined) {
      if (at !== undefined) {
        files.push({ kind: 'world', path: at, value: undefined, version: version(at) })
        remove.push(at)
      }
    } else if (at === undefined) {
      const path = `${WORLD_FOLDER}/${now.world.id}.json`
      files.push({ kind: 'world', path, value: now.world, version: undefined })
      add.push({ type: 'world', path })
    } else {
      files.push({ kind: 'world', path: at, value: now.world, version: version(at) })
    }
  }

  const project: ProjectChange | undefined =
    add.length === 0 && remove.length === 0
      ? undefined
      : { ...(add.length === 0 ? {} : { add }), ...(remove.length === 0 ? {} : { remove }) }
  return { files, project }
}

/** What would be put in: each file that differs from `base`, as `PutFile`s, and the project's change. */
export function toPut(
  game: OpenGame,
  edits: Edits,
): { readonly files: readonly PutFile[]; readonly project: ProjectChange | undefined } {
  const planned = plan(game, edits)
  return {
    files: planned.files.map(({ path, value, version }) => ({ path, value, version })),
    project: planned.project,
  }
}

/** The project's text as it would be after the change (what was opened when nothing is listed or taken out). */
function projectAfter(edits: Edits, project: ProjectChange | undefined): string {
  if (project === undefined) return edits.base.project
  return changeProject(edits.base.project, project) ?? edits.base.project
}

/**
 * The game the page holds after a put: new versions, new texts, `base` moved up to `now`. Whoever made the game from
 * its files (`loadGame`) after this gets the same answer; `content.places` is not worked out again here, so a screen
 * that needs the joined places reads the game afresh with `readerOf`.
 */
export function afterPut(
  game: OpenGame,
  edits: Edits,
  answer: PutAnswer,
): { readonly game: OpenGame; readonly edits: Edits } {
  const { files: put, project: listed } = plan(game, edits)
  const files = new Map(game.files)
  for (const file of put) {
    if (file.value === undefined) {
      files.delete(file.path)
      continue
    }
    const version = answer.versions[file.path]
    if (version === undefined) continue
    files.set(file.path, { path: file.path, text: writeContent(file.kind, file.value as never), version })
  }
  if (answer.project !== undefined) files.set(answer.project.path, answer.project)

  const { worlds: _worlds, ...content } = game.content
  const parsed = answer.project === undefined ? undefined : parseProject(answer.project.text)
  const { now } = edits
  const worldPath =
    now.world === undefined ? undefined : (game.worldPath ?? put.find((file) => file.kind === 'world')?.path)
  const kept: Working = { ...now, project: answer.project?.text ?? projectAfter(edits, listed) }
  return {
    game: {
      ...game,
      files,
      mine: answer.mine ?? game.mine,
      worldPath,
      content: {
        ...content,
        ...(parsed?.ok === true ? { project: parsed.value } : {}),
        levels: now.levels,
        ...(now.world === undefined ? {} : { worlds: { [now.world.id]: now.world } }),
      },
    },
    edits: { base: kept, now: kept, past: edits.past, future: edits.future },
  }
}

/** The edited game as texts, for `loadGame`, `readGame` and play. */
export function readerOf(game: OpenGame, edits: Edits): (path: string) => Promise<string> {
  const { files, project } = plan(game, edits)
  const changed = new Map(files.map((file) => [file.path, file] as const))
  return async (path) => {
    if (path === PROJECT_FILE) return projectAfter(edits, project)
    const file = changed.get(path)
    if (file !== undefined) {
      if (file.value === undefined) throw new Error(`${path}: no such file`)
      return writeContent(file.kind, file.value as never)
    }
    const opened = game.files.get(path)
    if (opened === undefined) throw new Error(`${path}: no such file`)
    return opened.text
  }
}
