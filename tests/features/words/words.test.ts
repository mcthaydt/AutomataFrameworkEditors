import { expect, test } from 'vitest'
import { WORDS } from '#src/features/words/words.ts'
import { bannedIn } from '../../fixtures/banned.ts'

// The first words, exactly as the plan pins them (Task 2). Later tasks add their own rows to this list.
const PINNED: Readonly<Record<string, string>> = {
  appName: 'Automata Editors',
  welcomeLine: 'Change your game by touch, together.',
  signIn: 'Sign in with GitHub',
  signInNotReady: "Sign-in isn't ready on this site yet.",
  signInCancelled: "You didn't sign in. Press the button to try again.",
  signInFailed: "Sign-in didn't work. Press the button to try again.",
  signedOutAgain: "You've been signed out. Sign in again to keep going.",
  signInWhy: "GitHub only tells us who you are. After this you don't need to open it again.",
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
  gameLevels: 'Levels',
  gameMoreSoon: 'More editors are coming. For now you can change levels.',
  mineWaiting: 'Your changes are waiting for approval. This is your version of the game.',
  back: 'Back',
  pickTitle: 'Pick a game',
  loading: 'Getting your game…',
  hintIdle: 'Touch a box and drag it to move it.',
  hintSelected: 'Drag crate-1, or press the arrows.',
  thingLabel: 'crate-1. Drag to move it.',
  moveLeft: 'Move left',
  moveRight: 'Move right',
  moveUp: 'Move up',
  moveDown: 'Move down',
  undo: 'Undo',
  save: 'Save',
  solid: 'That spot is solid ground. Try another spot.',
}

const read = (key: string): string => {
  const value = (WORDS as Readonly<Record<string, string | ((name: string) => string)>>)[key]
  if (value === undefined) throw new Error(`WORDS has no ${key}`)
  return typeof value === 'function' ? value('crate-1') : value
}

test.each(Object.entries(PINNED))('%s says exactly what the plan says', (key, words) => {
  expect(read(key)).toBe(words)
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

test.each([
  ['look', 'You can look at this game.'],
  ['suggest', 'You can change this game. Someone will approve your changes.'],
  ['approve', "You can change this game, and approve other people's changes."],
  ['edit', 'You can change this game. Your changes go straight in.'],
  ['owner', 'This is your game. You can change it, and choose who helps.'],
  ['nothing', 'You can look at this game.'],
])('youAre(%s) says exactly what the plan says', (level, words) => {
  expect(WORDS.youAre(level)).toBe(words)
})
