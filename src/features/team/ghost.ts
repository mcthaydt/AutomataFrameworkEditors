// What a helper changed in the game while the person worked, as something to keep or undo: the game's side laid over what
// the person has, thing by thing, and the lines it would say. Pure: the page reads the game, this only compares.
import { formatDiagnostic, type Level, parseContent } from '@automataframework/framework/headless'
import { type ChangeLine, type Merged, merge, type Working } from '../game/game.ts'

export interface Ghost {
  readonly lines: readonly ChangeLine[]
  readonly merged: Merged
}

/** What changed in the game under the person since they opened it. Undefined when nothing did. */
export function ghostOf(base: Working, mine: Working, theirs: Working): Ghost | undefined {
  const merged = merge(base, mine, theirs)
  return merged.theirs.length === 0 ? undefined : { lines: merged.theirs, merged }
}

/**
 * A level file pasted back from a helper: the framework's own sentence when it is not a level, else the ghost of laying
 * it over the open level. A file that says what the level already says is a ghost of no lines.
 */
export function ghostOfPasted(
  text: string,
  _base: Working,
  mine: Working,
  level: string,
): Ghost | { readonly problem: string } {
  const parsed = parseContent('level', text, `${level}.json`)
  if (!parsed.ok) return { problem: parsed.diagnostics.map(formatDiagnostic).join('\n') }
  const pasted: Level = { ...parsed.value, id: level }
  const theirs: Working = { ...mine, levels: { ...mine.levels, [level]: pasted } }
  const merged = merge(mine, mine, theirs)
  return { lines: merged.theirs, merged }
}
