// One row of a `Menu`. A heading names the rows under it, a rule is a thin line between groups, and a plain row is a
// thing to do. A row that cannot act says why under its word.
import type { IconName } from './icons.ts'

export interface MenuItem {
  readonly id: string
  readonly words: string
  readonly kind?: 'item' | 'heading' | 'rule'
  readonly icon?: IconName
  /** Its key, shown at the end of the row ("V"). */
  readonly key?: string
  /** A line under the word saying what the row is for. */
  readonly about?: string
  /** Why this row cannot act ("A level has one Start"). A row with no reason can. */
  readonly off?: string
  /** The row for where the person is now: ticked. */
  readonly here?: boolean
}
