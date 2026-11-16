// What a workspace tells the shell. The shell is the same for every editor: a top bar, a toolbar, a list and a panel
// of settings. A workspace says only which parts it has, which of the five tools have a job on its page, and the six
// editors are listed once here so the editor menu and the part menu draw the same rows.
import type { IconName } from '../ui/ui.ts'
import type { menus } from '../words/words.ts'

/** The five tools every workspace shares, in the order the toolbar draws them. */
export const TOOLS = ['pick', 'place', 'paint', 'erase', 'join'] as const
export type Tool = (typeof TOOLS)[number]

/** A row of the words in `words/menus.ts`. */
export type MenuKey = keyof (typeof menus)['en']

export interface Workspace {
  readonly id: 'world'
  readonly parts: readonly { readonly id: string; readonly words: MenuKey; readonly about: MenuKey }[]
  /** The tools that have a job on this page; one left out is not drawn. */
  readonly tools: readonly Tool[]
}

export interface Editor {
  readonly id: 'world' | 'characters' | 'feel' | 'sound' | 'story' | 'screens'
  readonly icon: IconName
  /** False: drawn as it will be, and a tap says in plain words that it is not in this version yet. */
  readonly built: boolean
  readonly name: MenuKey
  readonly about: MenuKey
  /** What a tap on a row that is not built says. */
  readonly note: MenuKey | undefined
}

/** The six editors, in the order the editor menu draws them. */
export const EDITORS: readonly Editor[] = [
  {
    id: 'world',
    icon: 'map-trifold',
    built: true,
    name: 'editorWorld',
    about: 'editorWorldAbout',
    note: undefined,
  },
  {
    id: 'characters',
    icon: 'person',
    built: false,
    name: 'editorCharacters',
    about: 'editorCharactersAbout',
    note: 'noteCharacters',
  },
  {
    id: 'feel',
    icon: 'sliders-horizontal',
    built: false,
    name: 'editorFeel',
    about: 'editorFeelAbout',
    note: 'noteFeel',
  },
  {
    id: 'sound',
    icon: 'music-notes',
    built: false,
    name: 'editorSound',
    about: 'editorSoundAbout',
    note: 'noteSound',
  },
  {
    id: 'story',
    icon: 'book-open',
    built: false,
    name: 'editorStory',
    about: 'editorStoryAbout',
    note: 'noteStory',
  },
  {
    id: 'screens',
    icon: 'layout',
    built: false,
    name: 'editorScreens',
    about: 'editorScreensAbout',
    note: 'noteScreens',
  },
]
