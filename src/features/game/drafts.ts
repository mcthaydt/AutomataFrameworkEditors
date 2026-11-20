// What a person changed and has not put in, kept on the device so that a reload, or a trip to GitHub and back to sign
// in, does not lose it. One key for each changed file (`af.draft:<owner>/<name>:<path>`), holding the file's text as it
// would be written, the version it was made against and the text it started from. A convenience and nothing more: the
// store may be missing, full or full of garbage, and then the person simply has no draft. A file that changed in the
// game while the person worked is never dropped and never laid over: it comes back in `moved`, to be merged first.
import { type Level, parseContent, type WorldFile, writeContent } from '@automataframework/framework/headless'
import { type Edits, startEdits, toPut } from './changes.ts'
import type { OpenGame } from './open.ts'

interface Kept {
  /** The version of the file the draft was made against; null for a file that is new. */
  readonly version: string | null
  /** The text the draft started from; null for a file that is new. */
  readonly base: string | null
  /** The text it would be written as; null for a file taken away. */
  readonly text: string | null
}

/** `draft`: what is not put in yet. `sent`: what was sent to be checked, kept until it is told yes or no. */
export type Shelf = 'draft' | 'sent'

const prefixOf = (game: OpenGame, shelf: Shelf = 'draft'): string =>
  `af.${shelf}:${game.ref.owner}/${game.ref.name}:`

/** Every key of this game's drafts, whatever is in them. */
function keysOf(store: Storage, game: OpenGame, shelf: Shelf): string[] {
  const prefix = prefixOf(game, shelf)
  const keys: string[] = []
  try {
    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i)
      if (key?.startsWith(prefix)) keys.push(key)
    }
  } catch {
    // A store that throws has no drafts to find.
  }
  return keys
}

function forget(store: Storage, key: string): void {
  try {
    store.removeItem(key)
  } catch {
    // Nothing to do.
  }
}

const orNull = (value: unknown): string | null | undefined =>
  value === null || typeof value === 'string' ? value : undefined

/** What a key holds, or undefined for anything that is not a draft of this form (including the old one-level form). */
function readKept(store: Storage, key: string): Kept | undefined {
  try {
    const raw = store.getItem(key)
    if (raw === null) return undefined
    const kept: unknown = JSON.parse(raw)
    if (typeof kept !== 'object' || kept === null) return undefined
    const { version, base, text } = kept as Record<string, unknown>
    const read = { version: orNull(version), base: orNull(base), text: orNull(text) }
    if (read.version === undefined || read.base === undefined || read.text === undefined) return undefined
    return { version: read.version, base: read.base, text: read.text }
  } catch {
    return undefined
  }
}

const LEVEL_FILE = /^content\/levels\/[^/]+\.json$/
const WORLD_FILE = /^content\/worlds\/[^/]+\.json$/

/** Which kind of file a draft's path is, for the game as it is now; undefined when it is no file the game has or lacks. */
function kindOf(game: OpenGame, path: string, isNew: boolean): 'level' | 'world' | undefined {
  if (path === game.worldPath) return 'world'
  if (isNew) {
    if (game.worldPath === undefined && WORLD_FILE.test(path)) return 'world'
    return LEVEL_FILE.test(path) ? 'level' : undefined
  }
  const listed = game.content.project.content.some((ref) => ref.type === 'level' && ref.path === path)
  return listed ? 'level' : undefined
}

/** Writes each changed file, and removes the keys of files that are no longer changed. A full store loses nothing else. */
export function keepDrafts(store: Storage, game: OpenGame, edits: Edits, shelf: Shelf = 'draft'): void {
  const wanted = new Set<string>()
  for (const file of toPut(game, edits).files) {
    const key = `${prefixOf(game, shelf)}${file.path}`
    wanted.add(key)
    const kind = kindOf(game, file.path, file.version === undefined) ?? 'level'
    const kept: Kept = {
      version: file.version ?? null,
      base: game.files.get(file.path)?.text ?? null,
      text: file.value === undefined ? null : writeContent(kind, file.value as never),
    }
    try {
      store.setItem(key, JSON.stringify(kept))
    } catch {
      // No room, or no store: the person loses nothing but the convenience.
    }
  }
  for (const key of keysOf(store, game, shelf)) if (!wanted.has(key)) forget(store, key)
}

export interface Taken {
  /** The person's changes. For a file in `moved`, `base` is the text the person started from, not the game's now. */
  readonly edits: Edits
  /** Paths whose file changed in the game since: lay these together with `merge` before anything is put in. */
  readonly moved: readonly string[]
}

const idOf = (path: string): string => path.slice(path.lastIndexOf('/') + 1, -'.json'.length)

/**
 * The changes kept for this game, laid over the game as it is now. A key that holds garbage, or a file the game no
 * longer lists, is removed and the rest is still taken. Undefined when nothing is kept.
 */
export function takeDrafts(store: Storage, game: OpenGame, shelf: Shelf = 'draft'): Taken | undefined {
  const start = startEdits(game)
  const nowLevels: Record<string, Level> = { ...start.now.levels }
  const baseLevels: Record<string, Level> = { ...start.base.levels }
  let nowWorld: WorldFile | undefined = start.now.world
  let baseWorld: WorldFile | undefined = start.base.world
  const moved: string[] = []
  let taken = 0

  for (const key of keysOf(store, game, shelf)) {
    const path = key.slice(prefixOf(game, shelf).length)
    const kept = readKept(store, key)
    const isNew = kept?.version === null
    const kind = kept === undefined ? undefined : kindOf(game, path, isNew)
    const current = game.files.get(path)
    if (kept === undefined || kind === undefined) {
      forget(store, key)
      continue
    }
    const changedSince = isNew ? current !== undefined : kept.version !== current?.version

    let mine: Level | WorldFile | undefined
    if (kept.text !== null) {
      const parsed = parseContent(kind, kept.text, path)
      if (!parsed.ok || (parsed.value as { id?: string }).id !== idOf(path)) {
        forget(store, key)
        continue
      }
      mine = parsed.value as Level | WorldFile
    }
    let started: Level | WorldFile | undefined
    if (changedSince && !isNew) {
      const parsed = kept.base === null ? undefined : parseContent(kind, kept.base, path)
      if (parsed === undefined || !parsed.ok) {
        forget(store, key)
        continue
      }
      started = parsed.value as Level | WorldFile
    }

    if (kind === 'world') {
      nowWorld = mine as WorldFile | undefined
      if (changedSince) baseWorld = started as WorldFile | undefined
    } else {
      const id = idOf(path)
      if (mine === undefined) delete nowLevels[id]
      else nowLevels[id] = mine as Level
      if (changedSince && started !== undefined) baseLevels[id] = started as Level
      else if (changedSince) delete baseLevels[id]
    }
    if (changedSince) moved.push(path)
    taken += 1
  }
  if (taken === 0) return undefined

  const base = { levels: baseLevels, world: baseWorld, project: start.base.project }
  const now = { levels: nowLevels, world: nowWorld, project: start.now.project }
  return { edits: { base, now, past: [], future: [] }, moved }
}

export function dropDrafts(store: Storage, game: OpenGame, shelf: Shelf = 'draft'): void {
  for (const key of keysOf(store, game, shelf)) forget(store, key)
}
