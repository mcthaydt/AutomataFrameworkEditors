// The people side of a game: where a person finds their games, the address of each screen, the sheets that open over a
// level (who can change it, what waits, one waiting change), and the sheets that put changes in.
export { default as Games } from './Games.svelte'
export { default as History } from './History.svelte'
export { default as KeepCopy } from './KeepCopy.svelte'
export { default as People } from './People.svelte'
export { default as ProblemStrip } from './ProblemStrip.svelte'
export { default as Problems } from './Problems.svelte'
export { default as PutSheet } from './PutSheet.svelte'
export { needsPerson, parseRoute, type Route, routeHash, type Sheet, withoutSheet } from './route.ts'
export type { Failure, Phase } from './sheets.ts'
export { default as Waiting } from './Waiting.svelte'
export { default as WaitingChange } from './WaitingChange.svelte'
export { default as WaitingSheet } from './WaitingSheet.svelte'
