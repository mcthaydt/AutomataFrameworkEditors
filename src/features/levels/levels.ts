// The levels editor: changing a level (moving, adding, erasing, another character, undo and redo), as plain functions.
// The screens come after.
export { compareLevels, type HitId, type LevelChanges, type ThingMove } from './compare.ts'
export {
  type Added,
  addThing,
  type Characters,
  canErase,
  describeChange,
  eraseThing,
  isDirty,
  type LevelEdit,
  type LevelRules,
  type Moved,
  moveThing,
  nudgeThing,
  placeOf,
  redo,
  rulesOf,
  setCharacter,
  sizeOf,
  startEdit,
  undo,
  type Way,
} from './edit.ts'
export { nextId } from './ids.ts'
export { default as Levels } from './Levels.svelte'
export { type Shape, shapeOf } from './layout.ts'
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
export { default as Stage } from './Stage.svelte'
