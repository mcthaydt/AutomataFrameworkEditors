// Where a tap on the playing level is, in the level's own tiles. The framework draws the whole place (or the one level)
// as large as fits the box, centred, so the tap is read back the way `fitWorld` puts it there.
import { fitWorld } from '@automataframework/framework'
import { type Arrive, levelAt, placeSize, type SimLevel } from '@automataframework/framework/headless'

/** The spot of `opened` that a tap at (x, y) pixels of a box `box` pixels big is on; undefined off the level or outside it. */
export function spotOf(
  box: { readonly w: number; readonly h: number },
  levels: readonly SimLevel[],
  opened: string,
  tap: { readonly x: number; readonly y: number },
): Arrive | undefined {
  const fit = fitWorld(box, placeSize(levels))
  if (fit.scale <= 0) return undefined
  const x = (tap.x - fit.left) / fit.scale
  const y = (tap.y - fit.top) / fit.scale
  if (levelAt(levels, x, y) !== opened) return undefined
  const at = levels.find((one) => one.level === opened)
  return at === undefined ? undefined : { x: x - at.x, y: y - at.y }
}

/** `m:ss` of a count of ticks. */
export function clock(ticks: number, hz: number): string {
  const seconds = Math.max(0, Math.floor(ticks / hz))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
