// The games this device has opened, so someone who was sent a link finds the game again on the list. It is a
// convenience on the device and nothing else: the game's own files are the only thing that matters.
import type { GameRef } from '../wire/wire.ts'

const KEY = 'af.recent'
const MAX = 20
const same = (a: GameRef, b: GameRef): boolean =>
  a.owner.toLowerCase() === b.owner.toLowerCase() && a.name.toLowerCase() === b.name.toLowerCase()

/** Newest first, at most 20. Garbage in the store, or a store that throws, is an empty list. */
export function recentGames(store: Storage): readonly GameRef[] {
  try {
    const parsed: unknown = JSON.parse(store.getItem(KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []
    const games: GameRef[] = []
    for (const item of parsed) {
      const { owner, name } = (item ?? {}) as Partial<GameRef>
      if (
        typeof owner === 'string' &&
        typeof name === 'string' &&
        !games.some((g) => same(g, { owner, name }))
      ) {
        games.push({ owner, name })
      }
    }
    return games.slice(0, MAX)
  } catch {
    return []
  }
}

function write(store: Storage, games: readonly GameRef[]): void {
  try {
    store.setItem(KEY, JSON.stringify(games.slice(0, MAX)))
  } catch {
    // Nothing is kept; the list is only a convenience.
  }
}

export function rememberGame(store: Storage, ref: GameRef): void {
  write(store, [ref, ...recentGames(store).filter((game) => !same(game, ref))])
}

export function forgetGame(store: Storage, ref: GameRef): void {
  write(
    store,
    recentGames(store).filter((game) => !same(game, ref)),
  )
}
