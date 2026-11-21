// The world map: where levels sit, and how to move them. The screens come after.

export {
  type Box,
  boxes,
  type Door,
  type Landing,
  landing,
  marksOf,
  moveLevel,
  neighbours,
  nudgeLevel,
  pullApart,
  type Wall,
  wholeWorld,
} from './arrange.ts'
export { edgesOf } from './edges.ts'
export { wallFold } from './fold.svelte.ts'
export { default as MapPart } from './MapPart.svelte'
