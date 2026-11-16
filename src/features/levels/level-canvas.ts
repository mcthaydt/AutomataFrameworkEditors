// The page's one Pixi Application, and the level drawn on it in the game's own art: the backdrop, each tile as its
// picture of the tileset (or the level's ground colour when the tileset has none), each thing as its figure's first pose
// (or its character's coloured box), and a start point as the hero at half strength. It only draws; it knows nothing of
// fingers, and the marks a person touches are an SVG layer above it. The fit is a `Camera` (see `view.ts`), so a level
// sits here where the view says. This is one of the two files that import Pixi, and the no-eval entry comes first
// because the page's security policy forbids `eval`.
import 'pixi.js/unsafe-eval'
import { type Art, loadArt, needsPictures } from '@automataframework/framework'
import {
  type GameContent,
  groundOf,
  type Level,
  levelSize,
  skyOf,
  type TilesetFile,
  tileRuns,
} from '@automataframework/framework/headless'
import { Application, Container, Graphics, loadTextures, RenderTexture, Sprite } from 'pixi.js'
import type { OpenPicture } from '../wire/wire.ts'
import { readPictureOf } from './art.ts'
import { type Camera, toScreen } from './view.ts'

/** The framework's dark edge round every box. */
const EDGE = 0x1b1b24
const FALLBACK_COLOR = '#888888'
/** What each kind of tile is tinted when the person asks what the tiles are: the first kind, the second, and so on round. */
const KIND_TINTS = [0xd9534f, 0x2f9e8f, 0xe0a030, 0x7a5cc8, 0x4a90d9, 0xc0568f] as const

/** How a level is looked at: what is faint or hidden, whether the tiles are tinted by kind, and the grid. */
export interface Look {
  readonly faint: ReadonlySet<string>
  readonly hidden: ReadonlySet<string>
  readonly whatItIs: boolean
  readonly grid: 'off' | 'tiles' | 'finer'
}
const PLAIN: Look = { faint: new Set(), hidden: new Set(), whatItIs: false, grid: 'off' }

export interface LevelCanvas {
  show(content: GameContent, pictures: readonly OpenPicture[], level: Level, camera: Camera, look: Look): void
  /** In CSS pixels. A size not above zero is ignored; the last picture is redrawn. */
  resize(w: number, h: number): void
  /** The same drawing as a container in the same Application, in tiles, for the map: `map-canvas.ts` places it and keeps it. */
  picture(content: GameContent, pictures: readonly OpenPicture[], level: Level): unknown
}

export interface Stage {
  /** The one canvas; the level view and the map draw into it, one at a time. */
  readonly canvas: HTMLCanvasElement
  readonly levels: LevelCanvas
  /** One level, small, as a copy on a 2D canvas: what the games list shows. Calls wait their turn. */
  snapshot(
    content: GameContent,
    pictures: readonly OpenPicture[],
    level: Level,
    size: { w: number; h: number },
  ): Promise<HTMLCanvasElement>
  /** Safe to call twice. */
  destroy(): void
}

/** The tileset a level draws with, when its game has it. */
const tilesetOf = (content: GameContent, level: Level): TilesetFile | undefined =>
  level.tileset === undefined ? undefined : content.tilesets?.[level.tileset]

/** The same content, with this level in the place of the file's, so `loadArt` cuts the tiles the person sees. */
const withLevel = (content: GameContent, level: Level): GameContent => ({
  ...content,
  levels: { ...content.levels, [level.id]: level },
})

async function loadFor(
  content: GameContent,
  pictures: readonly OpenPicture[],
  level: Level,
): Promise<Art | undefined> {
  const here = withLevel(content, level)
  if (!needsPictures(here, level.id)) return undefined
  return loadArt({ content: here, level: level.id, readPicture: readPictureOf(content, pictures) })
}

/** What to draw a level with: the art that is loaded (or none, and the colours show), and where. */
function drawLevel(
  into: Container,
  content: GameContent,
  art: Art | undefined,
  level: Level,
  look: Look,
  scale: number,
): void {
  const size = levelSize(level)
  const edge = 1 / scale
  const characters = content.characters
  const tileset = tilesetOf(content, level)

  const backdrop = art?.backdrop
  if (backdrop !== undefined && backdrop.width > 0) {
    for (const layer of backdrop.layers) {
      for (let x = 0; x < size.w; x += backdrop.width) {
        const strip = new Sprite({ texture: layer.texture })
        strip.position.set(x, size.h - layer.height)
        strip.width = backdrop.width
        strip.height = layer.height
        into.addChild(strip)
      }
    }
    for (const prop of backdrop.props) {
      for (let x = 0; x < size.w; x += backdrop.width) {
        const sprite = new Sprite({ texture: prop.texture })
        sprite.anchor.set(0.5, 1)
        sprite.position.set(x + prop.x, size.h - prop.up)
        sprite.width = prop.w
        sprite.height = prop.h
        into.addChild(sprite)
      }
    }
  }

  // The ground: the tileset's pictures, or the level's ground colour wherever a tile is solid.
  if (art !== undefined && art.tiles.length > 0) {
    for (const tile of art.tiles) {
      const square = new Sprite({ texture: tile.texture })
      square.position.set(tile.col, tile.row)
      square.width = 1
      square.height = 1
      into.addChild(square)
    }
  } else {
    const solid =
      tileset === undefined ? undefined : new Set(tileset.tiles.filter((k) => k.solid).map((k) => k.letter))
    const ground = new Graphics()
    for (const run of tileRuns(
      level.tiles,
      solid === undefined ? undefined : (letter) => solid.has(letter),
    )) {
      ground.rect(run.col, run.row, run.length, 1)
    }
    ground.fill(groundOf(level))
    into.addChild(ground)
  }

  if (look.whatItIs) {
    const kinds = tileset?.tiles.map((kind) => kind.letter) ?? ['#']
    const tint = new Graphics()
    kinds.forEach((letter, index) => {
      for (const run of tileRuns(level.tiles, (found) => found === letter))
        tint.rect(run.col, run.row, run.length, 1)
      tint.fill({ color: KIND_TINTS[index % KIND_TINTS.length] ?? 0xffffff, alpha: 0.45 })
    })
    into.addChild(tint)
  }

  if (look.grid !== 'off') {
    const step = look.grid === 'finer' ? 0.5 : 1
    const lines = new Graphics()
    for (let x = 0; x <= size.w; x += step) lines.moveTo(x, 0).lineTo(x, size.h)
    for (let y = 0; y <= size.h; y += step) lines.moveTo(0, y).lineTo(size.w, y)
    lines.stroke({ width: edge, color: 0xffffff, alpha: 0.25 })
    into.addChild(lines)
  }

  /** One thing or start: its figure's first pose standing on the bottom of its box, or its coloured box. */
  const drawThing = (
    character: string,
    at: { x: number; y: number },
    player: number,
    alpha: number,
  ): void => {
    const c = characters[character]
    const w = c?.size.w ?? 1
    const h = c?.size.h ?? 1
    const shown = art?.figure(character, '', player)
    if (shown !== undefined) {
      const sprite = new Sprite({ texture: shown.texture })
      sprite.anchor.set(0.5, 1)
      sprite.position.set(at.x, at.y + h / 2)
      sprite.width = shown.w
      sprite.height = shown.h
      sprite.alpha = alpha
      into.addChild(sprite)
      return
    }
    const box = new Graphics()
    box
      .rect(-w / 2, -h / 2, w, h)
      .fill({ color: c?.color ?? FALLBACK_COLOR, alpha })
      .stroke({ width: edge, color: EDGE, alpha, alignment: 1 })
    box.position.set(at.x, at.y)
    into.addChild(box)
  }
  for (const thing of level.things) {
    if (look.hidden.has(thing.id)) continue
    drawThing(thing.character, thing, 1, look.faint.has(thing.id) ? 0.35 : 1)
  }
  for (const start of level.starts) drawThing(content.project.hero, start, start.player, 0.5)
}

export async function createStage(): Promise<Stage> {
  // Workers are only a guess about the device here, and the page's policy has no room for them.
  if (loadTextures.config !== undefined) loadTextures.config.preferWorkers = false
  const app = new Application()
  await app.init({
    width: 1,
    height: 1,
    background: 0x9fd3f0,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: false,
    autoStart: false,
    sharedTicker: false,
    preference: 'webgl',
    // So the picture can be read back after it is shown: a test, or a person's screenshot, sees what was drawn and not
    // a cleared buffer.
    preserveDrawingBuffer: true,
  })
  const { canvas } = app
  canvas.style.cssText = 'display:block;width:100%;height:100%'
  const world = new Container()
  app.stage.addChild(world)

  let gone = false
  let box = { w: 0, h: 0 }
  let last:
    | { content: GameContent; pictures: readonly OpenPicture[]; level: Level; camera: Camera; look: Look }
    | undefined

  // The art each level was last loaded with. A load that is on its way is not started twice, and the art that was there
  // before stays on screen until the new one arrives, so a change of tiles never flashes the colours.
  interface Held {
    readonly key: string
    readonly content: GameContent
    readonly pictures: readonly OpenPicture[]
    readonly art: Art | undefined
  }
  const held = new Map<string, Held>()
  const loading = new Map<string, string>()
  const keyOf = (level: Level): string =>
    `${level.tileset ?? ''}|${level.backdrop ?? ''}|${level.tiles.join('/')}`

  function artFor(content: GameContent, pictures: readonly OpenPicture[], level: Level): Art | undefined {
    const now = held.get(level.id)
    const key = keyOf(level)
    const fresh = now !== undefined && now.key === key && now.content === content && now.pictures === pictures
    if (!fresh && loading.get(level.id) !== key) {
      loading.set(level.id, key)
      void loadFor(content, pictures, level)
        .catch(() => undefined)
        .then((art) => {
          if (loading.get(level.id) === key) loading.delete(level.id)
          if (gone) return art?.destroy()
          held.get(level.id)?.art?.destroy()
          held.set(level.id, { key, content, pictures, art })
          redraw()
        })
    }
    return now?.art
  }

  function redraw(): void {
    if (gone || last === undefined || box.w <= 0 || box.h <= 0) return
    const { content, pictures, level, camera, look } = last
    app.renderer.background.color = skyOf(level)
    const at = toScreen(camera, box, { x: 0, y: 0 })
    world.scale.set(camera.scale)
    world.position.set(at.x, at.y)
    for (const child of world.removeChildren()) child.destroy({ children: true })
    drawLevel(world, content, artFor(content, pictures, level), level, look, camera.scale)
    app.render()
  }

  const levels: LevelCanvas = {
    show(content, pictures, level, camera, look) {
      last = { content, pictures, level, camera, look }
      redraw()
    },
    resize(w, h) {
      if (gone || !(w > 0) || !(h > 0)) return
      box = { w, h }
      app.renderer.resize(w, h)
      redraw()
    },
    picture(content, pictures, level) {
      const container = new Container()
      drawLevel(container, content, artFor(content, pictures, level), level, PLAIN, 1)
      return container
    },
  }

  let turn: Promise<unknown> = Promise.resolve()
  async function snap(
    content: GameContent,
    pictures: readonly OpenPicture[],
    level: Level,
    size: { w: number; h: number },
  ): Promise<HTMLCanvasElement> {
    const width = Math.max(1, Math.round(size.w))
    const height = Math.max(1, Math.round(size.h))
    const art = await loadFor(content, pictures, level).catch(() => undefined)
    const container = new Container()
    const tiles = levelSize(level)
    const scale = Math.min(width / Math.max(1, tiles.w), height / Math.max(1, tiles.h))
    container.scale.set(scale)
    container.position.set((width - tiles.w * scale) / 2, (height - tiles.h * scale) / 2)
    drawLevel(container, content, art, level, PLAIN, scale)
    const target = RenderTexture.create({ width, height, resolution: 1 })
    try {
      app.renderer.render({ container, target, clearColor: skyOf(level) })
      const drawn = app.renderer.extract.canvas(target) as unknown as CanvasImageSource
      const copy = document.createElement('canvas')
      copy.width = width
      copy.height = height
      copy.getContext('2d')?.drawImage(drawn, 0, 0)
      return copy
    } finally {
      target.destroy(true)
      container.destroy({ children: true })
      art?.destroy()
    }
  }

  return {
    canvas,
    levels,
    snapshot(content, pictures, level, size) {
      const mine = turn.then(() => snap(content, pictures, level, size))
      turn = mine.catch(() => undefined)
      return mine
    },
    destroy() {
      if (gone) return
      gone = true
      for (const one of held.values()) one.art?.destroy()
      held.clear()
      app.destroy({ removeView: true }, { children: true })
    },
  }
}
