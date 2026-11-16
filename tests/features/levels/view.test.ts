import { type Level, levelSize, loadGame } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import {
  type Camera,
  closeUp,
  fromMini,
  MAX_SCALE,
  MIN_SCALE,
  miniMap,
  slideBy,
  toScreen,
  toTiles,
  wholeLevel,
  zoomBy,
} from '#src/features/levels/view.ts'
import { readFrom } from '../../fixtures/game/read.ts'
import { linksMap } from '../../fixtures/links-game/read.ts'

const loaded = await loadGame(readFrom(linksMap()))
if (!loaded.ok) throw new Error('the links game did not load')
const level = loaded.value.levels['room-1'] as Level
const size = levelSize(level)
const screen = { w: 1210, h: 834 }
const none = { top: 0, right: 0, bottom: 0, left: 0 }

const near = (a: number, b: number): void => expect(a).toBeCloseTo(b, 6)

test('a point goes to the screen and back to the same tiles', () => {
  const camera: Camera = { x: 7.25, y: 3.5, scale: 37 }
  for (const p of [
    { x: 0, y: 0 },
    { x: 4.5, y: 7.5 },
    { x: size.w, y: size.h },
  ]) {
    const back = toTiles(camera, screen, toScreen(camera, screen, p))
    near(back.x, p.x)
    near(back.y, p.y)
  }
  expect(toScreen(camera, screen, { x: 7.25, y: 3.5 })).toEqual({ x: 605, y: 417 })
})

test('the whole level sits clear of the four panels', () => {
  const insets = { top: 56, right: 280, bottom: 90, left: 120 }
  const camera = wholeLevel(level, screen, insets)
  const topLeft = toScreen(camera, screen, { x: 0, y: 0 })
  const bottomRight = toScreen(camera, screen, { x: size.w, y: size.h })
  expect(topLeft.x).toBeGreaterThanOrEqual(insets.left - 1e-6)
  expect(topLeft.y).toBeGreaterThanOrEqual(insets.top - 1e-6)
  expect(bottomRight.x).toBeLessThanOrEqual(screen.w - insets.right + 1e-6)
  expect(bottomRight.y).toBeLessThanOrEqual(screen.h - insets.bottom + 1e-6)
  // One side touches its limit: the level is as big as it can be.
  const wide = bottomRight.x - topLeft.x
  const tall = bottomRight.y - topLeft.y
  const fills = Math.abs(wide - (screen.w - insets.left - insets.right)) < 1e-6
  const fillsTall = Math.abs(tall - (screen.h - insets.top - insets.bottom)) < 1e-6
  expect(fills || fillsTall).toBe(true)
})

test('a close up has the point in the middle at 64 pixels a tile', () => {
  const camera = closeUp(level, { x: 5.5, y: 7.5 }, screen)
  expect(camera).toEqual({ x: 5.5, y: 7.5, scale: 64 })
})

test('zooming keeps the tile under the finger under it, and stops at both limits', () => {
  const camera: Camera = { x: 8, y: 5, scale: 40 }
  const about = { x: 900, y: 200 }
  const before = toTiles(camera, screen, about)
  const zoomed = zoomBy(camera, 1.7, about, screen)
  const after = toTiles(zoomed, screen, about)
  near(after.x, before.x)
  near(after.y, before.y)
  expect(zoomed.scale).toBeCloseTo(68, 6)
  expect(zoomBy(camera, 1000, about, screen).scale).toBe(MAX_SCALE)
  expect(zoomBy(camera, 0.0001, about, screen).scale).toBe(MIN_SCALE)
  expect(zoomBy(camera, 0, about, screen)).toBe(camera)
})

test('sliding by a finger moves the picture with it', () => {
  const camera: Camera = { x: 8, y: 5, scale: 40 }
  const slid = slideBy(camera, { x: 80, y: -40 })
  expect(slid).toEqual({ x: 6, y: 6, scale: 40 })
  const spot = { x: 8, y: 5 }
  const was = toScreen(camera, screen, spot)
  const now = toScreen(slid, screen, spot)
  near(now.x - was.x, 80)
  near(now.y - was.y, -40)
})

test('the small map of a view that shows the whole level is the whole small map', () => {
  const camera = wholeLevel(level, screen, none)
  const mini = { w: 160, h: 100 }
  const { box, scale } = miniMap(level, camera, screen, mini)
  expect(scale).toBeCloseTo(Math.min(160 / size.w, 100 / size.h), 9)
  near(box.x, 0)
  near(box.y, 0)
  near(box.w, size.w * scale)
  near(box.h, size.h * scale)
})

test('the small map boxes the part on screen, and a tap in its middle goes there', () => {
  const mini = { w: 160, h: 100 }
  const camera: Camera = { x: size.w / 2, y: size.h / 2, scale: 64 }
  const { box, scale } = miniMap(level, camera, { w: 320, h: 256 }, mini)
  near(box.w, (320 / 64) * scale)
  near(box.h, (256 / 64) * scale)
  const middle = { x: box.x + box.w / 2, y: box.y + box.h / 2 }
  const again = fromMini(level, middle, camera, { w: 320, h: 256 }, mini)
  near(again.x, camera.x)
  near(again.y, camera.y)
  expect(again.scale).toBe(64)
})

test('a tap on the small map outside the level goes only as far as the edge', () => {
  const camera: Camera = { x: 3, y: 3, scale: 64 }
  const there = fromMini(level, { x: 9999, y: -50 }, camera, screen, { w: 160, h: 100 })
  expect(there).toEqual({ x: size.w, y: 0, scale: 64 })
})
