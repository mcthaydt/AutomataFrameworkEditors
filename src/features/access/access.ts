// The levels and the sharing file: what each person may do in a game, and the file that says so. Used by both the
// page (to know what to show) and the API (to know what to allow), so nothing here touches a page or GitHub.

export {
  ACCESS_FILE,
  type AccessFile,
  CLOSED,
  checkAccess,
  defaultAccess,
  levelOf,
  MAX_PEOPLE,
  parseAccess,
  writeAccess,
} from './file.ts'
export { type AccessLevel, type Action, can, higher, LEVELS } from './levels.ts'
