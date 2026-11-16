// The keys a computer has for what a finger does. A key does nothing while the person is typing in a field, and a
// command is only a name: the page that is showing something decides whether the command means anything there.

export interface Key {
  readonly id: string
  /** What is on the key ("V", "⌘Z"). */
  readonly key: string
}

export const KEYS: readonly Key[] = [
  { id: 'tool:pick', key: 'V' },
  { id: 'tool:place', key: 'A' },
  { id: 'tool:paint', key: 'B' },
  { id: 'tool:erase', key: 'E' },
  { id: 'tool:join', key: 'L' },
  { id: 'undo', key: '⌘Z' },
  { id: 'redo', key: '⇧⌘Z' },
  { id: 'find', key: '⌘K' },
  { id: 'play', key: 'Space' },
  { id: 'help', key: '?' },
  { id: 'delete', key: 'Delete' },
  { id: 'nudge:left', key: '←' },
  { id: 'nudge:right', key: '→' },
  { id: 'nudge:up', key: '↑' },
  { id: 'nudge:down', key: '↓' },
  { id: 'duplicate', key: '⌘D' },
  { id: 'copy', key: '⌘C' },
  { id: 'paste', key: '⌘V' },
  { id: 'escape', key: 'Escape' },
]

const PLAIN: Readonly<Record<string, string>> = {
  v: 'tool:pick',
  a: 'tool:place',
  b: 'tool:paint',
  e: 'tool:erase',
  l: 'tool:join',
  ' ': 'play',
  '?': 'help',
  Delete: 'delete',
  Backspace: 'delete',
  ArrowLeft: 'nudge:left',
  ArrowRight: 'nudge:right',
  ArrowUp: 'nudge:up',
  ArrowDown: 'nudge:down',
  Escape: 'escape',
}

const WITH_COMMAND: Readonly<Record<string, string>> = {
  k: 'find',
  d: 'duplicate',
  c: 'copy',
  v: 'paste',
}

/** The command a key press asks for, or nothing: while typing in a field, or for a key that means nothing here. */
export function commandFor(event: {
  key: string
  meta: boolean
  ctrl: boolean
  shift: boolean
  inField: boolean
}): string | undefined {
  if (event.inField) return undefined
  const command = event.meta || event.ctrl
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
  if (command) {
    if (key === 'z') return event.shift ? 'redo' : 'undo'
    return WITH_COMMAND[key]
  }
  return PLAIN[key === ' ' ? ' ' : key]
}
