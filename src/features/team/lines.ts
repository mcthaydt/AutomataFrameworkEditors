// A line of what changed, said in a person's words: what was done to what, and which level it was in.
import type { ChangeLine } from '../game/game.ts'
import { nameOf, type Row, type Words } from '../words/words.ts'

const text = (row: Row, ...parts: (string | number)[]): string =>
  typeof row === 'function' ? row(...parts) : row

export interface SaidLine {
  readonly words: string
  /** The level it was in; undefined when the line is about a level as a whole. */
  readonly level: string | undefined
}

/** One line in `words`: "Moved Crate 1", under "Level 1". */
export function sayLine(words: Words, line: ChangeLine): SaidLine {
  const w = words.kept
  const level = nameOf(line.level)
  switch (line.kind) {
    case 'moved':
      return { words: text(w.lineMoved, nameOf(line.thing)), level }
    case 'added':
      return { words: text(w.lineAdded, nameOf(line.thing)), level }
    case 'deleted':
      return { words: text(w.lineDeleted, nameOf(line.thing)), level }
    case 'renamed':
      return { words: text(w.lineRenamed, nameOf(line.thing)), level }
    case 'settings':
      return { words: text(w.lineSettings, nameOf(line.thing)), level }
    case 'order':
      return { words: text(w.lineOrder, nameOf(line.thing)), level }
    case 'ground':
      return { words: text(w.lineGround), level }
    case 'start':
      return { words: text(w.lineStart), level }
    case 'joined':
      return { words: text(w.lineJoined), level }
    case 'look':
      return { words: text(w.lineLook), level }
    case 'level-new':
      return { words: text(w.lineLevelNew, level), level: undefined }
    case 'level-deleted':
      return { words: text(w.lineLevelDeleted, level), level: undefined }
    case 'level-moved':
      return { words: text(w.lineLevelMoved, level), level: undefined }
    case 'level-renamed':
      return { words: text(w.lineLevelRenamed, level), level: undefined }
  }
}
