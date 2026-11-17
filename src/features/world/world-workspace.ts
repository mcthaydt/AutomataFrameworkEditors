// What the World editor tells the shell: one part (the levels), and the tools that have a job on its page. Pick, place and
// erase work on things and ground, and join draws what a switch opens; paint comes with the pull request that gives it one.
import type { Workspace } from '../shell/shell.ts'

export const WORLD: Workspace = {
  id: 'world',
  parts: [{ id: 'levels', words: 'partLevels', about: 'partLevelsAbout' }],
  tools: ['pick', 'place', 'erase', 'join'],
}
