// Where each level sits on the world map, and which level a game starts in, worked out from what a person is holding.
// This is the part of the map that the level files need too (a level made or copied is placed on it), so it lives
// here, below the map. Pure: no page, no device.
import { type Level, type LevelPoint, parseProject } from '@automataframework/framework/headless'
import type { Working } from '../game/game.ts'

/** One level on the map: its top left corner and how many tiles it covers. */
export interface MapBox {
  readonly level: string
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
}

/** The id of the world file the editor makes when a game has none. */
const WORLD_ID = 'world'
/** Tiles between levels a world file does not place. */
const GAP = 2

export const sizeOfLevel = (level: Level): { readonly w: number; readonly h: number } => ({
  w: level.tiles[0]?.length ?? 0,
  h: level.tiles.length,
})

/**
 * Every level as a box: where the world file puts it, or, for a level it leaves out or a game with no world file, in
 * a row along the top, two tiles apart, in the project's order (right of whatever the file does place).
 */
export function mapBoxes(working: Working, order: readonly string[]): readonly MapBox[] {
  const ids = [
    ...new Set([...order.filter((id) => working.levels[id] !== undefined), ...Object.keys(working.levels)]),
  ]
  const placed = new Map((working.world?.levels ?? []).map((entry) => [entry.level, entry.at] as const))
  let cursor = 0
  for (const id of ids) {
    const at = placed.get(id)
    const level = working.levels[id]
    if (at !== undefined && level !== undefined) cursor = Math.max(cursor, at.x + sizeOfLevel(level).w + GAP)
  }
  return ids.flatMap((id): MapBox[] => {
    const level = working.levels[id]
    if (level === undefined) return []
    const size = sizeOfLevel(level)
    const at = placed.get(id)
    if (at !== undefined) return [{ level: id, x: at.x, y: at.y, ...size }]
    const box = { level: id, x: cursor, y: 0, ...size }
    cursor += size.w + GAP
    return [box]
  })
}

/**
 * Puts the level there on the map, writing the world file: made now, with every level where it sits at the moment,
 * when the game has none.
 */
export function placeOn(working: Working, level: string, at: LevelPoint): Working {
  const entries =
    working.world === undefined
      ? mapBoxes(working, Object.keys(working.levels)).map((box) => ({
          level: box.level,
          at: { x: box.x, y: box.y },
        }))
      : working.world.levels
  const there = { x: at.x, y: at.y }
  const next = entries.some((entry) => entry.level === level)
    ? entries.map((entry) => (entry.level === level ? { ...entry, at: there } : entry))
    : [...entries, { level, at: there }]
  return { ...working, world: { format: 1, id: working.world?.id ?? WORLD_ID, levels: next } }
}

/** The level a game starts in, as it is named now: the project's `start`, followed through any rename. */
export function startOf(working: Working): string | undefined {
  const parsed = parseProject(working.project)
  if (!parsed.ok) return undefined
  const { start } = parsed.value
  return working.renames?.[start] ?? start
}
