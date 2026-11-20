import { expect, test } from 'vitest'
import { LANGUAGES, WORDS, wordsIn } from '#src/features/words/words.ts'
import { bannedIn } from '../../fixtures/banned.ts'

// The first words, exactly as the plan pins them (Task 2). Later tasks add their own rows to this list.
const PINNED: Readonly<Record<string, string>> = {
  appName: 'Automata Editors',
  welcomeLine: 'Change your game by touch, together.',
  signIn: 'Sign in with GitHub',
  signInNotReady: "Sign-in isn't ready on this site yet.",
  signInCancelled: "You didn't sign in. You can try again whenever you like.",
  signInFailed: "Sign-in didn't work. You can try again.",
  signedOutAgain: "You've been signed out. Sign in again to keep going.",
  signInWhy:
    "Signing in is how your changes get saved and shared. It's only so people know who you are. You won't need GitHub after that.",
  noAccount: "No GitHub account? Make one, it's free.",
  signOut: 'Sign out',
  pickFind: 'Find a game by name',
  pickNoMatch: 'No game has that name.',
  pickEmpty: "You don't have a game here yet.",
  pickEmptyLink: 'If someone shared a game with you, open the link they sent.',
  pickAdd: 'Add the editor to a game of mine',
  notAGame: "This isn't an Automata game. Pick another one.",
  brokenGame: 'This game has problems that need fixing first:',
  cantFindGame: "We can't find that game, or it hasn't been shared with you. Ask its owner.",
  cantFindVisitor: "We can't find that game. If someone shared it with you, sign in to open it.",
  visitorCan: 'Try anything you like. To save your changes into the game, sign in.',
  cantReach: "Can't reach the game right now. Check the internet and try again.",
  tryAgain: 'Try again',
  mineWaiting: 'Your changes are waiting for approval. This is your version of the game.',
  back: 'Back',
  pickTitle: 'Pick a game',
  loading: 'Getting your game…',
  solid: 'That spot is solid ground. Try another spot.',
  lookOnly: "You can look and try things, but you can't save changes to this game. Ask its owner to let you.",
  offline: "Can't reach the game right now. Your change is still here. Check the internet and try again.",
  busy: 'Things are busy. Your change is still here. Wait a minute and try again.',
  saveFailed: "Something went wrong and your change wasn't saved. Try again.",
  blockedOwner:
    "GitHub is set to stop the editor changing this game. The game's owner needs to let Automata Editors past that rule.",
  leaveAsk: "You have changes that aren't saved. Leave anyway?",
  leaveYes: 'Leave without saving',
  leaveNo: 'Stay',
  draftBack: "We brought back the change you hadn't saved.",
  waitingTitle: 'Waiting changes',
  waitingNone: 'Nothing is waiting.',
  waitingBy: 'From crate-1',
  waitingMine: 'From you',
  shareTitle: 'Share crate-1',
  shareLinkLabel: 'Send this link to the people you want to help:',
  copyLink: 'Copy the link',
  linkCopied: 'Copied.',
  everyoneLabel: 'Anyone who opens the link and signs in:',
  everyoneNothing: "Can't get in",
  everyoneNothingHint: 'Only the people below can open the game.',
  levelLook: 'Look',
  levelLookHint: 'Can see the game.',
  levelSuggest: 'Suggest',
  levelSuggestHint: 'Can change things. Someone has to approve the changes.',
  levelApprove: 'Approve',
  levelApproveHint: "Can suggest changes and approve other people's.",
  levelEdit: 'Edit',
  levelEditHint: 'Changes go straight into the game.',
  levelOwner: 'Owner',
  levelOwnerHint: 'Can do everything, and choose who helps.',
  peopleLabel: 'People',
  peopleOwner: 'crate-1 owns this game.',
  peopleNone: 'Nobody else has been added yet.',
  addName: 'Their GitHub name',
  addNameHint: "It's the name they sign in to GitHub with. They don't need to do anything on GitHub.",
  addPerson: 'Add',
  remove: 'Remove crate-1',
  nameUnknown: "There's nobody on GitHub called crate-1. Check the spelling.",
  nameTwice: 'crate-1 is already on the list.',
  nameBad: "That doesn't look like a GitHub name.",
  saveSharing: 'Save sharing',
  sharingSaved: 'Saved. The people on the list can use the link now.',
  sharingChanged: 'Someone else changed the sharing while you were here. Here is the newest list.',
  sharingBroken: 'The sharing list on this game was damaged. Check the list below and press Save to mend it.',
  sharingDirty: "You have sharing changes that aren't saved.",
  tryIt: 'Try it now',
  tryItLine: 'No account needed. Open the example game and change it.',
  tipShare: "Want help with your game? Open the game's menu to let someone in.",
  tipApprove: 'Someone made a change for you to look at. Open it to approve it or turn it down.',
  tipGotIt: 'Got it',
  draftDropped: 'This level changed while you were away, so your unsaved change was dropped.',
}

const read = (key: string): string => {
  const value = (WORDS as unknown as Readonly<Record<string, string | ((name: string) => string)>>)[key]
  if (value === undefined) throw new Error(`WORDS has no ${key}`)
  return typeof value === 'function' ? value('crate-1') : value
}

test.each(Object.entries(PINNED))('%s says exactly what the plan says', (key, words) => {
  expect(read(key)).toBe(words)
})

// The move arrows' spoken names and tooltips (the settings panel's cross and the pad on the level): exactly these in
// English, and four different names in every language, so each arrow is told apart by ear (the audit of 2026-11-20, N6).
const PAD = { padUp: 'Move up', padLeft: 'Move left', padRight: 'Move right', padDown: 'Move down' } as const

test('the move arrows say exactly what the plan says, and every language names all four apart', () => {
  const english = wordsIn('en').levels
  for (const [key, words] of Object.entries(PAD)) expect(english[key as keyof typeof PAD]).toBe(words)
  for (const lang of LANGUAGES) {
    const said = wordsIn(lang).levels
    const names = Object.keys(PAD).map((key) => {
      const row = said[key as keyof typeof PAD]
      return typeof row === 'string' ? row : row()
    })
    expect(
      names.every((name) => name.trim() !== ''),
      lang,
    ).toBe(true)
    expect(new Set(names).size, lang).toBe(4)
  }
})

test('WORDS is frozen', () => {
  expect(Object.isFrozen(WORDS)).toBe(true)
})

test('no word a person reads is one of the banned ones', () => {
  for (const key of Object.keys(WORDS)) expect(bannedIn(read(key)), key).toEqual([])
})

test('the banned list matches whole words only', () => {
  expect(bannedIn('Save the sharing list')).toEqual([])
  expect(bannedIn('Your commit and the Repository')).toEqual(['repository', 'commit'])
})
