// The team's and the changes' English words, exactly as PR 16 worded them. A reword is a product choice: it changes
// this list on purpose. A row that takes a count or a name is shown with `{a}` and `{b}` standing for them, and with the
// counts 1 and 2 where the wording differs. (A row that is the same either way shows once.)
import { expect, test } from 'vitest'
import { wordsIn } from '#src/features/words/words.ts'

const PINNED: Readonly<Record<string, string>> = {
  'team.peopleTitle(a,b)': 'Who can change {a}',
  'team.peopleTitle(1,b)': 'Who can change 1',
  'team.peopleTitle(2,b)': 'Who can change 2',
  'team.peopleOwnerYou': 'You are an owner, so you can change what anyone may do.',
  'team.peopleOnlyOwner': 'Only an owner can change this list.',
  'team.peopleStarted': 'Started the game',
  'team.peopleYou(a,b)': '{a} (you)',
  'team.peopleYou(1,b)': '1 (you)',
  'team.peopleYou(2,b)': '2 (you)',
  'team.peopleNone': 'Nobody else has been added yet.',
  'team.lookName': 'Can look',
  'team.lookAbout': 'Sees everything. Changes nothing.',
  'team.suggestName': 'Can suggest',
  'team.suggestAbout': 'Changes things, then sends them to be checked.',
  'team.approveName': 'Can check and put in',
  'team.approveAbout': 'Suggests, and checks other people’s changes.',
  'team.editName': 'Can change',
  'team.editAbout': 'Changes the game straight away.',
  'team.ownerName': 'Owner',
  'team.ownerAbout': 'Everything, and who is on this list.',
  'team.everyoneLabel': 'Anyone with the link',
  'team.everyoneNothing': 'Can’t open it',
  'team.linkLabel': 'The link to send',
  'team.copyLink': 'Copy the link',
  'team.linkCopied': 'Copied.',
  'team.addName': 'Their GitHub name',
  'team.addPerson': 'Add',
  'team.addAbout': 'They need GitHub only to sign in. Nothing else asks for it.',
  'team.removeName(a,b)': 'Take {a} off the list',
  'team.removeName(1,b)': 'Take 1 off the list',
  'team.removeName(2,b)': 'Take 2 off the list',
  'team.saveList': 'Save',
  'team.savedList': 'Saved. The people on the list can use the link now.',
  'team.listChanged': 'Someone else changed this list while you were here. Here is the newest one.',
  'team.listBroken': 'This list was damaged. Check it, then press Save to mend it.',
  'team.listUnsaved': 'You have changes that are not saved yet.',
  'team.leaveAsk': 'You have changes that are not saved yet. Leave anyway?',
  'team.leaveYes': 'Leave without saving',
  'team.leaveNo': 'Stay',
  'team.nameUnknown(a,b)': 'There is nobody on GitHub called {a}. Check the spelling.',
  'team.nameUnknown(1,b)': 'There is nobody on GitHub called 1. Check the spelling.',
  'team.nameUnknown(2,b)': 'There is nobody on GitHub called 2. Check the spelling.',
  'team.nameTwice(a,b)': '{a} is already on the list.',
  'team.nameTwice(1,b)': '1 is already on the list.',
  'team.nameTwice(2,b)': '2 is already on the list.',
  'team.nameBad': 'That does not look like a GitHub name.',
  'team.askOwner(a,b)': 'Ask {a} to change what I can do',
  'team.askOwner(1,b)': 'Ask 1 to change what I can do',
  'team.askOwner(2,b)': 'Ask 2 to change what I can do',
  'team.reachFail': 'Can’t reach the game right now. Check the internet and try again.',
  'team.busyFail': 'Things are busy. Wait a minute and try again.',
  'team.blockedFail': 'GitHub is set to stop this. The game’s owner needs to let Automata Editors past it.',
  'team.elseFail': 'Something went wrong. Try again.',
  'team.historyTitle(a,b)': 'What changed in {a}',
  'team.historyTitle(1,b)': 'What changed in 1',
  'team.historyTitle(2,b)': 'What changed in 2',
  'team.historyAbout': 'Newest first. These are in the game now.',
  'team.historyShow': 'Show me',
  'team.historyMore': 'Show more',
  'team.historyNone': 'Nothing has changed in the game yet.',
  'team.historyEnd': 'That is everything it remembers.',
  'team.historyMap': 'The map',
  'team.historyWhole': 'The whole game',
  'team.historyLoading': 'Getting what changed…',
  'team.historyOpen(a,b)': 'Show me: {a}',
  'team.historyOpen(1,b)': 'Show me: 1',
  'team.historyOpen(2,b)': 'Show me: 2',
  'team.seeWhatChanged': 'See what changed',
  'team.showOnLevel': 'Show me on the level',
  'changes.putTitle(a,b)': 'Put {a} changes in the game',
  'changes.putTitle(1,b)': 'Put 1 change in the game',
  'changes.putTitle(2,b)': 'Put 2 changes in the game',
  'changes.sendTitle(a,b)': 'Send {a} changes to {b}',
  'changes.sendTitle(1,b)': 'Send 1 change to {b}',
  'changes.sendTitle(2,b)': 'Send 2 changes to {b}',
  'changes.putAbout(a,b)': 'Only you can see these, {a}. Put them in and your team sees them too.',
  'changes.putAbout(1,b)': 'Only you can see these, 1. Put them in and your team sees them too.',
  'changes.putAbout(2,b)': 'Only you can see these, 2. Put them in and your team sees them too.',
  'changes.sendAbout(a,b)':
    '{a} puts them in the game, or tells you what to change. Until then, only you can see them, {b}.',
  'changes.sendAbout(1,b)':
    '1 puts them in the game, or tells you what to change. Until then, only you can see them, {b}.',
  'changes.sendAbout(2,b)':
    '2 puts them in the game, or tells you what to change. Until then, only you can see them, {b}.',
  'changes.putThem': 'Put them in',
  'changes.sendThem(a,b)': 'Send to {a} to check',
  'changes.sendThem(1,b)': 'Send to 1 to check',
  'changes.sendThem(2,b)': 'Send to 2 to check',
  'changes.putAnyway': 'Put them in anyway',
  'changes.sendAnyway': 'Send them anyway',
  'changes.notYet': 'Not yet',
  'changes.warnPut': 'You can still put them in. Whether this warns you first is in Settings.',
  'changes.warnSend': 'You can still send them. Whether this warns you first is in Settings.',
  'changes.fixFirst(a,b)': 'Fix {a} problems first',
  'changes.fixFirst(1,b)': 'Fix 1 problem first',
  'changes.fixFirst(2,b)': 'Fix 2 problems first',
  'changes.stopsAbout':
    'This game asks for every problem to be fixed before changes go in, so players never meet one.',
  'changes.stopsSafe':
    'Your changes are safe on this device until then. Only an Owner can change this rule, in Settings.',
  'changes.afterSend(a,b)': 'After you send, the top bar says “Waiting for {a}”.',
  'changes.afterSend(1,b)': 'After you send, the top bar says “Waiting for 1”.',
  'changes.afterSend(2,b)': 'After you send, the top bar says “Waiting for 2”.',
  'changes.showMe': 'Show me',
  'changes.cameIn(a,b)':
    '{a} changes came in from the game while you worked. They are in your level now. Press once more to put yours in.',
  'changes.cameIn(1,b)':
    '1 change came in from the game while you worked. It is in your level now. Press once more to put yours in.',
  'changes.cameIn(2,b)':
    '2 changes came in from the game while you worked. They are in your level now. Press once more to put yours in.',
  'changes.clashed(a,b)':
    '{a} of your changes clash with someone else’s. The game’s version is kept for now. Undo brings yours back.',
  'changes.clashed(1,b)':
    '1 of your changes clashes with someone else’s. The game’s version is kept for now. Undo brings yours back.',
  'changes.clashed(2,b)':
    '2 of your changes clash with someone else’s. The game’s version is kept for now. Undo brings yours back.',
  'changes.working': 'One moment…',
  'changes.onDevice(a,b)': 'on this computer',
  'changes.clashTitle': 'The game’s version is kept',
  'changes.sendIt(a,b)': 'Send them too',
  'changes.sendIt(1,b)': 'Send it too',
  'changes.doneTitle': 'In the game',
  'changes.doneAbout(a,b)': 'Everyone on {a} has your {b} changes now.',
  'changes.doneAbout(1,b)': 'Everyone on 1 has your {b} changes now.',
  'changes.doneAbout(2,b)': 'Everyone on 2 has your {b} changes now.',
  'changes.sentTitle(a,b)': 'Sent to {a} to check',
  'changes.sentTitle(1,b)': 'Sent to 1 to check',
  'changes.sentTitle(2,b)': 'Sent to 2 to check',
  'changes.sentAbout': 'You’ll see here when they are in the game. You can keep working.',
  'changes.takeBack': 'Take them back',
  'changes.takenBack': 'Taken back. Your changes are yours again, on this device.',
  'changes.takeBackFailed': 'Couldn’t take them back. Your changes are safe: nothing is lost. Try again.',
  'changes.failPut': 'Couldn’t put them in',
  'changes.failSend': 'Couldn’t send them',
  'changes.failOffline(a,b)':
    'There is no internet right now. Your {a} changes are safe on this device: nothing is lost.',
  'changes.failOffline(1,b)':
    'There is no internet right now. Your 1 change is safe on this device: nothing is lost.',
  'changes.failOffline(2,b)':
    'There is no internet right now. Your 2 changes are safe on this device: nothing is lost.',
  'changes.failBusy(a,b)':
    'Things are busy right now. Your {a} changes are safe: nothing is lost. Wait a minute and try again.',
  'changes.failBusy(1,b)':
    'Things are busy right now. Your 1 change is safe: nothing is lost. Wait a minute and try again.',
  'changes.failBusy(2,b)':
    'Things are busy right now. Your 2 changes are safe: nothing is lost. Wait a minute and try again.',
  'changes.failBroken': 'The game would not read with these changes. Here is what needs mending:',
  'changes.failBlocked':
    'GitHub is set to stop the editor changing this game. The game’s owner needs to let Automata Editors past that rule. Your changes are safe here.',
  'changes.failLook':
    'You can look at this game, but you can’t change it any more. Your changes are safe here: keep a copy instead.',
  'changes.failElse':
    'Something went wrong, and your changes were not put in. They are safe here: nothing is lost.',
  'changes.again': 'Try again',
  'changes.notNow': 'Not now',
  'changes.waitTitle(a,b)': 'With {a}, to check',
  'changes.waitTitle(1,b)': 'With 1, to check',
  'changes.waitTitle(2,b)': 'With 2, to check',
  'changes.waitAbout(a,b)':
    '{a} has your changes. They are not in the game yet. You can keep working while you wait.',
  'changes.waitAbout(1,b)':
    '1 has your changes. They are not in the game yet. You can keep working while you wait.',
  'changes.waitAbout(2,b)':
    '2 has your changes. They are not in the game yet. You can keep working while you wait.',
  'changes.waitMoreTitle(a,b)': '{a} has your first changes',
  'changes.waitMoreTitle(1,b)': '1 has your first changes',
  'changes.waitMoreTitle(2,b)': '2 has your first changes',
  'changes.waitMoreAbout(a,b)': 'These {a} new ones are only on this device so far.',
  'changes.waitMoreAbout(1,b)': 'This new one is only on this device so far.',
  'changes.waitMoreAbout(2,b)': 'These 2 new ones are only on this device so far.',
}

const shown = (): Record<string, string> => {
  const out: Record<string, string> = {}
  for (const area of ['team', 'changes'] as const) {
    const rows = wordsIn('en')[area] as Record<string, unknown>
    for (const [key, row] of Object.entries(rows)) {
      if (typeof row !== 'function') {
        out[`${area}.${key}`] = String(row)
        continue
      }
      const say = row as (...parts: unknown[]) => string
      out[`${area}.${key}(a,b)`] = say('{a}', '{b}')
      out[`${area}.${key}(1,b)`] = say(1, '{b}')
      out[`${area}.${key}(2,b)`] = say(2, '{b}')
    }
  }
  for (const key of Object.keys(out)) {
    const base = key.replace(/\((1|2),b\)$/, '(a,b)')
    if (base !== key && out[base] === out[key]) delete out[key]
  }
  return out
}

test('every English row of the team and the changes says exactly what PR 16 pinned', () => {
  expect(shown()).toEqual(PINNED)
})
