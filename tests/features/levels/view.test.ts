import { expect, test } from 'vitest'
import {
  clampView,
  EDGE_PX,
  edgeSlide,
  fitOf,
  isWhole,
  type LevelView,
  mostZoom,
  panBy,
  pinch,
  reveal,
  stepZoom,
  whole,
  zoomAbout,
} from '#src/features/levels/view.ts'

// A phone held upright: the level 16 by 9 tiles, fitted in the clear cell the plan's room leaves.
const world = { w: 16, h: 9 }
const clear = { x: 8, y: 64, w: 374, h: 548 }
const home = { scale: 23.375, left: 8, top: 232.8125 }
const view = (zoom: number, x: number, y: number): LevelView => ({ zoom, x, y })
const about = (a: LevelView, b: LevelView): void => {
  expect(b.zoom).toBeCloseTo(a.zoom, 4)
  expect(b.x).toBeCloseTo(a.x, 4)
  expect(b.y).toBeCloseTo(a.y, 4)
}

test('the whole level fits where the plan puts it, and is whole', () => {
  expect(fitOf(whole(world), home, clear)).toEqual(home)
  expect(isWhole(whole(world))).toBe(true)
  expect(isWhole(view(1.004, 8, 4.5))).toBe(true)
  expect(isWhole(view(1.5, 8, 4.5))).toBe(false)
})

test('the most zoom is a tile of 128 px, and never under 2', () => {
  expect(mostZoom(home)).toBeCloseTo(5.476, 3)
  expect(mostZoom({ scale: 47.75, left: 0, top: 0 })).toBeCloseTo(2.681, 3)
  expect(mostZoom({ scale: 100, left: 0, top: 0 })).toBe(2)
  expect(mostZoom({ scale: 0, left: 0, top: 0 })).toBe(1)
})

test('a view is kept legal: zoom from 1, the level never lost, a small level centered', () => {
  expect(clampView(view(0.5, 3, 1), home, clear, world)).toEqual(view(1, 8, 4.5))
  expect(clampView(view(2, 0, 0), home, clear, world)).toEqual(view(2, 4, 4.5))
  expect(clampView(view(2, 99, 9), home, clear, world)).toEqual(view(2, 12, 4.5))
  about(clampView(view(4, 0, 0), home, clear, world), view(4, 2, 2.9305))
  expect(clampView(view(99, 8, 4.5), home, clear, world).zoom).toBe(mostZoom(home))
  expect(clampView(view(Number.NaN, 8, 4.5), home, clear, world)).toEqual(whole(world))
  expect(clampView(view(2, Number.NaN, 4.5), home, clear, world)).toEqual(whole(world))
})

test('zooming about a point keeps the level under it', () => {
  expect(zoomAbout(whole(world), home, clear, world, { x: 8, y: 338 }, 2)).toEqual(view(2, 4, 4.5))
  expect(zoomAbout(whole(world), home, clear, world, { x: 195, y: 338 }, 2)).toEqual(view(2, 8, 4.5))
})

test('moving the level moves it as a finger does, and the whole level cannot be moved', () => {
  expect(panBy(view(2, 8, 4.5), home, clear, world, -46.75, 0)).toEqual(view(2, 9, 4.5))
  expect(panBy(whole(world), home, clear, world, 100, 100)).toEqual(whole(world))
})

test('a pinch scales by the fingers’ distance and moves by their middle, from where it started', () => {
  const from = [
    { x: 101.5, y: 338 },
    { x: 288.5, y: 338 },
  ] as const
  const out = [
    { x: 8, y: 338 },
    { x: 382, y: 338 },
  ] as const
  expect(pinch(whole(world), home, clear, world, from, out)).toEqual(view(2, 8, 4.5))
  const moved = [
    { x: 54.75, y: 338 },
    { x: 428.75, y: 338 },
  ] as const
  expect(pinch(whole(world), home, clear, world, from, moved)).toEqual(view(2, 7, 4.5))
  const together = [
    { x: 50, y: 50 },
    { x: 50, y: 50 },
  ] as const
  expect(pinch(view(2, 9, 4.5), home, clear, world, from, together)).toEqual(view(2, 9, 4.5))
})

test('the buttons step by half again, in to the most and out to the whole level', () => {
  expect(stepZoom(1, 'in', 2.68)).toBe(1.5)
  expect(stepZoom(2.25, 'in', 2.68)).toBe(2.68)
  expect(stepZoom(1.2, 'out', 2.68)).toBe(1)
  expect(stepZoom(1, 'out', 2.68)).toBe(1)
  expect(stepZoom(3, 'out', 5)).toBe(2)
})

test('a thing out of sight is brought in by the least move, and one in sight changes nothing', () => {
  const zoomed = view(2, 4, 4.5)
  expect(reveal(zoomed, home, clear, world, { x: 14, y: 4, w: 1, h: 1 })).toEqual(view(2, 11.5, 4.5))
  expect(reveal(zoomed, home, clear, world, { x: 3, y: 4, w: 1, h: 1 })).toBe(zoomed)
  expect(reveal(whole(world), home, clear, world, { x: 3, y: 4, w: 1, h: 1 }).zoom).toBe(1)
})

test('a dragged thing near the edge slides the level, deeper is faster, the middle does not', () => {
  expect(edgeSlide({ x: 372, y: 338 }, clear, 0.5)).toEqual({ dx: 180, dy: 0 })
  expect(edgeSlide({ x: 195, y: 338 }, clear, 0.5)).toEqual({ dx: 0, dy: 0 })
  expect(edgeSlide({ x: 18, y: 338 }, clear, 0.5)).toEqual({ dx: -180, dy: 0 })
  expect(edgeSlide({ x: 195, y: 64 + EDGE_PX }, clear, 1)).toEqual({ dx: 0, dy: 0 })
  expect(edgeSlide({ x: 195, y: 64 }, clear, 1)).toEqual({ dx: 0, dy: -480 })
})

test('Review Focus 2: with no room at all every answer is the whole level and none is NaN', () => {
  const nothing = { scale: 0, left: 0, top: 0 }
  const here = { x: 100, y: 100 }
  const results = [
    clampView(view(2, 3, 3), nothing, clear, world),
    zoomAbout(view(2, 3, 3), nothing, clear, world, here, 2),
    panBy(view(2, 3, 3), nothing, clear, world, 10, 10),
    pinch(view(2, 3, 3), nothing, clear, world, [here, { x: 120, y: 100 }], [here, { x: 140, y: 100 }]),
    reveal(view(2, 3, 3), nothing, clear, world, { x: 1, y: 1, w: 1, h: 1 }),
  ]
  for (const result of results) expect(result).toEqual(whole(world))
})

test('Review Focus 3: a very big level reaches its most zoom in nine presses, and stays', () => {
  const big = { w: 200, h: 100 }
  const far = { scale: 4, left: 0, top: 0 }
  const most = mostZoom(far)
  expect(most).toBe(32)
  let zoom = 1
  for (let press = 0; press < 9; press++) zoom = stepZoom(zoom, 'in', most)
  expect(zoom).toBe(32)
  expect(stepZoom(zoom, 'in', most)).toBe(32)
  const shown = reveal(view(32, 100, 50), far, clear, big, { x: 199, y: 99, w: 1, h: 1 })
  const at = fitOf(shown, far, clear)
  const left = at.left + 199 * at.scale
  const top = at.top + 99 * at.scale
  expect(left).toBeGreaterThanOrEqual(clear.x)
  expect(left + at.scale).toBeLessThanOrEqual(clear.x + clear.w + 1e-6)
  expect(top).toBeGreaterThanOrEqual(clear.y)
  expect(top + at.scale).toBeLessThanOrEqual(clear.y + clear.h + 1e-6)
})

test('Review Focus 4: a level that changed size while zoomed is brought back inside the new one', () => {
  const small = { w: 8, h: 5 }
  const clamped = clampView(view(4, 14, 6), home, clear, small)
  const scale = home.scale * clamped.zoom
  expect(clamped.x).toBeGreaterThanOrEqual(clear.w / 2 / scale)
  expect(clamped.x).toBeLessThanOrEqual(small.w - clear.w / 2 / scale + 1e-9)
  expect(clamped.y).toBe(small.h / 2)
})
