// The five editors the suite will have, and what to say about each. Only World is built; the other four open a card
// that says they are coming. Words are read when asked, so a change of language is seen the next time they are shown.
import type { IconName } from '../ui/ui.ts'
import { WORDS } from '../words/words.ts'

export type EditorId = 'world' | 'characters' | 'feel' | 'sound' | 'story'

/** In the order a person meets them. */
export const EDITORS: readonly EditorId[] = ['world', 'characters', 'feel', 'sound', 'story']

/** The editor the level screen is. */
export const CURRENT: EditorId = 'world'

export const EDITOR_ICON: Readonly<Record<EditorId, IconName>> = {
  world: 'world',
  characters: 'characters',
  feel: 'feel',
  sound: 'sound',
  story: 'story',
}

export function editorName(id: EditorId): string {
  switch (id) {
    case 'world':
      return WORDS.edWorld
    case 'characters':
      return WORDS.edCharacters
    case 'feel':
      return WORDS.edFeel
    case 'sound':
      return WORDS.edSound
    case 'story':
      return WORDS.edStory
  }
}

/** The sentence on the Coming soon card: what the editor will let a person do. */
export function editorSoon(id: EditorId): string {
  switch (id) {
    case 'world':
      return ''
    case 'characters':
      return WORDS.soonCharacters
    case 'feel':
      return WORDS.soonFeel
    case 'sound':
      return WORDS.soonSound
    case 'story':
      return WORDS.soonStory
  }
}
