// Where the level may be drawn: clear of the toolbar, the list and the settings, whatever of them is on screen.
import type { Layout } from '../shell/shell.ts'

export interface Insets {
  readonly left: number
  readonly right: number
  readonly bottom: number
}

/**
 * `settings` is how the settings panel is drawn with something picked: it is held whether or not a thing is picked, so
 * picking one never moves the level under a finger that is dragging it. `away`: the panels are put away. `onMap`: the map
 * has no settings panel, so its side is free.
 */
export function insetsOf(lay: Layout, settings: Layout['settings'], away: boolean, onMap = false): Insets {
  if (away) return { left: 0, right: 0, bottom: 0 }
  const toolbar = lay.toolbar === 'left' ? 76 : 0
  const list = lay.list === 'rail' ? 68 : lay.list === 'beside' ? 288 : 0
  const side = onMap ? 0 : settings === 'side' ? 296 : settings === 'tab' ? 44 : 0
  const bottom = (lay.toolbar === 'bottom' ? 76 : 0) + (lay.settings === 'bar' ? 56 : 0)
  return lay.mirror
    ? { left: side, right: toolbar + list, bottom }
    : { left: toolbar + list, right: side, bottom }
}
