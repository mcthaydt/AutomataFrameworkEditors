// What a key press means on the World screen, said as a plain act: the screen does it. While a level plays a key belongs
// to the game (only Escape comes back); while a person types it belongs to the field.
import { commandFor, type Tool } from '../shell/shell.ts'
import { onControl, typing } from './listen.ts'
import { WORLD } from './world-workspace.ts'

export type KeyAct =
  | { readonly kind: 'stop-play' }
  | { readonly kind: 'step'; readonly which: 'undo' | 'redo' }
  | { readonly kind: 'escape' }
  | { readonly kind: 'play' }
  | { readonly kind: 'help' }
  | { readonly kind: 'find' }
  | { readonly kind: 'nudge'; readonly way: 'left' | 'right' | 'up' | 'down' }
  | { readonly kind: 'tool'; readonly tool: Tool }
  | { readonly kind: 'level'; readonly command: 'delete' | 'duplicate' | 'copy' | 'paste' }

export interface KeyFacts {
  readonly playing: boolean
  /** A level is open (not the map), so it can play. */
  readonly canPlay: boolean
  /** How many things are picked. */
  readonly picked: number
  /** A sheet has the keys. */
  readonly sheetOpen: boolean
}

const WAYS = ['left', 'right', 'up', 'down'] as const

/** The act a key press asks for, or nothing. Stops the browser's own answer to a key it takes. */
export function actOnKey(e: KeyboardEvent, facts: KeyFacts): KeyAct | undefined {
  if (facts.playing) {
    if (e.key !== 'Escape') return undefined
    e.preventDefault()
    return { kind: 'stop-play' }
  }
  const command = commandFor({
    key: e.key,
    meta: e.metaKey,
    ctrl: e.ctrlKey,
    shift: e.shiftKey,
    inField: typing(e) || (e.key === ' ' && onControl(e)),
  })
  if (command === 'undo' || command === 'redo') {
    e.preventDefault()
    return { kind: 'step', which: command }
  }
  if (command === 'escape') return { kind: 'escape' }
  if (command === 'play' && facts.canPlay) {
    e.preventDefault()
    return { kind: 'play' }
  }
  if (command === 'help' || command === 'find') {
    e.preventDefault()
    return { kind: command }
  }
  if (command?.startsWith('nudge:') && facts.picked === 1 && !e.defaultPrevented && !facts.sheetOpen) {
    // A thing that has focus moves itself; this is for a picked thing when the focus is elsewhere.
    const way = WAYS.find((one) => one === command.slice('nudge:'.length))
    if (way === undefined) return undefined
    e.preventDefault()
    return { kind: 'nudge', way }
  }
  if (command?.startsWith('tool:')) {
    const tool = WORLD.tools.find((one) => one === command.slice(5))
    return tool === undefined ? undefined : { kind: 'tool', tool }
  }
  if (command === 'delete' || command === 'duplicate' || command === 'copy' || command === 'paste') {
    return { kind: 'level', command }
  }
  return undefined
}
