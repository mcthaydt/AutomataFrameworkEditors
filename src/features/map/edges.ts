// Which edges of a level touch another level and are open there: the joins of the map (`layoutWorld`, through `marksOf`),
// seen from one level, so the level's own screen draws the same bar the map does.
import type { GameContent } from '@automataframework/framework/headless'
import type { Working } from '../game/game.ts'
import type { Edge } from '../levels/levels.ts'
import { boxes, marksOf } from './arrange.ts'

export function edgesOf(working: Working, content: GameContent, level: string): readonly Edge[] {
  const all = boxes(working, Object.keys(working.levels))
  const mine = all.find((box) => box.level === level)
  if (mine === undefined) return []
  return marksOf(working, content).joins.flatMap((join): Edge[] => {
    if (join.a !== level && join.b !== level) return []
    const first = join.a === level
    const upright = join.along === 'y'
    const side = upright ? (first ? 'right' : 'left') : first ? 'bottom' : 'top'
    const origin = upright ? mine.y : mine.x
    return [{ side, from: join.from - origin, to: join.to - origin, other: first ? join.b : join.a }]
  })
}
