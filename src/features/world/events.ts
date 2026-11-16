// What the screen says to the person in a few words, and the one or two things they can press about it. Plain data:
// the screen decides what it says; the list below it draws it.

export interface Saying {
  /** Names the event: a new event with the same id replaces the old one. */
  readonly id: string
  readonly kind: 'info' | 'good' | 'problem'
  readonly text: string
  /** Lines that go with it (what is wrong in the file). */
  readonly details?: readonly string[]
  /** The question this event asks, and so which buttons it has. */
  readonly ask?: 'sign-in' | 'changed-elsewhere' | 'leave' | 'keep'
  /** The level's text, in a box that is selected, where the clipboard was refused. */
  readonly box?: string
  /** A "Got it" button that takes it away. */
  readonly dismiss?: boolean
}

/** What a person pressed on an event: the choice's name. */
export type Answer =
  | 'sign-in'
  | 'take-theirs'
  | 'keep-mine'
  | 'stay'
  | 'leave'
  | 'copy-file'
  | 'copy-text'
  | 'dismiss'

/** The same list with `event` in it once: it replaces the one with its id, or goes last. */
export function say(events: readonly Saying[], event: Saying): readonly Saying[] {
  const at = events.findIndex((one) => one.id === event.id)
  return at < 0 ? [...events, event] : events.map((one, i) => (i === at ? event : one))
}

/** The list without the event with this id. */
export const unsay = (events: readonly Saying[], id: string): readonly Saying[] =>
  events.filter((one) => one.id !== id)
