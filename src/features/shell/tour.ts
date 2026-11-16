// The tour: four steps that each wait for the person to do the thing the step asks, and say so when they have. Pure,
// so what moves it on can be checked without a page. What the device keeps is small: that the first run is finished
// (`af.guide.done`), and one tick for each step the person has done (`af.tip.<step>`).
export const STEPS = ['tap-the-crate', 'tap-place', 'drag-a-value', 'play-then-put'] as const
export type Step = (typeof STEPS)[number]

export interface TourState {
  readonly step: Step | 'done' | 'skipped'
  /** The person has done what this step asked; the card says so, and offers "Next". */
  readonly did: boolean
}

export interface Happened {
  readonly kind: 'picked' | 'tool' | 'value' | 'moved' | 'played' | 'put' | 'skip' | 'next'
  /** Which tool, for `tool`. */
  readonly what?: string
}

/** What a step is waiting for. Step 3 ignores a pick: it asks for a change to what is picked. */
const WAITS: Readonly<Record<Step, (happened: Happened) => boolean>> = {
  'tap-the-crate': (h) => h.kind === 'picked',
  'tap-place': (h) => h.kind === 'tool' && h.what === 'place',
  'drag-a-value': (h) => h.kind === 'value' || h.kind === 'moved',
  'play-then-put': (h) => h.kind === 'played' || h.kind === 'put',
}

/** The steps whose job is on the screen; a step is added here by the pull request that draws what it asks for. */
export const stepsIn = (drawn: ReadonlySet<Step>): readonly Step[] => STEPS.filter((step) => drawn.has(step))

/** Where a tour begins: at `at` when that step is in `steps`, else at the first. Nothing to show is already done. */
export function tourFrom(steps: readonly Step[], at?: Step): TourState {
  const first = at !== undefined && steps.includes(at) ? at : steps[0]
  return first === undefined ? { step: 'done', did: false } : { step: first, did: false }
}

/** Moves on only when the person did the step's own thing; "Next" moves on once they have, and Skip always ends it. */
export function tourNext(state: TourState, happened: Happened, steps: readonly Step[] = STEPS): TourState {
  if (state.step === 'done' || state.step === 'skipped') return state
  if (happened.kind === 'skip') return { step: 'skipped', did: false }
  if (happened.kind === 'next') {
    if (!state.did) return state
    const after = steps[steps.indexOf(state.step) + 1]
    return after === undefined ? { step: 'done', did: false } : { step: after, did: false }
  }
  if (state.did || !WAITS[state.step](happened)) return state
  return { step: state.step, did: true }
}

const DONE = 'af.guide.done'
const TICK = 'af.tip.'

/** True until the first run is finished or skipped; a device that will not say counts as "still wanted". */
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
    // The tour comes back next time; nothing is lost.
  }
}

/** The steps this device has seen done. */
export function readTicks(store: Storage): ReadonlySet<Step> {
  const done = new Set<Step>()
  for (const step of STEPS) {
    try {
      if (store.getItem(`${TICK}${step}`) !== null) done.add(step)
    } catch {
      // One that cannot be read is one not done.
    }
  }
  return done
}
export function keepTick(store: Storage, step: Step): void {
  try {
    store.setItem(`${TICK}${step}`, '1')
  } catch {
    // The step shows as not done in Help; nothing else is lost.
  }
}
