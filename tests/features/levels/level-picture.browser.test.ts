// The level picture in each real browser: the framework draws the game's own art, and a game with no pictures is boxes.
// A pixel says what a person sees at a place, so these read the canvas, not the page around it.
import { loadArt, needsPictures } from '@automataframework/framework'
import { type GameContent, type Level, loadGame } from '@automataframework/framework/headless'
import { afterEach, expect, test, vi } from 'vitest'
import { type LevelPicture, openLevelPicture } from '#src/features/levels/level-picture.ts'
import { fixturePictures } from '../../fixtures/game/pictures.ts'
import { fixtureFiles, readFrom } from '../../fixtures/game/read.ts'
import { plainFiles } from '../../fixtures/plain-game/read.ts'

const LEVEL = 'level-1'
/** The hero character's box colour: what a game with no pictures draws at the start point. */
const HERO_BOX = '#e4572e'
const CRATE_BOX = '#c9a227'
/** The hero figure's own paints (its figure file), which a box never has. */
const HERO_PAINTS = ['#f37f94', '#fdd4bd']
const SKY = '#9fd3f0'

let mount: HTMLDivElement | undefined
let picture: LevelPicture | undefined
afterEach(() => {
  picture?.destroy()
  picture = undefined
  mount?.remove()
  mount = undefined
})

async function contentOf(files: Readonly<Record<string, string>>): Promise<GameContent> {
  const loaded = await loadGame(readFrom(files))
  if (!loaded.ok) throw new Error('the game did not load')
  return loaded.value
}

/** A picture of a game's first level in an 800 by 450 box (16 by 9 tiles at 50 pixels), once the first draw is done. */
async function open(files: Readonly<Record<string, string>>, withArt: boolean): Promise<{ level: Level }> {
  const content = await contentOf(files)
  const level = content.levels[LEVEL]
  if (level === undefined) throw new Error('no level-1')
  const pictures = withArt ? await fixturePictures() : {}
  const art = needsPictures(content, LEVEL)
    ? await loadArt({
        content,
        level: LEVEL,
        readPicture: async (path) =>
          new Blob([(pictures[path] ?? new Uint8Array()).slice()], { type: 'image/png' }),
      })
    : undefined
  mount = document.createElement('div')
  mount.style.cssText = 'position:fixed;left:0;top:0;width:800px;height:450px'
  document.body.append(mount)
  picture = await openLevelPicture({ mount, content, level, art })
  await vi.waitFor(() => expect(picture?.fit().scale).toBeGreaterThan(0))
  return { level }
}

/** The colour of the canvas at a place in tiles, as `#rrggbb`: what a person sees there. */
function colourAt(tile: { x: number; y: number }): string {
  const canvas = picture?.canvas
  if (canvas === undefined) throw new Error('no picture')
  const fit = picture?.fit()
  if (fit === undefined) throw new Error('no fit')
  const rect = canvas.getBoundingClientRect()
  const ratio = canvas.width / rect.width
  const copy = document.createElement('canvas')
  copy.width = canvas.width
  copy.height = canvas.height
  const context = copy.getContext('2d')
  if (context === null) throw new Error('no 2D canvas')
  context.drawImage(canvas, 0, 0)
  const [r = 0, g = 0, b = 0] = context.getImageData(
    Math.round((fit.left + tile.x * fit.scale) * ratio),
    Math.round((fit.top + tile.y * fit.scale) * ratio),
    1,
    1,
  ).data
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

/** Every colour found over a box of the level, sampled a quarter tile apart. */
function coloursIn(box: { x: number; y: number; w: number; h: number }): Set<string> {
  const found = new Set<string>()
  for (let dy = 0; dy <= box.h; dy += 0.125)
    for (let dx = 0; dx <= box.w; dx += 0.125) found.add(colourAt({ x: box.x + dx, y: box.y + dy }))
  return found
}

const crateAt = (level: Level, x: number): Level => ({
  ...level,
  things: level.things.map((t) => (t.id === 'crate-1' ? { ...t, x } : t)),
})

test('the game with art shows the hero’s picture at the start point, not the hero’s box', async () => {
  await open(fixtureFiles, true)
  // The hero is 0.8 by 1 tile, its middle on the start point (2.5, 7.5).
  const seen = await vi.waitFor(() => {
    const colours = coloursIn({ x: 2.1, y: 7, w: 0.8, h: 1 })
    expect(HERO_PAINTS.some((paint) => colours.has(paint))).toBe(true)
    return colours
  })
  expect(seen.has(HERO_BOX)).toBe(false)
})

test('a game with no pictures draws boxes: the crate in its colour, the hero in its own', async () => {
  await open(plainFiles, false)
  await vi.waitFor(() => expect(colourAt({ x: 6.5, y: 7.5 })).toBe(CRATE_BOX))
  expect(colourAt({ x: 2.5, y: 7.5 })).toBe(HERO_BOX)
  expect(colourAt({ x: 8.5, y: 7.5 })).toBe(SKY)
})

test('show draws the moved level: the crate is at its new place and gone from the old', async () => {
  const { level } = await open(plainFiles, false)
  await vi.waitFor(() => expect(colourAt({ x: 6.5, y: 7.5 })).toBe(CRATE_BOX))
  picture?.show(crateAt(level, 8.5))
  await vi.waitFor(() => expect(colourAt({ x: 8.5, y: 7.5 })).toBe(CRATE_BOX))
  expect(colourAt({ x: 6.5, y: 7.5 })).toBe(SKY)
})

test('with art, show moves the crate’s picture: the pixel at its middle follows it', async () => {
  const { level } = await open(fixtureFiles, true)
  await vi.waitFor(() => expect(colourAt({ x: 6.5, y: 7.5 })).not.toBe(SKY))
  const middle = colourAt({ x: 6.5, y: 7.5 })
  expect(middle).not.toBe(CRATE_BOX)
  picture?.show(crateAt(level, 8.5))
  await vi.waitFor(() => expect(colourAt({ x: 8.5, y: 7.5 })).toBe(middle))
  expect(colourAt({ x: 6.5, y: 7.5 })).not.toBe(middle)
})

test('the floor is drawn from the tileset’s picture: more than one colour across one floor tile', async () => {
  await open(fixtureFiles, true)
  await vi.waitFor(() => expect(colourAt({ x: 6.5, y: 8.5 })).not.toBe(SKY))
  expect(coloursIn({ x: 4, y: 8, w: 1, h: 1 }).size).toBeGreaterThan(1)
})

test('destroy twice is safe', async () => {
  await open(plainFiles, false)
  picture?.destroy()
  expect(() => picture?.destroy()).not.toThrow()
})
