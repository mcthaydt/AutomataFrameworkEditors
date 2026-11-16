// Keeping a copy of the open level by hand: on the clipboard, or as a file. Each says what happened through `update`,
// which hands the screen's events to a function and keeps what comes back.
import { keepCopy, type LevelCopy } from '../game/game.ts'
import { WORDS } from '../words/words.ts'
import { type Saying, say, unsay } from './events.ts'

export type Update = (next: (events: readonly Saying[]) => readonly Saying[]) => void

export async function copyText(copy: LevelCopy, update: Update): Promise<void> {
  update((events) => unsay(events, 'keep'))
  try {
    await navigator.clipboard.writeText(copy.text)
    update((events) => say(events, { id: 'copied', kind: 'good', text: WORDS.copyCopied, dismiss: true }))
  } catch {
    // Where the clipboard is not allowed, the text is shown and selected so it can be copied by hand.
    update((events) =>
      say(events, { id: 'copied', kind: 'info', text: WORDS.copySelect, box: copy.text, dismiss: true }),
    )
  }
}

export function copyFile(copy: LevelCopy, update: Update): void {
  keepCopy(document, copy)
  update((events) =>
    say(unsay(events, 'keep'), { id: 'copied', kind: 'good', text: WORDS.copyKept, dismiss: true }),
  )
}
