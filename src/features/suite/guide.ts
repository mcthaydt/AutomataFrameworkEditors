// The first run: which step a person is on, worked out from facts about where they are and what they have done, so
// the strip can never be out of step with the screen. The only thing kept on the device is that it is finished.

export type GuideStep = 'start' | 'add-editor' | 'pick-game' | 'move' | 'save' | 'done'

export interface GuideFacts {
  /** Only decides between `start` and what follows it, when no game is open. */
  readonly signedIn: boolean
  /** How many games are in the person's list; undefined while asking. */
  readonly games: number | undefined
  /** A game is open (they picked one, or came by a link). */
  readonly inGame: boolean
  readonly inLevel: boolean
  readonly dirty: boolean
  readonly savedOnce: boolean
  /** A visitor pressed one of the copy buttons after a change: also `done`. */
  readonly keptCopy: boolean
}

export function guideStep(facts: GuideFacts): GuideStep {
  if (facts.savedOnce) return 'done'
  if (facts.keptCopy && !facts.signedIn) return 'done'
  if (!facts.inGame) {
    if (!facts.signedIn) return 'start'
    // While the list is still being asked for, do not say "add the editor": it may turn out the person has games.
    return facts.games === 0 ? 'add-editor' : 'pick-game'
  }
  if (!facts.inLevel) return 'pick-game'
  return facts.dirty ? 'save' : 'move'
}

const OWNER_STEPS: readonly GuideStep[] = ['add-editor', 'pick-game', 'move', 'save']
const LINK_STEPS: readonly GuideStep[] = ['pick-game', 'move', 'save']
/** The steps this person will count; `start` is never one of them. */
export const guideSteps = (cameByLink: boolean): readonly GuideStep[] =>
  cameByLink ? LINK_STEPS : OWNER_STEPS

const DONE = 'af.guide.done'
/** True until the guide is finished or hidden; a store that fails counts as "still wanted". */
export function guideWanted(store: Storage): boolean {
  try {
    return store.getItem(DONE) === null
  } catch {
    return true
  }
}
export function finishGuide(store: Storage): void {
  try {
    store.setItem(DONE, '1')
  } catch {
    // The tips come back next time; nothing is lost.
  }
}
