// The map's pictures: each level drawn by the page's one Pixi Application (`Stage.levels.picture`, so the map and the
// level view never make two), placed on one sheet where the camera puts it. It keeps what it placed, so a level that is
// only being dragged moves without the sheet being built again. This is the second of the two files that import Pixi.
import type { GameContent, Level } from '@automataframework/framework/headless'
import type { Container } from 'pixi.js'
import { type Camera, type LevelStage, type Screen, toScreen } from '../levels/levels.ts'
import type { OpenPicture } from '../wire/wire.ts'
import type { Box } from './arrange.ts'

export interface MapSheet {
  readonly content: GameContent
  readonly pictures: readonly OpenPicture[]
  readonly levels: Readonly<Record<string, Level>>
  readonly boxes: readonly Box[]
  readonly camera: Camera
  readonly size: Screen
}

export interface MapCanvas {
  /** Builds the sheet, and again whenever the stage finds a level's art has arrived. */
  show(sheet: MapSheet): void
  /** Moves one level's picture to this pixel (its top left) without building anything anew. */
  lift(level: string, at: { readonly x: number; readonly y: number }): void
}

export function mapCanvas(stage: LevelStage): MapCanvas {
  const placed = new Map<string, Container>()
  return {
    show(sheet) {
      const { content, pictures, levels, boxes, camera, size } = sheet
      stage.levels.sheet(() => {
        placed.clear()
        return boxes.flatMap((box) => {
          const level = levels[box.level]
          if (level === undefined) return []
          const picture = stage.levels.picture(content, pictures, level, camera.scale) as Container
          const at = toScreen(camera, size, box)
          picture.scale.set(camera.scale)
          picture.position.set(at.x, at.y)
          placed.set(box.level, picture)
          return [picture]
        })
      })
    },
    lift(level, at) {
      placed.get(level)?.position.set(at.x, at.y)
      stage.levels.repaint()
    },
  }
}
