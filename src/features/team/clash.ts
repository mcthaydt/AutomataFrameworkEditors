// Two people changed one thing: what to say about it, and the two places to show. Pure.
import type { Level } from '@automataframework/framework/headless'
import type { Clash, Working } from '../game/game.ts'
import { nameOf, type Row, type Words } from '../words/words.ts'

const text = (row: Row, ...parts: (string | number)[]): string =>
  typeof row === 'function' ? row(...parts) : row

/** The sentence for one clash: what the person did, and that `by` did too. */
export function sayClash(words: Words, clash: Clash, by: string): string {
  const c = words.whose
  const level = nameOf(clash.level)
  switch (clash.what) {
    case 'thing': {
      const thing = nameOf(clash.thing)
      if (clash.mine === undefined) return text(c.clashMineGone, thing, by)
      if (clash.theirs === undefined) return text(c.clashTheirsGone, thing, by)
      const moved = clash.mine.x !== clash.theirs.x || clash.mine.y !== clash.theirs.y
      return text(moved ? c.clashMoved : c.clashChanged, thing, by)
    }
    case 'ground':
      return text(c.clashGround, level, by)
    case 'starts':
      return text(c.clashStart, level, by)
    case 'look':
      return text(c.clashLook, level, by)
    case 'place':
      return text(c.clashPlace, level, by)
    case 'level':
      return text(clash.gone === 'mine' ? c.clashLevelMineGone : c.clashLevelTheirsGone, level, by)
    case 'twin':
      return text(c.clashTwin, level, by)
  }
}

export interface Sides {
  readonly mine: Level | undefined
  readonly theirs: Level | undefined
  /** The thing to ring in both pictures. */
  readonly marked: readonly string[]
}

/** The level as each side has it, for the two pictures. */
export function sidesOf(clash: Clash, mine: Working, theirs: Working): Sides {
  return {
    mine: mine.levels[clash.level],
    theirs: theirs.levels[clash.level],
    marked: clash.what === 'thing' ? [clash.thing] : [],
  }
}
