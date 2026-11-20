// Tells a call the page itself cut off from a call that really failed. When a page moves on (a reload, a new address)
// while a call is open, or as its answer arrives, WebKit reports the call as a page error, "<address> due to access
// control checks", although the page's own code caught the rejection. That is the engine saying the page was replaced
// under a call, not a fault, so a journey must not fail on it. The same words about a call made after the page last
// moved are a fault and are kept.
//
// WebKit does it too for a picture the page is decoding in memory, which has an address but is never a request: it can only
// be told by its shape (a bare id), and only once the page has moved after its first load.
//
// Firefox does the same for a font: a font file still downloading when the page moves on is dropped with status
// 2152398850 (NS_BINDING_ABORTED), and Firefox logs "downloadable font: download failed ... status=2152398850 source:
// <address>" as a console error. Only that status, for a font first asked for before the page last moved, is excused;
// any other font failure (a missing file, a refused one, or an abort with no move to explain it) is a fault.

export interface CutOffTracker {
  /** A call started, to the address `url`. */
  started(url: string): void
  /** The page moved on (a reload or a new address). */
  navigated(): void
  /** Whether `error` is the engine's report of a call the page moved on from. */
  explains(error: string): boolean
}

/** Firefox's status for a download the page dropped (NS_BINDING_ABORTED). */
const ABORTED = 'status=2152398850'

const whereIs = (url: string): string => {
  const parsed = new URL(url)
  return parsed.pathname + parsed.search
}

/** The engine's name for a picture the page is decoding in memory: a bare id on the site's own address, never a request. */
const MEMORY_PICTURE =
  /^[a-z]*:?\/*\/?[\w.:-]+\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12} due to access control checks\.?$/

export function cutOffTracker(): CutOffTracker {
  let moves = 0
  /** For each address (its path and its question, so one game's open is not another's), how many moves the page had made when its first call started. */
  const firstCall = new Map<string, number>()
  return {
    started(url) {
      const path = whereIs(url)
      if (!firstCall.has(path)) firstCall.set(path, moves)
    },
    navigated() {
      moves += 1
    },
    explains(error) {
      if (error.includes('downloadable font: download failed')) {
        const source = /source: ([^\s"\]]+)/.exec(error)?.[1]
        if (!error.includes(ABORTED) || source === undefined || !URL.canParse(source)) return false
        const at = firstCall.get(whereIs(source))
        return at !== undefined && at < moves
      }
      // A picture decoded in memory has no request to start from; the page moving on after its first load is what cuts it.
      if (moves >= 2 && MEMORY_PICTURE.test(error.replace(/^page error: /, ''))) return true
      for (const [path, at] of firstCall) {
        if (at < moves && error.includes(`${path} due to access control checks`)) return true
      }
      return false
    },
  }
}
