// The levels editor: moving a thing in a level, as plain functions. The screens come after.
export { compareLevels, type ThingMove } from './compare.ts'
export {
  type Characters,
  describeChange,
  isDirty,
  type LevelEdit,
  type LevelRules,
  type Moved,
  moveThing,
  nudgeThing,
  rulesOf,
  startEdit,
  undo,
} from './edit.ts'
export { default as Levels } from './Levels.svelte'
export {
  keepInside,
  onSolid,
  type Point,
  type Room,
  type Size,
  snap,
  solidOf,
  toScreen,
  toWorld,
} from './place.ts'
