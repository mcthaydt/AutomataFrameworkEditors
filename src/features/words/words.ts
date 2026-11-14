// The words feature's entry: every word a person reads comes through `WORDS`, and the table of each language is
// written in `en.ts` and, from Task 17, beside it. A screen reads `WORDS`; it never reads a table itself.
export { nameOf, type Words } from './table.ts'
export { type Language, language, setLanguage, WORDS } from './words.svelte.ts'
