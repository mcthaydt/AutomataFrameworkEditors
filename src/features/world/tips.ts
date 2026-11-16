// The first-run tips that point at a place in a game's menu or say what Play leaves out, each shown until it is
// dismissed. Whether one is done is kept on this device with the other first-run tips (`af.tip.*`); a device that will
// not keep it shows the tip again.
import { type Saying, say } from './events.ts'

type Tip = 'share' | 'approve' | 'play-code'
const key = (tip: Tip): string => `af.tip.${tip}`

export function tipDone(store: Storage, tip: Tip): boolean {
  try {
    return store.getItem(key(tip)) !== null
  } catch {
    return false
  }
}

export function tipKept(store: Storage, tip: Tip): void {
  try {
    store.setItem(key(tip), '1')
  } catch {
    // It may come back next time; nothing is lost.
  }
}

/**
 * What is said once the game has started: the tip about what Play leaves out is added the first time, and marked as seen
 * the moment it is given. None when tips are off. A Play that fails never gets here, so it does not use the tip up.
 */
export function playTip(
  events: readonly Saying[],
  store: Storage,
  on: boolean,
  words: string,
): readonly Saying[] {
  if (!on || tipDone(store, 'play-code')) return events
  tipKept(store, 'play-code')
  return say(events, { id: 'tip-play-code', kind: 'info', text: words, dismiss: true })
}
