// Keeping a copy of the open level by hand: on the clipboard, or as a file. Each says what happened through `update`,
// which hands the screen's events to a function and keeps what comes back.
import { keepCopy, type LevelCopy } from '../game/game.ts'
import { WORDS } from '../words/words.ts'
import { copied, type Saying, say, unsay } from './events.ts'

export type Update = (next: (events: readonly Saying[]) => readonly Saying[]) => void

export async function copyText(copy: LevelCopy, update: Update): Promise<void> {
  update((events) => unsay(events, 'keep'))
  const said = await copied(copy.text)
  update((events) => say(events, said))
}

export function copyFile(copy: LevelCopy, update: Update): void {
  keepCopy(document, copy)
  update((events) =>
    say(unsay(events, 'keep'), { id: 'copied', kind: 'good', text: WORDS.copyKept, dismiss: true }),
  )
}
