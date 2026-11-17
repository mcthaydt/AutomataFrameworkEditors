// What the person is pointing with. A page hears `pointerType` ('touch', 'mouse' or 'pen') and a hovering Pencil tip
// (`pointermove` with no button down); it does not hear double tap or squeeze, so nothing here uses them.
import type { Me } from './me.ts'

export type PointerKind = 'touch' | 'mouse' | 'pen'

export interface Pointers {
  /** The kind of the last pointer event. */
  readonly last: PointerKind
  /** A Pencil has touched or hovered over this screen at least once: it is kept for good. */
  readonly penSeen: boolean
  /** A Pencil is over the screen now, with nothing pressed. */
  readonly hovering: boolean
}

const KINDS: readonly string[] = ['touch', 'mouse', 'pen']
const ENDS = new Set(['pointerdown', 'pointerleave', 'pointerout', 'pointercancel'])

export function nextPointers(
  now: Pointers,
  event: { readonly pointerType: string; readonly buttons: number; readonly type: string },
): Pointers {
  const last = KINDS.includes(event.pointerType) ? (event.pointerType as PointerKind) : now.last
  const pen = last === 'pen'
  const hovering =
    pen && (event.type === 'pointermove' || event.type === 'pointerover') && event.buttons === 0
  const next: Pointers = {
    last,
    penSeen: now.penSeen || pen,
    // Pressing or leaving ends a hover; anything else a pen does that is not a move keeps what it was.
    hovering: !pen || ENDS.has(event.type) ? false : hovering || now.hovering,
  }
  // Nothing changed: the same object, so what watches it is not woken for every move.
  return next.last === now.last && next.penSeen === now.penSeen && next.hovering === now.hovering ? now : next
}

/**
 * 'small' for a mouse or a hovering Pencil, 'touch' otherwise, unless the person chose. The caller reads it only when
 * a panel opens, so rows never change size under a moving hand.
 */
export function rowSize(pointers: Pointers, choice: Me['rows']): 'touch' | 'small' {
  if (choice !== 'auto') return choice
  return pointers.last === 'mouse' || pointers.hovering ? 'small' : 'touch'
}
