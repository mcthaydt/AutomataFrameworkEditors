// Where the level may be drawn: clear of the toolbar, the list and the settings, whatever of them is on screen.
import type { Layout } from '../shell/shell.ts'

export interface Insets {
  readonly left: number
  readonly right: number
  readonly bottom: number
  /** The settings sheet is pulled up: the level ends where it begins (see `SHEET_TOP`), not at `bottom`. */
  readonly sheet: boolean
  /**
   * The room the settings panel or its tab takes at a side of the level's box. The box itself runs under it, so the
   * level's backdrop has no dead strip beside it; the level is fitted and centred in what is left (the blind judge's
   * verdict, item 2), and in the whole box while nothing is picked.
   */
  readonly aside: { readonly left: number; readonly right: number }
}

/** What a second column of toolbar buttons adds to the toolbar's width. */
export const SECOND_COLUMN = 52

/**
 * The room the settings panel takes beside the level: its own width (`SettingsPanel`'s `.side`, 300) and its gap from
 * the screen's edge (`--space-2`), less the level's own margin (8), plus the gap it keeps from the level (`--space-2`),
 * so it never touches the level (the Owner, 2026-11-20: "it's hugging the edges"). The tab beside it the same way.
 */
const SIDE_ROOM = 300 + 8 - 8 + 8
const TAB_ROOM = 44 + 8 - 8 + 8

/** The room the pulled-up sheet may take from the bottom of the world, as the sheet's own `max-height` says it, and its gap. */
const SHEET_ROOM = 'calc(60% + 8px)'

/**
 * `settings` is how the settings panel is drawn now: it decides `aside`, never the box, so picking a thing never moves
 * the box under a finger that is dragging it (the level view holds its camera still while a hand is on a thing). `away`: the panels are put away. `onMap`: the map
 * has no settings panel, so its side is free. `twoRows`: the toolbar is two rows high (an upright phone). `twoColumns`:
 * it is two columns wide (a phone on its side, where one column of seven buttons would not fit between the bars).
 */
export function insetsOf(
  lay: Layout,
  settings: Layout['settings'],
  away: boolean,
  onMap = false,
  twoRows = false,
  twoColumns = false,
): Insets {
  if (away) return { left: 0, right: 0, bottom: 0, sheet: false, aside: { left: 0, right: 0 } }
  const toolbar = lay.toolbar === 'left' ? 76 + (twoColumns ? SECOND_COLUMN : 0) : 0
  const list = lay.list === 'rail' ? 68 : lay.list === 'beside' ? 288 : 0
  const side = onMap ? 0 : settings === 'side' ? SIDE_ROOM : settings === 'tab' ? TAB_ROOM : 0
  const sheet = lay.settings === 'sheet'
  const bottom = sheet
    ? 0
    : (lay.toolbar === 'bottom' ? (twoRows ? 136 : 76) : 0) + (lay.settings === 'bar' ? 56 : 0)
  return lay.mirror
    ? { left: 0, right: toolbar + list, bottom, sheet, aside: { left: side, right: 0 } }
    : { left: toolbar + list, right: 0, bottom, sheet, aside: { left: 0, right: side } }
}

/** The level's bottom edge as a style value: a pixel gap, or the room the pulled-up sheet takes. */
export const bottomOf = (insets: Insets): string => (insets.sheet ? SHEET_ROOM : `${insets.bottom}px`)
