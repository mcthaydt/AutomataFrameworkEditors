// What a table of words is, and the one helper every table shares. Plain TypeScript: the API side may read it.
import type { EN } from './en.ts'

/** Every word, by key: a string, or a function of names and numbers that gives one. */
export type Words = {
  readonly [K in keyof typeof EN]: (typeof EN)[K] extends string ? string : (typeof EN)[K]
}

/** An id as a person reads it: dashes are spaces and the first letter is a capital. `nameOf('level-1')` is 'Level 1'. */
export function nameOf(id: string): string {
  const spaced = id.replaceAll('-', ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}
