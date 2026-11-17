// The edges of a level that touch another level and are open there, drawn inside the level as the map draws them: a bar
// along the stretch. Plain data and arithmetic; which edges they are comes from the map (`map/edges.ts`).
import { type Level, levelSize } from '@automataframework/framework/headless'
import type { Rect } from './marks.ts'
import { type Camera, type Screen, toScreen } from './view.ts'

export interface Edge {
  readonly side: 'left' | 'right' | 'top' | 'bottom'
  /** The stretch along that side, in this level's tiles (`to` not included). */
  readonly from: number
  readonly to: number
  /** The level across. */
  readonly other: string
}

/** The stretch on the stage, as a box with no thickness across the side. */
export function edgeBar(edge: Edge, level: Level, camera: Camera, screen: Screen): Rect {
  const size = levelSize(level)
  const across = edge.side === 'left' ? 0 : edge.side === 'right' ? size.w : edge.side === 'top' ? 0 : size.h
  const upright = edge.side === 'left' || edge.side === 'right'
  const start = toScreen(camera, screen, upright ? { x: across, y: edge.from } : { x: edge.from, y: across })
  const length = (edge.to - edge.from) * camera.scale
  return upright ? { x: start.x, y: start.y, w: 0, h: length } : { x: start.x, y: start.y, w: length, h: 0 }
}
