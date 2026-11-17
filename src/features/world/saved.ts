// What a save that went in does to the screen: the game as it now is, the changes with the level counted as saved, and
// what the person is told.
import type { Level } from '@automataframework/framework/headless'
import type { Edits, SaveResult } from '../game/game.ts'
import { WORDS } from '../words/words.ts'
import type { Saying } from './events.ts'

export function savedAs(
  result: Extract<SaveResult, { ok: true }>,
  edits: Edits,
  levelId: string,
  now: Level,
): { game: Extract<SaveResult, { ok: true }>['game']; edits: Edits; saying: Saying } {
  return {
    game: result.game,
    edits: { ...edits, base: { ...edits.base, levels: { ...edits.base.levels, [levelId]: now } } },
    saying: {
      id: 'saved',
      kind: 'good',
      text: result.how === 'suggestion' ? WORDS.savedSuggestion : WORDS.savedDirect,
      dismiss: true,
    },
  }
}
