// The words feature's entry: every word a person reads comes through `WORDS`, and the table of each language is
// written in `en.ts` and, from Task 17, beside it. A screen reads `WORDS`; it never reads a table itself. What is not
// exported yet (`language`, `setLanguage`) is read from its own file by the tests, and joins this entry with
// the first screen that uses it, since a name nothing imports is a name knip fails on.
export { nameOf, type Words } from './table.ts'
export { type Language, WORDS } from './words.svelte.ts'
