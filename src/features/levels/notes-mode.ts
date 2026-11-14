// The drawing notes' switch: on, faded or hidden. It is a setting of this device and nothing else: it never reaches a
// game's files or the API. A device that cannot remember (a private window) or holds rubbish gets the notes on, and the
// switch still works for the visit.

export type NotesMode = 'on' | 'faded' | 'hidden'

/** Where the device keeps it. */
export const NOTES_KEY = 'af.notes'

const MODES: readonly NotesMode[] = ['on', 'faded', 'hidden']

/** What the device remembers; anything but one of the three words, or a store that throws, is `on`. */
export function readNotesMode(store: Storage): NotesMode {
  try {
    const kept = store.getItem(NOTES_KEY)
    return MODES.find((mode) => mode === kept) ?? 'on'
  } catch {
    return 'on'
  }
}

/** Remembers `mode`; a store that refuses is ignored. */
export function keepNotesMode(store: Storage, mode: NotesMode): void {
  try {
    store.setItem(NOTES_KEY, mode)
  } catch {
    // A device that will not remember still lets the switch work for this visit.
  }
}

/** The next press of the switch: on, faded, hidden, on. */
export function nextNotesMode(mode: NotesMode): NotesMode {
  return mode === 'on' ? 'faded' : mode === 'faded' ? 'hidden' : 'on'
}
