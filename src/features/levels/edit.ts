// The edit a person is in the middle of: the level as it was opened, as it is now, and the steps back and forward.
// Every function returns a new edit; the opened level is never changed.
import type { Character, GameContent, Level } from '@automataframework/framework/headless'
import { compareLevels, type HitId, startId } from './compare.ts'
import { nextId } from './ids.ts'
import { keepInside, onSolid, type Point, type Size, STEP, solidOf } from './place.ts'

export type { HitId } from './compare.ts'

export interface LevelEdit {
  readonly opened: Level
  readonly now: Level
  /** Older levels, the nearest last. */
  readonly past: readonly Level[]
  /** Levels that were undone, the nearest last. Any new change empties it. */
  readonly future: readonly Level[]
}
export type Moved =
  | { readonly edit: LevelEdit; readonly moved: true }
  | { readonly edit: LevelEdit; readonly moved: false; readonly why: 'solid' | 'same' | 'no-such-thing' }
export type Added =
  | { readonly edit: LevelEdit; readonly added: true; readonly id: string }
  | { readonly edit: LevelEdit; readonly added: false; readonly why: 'solid' | 'no-such-character' }
export type Characters = Readonly<Record<string, Character>>

/** What a change to a level must know about the game it is in. */
export interface LevelRules {
  readonly characters: Characters
  /** The project's hero, whose size a start point takes. */
  readonly hero: string
  /** Which tile letters are solid in this level. */
  readonly solid: (letter: string) => boolean
}

/** The rules of `level` in `content`. */
export function rulesOf(content: GameContent, level: Level): LevelRules {
  return { characters: content.characters, hero: content.project.hero, solid: solidOf(content, level) }
}

export const startEdit = (level: Level): LevelEdit => ({ opened: level, now: level, past: [], future: [] })

/** The edit after a change to `now`: the old level goes back one step, and what was undone cannot be redone. */
const changed = (edit: LevelEdit, now: Level): LevelEdit => ({
  opened: edit.opened,
  now,
  past: [...edit.past, edit.now],
  future: [],
})

/** A thing with a character the game lacks is still one box, so it can be moved while the game is being fixed. */
const FALLBACK_SIZE: Size = { w: 1, h: 1 }

/** The start point a hit id names, if it names one. */
const startOf = (level: Level, id: HitId) => level.starts.find((s) => startId(s.player) === id)

/** How big the box of a thing or a start point is: a start is the hero's size. */
export function sizeOf(rules: LevelRules, level: Level, id: HitId): Size {
  const thing = level.things.find((t) => t.id === id)
  const character = thing === undefined ? rules.hero : thing.character
  return rules.characters[character]?.size ?? FALLBACK_SIZE
}

/** Where a thing or a start point is, in tiles; undefined for an id the level lacks. */
export function placeOf(level: Level, id: HitId): Point | undefined {
  const at = level.things.find((t) => t.id === id) ?? startOf(level, id)
  return at === undefined ? undefined : { x: at.x, y: at.y }
}

/** `level` with the thing or start point `id` at `at`. */
function placed(level: Level, id: HitId, at: Point): Level {
  const thing = level.things.find((t) => t.id === id)
  if (thing !== undefined) {
    return { ...level, things: level.things.map((t) => (t.id === id ? { ...t, x: at.x, y: at.y } : t)) }
  }
  const starts = level.starts.map((s) => (startId(s.player) === id ? { ...s, x: at.x, y: at.y } : s))
  return { ...level, starts }
}

export function moveThing(edit: LevelEdit, rules: LevelRules, id: HitId, to: Point): Moved {
  const from = placeOf(edit.now, id)
  if (from === undefined) return { edit, moved: false, why: 'no-such-thing' }
  const size = sizeOf(rules, edit.now, id)
  const at = keepInside(edit.now, size, to)
  if (at.x === from.x && at.y === from.y) return { edit, moved: false, why: 'same' }
  if (onSolid(edit.now, size, at, rules.solid)) return { edit, moved: false, why: 'solid' }
  return { edit: changed(edit, placed(edit.now, id, at)), moved: true }
}

const WAYS = {
  left: { x: -STEP, y: 0 },
  right: { x: STEP, y: 0 },
  up: { x: 0, y: -STEP },
  down: { x: 0, y: STEP },
} as const
export type Way = keyof typeof WAYS

/** A move by one `STEP`. */
export function nudgeThing(edit: LevelEdit, rules: LevelRules, id: HitId, way: Way): Moved {
  const from = placeOf(edit.now, id)
  if (from === undefined) return { edit, moved: false, why: 'no-such-thing' }
  return moveThing(edit, rules, id, { x: from.x + WAYS[way].x, y: from.y + WAYS[way].y })
}

/** A new thing of `character`, named the way an agent would, with its middle at `at` (snapped, kept inside). */
export function addThing(edit: LevelEdit, rules: LevelRules, character: string, at: Point): Added {
  const known = rules.characters[character]
  if (known === undefined) return { edit, added: false, why: 'no-such-character' }
  const place = keepInside(edit.now, known.size, at)
  if (onSolid(edit.now, known.size, place, rules.solid)) return { edit, added: false, why: 'solid' }
  const id = nextId(edit.now, character)
  const now: Level = { ...edit.now, things: [...edit.now.things, { id, character, x: place.x, y: place.y }] }
  return { edit: changed(edit, now), added: true, id }
}

/** May this be taken out? A thing always; a start point only while another is left; an id the level lacks, never. */
export function canErase(level: Level, id: HitId): boolean {
  if (level.things.some((t) => t.id === id)) return true
  return level.starts.length > 1 && startOf(level, id) !== undefined
}

/** `level` without the thing or start point `id`, and without any joint that names a thing. */
export function eraseThing(edit: LevelEdit, id: HitId): LevelEdit {
  if (!canErase(edit.now, id)) return edit
  const { joints, ...rest } = edit.now
  const base = {
    ...rest,
    things: edit.now.things.filter((t) => t.id !== id),
    starts: edit.now.starts.filter((s) => startId(s.player) !== id),
  }
  // Left out stays left out; a level whose last joint goes loses the list.
  const kept = joints?.filter((j) => j.thing !== id && j.holder !== id)
  const now: Level = kept === undefined || kept.length === 0 ? base : { ...base, joints: kept }
  return changed(edit, now)
}

/** The same thing, now another character of the game. An unknown character, or no such thing, changes nothing. */
export function setCharacter(edit: LevelEdit, rules: LevelRules, id: string, character: string): LevelEdit {
  const thing = edit.now.things.find((t) => t.id === id)
  const known = rules.characters[character]
  if (thing === undefined || known === undefined || thing.character === character) return edit
  // The new box may be bigger, so it is kept inside the level, or the file would not pass the framework.
  const at = keepInside(edit.now, known.size, thing)
  const things = edit.now.things.map((t) => (t.id === id ? { ...t, character, x: at.x, y: at.y } : t))
  return changed(edit, { ...edit.now, things })
}

/** One step back; with no past, the same edit. */
export function undo(edit: LevelEdit): LevelEdit {
  const before = edit.past.at(-1)
  if (before === undefined) return edit
  return {
    opened: edit.opened,
    now: before,
    past: edit.past.slice(0, -1),
    future: [...edit.future, edit.now],
  }
}

/** One step forward again, after an undo; with nothing undone, the same edit. */
export function redo(edit: LevelEdit): LevelEdit {
  const after = edit.future.at(-1)
  if (after === undefined) return edit
  return { opened: edit.opened, now: after, past: [...edit.past, edit.now], future: edit.future.slice(0, -1) }
}

/** Does the level now differ from the one that was opened, by value? Moving a thing away and back is not a change. */
export const isDirty = (edit: LevelEdit): boolean => JSON.stringify(edit.now) !== JSON.stringify(edit.opened)

/**
 * The few words that say what changed: what a saved change is called in the game's history. One kind of change reads
 * as itself; several kinds, or several things added or taken away, read as "Change <level>"; no change is "".
 */
export function describeChange(edit: LevelEdit): string {
  const { moved, added, erased, retyped, other } = compareLevels(edit.opened, edit.now)
  const kinds = [moved, added, erased, retyped].filter((list) => list.length > 0).length + (other > 0 ? 1 : 0)
  const level = edit.now.id
  if (kinds === 0) return ''
  if (kinds === 1 && other === 0) {
    const one = moved[0]
    if (one !== undefined) {
      return moved.length === 1 ? `Move ${one.id} in ${level}` : `Move ${moved.length} things in ${level}`
    }
    if (added.length === 1) return `Add ${added[0]} to ${level}`
    if (erased.length === 1) return `Erase ${erased[0]} from ${level}`
    const turned = edit.now.things.find((t) => t.id === retyped[0])
    if (retyped.length === 1 && turned !== undefined) {
      return `Make ${turned.id} a ${turned.character} in ${level}`
    }
  }
  return `Change ${level}`
}
