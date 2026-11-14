// The game as the page holds it: opened through the API and read by the framework, and the games this device knows.

export { dropDraft, keepDraft, takeDraft } from './draft.ts'
export { levelPath, type Opened, type OpenGame, openGame } from './open.ts'
export { forgetGame, recentGames, rememberGame } from './recent.ts'
export { type SaveResult, saveLevel } from './save.ts'
