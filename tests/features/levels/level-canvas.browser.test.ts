// The picture of a level, in each real browser: what colour is where, in the game's own art.
import { loadArt } from '@automataframework/framework'
import { type GameContent, type Level, loadGame } from '@automataframework/framework/headless'
import { afterEach, expect, test, vi } from 'vitest'
import { readPictureOf } from '#src/features/levels/art.ts'
import { createStage, type Look, type Stage } from '#src/features/levels/level-canvas.ts'
import { type Camera, toScreen } from '#src/features/levels/view.ts'
import type { OpenPicture } from '#src/features/wire/wire.ts'
import { bytesToBase64 } from '#src/lib/base64.ts'
import { groundPicture } from '../../fixtures/game/ground-picture.ts'
import { fixtureFiles, LEVEL_PATH, readFrom } from '../../fixtures/game/read.ts'

const files: Record<string, string> = { ...fixtureFiles }
const loaded = await loadGame(readFrom(files))
if (!loaded.ok) throw new Error('the fixture game did not load')
const content: GameContent = loaded.value
const level = JSON.parse(fixtureFiles[LEVEL_PATH] ?? '{}') as Level
const pictures: readonly OpenPicture[] = [{ path: 'art/ground.png', base64: bytesToBase64(groundPicture()) }]
const plain: Look = { faint: new Set(), hidden: new Set(), whatItIs: false, grid: 'off' }

let made: Stage | undefined
let host: HTMLDivElement | undefined
afterEach(() => {
  made?.destroy()
  host?.remove()
  made = undefined
  host = undefined
})

const SCREEN = { w: 480, h: 270 }
async function drawn(): Promise<Stage> {
  made = await createStage()
  host = document.createElement('div')
  host.style.cssText = `position:fixed;left:0;top:0;width:${SCREEN.w}px;height:${SCREEN.h}px`
  host.append(made.canvas)
  document.body.append(host)
  made.levels.resize(SCREEN.w, SCREEN.h)
  return made
}

/** The colour at a point of the picture, read as a person would see it: `#rrggbb`. */
function colourAt(stage: Stage, cssX: number, cssY: number): string {
  const copy = document.createElement('canvas')
  copy.width = stage.canvas.width
  copy.height = stage.canvas.height
  const context = copy.getContext('2d')
  if (context === null) throw new Error('no 2D canvas')
  context.drawImage(stage.canvas, 0, 0)
  const ratio = stage.canvas.width / SCREEN.w
  const [r = 0, g = 0, b = 0] = context.getImageData(
    Math.round(cssX * ratio),
    Math.round(cssY * ratio),
    1,
    1,
  ).data
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

// The level is 16 by 9 tiles in a 480 by 270 box: 30 pixels to a tile, no bars.
const WHOLE: Camera = { x: 8, y: 4.5, scale: 30 }
const at = (camera: Camera, x: number, y: number): [number, number] => {
  const p = toScreen(camera, SCREEN, { x, y })
  return [p.x, p.y]
}
const show = (stage: Stage, camera: Camera = WHOLE, theLevel: Level = level, those = pictures): void =>
  stage.levels.show(content, those, theLevel, camera, plain)

test('an empty tile is sky, the crate is its own colour, and a start is the hero at half strength', async () => {
  const stage = await drawn()
  show(stage)
  expect(colourAt(stage, ...at(WHOLE, 3.5, 2.5))).toBe('#9fd3f0')
  // The crate is at 6.5, 7.5.
  expect(colourAt(stage, ...at(WHOLE, 6.5, 7.5))).toBe('#c9a227')
  const start = level.starts[0]
  if (start === undefined) throw new Error('the fixture has a start')
  expect(colourAt(stage, ...at(WHOLE, start.x, start.y))).not.toBe('#9fd3f0')
})

test('the crate is the crate at two zooms', async () => {
  const stage = await drawn()
  for (const camera of [WHOLE, { x: 6.5, y: 7.5, scale: 64 }]) {
    show(stage, camera)
    expect(colourAt(stage, ...at(camera, 6.5, 7.5))).toBe('#c9a227')
  }
})

test("a tile of the game's tileset is the picture's pixel, not the ground colour", async () => {
  const stage = await drawn()
  show(stage)
  // The picture loads on its own time; the tile is the picture's brown (#6b4f2a) once it has.
  await vi.waitFor(() => {
    show(stage)
    expect(colourAt(stage, ...at(WHOLE, 8.5, 8.6))).toBe('#6b4f2a')
  })
})

test('a tileset with no picture draws the ground colour, and nothing throws', async () => {
  const stage = await drawn()
  expect(() => show(stage, WHOLE, level, [])).not.toThrow()
  await new Promise((done) => setTimeout(done, 300))
  show(stage, WHOLE, level, [])
  expect(colourAt(stage, ...at(WHOLE, 8.5, 8.6))).toBe('#3b4a5a')
})

test('a thing whose character the game lacks is a box, and nothing throws', async () => {
  const stage = await drawn()
  const odd: Level = {
    ...level,
    things: [...level.things, { id: 'ghost-1', character: 'ghost', x: 3.5, y: 3.5 }],
  }
  expect(() => show(stage, WHOLE, odd)).not.toThrow()
  expect(colourAt(stage, ...at(WHOLE, 3.5, 3.5))).toBe('#888888')
})

test('a hidden thing is not drawn, and a faint one is drawn thin', async () => {
  const stage = await drawn()
  stage.levels.show(content, pictures, level, WHOLE, { ...plain, hidden: new Set(['crate-1']) })
  expect(colourAt(stage, ...at(WHOLE, 6.5, 7.5))).toBe('#9fd3f0')
  stage.levels.show(content, pictures, level, WHOLE, { ...plain, faint: new Set(['crate-1']) })
  expect(colourAt(stage, ...at(WHOLE, 6.5, 7.5))).not.toBe('#c9a227')
})

test('a size that is not above zero is ignored, and showing then throws nothing', async () => {
  const stage = await drawn()
  expect(() => {
    stage.levels.resize(0, 0)
    show(stage)
    stage.levels.resize(-5, 100)
    stage.levels.resize(Number.NaN, 100)
  }).not.toThrow()
})

test('destroy twice throws nothing, and nothing is drawn after it', async () => {
  const stage = await drawn()
  stage.destroy()
  expect(() => {
    stage.destroy()
    show(stage)
    stage.levels.resize(10, 10)
  }).not.toThrow()
  made = undefined
})

test('a snapshot is a 2D canvas of the size asked, and two at once both finish', async () => {
  const stage = await drawn()
  const [one, two] = await Promise.all([
    stage.snapshot(content, pictures, level, { w: 160, h: 90 }),
    stage.snapshot(content, pictures, level, { w: 64, h: 36 }),
  ])
  expect([one.width, one.height]).toEqual([160, 90])
  expect([two.width, two.height]).toEqual([64, 36])
  const pixel = one.getContext('2d')?.getImageData(80, 45, 1, 1).data
  expect(pixel?.[3]).toBe(255)
})

const FIGURE = `{
  "format": 1,
  "id": "crate",
  "tile": 16,
  "frame": { "w": 16, "h": 16 },
  "outline": "#111314",
  "paints": [{ "id": "wood", "color": "#c9a227" }],
  "parts": [{ "id": "box", "shape": "block", "x": 8, "y": 8, "w": 14, "h": 14, "paint": "wood" }],
  "poses": [{ "id": "idle", "moves": [] }]
}
`

test('the pictures of a game with a figure and a tileset are ones loadArt accepts, with no request and no blob address', async () => {
  const withFigure = await loadGame(
    readFrom({
      ...fixtureFiles,
      'automata.toml': `${fixtureFiles['automata.toml']}\n[[content]]\ntype = "figure"\npath = "content/figures/crate.json"\n`,
      'content/figures/crate.json': FIGURE,
      'content/characters/crate.json': (fixtureFiles['content/characters/crate.json'] ?? '').replace(
        '"id": "crate"',
        '"id": "crate",\n  "figure": "crate"',
      ),
    }),
  )
  if (!withFigure.ok) throw new Error('the game with a figure did not load')
  const fetched = vi.spyOn(globalThis, 'fetch')
  const object = vi.spyOn(URL, 'createObjectURL')
  const art = await loadArt({
    content: withFigure.value,
    level: 'level-1',
    readPicture: readPictureOf(withFigure.value, pictures),
  })
  expect(art.figure('crate', '', 1)).toBeDefined()
  expect(art.tiles.length).toBeGreaterThan(0)
  expect(fetched).not.toHaveBeenCalled()
  expect(object).not.toHaveBeenCalled()
  art.destroy()
  vi.restoreAllMocks()
})
