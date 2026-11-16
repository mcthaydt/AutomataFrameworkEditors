// What a change is called: the lines that say what differs between two moments of a game (a thing moved, a level
// made), and the few words that stand for them in the game's history. Lines are for a person to look at; the words are
// the title of the change as it is kept in the game, so they are plain English and use the names a person gave.
import type { Level, LevelThing } from '@automataframework/framework/headless'
import { same } from '../../lib/same.ts'
import type { Working } from './changes.ts'

export type ChangeLine =
  | {
      readonly kind: 'moved' | 'added' | 'deleted' | 'renamed' | 'settings' | 'order'
      readonly level: string
      readonly thing: string
    }
  | { readonly kind: 'ground' | 'start' | 'joined' | 'look'; readonly level: string }
  | { readonly kind: 'level-new' | 'level-deleted' | 'level-moved' | 'level-renamed'; readonly level: string }

const withoutId = <T extends { readonly id: string }>(value: T): Omit<T, 'id'> => {
  const { id: _id, ...rest } = value
  return rest
}

/** The look of a level: everything that is not its ground, its things, its starts or its joints. */
const lookOf = (level: Level) => ({
  tileset: level.tileset,
  backdrop: level.backdrop,
  sky: level.sky,
  ground: level.ground,
  view: level.view,
})

/** A thing taken away and one added with the same everything but the id is one thing renamed. */
function thingLines(
  level: string,
  before: readonly LevelThing[],
  after: readonly LevelThing[],
): ChangeLine[] {
  const was = new Map(before.map((t) => [t.id, t] as const))
  const now = new Map(after.map((t) => [t.id, t] as const))
  const lines: ChangeLine[] = []
  const added = after.filter((t) => !was.has(t.id))
  const taken = before.filter((t) => !now.has(t.id))

  for (const thing of after) {
    const old = was.get(thing.id)
    if (old === undefined) continue
    if (old.x !== thing.x || old.y !== thing.y) lines.push({ kind: 'moved', level, thing: thing.id })
    if (old.character !== thing.character || !same(old.values, thing.values)) {
      lines.push({ kind: 'settings', level, thing: thing.id })
    }
  }

  const order = (things: readonly LevelThing[], other: ReadonlyMap<string, LevelThing>): string[] =>
    things.filter((t) => other.has(t.id)).map((t) => t.id)
  const orderBefore = order(before, now)
  const orderAfter = order(after, was)
  if (!same(orderBefore, orderAfter)) {
    const first = orderAfter.findIndex((id, i) => id !== orderBefore[i])
    lines.push({ kind: 'order', level, thing: orderAfter[first] ?? '' })
  }

  const gone = new Set(taken.map((t) => t.id))
  for (const thing of added) {
    const twin = taken.find((t) => gone.has(t.id) && same(withoutId(t), withoutId(thing)))
    if (twin === undefined) {
      lines.push({ kind: 'added', level, thing: thing.id })
    } else {
      gone.delete(twin.id)
      lines.push({ kind: 'renamed', level, thing: thing.id })
    }
  }
  for (const thing of taken) if (gone.has(thing.id)) lines.push({ kind: 'deleted', level, thing: thing.id })
  return lines
}

function levelLines(id: string, before: Level, after: Level): ChangeLine[] {
  const lines: ChangeLine[] = []
  if (!same(before.tiles, after.tiles)) lines.push({ kind: 'ground', level: id })
  if (!same(before.starts, after.starts)) lines.push({ kind: 'start', level: id })
  if (!same(lookOf(before), lookOf(after))) lines.push({ kind: 'look', level: id })
  if (!same(before.joints, after.joints)) lines.push({ kind: 'joined', level: id })
  return [...lines, ...thingLines(id, before.things, after.things)]
}

/** Each difference between `base` and `now`, one line for each: however many tiles were painted is one `ground` line. */
export function describe(base: Working, now: Working): readonly ChangeLine[] {
  const lines: ChangeLine[] = []
  const made = Object.keys(now.levels).filter((id) => base.levels[id] === undefined)
  const removed = new Set(Object.keys(base.levels).filter((id) => now.levels[id] === undefined))
  const gone = new Set(removed)
  const renamed = new Set<string>()

  for (const id of Object.keys(now.levels)) {
    const level = now.levels[id]
    const was = base.levels[id]
    if (level === undefined) continue
    if (was !== undefined) {
      lines.push(...levelLines(id, was, level))
      continue
    }
    const twin = [...gone].find((old) => same(withoutId(base.levels[old] as Level), withoutId(level)))
    if (twin === undefined) {
      lines.push({ kind: 'level-new', level: id })
    } else {
      gone.delete(twin)
      renamed.add(id)
      lines.push({ kind: 'level-renamed', level: id })
    }
  }
  for (const id of gone) lines.push({ kind: 'level-deleted', level: id })

  // Where a level sits on the map: a level made, renamed or taken away says so already.
  const before = new Map((base.world?.levels ?? []).map((l) => [l.level, l.at] as const))
  const after = new Map((now.world?.levels ?? []).map((l) => [l.level, l.at] as const))
  for (const id of new Set([...before.keys(), ...after.keys()])) {
    if (made.includes(id) || renamed.has(id) || removed.has(id)) continue
    if (!same(before.get(id), after.get(id))) lines.push({ kind: 'level-moved', level: id })
  }
  return lines
}

/** "crate-1" is read as "Crate 1". */
const nice = (id: string): string =>
  id
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

function oneLine(line: ChangeLine): string {
  switch (line.kind) {
    case 'moved':
      return `Move ${nice(line.thing)} in ${nice(line.level)}`
    case 'added':
      return `Add ${nice(line.thing)} in ${nice(line.level)}`
    case 'deleted':
      return `Delete ${nice(line.thing)} in ${nice(line.level)}`
    case 'renamed':
      return `Rename ${nice(line.thing)} in ${nice(line.level)}`
    case 'settings':
      return `Change ${nice(line.thing)} in ${nice(line.level)}`
    case 'order':
      return `Change what is drawn in front of ${nice(line.thing)} in ${nice(line.level)}`
    case 'ground':
      return `Paint ${nice(line.level)}`
    case 'start':
      return `Move the starts of ${nice(line.level)}`
    case 'look':
      return `Change how ${nice(line.level)} looks`
    case 'joined':
      return `Change what is joined in ${nice(line.level)}`
    case 'level-new':
      return `Make ${nice(line.level)}`
    case 'level-deleted':
      return `Delete ${nice(line.level)}`
    case 'level-moved':
      return `Move ${nice(line.level)} on the map`
    case 'level-renamed':
      return `Rename to ${nice(line.level)}`
  }
}

/** A few words for the game's history: "Move Crate 1 in Level 1", "3 changes in Level 1", "5 changes in 2 levels". */
export function titleOf(lines: readonly ChangeLine[]): string {
  const [only] = lines
  if (only === undefined) return ''
  if (lines.length === 1) return oneLine(only)
  const levels = [...new Set(lines.map((line) => line.level))]
  const [first] = levels
  if (levels.length === 1 && first !== undefined) return `${lines.length} changes in ${nice(first)}`
  return `${lines.length} changes in ${levels.length} levels`
}
