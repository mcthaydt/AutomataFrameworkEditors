// The picture of a level, drawn with Pixi: sky, solid tiles, each thing as its character's coloured box, the chosen
// one ringed in white, and each start point as the hero's box at half strength. It only draws; it knows nothing of
// fingers. The fit is the framework's own, so a level sits here exactly as it does in the game. This is the one file
// that imports Pixi, and the no-eval entry comes first because the page's security policy forbids `eval`.
import 'pixi.js/unsafe-eval'
import { fitWorld } from '@automataframework/framework'
import { type Level, levelSize, SKY_COLOR, TILE_COLOR, tileRuns } from '@automataframework/framework/headless'
import { Application, Container, Graphics, loadTextures } from 'pixi.js'
import type { Characters } from './edit.ts'

/** The framework's dark edge round every box. */
const EDGE = 0x1b1b24
const RING = 0xffffff
const FALLBACK_COLOR = '#888888'

export interface LevelCanvas {
  readonly canvas: HTMLCanvasElement
  /** Draws the level. `hero` names the character a start point shows. */
  show(level: Level, characters: Characters, ringed?: string | readonly string[], hero?: string): void
  /** In CSS pixels. A size not above zero is ignored; the last picture is redrawn. */
  resize(w: number, h: number): void
  /** Safe to call twice. */
  destroy(): void
}

export async function createLevelCanvas(): Promise<LevelCanvas> {
  // Workers are only a guess about the device here, and the page's policy has no room for them.
  if (loadTextures.config !== undefined) loadTextures.config.preferWorkers = false
  const app = new Application()
  await app.init({
    width: 1,
    height: 1,
    background: SKY_COLOR,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: false,
    autoStart: false,
    sharedTicker: false,
    preference: 'webgl',
  })
  const { canvas } = app
  canvas.style.cssText = 'display:block;width:100%;height:100%'
  const world = new Container()
  app.stage.addChild(world)

  let box = { w: 0, h: 0 }
  let last:
    | {
        level: Level
        characters: Characters
        selected: string | readonly string[] | undefined
        hero: string | undefined
      }
    | undefined
  let gone = false

  function redraw(): void {
    if (gone || last === undefined || box.w <= 0 || box.h <= 0) return
    const { level, characters, selected, hero } = last
    const ringed = typeof selected === 'string' ? [selected] : (selected ?? [])
    const fit = fitWorld(box, levelSize(level))
    world.scale.set(fit.scale)
    world.position.set(fit.left, fit.top)
    for (const child of world.removeChildren()) child.destroy()
    const edge = 1 / fit.scale

    const ground = new Graphics()
    for (const run of tileRuns(level.tiles)) ground.rect(run.col, run.row, run.length, 1)
    ground.fill(TILE_COLOR)
    world.addChild(ground)

    const drawBox = (
      id: string,
      at: { x: number; y: number },
      character: string,
      alpha: number,
      ring: boolean,
    ): void => {
      const c = characters[character]
      const g = new Graphics()
      g.rect(-(c?.size.w ?? 1) / 2, -(c?.size.h ?? 1) / 2, c?.size.w ?? 1, c?.size.h ?? 1)
        .fill({ color: c?.color ?? FALLBACK_COLOR, alpha })
        .stroke({ width: edge, color: EDGE, alpha, alignment: 1 })
      if (ring) {
        g.rect(-(c?.size.w ?? 1) / 2, -(c?.size.h ?? 1) / 2, c?.size.w ?? 1, c?.size.h ?? 1).stroke({
          width: 4 * edge,
          color: RING,
          alignment: 1,
        })
      }
      g.position.set(at.x, at.y)
      g.label = id
      world.addChild(g)
    }
    if (hero !== undefined) {
      for (const start of level.starts) drawBox(`start-${start.player}`, start, hero, 0.5, false)
    }
    for (const thing of level.things) drawBox(thing.id, thing, thing.character, 1, ringed.includes(thing.id))
    app.render()
  }

  return {
    canvas,
    show(level, characters, selected, hero) {
      last = { level, characters, selected, hero }
      redraw()
    },
    resize(w, h) {
      if (gone || !(w > 0) || !(h > 0)) return
      box = { w, h }
      app.renderer.resize(w, h)
      redraw()
    },
    destroy() {
      if (gone) return
      gone = true
      app.destroy({ removeView: true }, { children: true })
    },
  }
}
