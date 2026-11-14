// What each level of help lets a person do. Each level can do everything the one before it can, so the whole
// table is one ordered list and a single comparison.

export const LEVELS = ['nothing', 'look', 'suggest', 'approve', 'edit', 'owner'] as const
export type AccessLevel = (typeof LEVELS)[number]

/**
 * What the API is asked about. `save` makes a change (a suggestion unless the level may `save-direct`); `approve`
 * puts someone else's waiting change into the game; `share` rewrites the sharing file.
 */
export type Action = 'look' | 'save' | 'approve' | 'save-direct' | 'share'

/** The lowest level that may do each action. */
const NEEDS: Readonly<Record<Action, AccessLevel>> = {
  look: 'look',
  save: 'suggest',
  approve: 'approve',
  'save-direct': 'edit',
  share: 'owner',
}

export function can(level: AccessLevel, action: Action): boolean {
  return LEVELS.indexOf(level) >= LEVELS.indexOf(NEEDS[action])
}

export function higher(a: AccessLevel, b: AccessLevel): AccessLevel {
  return LEVELS.indexOf(a) >= LEVELS.indexOf(b) ? a : b
}
