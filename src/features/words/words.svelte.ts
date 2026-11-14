// The words of the language on screen. `WORDS` looks like a plain table, and reading a key in markup (or in a derived
// value) makes the screen read again when the language changes. Only this file holds the `$state`: the tables are plain.
import { EN } from './en.ts'
import type { Words } from './table.ts'

/** The languages the editors speak. Task 17 widens this to the nine. */
export type Language = 'en'

/** Each language's words. Written to only by `useTables`, which a test reaches through `tests/fixtures/words.ts`. */
export const TABLES: Record<Language, Words> = { en: EN }

let current = $state<Language>('en')
/** Bumped when `useTables` swaps a table, so a screen reading `WORDS` reads again. */
let swaps = $state(0)

/** The language on screen. */
export const language = (): Language => current

/** Puts another language on screen. Every screen reading `WORDS` re-renders. */
export function setLanguage(next: Language): void {
  current = next
}

/**
 * Test only: swaps the tables for made-up ones (a table whose every string is 40% longer, say), and with no argument
 * puts the real ones back. Nothing under `src/` calls it.
 */
export function useTables(next?: Readonly<Record<Language, Words>>): void {
  TABLES.en = next?.en ?? EN
  swaps += 1
}

const table = (): Words => {
  void swaps
  return TABLES[current]
}

/** The words of the language on screen: reading a key asks the table of the moment. It is read only. */
export const WORDS: Words = new Proxy({} as Words, {
  get: (_, key) => (typeof key === 'string' ? table()[key as keyof Words] : undefined),
  has: (_, key) => typeof key === 'string' && key in table(),
  ownKeys: () => Reflect.ownKeys(table()),
  getOwnPropertyDescriptor: (_, key) =>
    typeof key === 'string' && key in table()
      ? { value: table()[key as keyof Words], enumerable: true, configurable: true, writable: false }
      : undefined,
  set: () => false,
  deleteProperty: () => false,
  defineProperty: () => false,
})
