// Where the level may be drawn: clear of the toolbar, the list and the settings, whatever of them is on screen.
import type { Layout } from '../shell/shell.ts'

export interface Insets {
  readonly left: number
  readonly right: number
  readonly bottom: number
  /** The settings sheet is pulled up: the level ends where it begins (see `SHEET_TOP`), not at `bottom`. */
  readonly sheet: boolean
}

/** The room the pulled-up sheet may take from the bottom of the world, as the sheet's own `max-height` says it, and its gap. */
const SHEET_ROOM = 'calc(60% + 8px)'

/**
 * `settings` is how the settings panel is drawn with something picked: it is held whether or not a thing is picked, so
 * picking one never moves the level under a finger that is dragging it. `away`: the panels are put away. `onMap`: the map
 * has no settings panel, so its side is free. `twoRows`: the toolbar is two rows high (an upright phone).
 */
export function insetsOf(
  lay: Layout,
  settings: Layout['settings'],
  away: boolean,
  onMap = false,
  twoRows = false,
): Insets {
  if (away) return { left: 0, right: 0, bottom: 0, sheet: false }
  const toolbar = lay.toolbar === 'left' ? 76 : 0
  const list = lay.list === 'rail' ? 68 : lay.list === 'beside' ? 288 : 0
  const side = onMap ? 0 : settings === 'side' ? 296 : settings === 'tab' ? 44 : 0
  const sheet = lay.settings === 'sheet'
  const bottom = sheet
    ? 0
    : (lay.toolbar === 'bottom' ? (twoRows ? 136 : 76) : 0) + (lay.settings === 'bar' ? 56 : 0)
  return lay.mirror
    ? { left: side, right: toolbar + list, bottom, sheet }
    : { left: toolbar + list, right: side, bottom, sheet }
}

/** The level's bottom edge as a style value: a pixel gap, or the room the pulled-up sheet takes. */
export const bottomOf = (insets: Insets): string => (insets.sheet ? SHEET_ROOM : `${insets.bottom}px`)
