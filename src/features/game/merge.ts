// Two people's changes to one game, laid together thing by thing. `base` is what both started from, `mine` is what the
// person has, and `theirs` is what the game is now. Where only one side changed something, that side's change stands;
// where both changed it the same way, so does that; where they changed it differently it is a clash, and the game
// holds theirs until the person says "keep mine". Nothing here writes anything: it gives a `Working` to look at.
import {
  type Level,
  type LevelPoint,
  parseProject,
  type WorldFile,
} from '@automataframework/framework/headless'
import { same } from '../../lib/same.ts'
import { changeProject, type ProjectChange } from '../files/files.ts'
import type { Working } from './changes.ts'
import { type ChangeLine, describe } from './describe.ts'
import { type Clash, mergeLevel, pick, withLook } from './merge-level.ts'

export type { Clash } from './merge-level.ts'

export interface Merged {
  readonly now: Working
  readonly clashes: readonly Clash[]
  /** What came in from the game that the person had not touched. */
  readonly theirs: readonly ChangeLine[]
  /** The game's side as it was, so `keep` can give it back after "keep mine". */
  readonly their: Working
}

interface Listing {
  readonly levels: ReadonlySet<string>
  readonly world: string | undefined
}

/** Where the project lists each level (by its id) and the world. */
function listing(project: string): Listing {
  const parsed = parseProject(project)
  const refs = parsed.ok ? parsed.value.content : []
  const idOf = (path: string): string => path.slice(path.lastIndexOf('/') + 1, -'.json'.length)
  return {
    levels: new Set(refs.filter((ref) => ref.type === 'level').map((ref) => idOf(ref.path))),
    world: refs.find((ref) => ref.type === 'world')?.path,
  }
}

/** The project's text with the levels and the world it lists made to fit `levels` and `world`. */
function relist(
  project: string,
  levels: Readonly<Record<string, Level>>,
  world: WorldFile | undefined,
): string {
  const listed = listing(project)
  const add: { type: 'level' | 'world'; path: string }[] = []
  const remove: string[] = []
  for (const id of Object.keys(levels)) {
    if (!listed.levels.has(id)) add.push({ type: 'level', path: `content/levels/${id}.json` })
  }
  for (const id of listed.levels) if (levels[id] === undefined) remove.push(`content/levels/${id}.json`)
  if (world !== undefined && listed.world === undefined) {
    add.push({ type: 'world', path: `content/worlds/${world.id}.json` })
  }
  if (add.length === 0 && remove.length === 0) return project
  const change: ProjectChange = {
    ...(add.length > 0 ? { add } : {}),
    ...(remove.length > 0 ? { remove } : {}),
  }
  return changeProject(project, change) ?? project
}

/** The world with each entry whose level the game does not have taken out. */
function tidy(
  world: WorldFile | undefined,
  levels: Readonly<Record<string, Level>>,
): WorldFile | undefined {
  if (world === undefined) return undefined
  const entries = world.levels.filter((entry) => levels[entry.level] !== undefined)
  return entries.length === world.levels.length ? world : { ...world, levels: entries }
}

function mergeWorld(
  base: WorldFile | undefined,
  mine: WorldFile | undefined,
  theirs: WorldFile | undefined,
): { readonly world: WorldFile | undefined; readonly clashes: readonly Clash[] } {
  // One side without a world file at all: the pieces have nothing to lay together, and the game's own stands.
  if (same(mine, base)) return { world: theirs, clashes: [] }
  if (same(theirs, base) || same(mine, theirs)) return { world: mine, clashes: [] }
  if (mine === undefined || theirs === undefined) return { world: theirs, clashes: [] }

  const placed = (world: WorldFile | undefined): ReadonlyMap<string, LevelPoint> =>
    new Map((world?.levels ?? []).map((entry) => [entry.level, entry.at] as const))
  const [was, mineAt, theirsAt] = [placed(base), placed(mine), placed(theirs)]
  const order = [...theirsAt.keys(), ...mineAt.keys()]
  const clashes: Clash[] = []
  const levels: { level: string; at: LevelPoint }[] = []
  for (const level of new Set(order)) {
    const one = pick(was.get(level), mineAt.get(level), theirsAt.get(level))
    if (one.clash) {
      clashes.push({ what: 'place', level, mine: mineAt.get(level), theirs: theirsAt.get(level) })
    }
    if (one.value !== undefined) levels.push({ level, at: one.value })
  }
  return { world: { ...theirs, levels }, clashes }
}

/** The levels of the three, laid together level by level: theirs in their order, then the ones only mine made. */
function mergeLevels(
  base: Working,
  mine: Working,
  theirs: Working,
): { levels: Record<string, Level>; clashes: Clash[] } {
  const levels: Record<string, Level> = {}
  const clashes: Clash[] = []
  const named = [theirs, mine, base].flatMap((working) => Object.keys(working.levels))
  const ids = new Set(named)
  for (const id of ids) {
    const [b, m, t] = [base.levels[id], mine.levels[id], theirs.levels[id]]
    let level: Level | undefined
    if (b === undefined) {
      level = t ?? m
      if (m !== undefined && t !== undefined && !same(m, t)) clashes.push({ what: 'twin', level: id })
    } else if (m === undefined || t === undefined) {
      // One of us took the level away: the other's changes to it, if any, are a clash that holds the game's side.
      const kept = m ?? t
      const changed = kept !== undefined && !same(kept, b)
      if (changed) clashes.push({ what: 'level', level: id, gone: m === undefined ? 'mine' : 'theirs' })
      level = changed ? t : undefined
    } else {
      const merged = mergeLevel(id, b, m, t)
      clashes.push(...merged.clashes)
      level = merged.level
    }
    if (level !== undefined) levels[id] = level
  }
  return { levels, clashes }
}

function finish(
  their: Working,
  mine: Working,
  levels: Readonly<Record<string, Level>>,
  worldIn: WorldFile | undefined,
  clashes: readonly Clash[],
): Merged {
  const world = tidy(worldIn, levels)
  const now: Working = { levels, world, project: relist(their.project, levels, world) }
  return { now, clashes, theirs: describe(mine, now), their }
}

/** Lays `mine` over `theirs`, both made from `base`. Where they clash, `now` holds theirs until `keep` says otherwise. */
export function merge(base: Working, mine: Working, theirs: Working): Merged {
  const levels = mergeLevels(base, mine, theirs)
  const world = mergeWorld(base.world, mine.world, theirs.world)
  return finish(theirs, mine, levels.levels, world.world, [...levels.clashes, ...world.clashes])
}

/** One thing of a level put where `whose` has it, taken away if they have none. */
function setThing(level: Level, id: string, thing: Level['things'][number] | undefined): Level {
  const there = level.things.some((t) => t.id === id)
  if (thing === undefined) return { ...level, things: level.things.filter((t) => t.id !== id) }
  const things = there ? level.things.map((t) => (t.id === id ? thing : t)) : [...level.things, thing]
  return { ...level, things }
}

/** The person's choice for one clash: their own side's, or the game's. The same clash can be chosen again and again. */
export function keep(merged: Merged, mine: Working, clash: Clash, whose: 'mine' | 'theirs'): Merged {
  const side = whose === 'mine' ? mine : merged.their
  const levels: Record<string, Level> = { ...merged.now.levels }
  let world = merged.now.world
  const level = levels[clash.level]
  const from = side.levels[clash.level]

  if (clash.what === 'thing') {
    const thing = whose === 'mine' ? clash.mine : clash.theirs
    if (level !== undefined) levels[clash.level] = setThing(level, clash.thing, thing)
  } else if (clash.what === 'ground' && level !== undefined && from !== undefined) {
    levels[clash.level] = { ...level, tiles: from.tiles }
  } else if (clash.what === 'starts' && level !== undefined && from !== undefined) {
    levels[clash.level] = { ...level, starts: from.starts }
  } else if (clash.what === 'look' && level !== undefined && from !== undefined) {
    levels[clash.level] = withLook(level, from)
  } else if (clash.what === 'place' && world !== undefined) {
    const at = whose === 'mine' ? clash.mine : clash.theirs
    const others = world.levels.filter((entry) => entry.level !== clash.level)
    world = { ...world, levels: at === undefined ? others : [...others, { level: clash.level, at }] }
  } else if (clash.what === 'level' || clash.what === 'twin') {
    if (from === undefined) delete levels[clash.level]
    else levels[clash.level] = from
    // A level given back goes back on the map where that side had it.
    const entry = side.world?.levels.find((e) => e.level === clash.level)
    if (from !== undefined && entry !== undefined && world !== undefined) {
      const others = world.levels.filter((e) => e.level !== clash.level)
      world = { ...world, levels: [...others, entry] }
    }
  }
  return finish(merged.their, mine, levels, world, merged.clashes)
}
