// The edit a person is in the middle of: the level as it was opened, as it is now, and the steps back. Every function
// returns a new edit; the opened level is never changed.
import type { Character, Level } from '@automataframework/framework/headless'
import { keepInside, onSolid, type Point, STEP } from './place.ts'

export interface LevelEdit {
  readonly opened: Level
  readonly now: Level
  /** Older levels, the nearest last. */
  readonly past: readonly Level[]
}
export type Moved =
  | { readonly edit: LevelEdit; readonly moved: true }
  | { readonly edit: LevelEdit; readonly moved: false; readonly why: 'solid' | 'same' | 'no-such-thing' }
export type Characters = Readonly<Record<string, Character>>

export const startEdit = (level: Level): LevelEdit => ({ opened: level, now: level, past: [] })

/** A thing with a character the game lacks is still one box, so it can be moved while the game is being fixed. */
const FALLBACK_SIZE = { w: 1, h: 1 }

export function moveThing(edit: LevelEdit, characters: Characters, thingId: string, to: Point): Moved {
  const thing = edit.now.things.find((t) => t.id === thingId)
  if (thing === undefined) return { edit, moved: false, why: 'no-such-thing' }
  const size = characters[thing.character]?.size ?? FALLBACK_SIZE
  const at = keepInside(edit.now, size, to)
  if (at.x === thing.x && at.y === thing.y) return { edit, moved: false, why: 'same' }
  if (onSolid(edit.now, size, at)) return { edit, moved: false, why: 'solid' }
  const now: Level = {
    ...edit.now,
    things: edit.now.things.map((t) => (t.id === thingId ? { ...t, x: at.x, y: at.y } : t)),
  }
  return { edit: { opened: edit.opened, now, past: [...edit.past, edit.now] }, moved: true }
}

const WAYS = {
  left: { x: -STEP, y: 0 },
  right: { x: STEP, y: 0 },
  up: { x: 0, y: -STEP },
  down: { x: 0, y: STEP },
} as const

/** A move by one `STEP`. */
export function nudgeThing(
  edit: LevelEdit,
  characters: Characters,
  thingId: string,
  way: keyof typeof WAYS,
): Moved {
  const thing = edit.now.things.find((t) => t.id === thingId)
  if (thing === undefined) return { edit, moved: false, why: 'no-such-thing' }
  return moveThing(edit, characters, thingId, { x: thing.x + WAYS[way].x, y: thing.y + WAYS[way].y })
}

/** One step back; with no past, the same edit. */
export function undo(edit: LevelEdit): LevelEdit {
  const before = edit.past.at(-1)
  return before === undefined ? edit : { opened: edit.opened, now: before, past: edit.past.slice(0, -1) }
}

/** Does the level now differ from the one that was opened, by value? Moving a thing away and back is not a change. */
export const isDirty = (edit: LevelEdit): boolean => JSON.stringify(edit.now) !== JSON.stringify(edit.opened)

/** The few words that say what changed: what a saved change is called in the game's history. */
export function describeChange(edit: LevelEdit): string {
  const was = new Map(edit.opened.things.map((t) => [t.id, t] as const))
  const moved = edit.now.things.filter((t) => {
    const before = was.get(t.id)
    return before !== undefined && (before.x !== t.x || before.y !== t.y)
  })
  if (moved.length === 0) return ''
  const only = moved[0]
  if (moved.length === 1 && only !== undefined) return `Move ${only.id} in ${edit.now.id}`
  return `Move ${moved.length} things in ${edit.now.id}`
}
