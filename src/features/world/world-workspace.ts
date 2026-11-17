// What the World editor tells the shell: one part (the levels), and the tools that have a job on its page. Pick, place and
// erase work on things and ground, paint says what the ground is, and join draws what a switch opens.
import type { Workspace } from '../shell/shell.ts'

export const WORLD: Workspace = {
  id: 'world',
  parts: [{ id: 'levels', words: 'partLevels', about: 'partLevelsAbout' }],
  tools: ['pick', 'place', 'paint', 'erase', 'join'],
}
