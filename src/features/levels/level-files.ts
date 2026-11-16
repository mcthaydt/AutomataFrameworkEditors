// Levels as files: a new one, a copy, a new name, and taking one away. Each is a pure function of what a person is
// holding (`Working`) that gives the new state or the reason it will not. A rename or a delete mends what pointed at
// the level: the world file, and every door that led to it. The project file's own lines (`start`, `levels`, the list
// of files) follow from what differs when the change is put in, so nothing here writes them.
import type { GameContent, Level, LevelThing, ThingValue } from '@automataframework/framework/headless'
import type { Working } from '../game/game.ts'
import { idOf } from '../words/words.ts'
import { type Done, no, ok } from './done.ts'
import { kindsOf } from './ground.ts'
import { placeOn, startOf } from './on-map.ts'
import { isId, mendValues } from './things.ts'

const NEW = /^level-(\d+)$/
const WIDE = 16
const HIGH = 9

/** "level-9": one past the highest "level-N" in use, or "level-1" when none is numbered. */
export function nextLevelId(working: Working): string {
  const used = Object.keys(working.levels).flatMap((id) => {
    const n = NEW.exec(id)?.[1]
    return n === undefined ? [] : [Number(n)]
  })
  return `level-${Math.max(0, ...used) + 1}`
}

const isWay = (value: ThingValue): value is { readonly level: string; readonly thing?: string | undefined } =>
  typeof value === 'object' &&
  !Array.isArray(value) &&
  typeof (value as { level?: unknown }).level === 'string'

/** The level with every way into `from` changed by `change` (a door that now leads nowhere is undefined). */
function mendWays(
  level: Level,
  change: (way: { readonly level: string; readonly thing?: string | undefined }) => ThingValue | undefined,
): Level {
  const things = level.things.map((thing: LevelThing) =>
    mendValues(thing, (value) => (isWay(value) ? change(value) : value)),
  )
  return things.some((thing, i) => thing !== level.things[i]) ? { ...level, things } : level
}

/**
 * A new level is never empty: 16 by 9, the bottom row solid, each player's start along it, and the game's one-per-level
 * goal (when a character has one) at the right. It takes its tileset, sky, ground and backdrop from the level it is
 * made beside (the one picked, else the start). Listed in the project and put on the map at `at`.
 */
export function newLevel(
  working: Working,
  content: GameContent,
  at: { readonly x: number; readonly y: number },
  beside?: string,
): { readonly working: Working; readonly id: string } {
  const id = nextLevelId(working)
  const from = working.levels[beside ?? startOf(working) ?? ''] ?? Object.values(working.levels)[0]
  const known =
    from?.tileset !== undefined && content.tilesets?.[from.tileset] !== undefined ? from.tileset : undefined
  const solid = from === undefined ? undefined : kindsOf(from, content.tilesets).find((kind) => kind.solid)
  // A tileset with nothing solid in it cannot make a floor, so the new level goes without it.
  const tileset = known !== undefined && solid !== undefined ? known : undefined
  const floor = (tileset === undefined ? '#' : (solid?.letter ?? '#')).repeat(WIDE)
  const players = Math.min(4, Math.max(1, content.project.players ?? 1))
  const goal = Object.values(content.characters).find((c) => c['one-per-level'] === true && c.kind === 'goal')
  const level: Level = {
    format: 1,
    id,
    ...(tileset === undefined ? {} : { tileset }),
    ...(from?.backdrop === undefined ? {} : { backdrop: from.backdrop }),
    ...(from?.sky === undefined ? {} : { sky: from.sky }),
    ...(from?.ground === undefined ? {} : { ground: from.ground }),
    tiles: [...Array.from({ length: HIGH - 1 }, () => '.'.repeat(WIDE)), floor],
    things: goal === undefined ? [] : [{ id: `${goal.id}-1`, character: goal.id, x: 13.5, y: 7.5 }],
    starts: Array.from({ length: players }, (_, i) => ({ player: i + 1, x: 2.5 + i, y: 7.5 })),
  }
  const added: Working = { ...working, levels: { ...working.levels, [id]: level } }
  return { working: placeOn(added, id, at), id }
}

/** A copy of a level, on the map at `at`. Its id is empty, and nothing changes, when the level is not there. */
export function copyLevel(
  working: Working,
  level: string,
  at: { readonly x: number; readonly y: number },
): { readonly working: Working; readonly id: string } {
  const source = working.levels[level]
  if (source === undefined) return { working, id: '' }
  const id = nextLevelId(working)
  const added: Working = { ...working, levels: { ...working.levels, [id]: { ...source, id } } }
  return { working: placeOn(added, id, at), id }
}

/** Where a rename is remembered: by the id the level had when it was opened, so the project file follows it. */
function renamed(
  renames: Working['renames'],
  from: string,
  to: string,
): Readonly<Record<string, string>> | undefined {
  const next: Record<string, string> = { ...renames }
  const origin = Object.keys(next).find((was) => next[was] === from) ?? from
  if (origin === to) delete next[origin]
  else next[origin] = to
  return Object.keys(next).length === 0 ? undefined : next
}

/**
 * Gives a level a new name: its id, its file, the world file's entry, and every door that led to it. `taken` when the
 * name is in use. The id is what a player's saved game remembers the level by, so the screen says so first.
 */
export function renameLevel(working: Working, level: string, name: string): Done<Working> {
  const old = working.levels[level]
  if (old === undefined) return no('no-such-thing')
  const id = idOf(name)
  if (id === undefined || !isId(id)) return no('not-allowed')
  if (id === level) return no('same')
  if (working.levels[id] !== undefined) return no('taken')
  const levels: Record<string, Level> = {}
  for (const [key, value] of Object.entries(working.levels)) {
    const mended = mendWays(value, (way) => (way.level === level ? { ...way, level: id } : way))
    levels[key === level ? id : key] = key === level ? { ...mended, id } : mended
  }
  const world = working.world && {
    ...working.world,
    levels: working.world.levels.map((entry) => (entry.level === level ? { ...entry, level: id } : entry)),
  }
  return ok({ ...working, levels, world, renames: renamed(working.renames, level, id) })
}

/**
 * Takes a level away: its file, its place on the map, and the way into it from every door that led there. Never the
 * level the game starts in, and never the last one.
 */
export function deleteLevel(working: Working, level: string): Done<Working> {
  if (working.levels[level] === undefined) return no('no-such-thing')
  if (Object.keys(working.levels).length <= 1 || startOf(working) === level) return no('not-allowed')
  const levels: Record<string, Level> = {}
  for (const [key, value] of Object.entries(working.levels)) {
    if (key !== level) levels[key] = mendWays(value, (way) => (way.level === level ? undefined : way))
  }
  const world = working.world && {
    ...working.world,
    levels: working.world.levels.filter((entry) => entry.level !== level),
  }
  const kept = Object.entries(working.renames ?? {}).filter(([, id]) => id !== level)
  return ok({
    ...working,
    levels,
    world,
    renames: kept.length === 0 ? undefined : Object.fromEntries(kept),
  })
}
