// What a kind of ground is called on screen: the tileset's own word for it, or Solid and Empty for a level without one.
import { type Lang, nameOf, wordsIn } from '../words/words.ts'
import type { Kind } from './ground.ts'
import { tintCss } from './tints.ts'

export function kindName(kind: Kind, lang: Lang): string {
  const say = wordsIn(lang).ground
  const row = kind.id === 'solid' ? say.kindSolid : kind.id === 'empty' ? say.kindEmpty : undefined
  if (row === undefined) return nameOf(kind.id)
  return typeof row === 'function' ? row() : row
}

/** The colour "Show what it is" tints a kind with, or undefined for the empty kind a level without a tileset has. */
export function kindTint(kinds: readonly Kind[], kind: Kind): string | undefined {
  const index = kinds.indexOf(kind)
  return index < 0 || kind.id === 'empty' ? undefined : tintCss(index)
}
