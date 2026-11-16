// The person's own choices in Settings, "For me". They are kept on this device and nowhere else, under `af.me.*`,
// and none is something an agent needs: they change how the editor looks and feels for this person only.
import { LANGUAGES, type Lang } from '../words/words.ts'

export interface Me {
  /** "See-through panels". */
  readonly glass: 'auto' | 'on' | 'off'
  /** Row size. */
  readonly rows: 'auto' | 'touch' | 'small'
  /** Once a Pencil is seen it does the tool and a finger slides the view; this lets a finger draw too. */
  readonly fingerDraws: boolean
  /** The free-thumb hold buttons go on the left. */
  readonly leftHand: boolean
  /** First-run tips. */
  readonly tips: boolean
  readonly language: Lang | undefined
}

export const ME_DEFAULT: Me = {
  glass: 'auto',
  rows: 'auto',
  fingerDraws: false,
  leftHand: false,
  tips: true,
  language: undefined,
}

const KEYS = {
  glass: 'af.me.glass',
  rows: 'af.me.rows',
  fingerDraws: 'af.me.finger',
  leftHand: 'af.me.left',
  tips: 'af.me.tips',
  language: 'af.me.language',
} as const

function read(store: Storage, key: string): string | null {
  try {
    return store.getItem(key)
  } catch {
    return null
  }
}

const oneOf = <T extends string>(value: string | null, choices: readonly T[], otherwise: T): T =>
  choices.find((choice) => choice === value) ?? otherwise

const flag = (value: string | null, otherwise: boolean): boolean =>
  value === 'true' ? true : value === 'false' ? false : otherwise

/** What this device kept; anything unreadable, a field at a time, is the default. */
export function readMe(store: Storage): Me {
  const language = read(store, KEYS.language)
  return {
    glass: oneOf(read(store, KEYS.glass), ['auto', 'on', 'off'], ME_DEFAULT.glass),
    rows: oneOf(read(store, KEYS.rows), ['auto', 'touch', 'small'], ME_DEFAULT.rows),
    fingerDraws: flag(read(store, KEYS.fingerDraws), ME_DEFAULT.fingerDraws),
    leftHand: flag(read(store, KEYS.leftHand), ME_DEFAULT.leftHand),
    tips: flag(read(store, KEYS.tips), ME_DEFAULT.tips),
    language: LANGUAGES.find((lang) => lang === language),
  }
}

/** Keeps `me`. A device that will not keep it (private window, full) keeps nothing and the editor carries on. */
export function keepMe(store: Storage, me: Me): void {
  try {
    store.setItem(KEYS.glass, me.glass)
    store.setItem(KEYS.rows, me.rows)
    store.setItem(KEYS.fingerDraws, String(me.fingerDraws))
    store.setItem(KEYS.leftHand, String(me.leftHand))
    store.setItem(KEYS.tips, String(me.tips))
    if (me.language === undefined) store.removeItem(KEYS.language)
    else store.setItem(KEYS.language, me.language)
  } catch {
    // Nothing to do: the choice lasts until the page is closed.
  }
}
