// The change a person has not saved, kept on the device so that a reload, or a trip to GitHub and back to sign in,
// does not lose it. It is a convenience and nothing more: the store may be missing, full or full of garbage, and
// then the person simply has no draft. A draft remembers the version of the file it was made against, so a level
// that changed in the meantime never gets an old change laid over it.
import { type Level, parseContent } from '@automataframework/framework/headless'
import { levelPath, type OpenGame } from './open.ts'

interface Kept {
  readonly version: string
  readonly level: unknown
}

const keyFor = (game: OpenGame, path: string): string => `af.draft:${game.ref.owner}/${game.ref.name}:${path}`

/** Where a level's draft lives; undefined for a level the project does not list. */
function slot(game: OpenGame, levelId: string): { key: string; version: string } | undefined {
  const path = levelPath(game, levelId)
  const file = path === undefined ? undefined : game.files.get(path)
  return path === undefined || file === undefined
    ? undefined
    : { key: keyFor(game, path), version: file.version }
}

export function keepDraft(store: Storage, game: OpenGame, level: Level): void {
  const where = slot(game, level.id)
  if (where === undefined) return
  try {
    store.setItem(where.key, JSON.stringify({ version: where.version, level } satisfies Kept))
  } catch {
    // No room, or no store: the person loses nothing but the convenience.
  }
}

export function dropDraft(store: Storage, game: OpenGame, levelId: string): void {
  const where = slot(game, levelId)
  if (where === undefined) return
  try {
    store.removeItem(where.key)
  } catch {
    // Nothing to do.
  }
}

/** The kept level if it was made against the file as it is now; `'changed'` if the file moved on; else undefined. */
export function takeDraft(
  store: Storage,
  game: OpenGame,
  levelId: string,
): { level: Level } | 'changed' | undefined {
  const where = slot(game, levelId)
  if (where === undefined) return undefined
  try {
    const raw = store.getItem(where.key)
    if (raw === null) return undefined
    const kept = JSON.parse(raw) as Partial<Kept> | null
    if (kept === null || typeof kept.version !== 'string' || kept.level === undefined) {
      dropDraft(store, game, levelId)
      return undefined
    }
    if (kept.version !== where.version) {
      dropDraft(store, game, levelId)
      return 'changed'
    }
    const parsed = parseContent('level', JSON.stringify(kept.level), where.key)
    if (!parsed.ok) {
      dropDraft(store, game, levelId)
      return undefined
    }
    return { level: parsed.value }
  } catch {
    // Text that is not JSON at all, or a store that throws: no draft, and no leftover.
    dropDraft(store, game, levelId)
    return undefined
  }
}
