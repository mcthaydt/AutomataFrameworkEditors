// A level as something a person can keep: the text to paste to an agent or into the game's files, and a file of it.
// The bytes are the framework's own `writeContent`, so what is kept is exactly what Save would have written.
import { type Level, writeContent } from '@automataframework/framework/headless'
import { levelPath, type OpenGame } from './open.ts'

export interface LevelCopy {
  /** The last part of the level's path, e.g. `level-1.json`. */
  readonly name: string
  readonly text: string
}

/** The copy of `level`, or undefined for a level the project does not list. */
export function levelCopy(game: OpenGame, level: Level): LevelCopy | undefined {
  const path = levelPath(game, level.id)
  const name = path?.split('/').pop()
  if (name === undefined) return undefined
  return { name, text: writeContent('level', level as never) }
}

/** Hands the copy to the browser as a download: a Blob, a link, one click, and the Blob's address given back. */
export function keepCopy(doc: Document, copy: LevelCopy): void {
  const url = URL.createObjectURL(new Blob([copy.text], { type: 'application/json' }))
  const link = doc.createElement('a')
  link.href = url
  link.download = copy.name
  doc.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
