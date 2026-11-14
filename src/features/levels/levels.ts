// The levels editor: moving a thing in a level, as plain functions. The screens come after.
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
export { keepInside, onSolid, type Point, type Size, snap, toScreen, toWorld } from './place.ts'
