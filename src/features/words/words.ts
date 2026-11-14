// Every word a person reads comes from here, so the whole product can be read at once (and, in M3, translated by
// swapping this one file). No screen says repo, repository, commit, branch, pull request, token, JSON, sync, push,
// merge or conflict: `tests/features/words/words.test.ts` fails on any of them. Each later task that adds a screen
// adds its rows here and to that test. A value is a string, or a function of a name that gives one.

export const WORDS = Object.freeze({
  appName: 'Automata Editors',
  welcomeLine: 'Change your game by touch, together.',
  signIn: 'Sign in with GitHub',
  signInWhy: "GitHub only tells us who you are. After this you don't need to open it again.",
  signInNotReady: "Sign-in isn't ready on this site yet.",
  signInCancelled: "You didn't sign in. Press the button to try again.",
  signInFailed: "Sign-in didn't work. Press the button to try again.",
  signedOutAgain: "You've been signed out. Sign in again to keep going.",
  signOut: 'Sign out',
  pickTitle: 'Pick a game',
  loading: 'Getting your game…',
  hintIdle: 'Touch a box and drag it to move it.',
  hintSelected: (name: string): string => `Drag ${name}, or press the arrows.`,
  thingLabel: (name: string): string => `${name}. Drag to move it.`,
  moveLeft: 'Move left',
  moveRight: 'Move right',
  moveUp: 'Move up',
  moveDown: 'Move down',
  undo: 'Undo',
  save: 'Save',
  solid: 'That spot is solid ground. Try another spot.',
  // The one word beside a notice's icon, so its kind never rests on colour alone.
  noticeInfo: 'Note',
  noticeGood: 'Done',
  noticeProblem: 'Problem',
})
