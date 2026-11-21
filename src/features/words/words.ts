// Every word a person reads comes from here, so the whole product can be read at once (and, in M3, translated by
// swapping this one file). No screen says repo, repository, commit, branch, pull request, token, JSON, sync, push,
// merge or conflict: `tests/features/words/words.test.ts` fails on any of them. Each later task that adds a screen
// adds its rows here and to that test. A value is a string, or a function of a name that gives one.

import { arrange } from './arrange.ts'
import { bar } from './bar.ts'
import { changes } from './changes.ts'
import { check } from './check.ts'
import { first } from './first.ts'
import { games } from './games.ts'
import { ground } from './ground.ts'
import { help } from './help.ts'
import { helper } from './helper.ts'
import { kept } from './kept.ts'
import { LANGUAGES, type Lang, type Row } from './languages.ts'
import { levels } from './levels.ts'
import { map } from './map.ts'
import { menus } from './menus.ts'
import { notes } from './notes.ts'
import { panels } from './panels.ts'
import { play } from './play.ts'
import { settings } from './settings.ts'
import { shell } from './shell.ts'
import { team } from './team.ts'
import { thing } from './thing.ts'
import { whose } from './whose.ts'

export { arrange } from './arrange.ts'
export { bar } from './bar.ts'
export { changes } from './changes.ts'
export { check } from './check.ts'
export { first } from './first.ts'
export { games } from './games.ts'
export { ground } from './ground.ts'
export { help } from './help.ts'
export { helper } from './helper.ts'
export { kept } from './kept.ts'
export { LANGUAGE_NAMES, LANGUAGES, type Lang, READ_BY_A_SPEAKER, type Row } from './languages.ts'
export { levels } from './levels.ts'
export { map } from './map.ts'
export { menus } from './menus.ts'
export { notes } from './notes.ts'
export { panels } from './panels.ts'
export { play } from './play.ts'
export { settings } from './settings.ts'
export { shell } from './shell.ts'
export { team } from './team.ts'
export { thing } from './thing.ts'
export { whose } from './whose.ts'

export const WORDS = Object.freeze({
  appName: 'Automata Editors',
  welcomeLine: 'Change your game by touch, together.',
  signIn: 'Sign in with GitHub',
  signInWhy:
    "Signing in is how your changes get saved and shared. It's only so people know who you are. You won't need GitHub after that.",
  noAccount: "No GitHub account? Make one, it's free.",
  signInNotReady: "Sign-in isn't ready on this site yet.",
  signInCancelled: "You didn't sign in. You can try again whenever you like.",
  signInFailed: "Sign-in didn't work. You can try again.",
  signedOutAgain: "You've been signed out. Sign in again to keep going.",
  notAGame: "This isn't an Automata game. Pick another one.",
  brokenGame: 'One of its files has a mistake in it. Whoever looks after the game can mend it.',
  brokenTitle: "This game won't open",
  brokenFor: 'What is wrong, for them:',
  notAGameTitle: "That isn't a game",
  backToGames: 'Back to your games',
  cantFindGame: "We can't find that game, or it hasn't been shared with you. Ask its owner.",
  cantFindVisitor: "We can't find that game. If someone shared it with you, sign in to open it.",
  visitorCan: 'Try anything you like. To save your changes into the game, sign in.',
  cantReach: "Can't reach the game right now. Check the internet and try again.",
  tryAgain: 'Try again',
  mineWaiting: 'Your changes are waiting for approval. This is your version of the game.',
  back: 'Back',
  loading: 'Getting your game…',
  lookOnly: "You can look and try things, but you can't save changes to this game. Ask its owner to let you.",
  leaveAsk: "You have changes that aren't saved. Leave anyway?",
  leaveYes: 'Leave without saving',
  leaveNo: 'Stay',
  draftBack: "We brought back the change you hadn't saved.",
  draftDropped: 'This level changed while you were away, so your unsaved change was dropped.',
  solid: 'That spot is solid ground. Try another spot.',
  waitingTitle: 'Waiting changes',
  waitingNone: 'Nothing is waiting.',
  waitingBy: (name: string): string => `From ${name}`,
  waitingMine: 'From you',
  tryIt: 'Try it now',
  tryItLine: 'No account needed. Open the example game and change it.',
  tipShare: "Want help with your game? Open the game's menu to let someone in.",
  tipApprove: 'Someone made a change for you to look at. Open it to approve it or turn it down.',
  tipGotIt: 'Got it',
  // The one word beside a notice's icon, so its kind never rests on colour alone.
  noticeInfo: 'Note',
  noticeGood: 'Done',
  noticeProblem: 'Problem',
})

/** The rows of every area, said in one language. */
export interface Words {
  readonly bar: Readonly<Record<keyof (typeof bar)['en'], Row>>
  readonly shell: Readonly<Record<keyof (typeof shell)['en'], Row>>
  readonly menus: Readonly<Record<keyof (typeof menus)['en'], Row>>
  readonly panels: Readonly<Record<keyof (typeof panels)['en'], Row>>
  readonly first: Readonly<Record<keyof (typeof first)['en'], Row>>
  readonly levels: Readonly<Record<keyof (typeof levels)['en'], Row>>
  readonly map: Readonly<Record<keyof (typeof map)['en'], Row>>
  readonly arrange: Readonly<Record<keyof (typeof arrange)['en'], Row>>
  readonly settings: Readonly<Record<keyof (typeof settings)['en'], Row>>
  readonly help: Readonly<Record<keyof (typeof help)['en'], Row>>
  readonly play: Readonly<Record<keyof (typeof play)['en'], Row>>
  readonly changes: Readonly<Record<keyof (typeof changes)['en'], Row>>
  readonly check: Readonly<Record<keyof (typeof check)['en'], Row>>
  readonly kept: Readonly<Record<keyof (typeof kept)['en'], Row>>
  readonly whose: Readonly<Record<keyof (typeof whose)['en'], Row>>
  readonly thing: Readonly<Record<keyof (typeof thing)['en'], Row>>
  readonly team: Readonly<Record<keyof (typeof team)['en'], Row>>
  readonly games: Readonly<Record<keyof (typeof games)['en'], Row>>
  readonly helper: Readonly<Record<keyof (typeof helper)['en'], Row>>
  readonly notes: Readonly<Record<keyof (typeof notes)['en'], Row>>
  readonly ground: Readonly<Record<keyof (typeof ground)['en'], Row>>
}

/**
 * Every area in `lang`. English is the source, so a row a language lacks is English, never a blank: a language added
 * a row at a time is always whole. The older `WORDS` above stays English until the old screens are replaced.
 */
export function wordsIn(lang: Lang): Words {
  if (!LANGUAGES.includes(lang)) return wordsIn('en')
  return {
    bar: { ...bar.en, ...bar[lang] },
    shell: { ...shell.en, ...shell[lang] },
    first: { ...first.en, ...first[lang] },
    settings: { ...settings.en, ...settings[lang] },
    help: { ...help.en, ...help[lang] },
    menus: { ...menus.en, ...menus[lang] },
    panels: { ...panels.en, ...panels[lang] },
    levels: { ...levels.en, ...levels[lang] },
    map: { ...map.en, ...map[lang] },
    arrange: { ...arrange.en, ...arrange[lang] },
    play: { ...play.en, ...play[lang] },
    changes: { ...changes.en, ...changes[lang] },
    check: { ...check.en, ...check[lang] },
    kept: { ...kept.en, ...kept[lang] },
    whose: { ...whose.en, ...whose[lang] },
    thing: { ...thing.en, ...thing[lang] },
    team: { ...team.en, ...team[lang] },
    games: { ...games.en, ...games[lang] },
    helper: { ...helper.en, ...helper[lang] },
    notes: { ...notes.en, ...notes[lang] },
    ground: { ...ground.en, ...ground[lang] },
  }
}

/** An id said nicely: "level-1" is "Level 1", "crate-2" is "Crate 2", "big-box" is "Big box". */
export function nameOf(id: string): string {
  const said = id.replace(/-+/g, ' ').trim()
  return said === '' ? '' : said.charAt(0).toUpperCase() + said.slice(1)
}

/** A name back to an id: "Big box" is "big-box"; undefined when no id can be made of it. */
export function idOf(name: string): string | undefined {
  const id = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return id === '' ? undefined : id
}
