// The first-run tips that point at a place in a game's menu or say what Play leaves out, each shown until it is
// dismissed. Whether one is done is kept on this device with the other first-run tips (`af.tip.*`); a device that will
// not keep it shows the tip again.
import type { Saying } from './events.ts'

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

/** The tip about what Play leaves out, once: marked as seen the moment it is given, and none when tips are off. */
export function playTip(store: Storage, on: boolean, words: string): Saying | undefined {
  if (!on || tipDone(store, 'play-code')) return undefined
  tipKept(store, 'play-code')
  return { id: 'tip-play-code', kind: 'info', text: words, dismiss: true }
}
