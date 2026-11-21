// What the World screen says when it opens: a change brought back or let go, who the person is here, and the tips.
import { can } from '../access/access.ts'
import { dropDrafts, type Edits, keepDrafts, type OpenGame, startEdits, takeDrafts } from '../game/game.ts'
import { WORDS } from '../words/words.ts'
import { type Saying, say } from './events.ts'
import { tipDone } from './tips.ts'

export function begin(
  given: OpenGame,
  drafts: Storage,
  remembered: Storage,
  savedBefore: boolean,
  /** False once the person has turned the tips off in Settings. */
  tips = true,
): { edits: Edits; said: readonly Saying[]; back: boolean } {
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
  // Changes that were sent to be checked and turned down: back on the screen, ready to be sent again, if this device
  // still has them. Once answered, what was kept is not needed any more.
  let back = false
  if (taken === undefined && given.turnedDown !== undefined) {
    const sentBack = takeDrafts(drafts, given, 'sent')
    if (sentBack !== undefined && sentBack.moved.length === 0) {
      edits = sentBack.edits
      back = true
      keepDrafts(drafts, given, edits)
    } else if (sentBack !== undefined) {
      said = say(said, { id: 'draft', kind: 'info', text: WORDS.draftDropped, dismiss: true })
    }
  }
  if (given.mine === undefined) dropDrafts(drafts, given, 'sent')
  if (given.login === undefined) {
    said = say(said, { id: 'standing', kind: 'info', text: WORDS.visitorCan, dismiss: true })
  } else if (!can(given.level, 'save')) {
    said = say(said, { id: 'standing', kind: 'info', text: WORDS.lookOnly, dismiss: true })
  } else if (given.mine !== undefined && given.mine.asked === undefined) {
    // Asked for a change, the change is not waiting for approval any more: the asked note says so (design round 2, R3).
    said = say(said, { id: 'standing', kind: 'info', text: WORDS.mineWaiting, dismiss: true })
  }
  const toCheck = given.waiting - (given.mine === undefined ? 0 : 1)
  if (
    tips &&
    given.level === 'owner' &&
    given.login !== undefined &&
    savedBefore &&
    !tipDone(remembered, 'share')
  ) {
    said = say(said, { id: 'tip-share', kind: 'info', text: WORDS.tipShare, dismiss: true })
  }
  if (tips && can(given.level, 'approve') && toCheck > 0 && !tipDone(remembered, 'approve')) {
    said = say(said, { id: 'tip-approve', kind: 'info', text: WORDS.tipApprove, dismiss: true })
  }
  return { edits, said, back }
}
