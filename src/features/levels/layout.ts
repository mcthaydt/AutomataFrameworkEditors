// How the level screen is laid out for the window it is in: its shape, and the room kept clear of the level for the
// floating parts. Plain numbers and functions; nothing here touches a page.
import type { Room, Size } from './place.ts'

/** What the frame looks like: `wide` (an iPad sideways, a desktop), `mid` (an iPad upright, a phone sideways), `narrow` (a phone upright). */
export type Shape = 'wide' | 'mid' | 'narrow'

/** The shape of the frame's own box, whatever the device is (ruling 1). */
export function shapeOf(box: Size): Shape {
  if (box.w >= 1024 && box.h >= 600) return 'wide'
  if (box.w < 600) return 'narrow'
  return 'mid'
}

/**
 * The least room kept clear on each side for the floating parts (ruling 2, as the zoom amendment changes it): on
 * `mid` the zoom buttons' column on the right, on `narrow` the row of the switch and the block above the zoom and
 * undo row (the Owner's answer A: a phone held upright does not scroll).
 */
export function roomFor(shape: Shape): Room {
  switch (shape) {
    case 'wide':
      return { top: 80, right: 320, bottom: 88, left: 96 }
    case 'mid':
      return { top: 72, right: 92, bottom: 88, left: 16 }
    case 'narrow':
      return { top: 64, right: 8, bottom: 232, left: 8 }
  }
}

/** The gap kept between a measured part and the level. */
const GAP = 16

/**
 * The room once the parts have been measured: on each side the larger of the least room and the measured part plus
 * the gap, so a long word in another language never covers the level (audit I1). A side not measured keeps the least.
 */
export function roomWith(least: Room, measured: Partial<Room>): Room {
  const side = (name: keyof Room): number => Math.max(least[name], (measured[name] ?? -GAP) + GAP)
  return { top: side('top'), right: side('right'), bottom: side('bottom'), left: side('left') }
}
