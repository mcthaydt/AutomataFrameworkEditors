// Two people's changes to one level, laid together piece by piece. A piece is a thing (by its id), the ground, the
// starts, or the look (sky, ground colour, view, backdrop, tileset and joints together). A piece only one of us changed
// is that side's; changed the same way by both is that; changed differently by both is a clash, and the level holds
// theirs until the person says otherwise.
import type { Level, LevelThing } from '@automataframework/framework/headless'
import { same } from '../../lib/same.ts'

export type Clash =
  | {
      readonly what: 'thing'
      readonly level: string
      readonly thing: string
      readonly mine: LevelThing | undefined
      readonly theirs: LevelThing | undefined
    }
  | { readonly what: 'ground' | 'starts' | 'look'; readonly level: string }
  | {
      readonly what: 'place'
      readonly level: string
      readonly mine: { readonly x: number; readonly y: number } | undefined
      readonly theirs: { readonly x: number; readonly y: number } | undefined
    }
  /** One of us took the level away and the other changed it: `gone` says who took it away. */
  | { readonly what: 'level'; readonly level: string; readonly gone: 'mine' | 'theirs' }
  /** Two levels made with one name. */
  | { readonly what: 'twin'; readonly level: string }

/** The pieces of a level that are not its ground, its things or its starts. */
const LOOK = ['tileset', 'backdrop', 'sky', 'ground', 'view', 'joints'] as const
const lookOf = (level: Level): Readonly<Record<string, unknown>> =>
  Object.fromEntries(LOOK.map((key) => [key, level[key]]).filter(([, value]) => value !== undefined))

/** The level with its look taken from `from`. */
export function withLook(level: Level, from: Level): Level {
  const rest: Record<string, unknown> = { ...level }
  for (const key of LOOK) delete rest[key]
  return { ...rest, ...lookOf(from) } as unknown as Level
}

/** `value` from the side that changed it; theirs (and a flag) when both changed it differently. */
export function pick<T>(base: T, mine: T, theirs: T): { readonly value: T; readonly clash: boolean } {
  if (same(mine, base)) return { value: theirs, clash: false }
  if (same(theirs, base) || same(mine, theirs)) return { value: mine, clash: false }
  return { value: theirs, clash: true }
}

/** The next id free for a thing made beside "crate-3": "crate-4", and so on past every id in `taken`. */
function nextFree(id: string, taken: ReadonlySet<string>): string {
  const match = /^(.*)-(\d+)$/.exec(id)
  const stem = match?.[1] ?? id
  for (let n = match === null ? 2 : Number(match[2]) + 1; ; n += 1) {
    const candidate = `${stem}-${n}`
    if (!taken.has(candidate)) return candidate
  }
}

const byId = (things: readonly LevelThing[]): ReadonlyMap<string, LevelThing> =>
  new Map(things.map((t) => [t.id, t] as const))

/**
 * The things of the three levels laid together: theirs in their order, then mine's new ones last. Two new things with
 * one id are not a clash: mine takes the next free id.
 */
function mergeThings(
  level: string,
  base: Level,
  mine: Level,
  theirs: Level,
): { things: LevelThing[]; clashes: Clash[] } {
  const was = byId(base.things)
  const mineBy = byId(mine.things)
  const theirsBy = byId(theirs.things)
  const taken = new Set([...was.keys(), ...mineBy.keys(), ...theirsBy.keys()])
  const decided = new Map<string, LevelThing | undefined>()
  const added: string[] = []
  const clashes: Clash[] = []

  for (const id of [...theirsBy.keys(), ...mineBy.keys(), ...was.keys()]) {
    if (decided.has(id)) continue
    const [b, m, t] = [was.get(id), mineBy.get(id), theirsBy.get(id)]
    if (b === undefined && m !== undefined && t !== undefined && !same(m, t)) {
      const free = nextFree(id, taken)
      taken.add(free)
      decided.set(id, t)
      decided.set(free, { ...m, id: free })
      added.push(free)
      continue
    }
    const result = pick(b, m, t)
    decided.set(id, result.value)
    if (result.clash) clashes.push({ what: 'thing', level, thing: id, mine: m, theirs: t })
  }

  const order = [...theirsBy.keys(), ...[...mineBy.keys()].filter((id) => !theirsBy.has(id)), ...added]
  const things = [...new Set(order)].flatMap((id) => {
    const thing = decided.get(id)
    return thing === undefined ? [] : [thing]
  })
  return { things, clashes }
}

/**
 * The ground of two people who both changed it, laid together tile by tile: only when neither changed its size, and no
 * tile was made another letter by each of us. Undefined when that cannot be done.
 */
function tileByTile(
  base: readonly string[],
  mine: readonly string[],
  theirs: readonly string[],
): string[] | undefined {
  const columns = base[0]?.length ?? 0
  const sized = (tiles: readonly string[]): boolean =>
    tiles.length === base.length && tiles.every((row) => row.length === columns)
  if (!sized(mine) || !sized(theirs)) return undefined
  const rows: string[] = []
  for (const [y, row] of base.entries()) {
    let line = ''
    for (const [x, was] of [...row].entries()) {
      const tile = pick(was, mine[y]?.[x] ?? was, theirs[y]?.[x] ?? was)
      if (tile.clash) return undefined
      line += tile.value
    }
    rows.push(line)
  }
  return rows
}

/** One level made by two people from `base`. */
export function mergeLevel(
  id: string,
  base: Level,
  mine: Level,
  theirs: Level,
): { readonly level: Level; readonly clashes: readonly Clash[] } {
  if (same(theirs, base)) return { level: mine, clashes: [] }
  if (same(mine, base)) return { level: theirs, clashes: [] }
  const clashes: Clash[] = []

  const whole = pick(base.tiles, mine.tiles, theirs.tiles)
  let ground = whole.value
  if (whole.clash) {
    ground = tileByTile(base.tiles, mine.tiles, theirs.tiles) ?? theirs.tiles
    if (ground === theirs.tiles) clashes.push({ what: 'ground', level: id })
  }

  const starts = pick(base.starts, mine.starts, theirs.starts)
  if (starts.clash) clashes.push({ what: 'starts', level: id })

  const look = pick(lookOf(base), lookOf(mine), lookOf(theirs))
  if (look.clash) clashes.push({ what: 'look', level: id })
  const lookFrom = same(look.value, lookOf(mine)) ? mine : theirs

  const things = mergeThings(id, base, mine, theirs)
  clashes.push(...things.clashes)
  const level = withLook({ ...theirs, tiles: ground, starts: starts.value, things: things.things }, lookFrom)
  return { level, clashes }
}
