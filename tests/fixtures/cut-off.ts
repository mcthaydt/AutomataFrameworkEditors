// Tells a call the page itself cut off from a call that really failed. When a page moves on (a reload, a new address)
// while a call is open, or as its answer arrives, WebKit reports the call as a page error, "<address> due to access
// control checks", although the page's own code caught the rejection. That is the engine saying the page was replaced
// under a call, not a fault, so a journey must not fail on it. The same words about a call made after the page last
// moved are a fault and are kept.

export interface CutOffTracker {
  /** A call started, to the address `url`. */
  started(url: string): void
  /** The page moved on (a reload or a new address). */
  navigated(): void
  /** Whether `error` is the engine's report of a call the page moved on from. */
  explains(error: string): boolean
}

export function cutOffTracker(): CutOffTracker {
  let moves = 0
  /** For each address, how many moves the page had made when its first call started. */
  const firstCall = new Map<string, number>()
  return {
    started(url) {
      const path = new URL(url).pathname
      if (!firstCall.has(path)) firstCall.set(path, moves)
    },
    navigated() {
      moves += 1
    },
    explains(error) {
      for (const [path, at] of firstCall) {
        if (at < moves && error.includes(`${path} due to access control checks`)) return true
      }
      return false
    },
  }
}
