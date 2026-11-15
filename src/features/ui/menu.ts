// What a `Menu` is made of. Plain TypeScript, so the screens that build the items need no component for it.
import type { IconName } from './icons.ts'

/** One row of a menu: what it says, an icon beside it, a small tag after it (`Coming soon`) and what pressing it does. */
export interface MenuItem {
  readonly id: string
  readonly label: string
  readonly icon?: IconName
  readonly tag?: string
  /** The one the person is on now (the editor they are in): shown as current, and pressing it only closes the menu. */
  readonly current?: boolean
  readonly onpress: () => void
}
