// The words as tests look them up: the English table, plain, so a test that finds a button by its English name needs no
// Svelte and reads the same words in Node and in a browser. A test that needs a made-up table on screen (words 40%
// longer, say) imports `useTables` from `words.svelte.ts` itself; nothing under `src/` calls it.
import { EN } from '#src/features/words/en.ts'
import type { Words } from '#src/features/words/table.ts'

/** The English words. */
export const WORDS: Words = EN
