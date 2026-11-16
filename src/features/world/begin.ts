// What the World screen says when it opens: a change brought back or let go, who the person is here, and the tips.
import { can } from '../access/access.ts'
import { dropDrafts, type Edits, type OpenGame, startEdits, takeDrafts } from '../game/game.ts'
import { WORDS } from '../words/words.ts'
import { type Saying, say } from './events.ts'
import { tipDone } from './tips.ts'

export function begin(
  given: OpenGame,
  drafts: Storage,
  remembered: Storage,
  savedBefore: boolean,
): { edits: Edits; said: readonly Saying[] } {
  const taken = takeDrafts(drafts, given)
  let said: readonly Saying[] = []
  let edits = startEdits(given)
  if (taken !== undefined && taken.moved.length > 0) {
    dropDrafts(drafts, given)
    said = say(said, { id: 'draft', kind: 'info', text: WORDS.draftDropped, dismiss: true })
  } else if (taken !== undefined) {
    edits = taken.edits
    said = say(said, { id: 'draft', kind: 'good', text: WORDS.draftBack, dismiss: true })
  }
  if (given.login === undefined) {
    said = say(said, { id: 'standing', kind: 'info', text: WORDS.visitorCan, dismiss: true })
  } else if (!can(given.level, 'save')) {
    said = say(said, { id: 'standing', kind: 'info', text: WORDS.lookOnly, dismiss: true })
  } else if (given.mine !== undefined) {
    said = say(said, { id: 'standing', kind: 'info', text: WORDS.mineWaiting, dismiss: true })
  }
  const toCheck = given.waiting - (given.mine === undefined ? 0 : 1)
  if (given.level === 'owner' && given.login !== undefined && savedBefore && !tipDone(remembered, 'share')) {
    said = say(said, { id: 'tip-share', kind: 'info', text: WORDS.tipShare, dismiss: true })
  }
  if (can(given.level, 'approve') && toCheck > 0 && !tipDone(remembered, 'approve')) {
    said = say(said, { id: 'tip-approve', kind: 'info', text: WORDS.tipApprove, dismiss: true })
  }
  return { edits, said }
}
