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
  statusClean: 'Nothing to save.',
  statusDirty: "You have changes that aren't saved.",
  statusSaving: 'Saving…',
  savedDirect: 'Saved. Your game has the change.',
  savedSuggestion: 'Saved. Your change is waiting for approval.',
  lookOnly: "You can look and try things, but you can't save changes to this game. Ask its owner to let you.",
  signInToSave: 'Sign in to save this into the game. Your change will still be here when you come back.',
  changedElsewhere: "Someone changed this level while you were working, so your change wasn't saved.",
  takeTheirs: 'Show their version (drop my change)',
  keepMine: 'Keep my change for now',
  offline:
    "Can't reach the game right now. Your change is still here. Check the internet and press Save again.",
  busy: 'Things are busy. Your change is still here. Wait a minute and press Save again.',
  saveFailed: "Something went wrong and your change wasn't saved. Press Save again.",
  blockedOwner:
    "GitHub is set to stop the editor changing this game. The game's owner needs to let Automata Editors past that rule.",
  leaveAsk: "You have changes that aren't saved. Leave anyway?",
  leaveYes: 'Leave without saving',
  leaveNo: 'Stay',
  draftBack: "We brought back the change you hadn't saved.",
  waitingRow: 'crate-1 changes are waiting',
  waitingTitle: 'Waiting changes',
  waitingNone: 'Nothing is waiting.',
  waitingBy: 'From crate-1',
  waitingMine: 'From you',
  changeMoved: 'crate-1 was moved. The ring shows where it is now.',
  changeOther: 'This change does more than move things.',
  approve: 'Approve',
  turnDown: 'Turn it down',
  takeBack: 'Take my change back',
  approved: 'Approved. The change is in the game now.',
  turnedDown: 'Turned down. The game stays as it was.',
  checksRunning: 'This change is still being checked. Try again in a minute.',
  checksFailed: "The checks found a problem with this change, so it can't be approved.",
  ownChange: 'Someone else has to approve your own change.',
  clashes:
    "The game changed since this was made, so it doesn't fit any more. Turn it down and ask for it again.",
  notHere: "This change touches more than the game's levels, so it can't be approved here.",
  cantApprove: "You can look at this change, but you can't approve it.",
  share: 'Share',
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
  copyLevel: 'Copy this level',
  copyCopied: "Copied. Paste it to your agent, or into your game's files.",
  copySelect: "Copy the text below, then paste it to your agent or into your game's files.",
  copyKeep: 'Save it as a file',
  copyKept: 'A copy of this level is on your device.',
  guideCount: 'Step crate-1 of undefined',
  guideStart: 'Try the example game, or sign in to open your own.',
  guideStartPlain: 'First, sign in.',
  guideSaveVisitor: 'Nice. To put it in the game, press Save and sign in. Or keep a copy.',
  guideDoneCopy: 'You did it. You have a copy. Sign in whenever you want to save into a game.',
  guideAdd:
    "Next, let the editor open your game. Press the button, choose your game on GitHub, and you'll come back here. You only do this once.",
  guidePick: 'Now pick your game.',
  guidePickLevel: 'Pick a level to change.',
  guideMove: 'Touch a box and drag it somewhere new.',
  guideSave: 'Nice. Now press Save.',
  guideDoneDirect: 'You did it. The change is in your game.',
  guideDoneSuggestion: 'You did it. Your change is waiting for someone to approve it.',
  guideLook: 'You can look around this game. To change things, ask its owner.',
  guideHide: 'Hide these tips',
  tipShare: 'Want help with your game? Press Share to let someone in.',
  tipApprove: 'Someone made a change for you to look at. Open it to approve it or turn it down.',
  tipGotIt: 'Got it',
  redo: 'Redo',
  editorWorld: 'World',
  noteAcross: 'Across',
  noteDown: 'Down',
  notesOn: 'Notes on',
  notesFaded: 'Notes faded',
  notesHidden: 'Notes hidden',
  noteTiles: 'crate-1 tiles',
  noteChange: 'crate-1 undefined. Press to change it.',
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

test('waiting changes are counted in the singular and the plural', () => {
  expect(WORDS.waitingRow(1)).toBe('1 change is waiting')
  expect(WORDS.waitingRow(3)).toBe('3 changes are waiting')
})

test('the step count says which step of how many', () => {
  expect(WORDS.guideCount(2, 4)).toBe('Step 2 of 4')
})

test('tiles are counted in the singular and the plural', () => {
  expect(WORDS.noteTiles(1)).toBe('1 tile')
  expect(WORDS.noteTiles(6.5)).toBe('6.5 tiles')
  expect(WORDS.noteTiles(0)).toBe('0 tiles')
})

test('a note says what it is and that pressing it changes it', () => {
  expect(WORDS.noteChange('Across', '6.5 tiles')).toBe('Across 6.5 tiles. Press to change it.')
})
