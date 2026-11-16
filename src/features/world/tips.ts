// The two first-run tips that point at a place in a game's menu, each shown until it is dismissed. Whether one is done
// is kept on this device with the other first-run tips (`af.tip.*`); a device that will not keep it shows the tip again.
const key = (tip: 'share' | 'approve'): string => `af.tip.${tip}`

export function tipDone(store: Storage, tip: 'share' | 'approve'): boolean {
  try {
    return store.getItem(key(tip)) !== null
  } catch {
    return false
  }
}

export function tipKept(store: Storage, tip: 'share' | 'approve'): void {
  try {
    store.setItem(key(tip), '1')
  } catch {
    // It may come back next time; nothing is lost.
  }
}
