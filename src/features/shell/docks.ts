// Where each dock sits at each size, as one pure function the design language's table can be checked against. A dock
// is a piece of floating glass: the toolbar, the list, the settings and the free thumb's buttons.
import type { SizeClass } from '../device/device.ts'
import type { IconName } from '../ui/ui.ts'

export interface Docks {
  /** The list: shut, open on what is in the level, or open on the things to add. */
  readonly list: 'closed' | 'list' | 'add'
  /** The settings of what is picked: in sight, or folded to a tab (a bar on a small screen). */
  readonly settings: 'shown' | 'hidden'
  /** The free thumb's buttons are unfolded. */
  readonly hold: boolean
}

export interface Layout {
  /** Down the left edge when there is room beside the level, along the bottom otherwise. */
  readonly toolbar: 'left' | 'bottom'
  /**
   * `rail`: shut to a thin strip with a word under each icon. `beside`: open and pushing the level over. `over`: open
   * over the level. `hidden`: shut and not drawn; the toolbar's own List button opens it.
   */
  readonly list: 'rail' | 'beside' | 'over' | 'hidden'
  /**
   * `side`: a panel at the right edge. `tab`: folded to a tab there. `bar`: a one-line bar that pulls up. `sheet`: that
   * bar pulled up, closed with Done. `none`: nothing is picked, so there is nothing to show.
   */
  readonly settings: 'side' | 'tab' | 'bar' | 'sheet' | 'none'
  /** "I draw with my left hand" turns the panels and the hold buttons round. */
  readonly mirror: boolean
}

/**
 * An iPad sideways and a computer are both `wide`; what tells them apart is `device`. The design language gives them
 * different defaults: the tools down the left edge and the list shut to a rail on the iPad, the tools along the bottom
 * and the list open on a computer. A phone, a phone on its side and an upright iPad keep the list shut until asked.
 */
export function layout(
  device: 'ipad' | 'phone' | 'computer',
  size: SizeClass,
  docks: Docks,
  picked: boolean,
  leftHand: boolean,
): Layout {
  const wide = size === 'wide'
  const toolbar = (wide && device === 'ipad') || size === 'phone-sideways' ? 'left' : 'bottom'
  let list: Layout['list']
  if (docks.list === 'closed') list = wide ? 'rail' : 'hidden'
  else list = wide ? 'beside' : 'over'
  let settings: Layout['settings']
  if (!picked) settings = 'none'
  else if (wide) settings = docks.settings === 'shown' ? 'side' : 'tab'
  else settings = docks.settings === 'shown' ? 'sheet' : 'bar'
  return { toolbar, list, settings, mirror: leftHand }
}

/** At most two things float over the level: opening a third closes the oldest, and opening one again moves it last. */
export function floating(open: readonly string[], next: string): readonly string[] {
  return [...open.filter((one) => one !== next), next].slice(-2)
}

/** One of the free thumb's buttons: a key a computer holds, as a button. */
export interface HoldButton {
  readonly id: string
  readonly icon: IconName
  /** The row of `words/panels.ts` that names it. */
  readonly words: 'pickSeveral' | 'dragCopy' | 'straightLines'
}
