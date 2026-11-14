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
  signOut: 'Sign out',
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
