// A thing's values, and what a switch opens. A character declares the values its things may hold (a number, a switch,
// a choice, some words, links to other things, a path, a way into another level); a thing writes only the ones that are
// not the default. Pure functions of the level that give the new level or the reason it will not. A value the
// character does not declare is shown but never edited, so a level an agent wrote by hand is met as it is.
import type {
  Character,
  Level,
  LevelThing,
  ThingValue,
  ValueDeclaration,
} from '@automataframework/framework/headless'
import { same } from '../../lib/same.ts'
import type { Working } from '../game/game.ts'
import { type Done, no, ok } from './done.ts'
import type { Characters } from './edit.ts'

/** One value of one thing, as a card shows it. */
export interface ValueRow {
  readonly id: string
  readonly declaration: ValueDeclaration | undefined
  readonly value: ThingValue | undefined
  /** True when the thing holds its own value, not the character's default. */
  readonly own: boolean
}

type NumberValue = Extract<ValueDeclaration, { type: 'number' }>
type ThingsValue = Extract<ValueDeclaration, { type: 'thing' }>

/** What a thing holds when it says nothing, or undefined for a value with no default (a link, a path, a way in). */
function defaultOf(declaration: ValueDeclaration): ThingValue | undefined {
  switch (declaration.type) {
    case 'number':
    case 'switch':
    case 'choice':
    case 'words':
      return declaration.default
    default:
      return undefined
  }
}

/** A thing's values in its character's order, then any the character does not declare (shown, never edited). */
export function rowsOf(thing: LevelThing, character: Character | undefined): readonly ValueRow[] {
  const given = thing.values ?? {}
  const declared = character?.values ?? []
  const rows: ValueRow[] = declared.map((declaration) => {
    const own = Object.hasOwn(given, declaration.id)
    return {
      id: declaration.id,
      declaration,
      value: own ? given[declaration.id] : defaultOf(declaration),
      own,
    }
  })
  for (const [id, value] of Object.entries(given)) {
    if (!declared.some((declaration) => declaration.id === id))
      rows.push({ id, declaration: undefined, value, own: true })
  }
  return rows
}

/** Rounds away the tail a step of 0.1 leaves behind. */
const tidy = (n: number): number => Math.round(n * 1e9) / 1e9 + 0

/** The nearest number the declaration allows: inside `least` to `most`, on `step` counted from `least`. */
export function hold(declaration: NumberValue, n: number): number {
  const inside = Math.min(declaration.most, Math.max(declaration.least, n))
  const { step } = declaration
  if (step === undefined || step <= 0) return tidy(inside)
  const stepped = declaration.least + Math.round((inside - declaration.least) / step) * step
  return tidy(Math.min(declaration.most, Math.max(declaration.least, stepped)))
}

/** The level with one thing changed; the same level when `to` gives the same thing. */
function withThing(level: Level, id: string, to: (thing: LevelThing) => LevelThing): Level {
  return { ...level, things: level.things.map((t) => (t.id === id ? to(t) : t)) }
}

/** The thing with one value set, or taken out when `to` is undefined; no `values` at all when it was the last. */
function setIn(thing: LevelThing, value: string, to: ThingValue | undefined): LevelThing {
  const { values, ...rest } = thing
  const next: Record<string, ThingValue> = { ...values }
  if (to === undefined) delete next[value]
  else next[value] = to
  return Object.keys(next).length === 0 ? rest : { ...rest, values: next }
}

const isPlace = (to: ThingValue): to is { readonly level: string; readonly thing?: string | undefined } =>
  typeof to === 'object' &&
  to !== null &&
  !Array.isArray(to) &&
  typeof (to as { level?: unknown }).level === 'string'

/** The value as its declaration holds it, or undefined when it is not a value of that kind. */
function held(declaration: ValueDeclaration, to: ThingValue): ThingValue | undefined {
  switch (declaration.type) {
    case 'number':
      return typeof to === 'number' && Number.isFinite(to) ? hold(declaration, to) : undefined
    case 'switch':
      return typeof to === 'boolean' ? to : undefined
    case 'choice':
      return typeof to === 'string' && declaration.from.some((option) => option.id === to) ? to : undefined
    case 'words':
      return typeof to === 'string' && to.length <= 96 ? to : undefined
    case 'leads-to':
      return isPlace(to) ? to : undefined
    default:
      return undefined
  }
}

/**
 * Sets one value, held to its declaration. A value equal to the default is taken out of the file, and `undefined`
 * takes any value out. Links and paths are not set here (`link`, and the path's own editor), and a value the
 * character does not declare is never edited.
 */
export function setValue(
  level: Level,
  characters: Characters,
  thing: string,
  value: string,
  to: ThingValue | undefined,
): Done {
  const found = level.things.find((t) => t.id === thing)
  if (found === undefined) return no('no-such-thing')
  const declaration = characters[found.character]?.values?.find((v) => v.id === value)
  if (declaration === undefined || declaration.type === 'path' || declaration.type === 'thing') {
    return no('not-allowed')
  }
  const next = to === undefined ? undefined : held(declaration, to)
  if (to !== undefined && next === undefined) return no('not-allowed')
  const keep = next !== undefined && same(next, defaultOf(declaration)) ? undefined : next
  if (same(found.values?.[value], keep)) return no('same')
  return ok(withThing(level, thing, (t) => setIn(t, value, keep)))
}

/** The things a value links to now, in the order given. */
function linked(thing: LevelThing, value: string): readonly string[] {
  const given = thing.values?.[value]
  if (typeof given === 'string') return [given]
  return Array.isArray(given) ? (given as readonly string[]).filter((one) => typeof one === 'string') : []
}

const declarationOf = (characters: Characters, thing: LevelThing, value: string): ThingsValue | undefined => {
  const declaration = characters[thing.character]?.values?.find((v) => v.id === value)
  return declaration?.type === 'thing' ? declaration : undefined
}

/** The things this value could ever link to: the declaration's `kinds`, never itself, and what a switch opens can be opened. */
function candidates(
  level: Level,
  characters: Characters,
  from: LevelThing,
  value: string,
): readonly string[] {
  const declaration = declarationOf(characters, from, value)
  if (declaration === undefined) return []
  const opensOthers = characters[from.character]?.switch?.opens === value
  return level.things
    .filter((other) => {
      if (other.id === from.id) return false
      const character = characters[other.character]
      if (character === undefined) return false
      if (
        declaration.kinds !== undefined &&
        (character.kind === undefined || !declaration.kinds.includes(character.kind))
      ) {
        return false
      }
      return !opensOthers || character.opens !== undefined
    })
    .map((other) => other.id)
}

/** Which things this value may link to: the declaration's `kinds`, never itself, never past `most`. */
export function mayOpen(
  level: Level,
  characters: Characters,
  thing: string,
  value: string,
): readonly string[] {
  const from = level.things.find((t) => t.id === thing)
  if (from === undefined) return []
  const all = candidates(level, characters, from, value)
  const now = linked(from, value)
  const most = declarationOf(characters, from, value)?.most ?? 1
  return now.length >= most ? all.filter((id) => now.includes(id)) : all
}

/** Links a thing's value to another thing. `limit` when it already holds as many as its declaration allows. */
export function link(level: Level, characters: Characters, from: string, value: string, to: string): Done {
  const thing = level.things.find((t) => t.id === from)
  if (thing === undefined || !level.things.some((t) => t.id === to)) return no('no-such-thing')
  const declaration = declarationOf(characters, thing, value)
  if (declaration === undefined || !candidates(level, characters, thing, value).includes(to))
    return no('not-allowed')
  const now = linked(thing, value)
  if (now.includes(to)) return no('same')
  const most = declaration.most ?? 1
  if (now.length >= most) return no('limit')
  return ok(withThing(level, from, (t) => setIn(t, value, most === 1 ? to : [...now, to])))
}

/** Takes one link away. A value that held a single link is taken out; a list keeps its place, empty. */
export function unlink(level: Level, from: string, value: string, to: string): Done {
  const thing = level.things.find((t) => t.id === from)
  if (thing === undefined) return no('no-such-thing')
  const now = linked(thing, value)
  if (!now.includes(to)) return no('same')
  const given = thing.values?.[value]
  const rest = now.filter((one) => one !== to)
  return ok(withThing(level, from, (t) => setIn(t, value, typeof given === 'string' ? undefined : rest)))
}

/** A value several things share, or one they hold differently. */
export type SharedRow = ValueRow | { readonly id: string; readonly mixed: true }

/** What several picked things have in common: each value they all declare, as one row, or 'mixed' when they differ. */
export function shared(rows: readonly (readonly ValueRow[])[]): readonly SharedRow[] {
  const [first, ...others] = rows
  if (first === undefined) return []
  return first.flatMap((row): SharedRow[] => {
    const theirs = others.map((list) => list.find((other) => other.id === row.id))
    if (theirs.some((other) => other === undefined)) return []
    const alike = theirs.every(
      (other) =>
        other !== undefined && same(other.value, row.value) && same(other.declaration, row.declaration),
    )
    return [alike ? row : { id: row.id, mixed: true }]
  })
}

/** Where a door leads, as choices: every level but this one, with the things in it that are doors (a way in). */
export function waysOut(
  levels: Working['levels'],
  characters: Characters,
  from: string,
): readonly { readonly level: string; readonly things: readonly string[] }[] {
  const isWay = (thing: LevelThing): boolean =>
    characters[thing.character]?.values?.some((v) => v.type === 'leads-to') === true
  return Object.keys(levels)
    .filter((id) => id !== from)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    .map((id) => ({ level: id, things: (levels[id]?.things ?? []).filter(isWay).map((t) => t.id) }))
}
