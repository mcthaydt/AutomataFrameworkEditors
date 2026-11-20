// Notes on a level, as what the level draws: a pin for each note that belongs to it. Pure: the page reads the notes, this
// only says where each one sits.
import type { Level } from '@automataframework/framework/headless'
import type { Note, NotesFile } from '../files/files.ts'
import type { Extra } from '../levels/levels.ts'

const PREFIX = 'note:'

/** The note a pin is, by the id the level gives back when it is pressed; undefined for any other mark. */
export function noteIdOf(extraId: string): string | undefined {
  return extraId.startsWith(PREFIX) ? extraId.slice(PREFIX.length) : undefined
}

/** The notes about one level, in the order they were written. */
export const notesOfLevel = (file: NotesFile, level: string): readonly Note[] =>
  file.notes.filter((note) => note.level === level)

/**
 * The pins for a level: a note on a thing sits at its top right corner as it is now; one on a spot, or on a thing that has
 * gone, sits where it was put; one on the whole level sits at its middle. Done notes only when `showDone`.
 */
export function noteExtras(
  file: NotesFile,
  level: Level | undefined,
  levelId: string,
  showDone: boolean,
  say: (note: Note) => string,
  sizeOf: (character: string) => { readonly w: number; readonly h: number },
): readonly Extra[] {
  const pins: Extra[] = []
  for (const note of notesOfLevel(file, levelId)) {
    if (note.done && !showDone) continue
    const thing = note.thing === undefined ? undefined : level?.things.find((one) => one.id === note.thing)
    const size = thing === undefined ? undefined : sizeOf(thing.character)
    const at =
      thing !== undefined && size !== undefined
        ? { x: thing.x + size.w / 2, y: thing.y - size.h / 2 }
        : (note.at ?? { x: 0.5, y: 0.5 })
    pins.push({
      id: `${PREFIX}${note.id}`,
      kind: 'note',
      at,
      name: say(note),
      ...(note.done ? { done: true } : {}),
    })
  }
  return pins
}
