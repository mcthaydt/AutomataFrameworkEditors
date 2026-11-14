// Every word a person reads comes from here, so the whole product can be read at once (and, in M3, translated by
// swapping this one file). No screen says repo, repository, commit, branch, pull request, token, JSON, sync, push,
// merge or conflict: `tests/features/words/words.test.ts` fails on any of them. Each later task that adds a screen
// adds its rows here and to that test. A value is a string, or a function of a name that gives one.

const YOU_ARE: Readonly<Record<string, string>> = {
  look: 'You can look at this game.',
  suggest: 'You can change this game. Someone will approve your changes.',
  approve: "You can change this game, and approve other people's changes.",
  edit: 'You can change this game. Your changes go straight in.',
  owner: 'This is your game. You can change it, and choose who helps.',
}

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
  /** What a person may do in a game, said to them. Anything unknown is said as "look", the safest. */
  youAre: (level: string): string => YOU_ARE[level] ?? YOU_ARE.look ?? '',
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
