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
  notAGame: "This isn't an Automata game. Pick another one.",
  brokenGame: 'This game has problems that need fixing first:',
  cantFindGame: "We can't find that game, or it hasn't been shared with you. Ask its owner.",
  cantFindVisitor: "We can't find that game. If someone shared it with you, sign in to open it.",
  visitorCan: 'Try anything you like. To save your changes into the game, sign in.',
  cantReach: "Can't reach the game right now. Check the internet and try again.",
  tryAgain: 'Try again',
  mineWaiting: 'Your changes are waiting for approval. This is your version of the game.',
  back: 'Back',
  loading: 'Getting your game…',
  solid: 'That spot is solid ground. Try another spot.',
  lookOnly: "You can look and try things, but you can't save changes to this game. Ask its owner to let you.",
  leaveAsk: "You have changes that aren't saved. Leave anyway?",
  leaveYes: 'Leave without saving',
  leaveNo: 'Stay',
  draftBack: "We brought back the change you hadn't saved.",
  waitingTitle: 'Waiting changes',
  waitingNone: 'Nothing is waiting.',
  waitingBy: 'From crate-1',
  waitingMine: 'From you',
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

// Words of the old pick-a-game and share pages that live on, word for word, under their new keys in the games and team
// words (the Share page's own others were reworded when it became "Who can change it", and left this list).
const PINNED_IN: readonly (readonly [area: 'menus' | 'games' | 'team', key: string, words: string])[] = [
  ['menus', 'signOut', 'Sign out'],
  ['games', 'gamesFind', 'Find a game by name'],
  ['games', 'gamesNoMatch', 'No game has that name.'],
  // The apostrophe is the curly one now, as every line of the new pages has it; the words are the same.
  ['games', 'gamesEmpty', 'You don’t have a game here yet.'],
  ['games', 'gamesEmptyHelp', 'If someone shared a game with you, open the link they sent.'],
  ['games', 'gamesAdd', 'Add the editor to a game of mine'],
  ['team', 'copyLink', 'Copy the link'],
  ['team', 'linkCopied', 'Copied.'],
  ['team', 'ownerName', 'Owner'],
  ['team', 'peopleNone', 'Nobody else has been added yet.'],
  ['team', 'addName', 'Their GitHub name'],
  ['team', 'addPerson', 'Add'],
  ['team', 'nameTwice', 'crate-1 is already on the list.'],
  ['team', 'savedList', 'Saved. The people on the list can use the link now.'],
]

test.each(PINNED_IN)('%s.%s still says what the old page said', (area, key, words) => {
  const row = (
    wordsIn('en')[area] as unknown as Readonly<Record<string, string | ((name: string) => string)>>
  )[key]
  expect(typeof row === 'function' ? row('crate-1') : row).toBe(words)
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
