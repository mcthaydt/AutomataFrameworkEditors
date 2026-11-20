// What the level shows and what the Paint tool holds, kept for this visit only: the Show choices, the kind of ground being
// painted, and the free thumb's buttons that are held. One object so the screen that owns it needs one line for it.
import { type Brush, NO_BRUSH, SHOW, type Show } from '../levels/levels.ts'

export function createLook() {
  let show = $state.raw<Show>(SHOW)
  let brush = $state.raw<Brush>(NO_BRUSH)
  return {
    get show(): Show {
      return show
    },
    get brush(): Brush {
      return brush
    },
    showing(next: Partial<Show>): void {
      show = { ...show, ...next }
    },
    paintWith(letter: string): void {
      brush = { ...brush, letter }
    },
    hold(id: string, held: boolean): void {
      const next = new Set(brush.held)
      if (held) next.add(id)
      else next.delete(id)
      brush = { ...brush, held: next }
    },
  }
}
export type Look = ReturnType<typeof createLook>
