// Things in a level: move, place, copy, delete, rename, and where a hero starts. Each is a pure function of the level
// that gives the new level or the reason it will not. A level an agent wrote by hand is met as it is: a thing whose
// character the game lacks is one 1 by 1 box, and nothing here reorders `things`, because the order of the file is the
// order things come into the game.
import {
  type Level,
  type LevelJoint,
  type LevelThing,
  levelSize,
  type ThingValue,
} from '@automataframework/framework/headless'
import { idOf } from '../words/words.ts'
import { type Done, no, ok } from './done.ts'
import type { Characters } from './edit.ts'
import { onSolid, type Point, type Size, snap } from './place.ts'

/** A thing with a character the game lacks is still one box, so it can be moved while the game is being fixed. */
const FALLBACK_SIZE: Size = { w: 1, h: 1 }
const TOLERANCE = 1e-9
const sizeOf = (characters: Characters, character: string): Size =>
  characters[character]?.size ?? FALLBACK_SIZE

/** An id: lower-case words joined by dashes, starting with a letter, at most 64 characters (the framework's own). */
const ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/
export const isId = (id: string): boolean => id.length <= 64 && ID.test(id)

/** Whether the whole box lies inside the level. */
function inside(level: Level, size: Size, at: Point): boolean {
  const world = levelSize(level)
  return (
    at.x - size.w / 2 >= -TOLERANCE &&
    at.x + size.w / 2 <= world.w + TOLERANCE &&
    at.y - size.h / 2 >= -TOLERANCE &&
    at.y + size.h / 2 <= world.h + TOLERANCE
  )
}

/** A move by whole tiles when lined up, by half tiles otherwise. Never `-0`. */
const shift = (by: Point, lineUp: boolean): Point =>
  lineUp ? { x: Math.round(by.x) + 0, y: Math.round(by.y) + 0 } : { x: snap(by.x), y: snap(by.y) }

/** Why a box may not be at `at`, or undefined when it may. */
function refusal(level: Level, size: Size, at: Point): 'outside' | 'solid' | undefined {
  if (!inside(level, size, at)) return 'outside'
  return onSolid(level, size, at) ? 'solid' : undefined
}

/** Moves several things by the same step: all of them move or none. */
export function moveThings(
  level: Level,
  characters: Characters,
  ids: readonly string[],
  by: Point,
  lineUp: boolean,
): Done {
  const wanted = new Set(ids)
  if (wanted.size === 0 || [...wanted].some((id) => !level.things.some((t) => t.id === id))) {
    return no('no-such-thing')
  }
  const delta = shift(by, lineUp)
  if (delta.x === 0 && delta.y === 0) return no('same')
  const things = level.things.map((t) =>
    wanted.has(t.id) ? { ...t, x: t.x + delta.x, y: t.y + delta.y } : t,
  )
  const moved = things.filter((t) => wanted.has(t.id))
  const why = moved.map((t) => refusal(level, sizeOf(characters, t.character), t))
  if (why.includes('outside')) return no('outside')
  if (why.includes('solid')) return no('solid')
  return ok({ ...level, things })
}

const WAYS = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
} as const

/** One tile. */
export function nudgeThings(
  level: Level,
  characters: Characters,
  ids: readonly string[],
  way: keyof typeof WAYS,
): Done {
  return moveThings(level, characters, ids, WAYS[way], true)
}

/** The next free id: "crate-2" when "crate-1" is there; the lowest free number from 1. */
export function nextId(level: Level, character: string): string {
  const used = new Set(level.things.map((t) => t.id))
  let n = 1
  while (used.has(`${character}-${n}`)) n++
  return `${character}-${n}`
}

const theOne = (level: Level, characters: Characters, character: string): LevelThing | undefined =>
  characters[character]?.['one-per-level'] === true
    ? level.things.find((t) => t.character === character)
    : undefined

/** For a `one-per-level` character that is already there: the old one's id, which `placeThing` would move. */
export const onlyOne = (level: Level, characters: Characters, character: string): string | undefined =>
  theOne(level, characters, character)?.id

export function placeThing(
  level: Level,
  characters: Characters,
  character: string,
  at: Point,
): Done<{ level: Level; id: string; replaced?: string }> {
  const known = characters[character]
  if (known === undefined) return no('not-allowed')
  const to = { x: snap(at.x), y: snap(at.y) }
  const why = refusal(level, known.size, to)
  if (why !== undefined) return no(why)
  const old = theOne(level, characters, character)
  if (old !== undefined) {
    if (old.x === to.x && old.y === to.y) return no('same')
    const things = level.things.map((t) => (t === old ? { ...t, x: to.x, y: to.y } : t))
    return ok({ level: { ...level, things }, id: old.id, replaced: old.id })
  }
  const id = nextId(level, character)
  return ok({ level: { ...level, things: [...level.things, { id, character, x: to.x, y: to.y }] }, id })
}

const isLinks = (value: ThingValue): value is readonly string[] =>
  Array.isArray(value) && value.every((one) => typeof one === 'string')

/**
 * A value with the links to `id` taken out of it: a list loses the id, and a single link to it is gone (undefined).
 * Without the characters a single link cannot be told from a choice or a key, so a text that is exactly `id` counts.
 */
function without(value: ThingValue, id: string): ThingValue | undefined {
  if (value === id) return undefined
  if (!isLinks(value) || !value.includes(id)) return value
  return value.filter((one) => one !== id)
}

/** The thing with `change` done to each of its values (a value changed to undefined is taken out); the same thing when nothing changed. */
export function mendValues(
  thing: LevelThing,
  change: (value: ThingValue) => ThingValue | undefined,
): LevelThing {
  if (thing.values === undefined) return thing
  const next: Record<string, ThingValue> = {}
  let changed = false
  for (const [key, value] of Object.entries(thing.values)) {
    const now = change(value)
    if (now !== value) changed = true
    if (now !== undefined) next[key] = now
  }
  if (!changed) return thing
  const { values: _before, ...rest } = thing
  return Object.keys(next).length === 0 ? rest : { ...rest, values: next }
}

/** Several things copied, each by the same step: the copies keep their values, but never a link to the thing they came from. */
export function copyThings(
  level: Level,
  characters: Characters,
  ids: readonly string[],
  by: Point,
): Done<{ level: Level; ids: readonly string[] }> {
  const wanted = new Set(ids)
  const originals = level.things.filter((t) => wanted.has(t.id))
  if (wanted.size === 0 || originals.length !== wanted.size) return no('no-such-thing')
  if (originals.some((t) => characters[t.character]?.['one-per-level'] === true)) return no('not-allowed')
  const delta = shift(by, false)
  if (delta.x === 0 && delta.y === 0) return no('same')
  let now = level
  const made: string[] = []
  for (const original of originals) {
    const at = { x: original.x + delta.x, y: original.y + delta.y }
    const why = refusal(level, sizeOf(characters, original.character), at)
    if (why !== undefined) return no(why)
    const id = nextId(now, original.character)
    const bare = mendValues(original, (value) => without(value, original.id))
    now = { ...now, things: [...now.things, { ...bare, id, x: at.x, y: at.y }] }
    made.push(id)
  }
  return ok({ level: now, ids: made })
}

/** The level's joints without the ones that hold, or are held by, a thing in `gone`. */
const jointsWithout = (joints: readonly LevelJoint[], gone: ReadonlySet<string>): readonly LevelJoint[] =>
  joints.filter((j) => !gone.has(j.thing) && !(j.holder !== undefined && gone.has(j.holder)))

/** Takes things away, and their ids out of every `thing` value and every joint that held them. */
export function deleteThings(level: Level, ids: readonly string[]): Done {
  const gone = new Set(ids)
  if (gone.size === 0 || [...gone].some((id) => !level.things.some((t) => t.id === id))) {
    return no('no-such-thing')
  }
  const things = level.things
    .filter((t) => !gone.has(t.id))
    .map((t) => [...gone].reduce((one, id) => mendValues(one, (value) => without(value, id)), t))
  const { joints, ...rest } = level
  const kept = joints === undefined ? [] : jointsWithout(joints, gone)
  return ok({ ...rest, things, ...(kept.length === 0 ? {} : { joints: kept }) })
}

/** Gives a thing a name (as an id), and mends what in this level pointed at the old one. */
export function renameThing(level: Level, id: string, name: string): Done {
  if (!level.things.some((t) => t.id === id)) return no('no-such-thing')
  const to = idOf(name)
  if (to === undefined || !isId(to)) return no('not-allowed')
  if (to === id) return no('same')
  if (level.things.some((t) => t.id === to)) return no('taken')
  const swap = (value: ThingValue): ThingValue => {
    if (value === id) return to
    return isLinks(value) && value.includes(id) ? value.map((one) => (one === id ? to : one)) : value
  }
  const things = level.things.map((t) => mendValues(t.id === id ? { ...t, id: to } : t, swap))
  const joints = level.joints?.map((j) => ({
    ...j,
    thing: j.thing === id ? to : j.thing,
    ...(j.holder === id ? { holder: to } : {}),
  }))
  return ok({ ...level, things, ...(joints === undefined ? {} : { joints }) })
}

/** Moves a player's start. */
export function moveStart(
  level: Level,
  characters: Characters,
  hero: string,
  player: number,
  at: Point,
): Done {
  const start = level.starts.find((s) => s.player === player)
  if (start === undefined) return no('no-such-thing')
  const to = { x: snap(at.x), y: snap(at.y) }
  const why = refusal(level, sizeOf(characters, hero), to)
  if (why !== undefined) return no(why)
  if (start.x === to.x && start.y === to.y) return no('same')
  return ok({ ...level, starts: level.starts.map((s) => (s === start ? { ...s, x: to.x, y: to.y } : s)) })
}
