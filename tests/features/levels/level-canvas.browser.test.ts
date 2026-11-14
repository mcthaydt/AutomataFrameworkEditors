// The picture of a level, in each real browser: what colour is where.
import type { Character, Level } from '@automataframework/framework/headless'
import { afterEach, expect, test } from 'vitest'
import { createLevelCanvas, type LevelCanvas } from '#src/features/levels/level-canvas.ts'
import { fixtureFiles, LEVEL_PATH } from '../../fixtures/game/read.ts'

const level = JSON.parse(fixtureFiles[LEVEL_PATH] ?? '{}') as Level
const characters: Record<string, Character> = {
  crate: JSON.parse(fixtureFiles['content/characters/crate.json'] ?? '{}'),
  hero: JSON.parse(fixtureFiles['content/characters/hero.json'] ?? '{}'),
}

let made: LevelCanvas | undefined
let host: HTMLDivElement | undefined
afterEach(() => {
  made?.destroy()
  host?.remove()
  made = undefined
  host = undefined
})

async function drawn(): Promise<LevelCanvas> {
  made = await createLevelCanvas()
  host = document.createElement('div')
  host.style.cssText = 'position:fixed;left:0;top:0;width:480px;height:270px'
  host.append(made.canvas)
  document.body.append(host)
  return made
}

/** The colour at a point of the picture, read as a person would see it: `#rrggbb`. */
function colourAt(picture: LevelCanvas, cssX: number, cssY: number): string {
  const copy = document.createElement('canvas')
  copy.width = picture.canvas.width
  copy.height = picture.canvas.height
  const context = copy.getContext('2d')
  if (context === null) throw new Error('no 2D canvas')
  context.drawImage(picture.canvas, 0, 0)
  const ratio = picture.canvas.width / 480
  const [r = 0, g = 0, b = 0] = context.getImageData(
    Math.round(cssX * ratio),
    Math.round(cssY * ratio),
    1,
    1,
  ).data
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

// The level is 16 by 9 tiles in a 480 by 270 box: 30 pixels to a tile, no bars.
const TILE = 30
const at = (col: number, row: number): [number, number] => [(col + 0.5) * TILE, (row + 0.5) * TILE]

test('an empty tile is sky, the floor is solid colour, and the crate is its own', async () => {
  const picture = await drawn()
  picture.resize(480, 270)
  picture.show(level, characters)
  expect(colourAt(picture, ...at(3, 2))).toBe('#9fd3f0')
  expect(colourAt(picture, ...at(8, 8))).toBe('#3b4a5a')
  // The crate is at 6.5, 7.5.
  expect(colourAt(picture, ...at(6, 7))).toBe('#c9a227')
})

test('a start point shows as the hero at half strength, only when the hero is named', async () => {
  const picture = await drawn()
  picture.resize(480, 270)
  const start = level.starts[0]
  if (start === undefined) throw new Error('the fixture has a start')
  picture.show(level, characters)
  const without = colourAt(picture, start.x * TILE, start.y * TILE)
  picture.show(level, characters, undefined, 'hero')
  const withHero = colourAt(picture, start.x * TILE, start.y * TILE)
  expect(withHero).not.toBe(without)
})

test('a size that is not above zero is ignored, and showing then throws nothing', async () => {
  const picture = await drawn()
  expect(() => {
    picture.resize(0, 0)
    picture.show(level, characters)
    picture.resize(-5, 100)
    picture.resize(Number.NaN, 100)
  }).not.toThrow()
})

test('destroy twice throws nothing, and nothing is drawn after it', async () => {
  const picture = await drawn()
  picture.destroy()
  expect(() => {
    picture.destroy()
    picture.show(level, characters)
    picture.resize(10, 10)
  }).not.toThrow()
  made = undefined
})
