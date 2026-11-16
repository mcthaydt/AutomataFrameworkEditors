// Where the level may be drawn: clear of the top bar's, the toolbar's and the open panels' sides, in pixels.
import type { Layout } from '../shell/shell.ts'

export interface Insets {
  readonly left: number
  readonly right: number
  readonly bottom: number
}

/** `settings` is the settings panel as it would be with a thing picked: held so picking one never moves the level. */
export function insetsOf(lay: Layout, settings: Layout['settings'], onMap: boolean): Insets {
  const toolbar = lay.toolbar === 'left' ? 76 : 0
  const list = lay.list === 'rail' ? 68 : lay.list === 'beside' ? 288 : 0
  const side = onMap ? 0 : settings === 'side' ? 296 : settings === 'tab' ? 44 : 0
  const bottom = (lay.toolbar === 'bottom' ? 76 : 0) + (lay.settings === 'bar' ? 56 : 0)
  return lay.mirror
    ? { left: side, right: toolbar + list, bottom }
    : { left: toolbar + list, right: side, bottom }
}
