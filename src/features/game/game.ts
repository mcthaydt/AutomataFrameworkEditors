// The game as the page holds it: opened through the API and read by the framework, and the games this device knows.
export {
  change,
  type Edits,
  inLevel,
  isChanged,
  readerOf,
  redo,
  startEdits,
  undo,
  type Working,
} from './changes.ts'
export { keepCopy, type LevelCopy, levelCopy } from './copy.ts'
export { type ChangeLine, describe } from './describe.ts'
export { dropDrafts, keepDrafts, takeDrafts } from './drafts.ts'
export { cameIn, type Merged, merge } from './merge.ts'
export { levelPath, type Opened, type OpenGame, openGame } from './open.ts'
export { type Problem, problemsOf } from './problems.ts'
export { approverOf, laidOver, type PutResult, put, type TakeBack, takeBack } from './put.ts'
export { forgetGame, recentGames, rememberGame } from './recent.ts'
