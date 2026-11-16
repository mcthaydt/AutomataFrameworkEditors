// What the shell's tests share: the World workspace as the shell is told it.
import type { Workspace } from '#src/features/shell/shell.ts'

export const WORLD: Workspace = {
  id: 'world',
  parts: [{ id: 'levels', words: 'partLevels', about: 'partLevelsAbout' }],
  tools: ['pick', 'place', 'erase'],
}
