// The levels editor: moving a thing in a level, as plain functions. The screens come after.
export { compareLevels, type ThingMove } from './compare.ts'
export { type Done, no, ok } from './done.ts'
export {
  type Characters,
  describeChange,
  isDirty,
  type LevelEdit,
  type Moved,
  moveThing,
  nudgeThing,
  startEdit,
  undo,
} from './edit.ts'
export { default as Levels } from './Levels.svelte'
export { type MapBox, mapBoxes, placeOn, startOf } from './on-map.ts'
export { keepInside, onSolid, type Point, type Size, snap, toScreen, toWorld } from './place.ts'
