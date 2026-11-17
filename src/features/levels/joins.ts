// What a switch opens, as lines to draw: one for each thing a `thing` value links to, from the switch to what it opens.
// A value the character says is not drawn (`shown: 'none'`) has no line, and a link to something no longer in the level
// has none either (the check says so; the editor never rewrites it).
import { type Level, shownOf } from '@automataframework/framework/headless'
import type { Characters } from './edit.ts'
import type { Mark, Rect } from './marks.ts'
import type { Point } from './place.ts'

export interface JoinFact {
  readonly from: string
  readonly value: string
  readonly to: string
}

export function joinFacts(level: Level, characters: Characters): readonly JoinFact[] {
  const facts: JoinFact[] = []
  for (const thing of level.things) {
    for (const declaration of characters[thing.character]?.values ?? []) {
      if (declaration.type !== 'thing' || shownOf(declaration) !== 'arrow') continue
      const given = thing.values?.[declaration.id]
      const ids = typeof given === 'string' ? [given] : Array.isArray(given) ? given : []
      for (const to of ids) {
        if (typeof to === 'string' && level.things.some((t) => t.id === to)) {
          facts.push({ from: thing.id, value: declaration.id, to })
        }
      }
    }
  }
  return facts
}

/** The thing a switch would be drawn from: the first `thing` value its character declares. */
export function joinValueOf(characters: Characters, character: string): string | undefined {
  return characters[character]?.values?.find((v) => v.type === 'thing')?.id
}

/** One line as it is drawn: where it starts and ends on the stage, its curve, and the spot a finger can press. */
export interface LineShape {
  readonly key: string
  readonly fact: JoinFact
  readonly from: Point
  readonly to: Point
  readonly d: string
  readonly mid: Point
}

const centreOf = (r: Rect): Point => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 })

/** The curve from one point to another, bowed upward so a line never lies along the ground it joins. */
export function curve(from: Point, to: Point): { d: string; mid: Point } {
  const bow = Math.min(90, Math.hypot(to.x - from.x, to.y - from.y) / 2)
  const control = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - bow }
  return {
    d: `M ${from.x} ${from.y} Q ${control.x} ${control.y} ${to.x} ${to.y}`,
    mid: { x: from.x / 4 + control.x / 2 + to.x / 4, y: from.y / 4 + control.y / 2 + to.y / 4 },
  }
}

/** The lines whose two ends are both on the stage (a thing that is hidden has no mark, and so no line). */
export function lineShapes(facts: readonly JoinFact[], marks: readonly Mark[]): readonly LineShape[] {
  return facts.flatMap((fact): LineShape[] => {
    const a = marks.find((m) => m.id === fact.from)
    const b = marks.find((m) => m.id === fact.to)
    if (a === undefined || b === undefined) return []
    const from = centreOf(a.box)
    const to = centreOf(b.box)
    return [{ key: `${fact.from}/${fact.value}/${fact.to}`, fact, from, to, ...curve(from, to) }]
  })
}

/**
 * The thing a tip is over or near (within 16 points of its hit area) among `ids`, or none. When it is near two, the one
 * whose middle is closer.
 */
export function nearTip(tip: Point, marks: readonly Mark[], ids: readonly string[]): string | undefined {
  const NEAR = 16
  let best: { id: string; far: number } | undefined
  for (const mark of marks) {
    if (!ids.includes(mark.id)) continue
    const { hit } = mark
    if (
      tip.x < hit.x - NEAR ||
      tip.x > hit.x + hit.w + NEAR ||
      tip.y < hit.y - NEAR ||
      tip.y > hit.y + hit.h + NEAR
    )
      continue
    const middle = centreOf(mark.box)
    const far = Math.hypot(tip.x - middle.x, tip.y - middle.y)
    if (best === undefined || far < best.far) best = { id: mark.id, far }
  }
  return best?.id
}

const overlapArea = (a: Rect, b: Rect): number =>
  Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) *
  Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y))

/**
 * Where a hint card sits so it covers as little as it can of what a person is about to touch: the first of the four
 * corners of the stage that covers nothing, else the one that covers least.
 */
export function hintAt(
  card: { readonly w: number; readonly h: number },
  avoid: readonly Rect[],
  screen: { readonly w: number; readonly h: number },
  prefer: readonly Point[] = [],
): Point {
  const GAP = 8
  const spots: readonly Point[] = [
    ...prefer,
    { x: Math.max(GAP, (screen.w - card.w) / 2), y: GAP },
    { x: Math.max(GAP, (screen.w - card.w) / 2), y: Math.max(GAP, screen.h - card.h - GAP) },
    { x: GAP, y: GAP },
    { x: Math.max(GAP, screen.w - card.w - GAP), y: GAP },
  ]
  const covered = (spot: Point): number =>
    avoid.reduce((sum, one) => sum + overlapArea({ ...spot, ...card }, one), 0)
  return spots.reduce((best, spot) => (covered(spot) < covered(best) ? spot : best))
}
