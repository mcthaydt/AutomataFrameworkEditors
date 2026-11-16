// What the screen says to the person in a few words, and the one or two things they can press about it. Plain data:
// the screen decides what it says; the list below it draws it.

import { type Row, WORDS } from '../words/words.ts'

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

/** What a save that did not go through says, in words a person can act on. */
export function saveProblem(problem: string, details?: readonly string[]): Saying {
  const failed = (text: string, lines?: readonly string[]): Saying => ({
    id: 'failed',
    kind: 'problem',
    text,
    ...(lines === undefined ? {} : { details: lines }),
  })
  switch (problem) {
    case 'changed-elsewhere':
      return { id: 'elsewhere', kind: 'problem', text: WORDS.changedElsewhere, ask: 'changed-elsewhere' }
    case 'not-allowed':
      return { id: 'standing', kind: 'info', text: WORDS.lookOnly, dismiss: true }
    case 'broken':
      return failed(WORDS.saveFailed, details ?? [])
    case 'blocked':
      return failed(WORDS.blockedOwner)
    case 'offline':
      return failed(WORDS.offline)
    case 'busy':
      return failed(WORDS.busy)
    default:
      return failed(WORDS.saveFailed)
  }
}

/** What a level that cannot be played says: the first sentence of what is wrong (the framework's own), and the rest. */
export function cantPlay(words: { cantPlay: Row; cantPlayNothing: Row }, lines: readonly string[]): Saying {
  const said = lines.length > 0 ? words.cantPlay : words.cantPlayNothing
  return {
    id: 'play',
    kind: 'problem',
    text: typeof said === 'string' ? said : said(),
    details: lines,
    dismiss: true,
  }
}

/** Puts the level's text on the clipboard; where that is not allowed, the text is shown and selected to copy by hand. */
export async function copied(text: string): Promise<Saying> {
  try {
    await navigator.clipboard.writeText(text)
    return { id: 'copied', kind: 'good', text: WORDS.copyCopied, dismiss: true }
  } catch {
    return { id: 'copied', kind: 'info', text: WORDS.copySelect, box: text, dismiss: true }
  }
}
