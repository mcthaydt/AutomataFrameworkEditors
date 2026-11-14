// The levels editor: moving a thing in a level, as plain functions. The screens come after.
export { compareLevels, type ThingMove } from './compare.ts'
export {
  type Characters,
  describeChange,
  isDirty,
  type LevelEdit,
  type Moved,
  moveThing,
  nudgeThing,
  redo,
  startEdit,
  undo,
} from './edit.ts'
export { default as Levels } from './Levels.svelte'
export { type Box, type Line, type Notes, notesFor } from './notes.ts'
export { keepNotesMode, NOTES_KEY, type NotesMode, nextNotesMode, readNotesMode } from './notes-mode.ts'
export {
  fitInside,
  type Inset,
  keepInside,
  onSolid,
  type Point,
  type Size,
  snap,
  toScreen,
  toWorld,
} from './place.ts'
