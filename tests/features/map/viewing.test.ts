import { expect, test } from 'vitest'
import type { Box } from '#src/features/map/arrange.ts'
import { mapCamera, TOP_ROOM } from '#src/features/map/shapes.ts'
import { MAP_MAX_SCALE, reveal, slideMap, zoomMap } from '#src/features/map/viewing.ts'

const all: Box[] = [
  { level: 'a', x: 0, y: 0, w: 16, h: 9 },
  { level: 'b', x: 16, y: 0, w: 16, h: 9 },
  { level: 'c', x: 0, y: 40, w: 16, h: 9 },
]
const size = { w: 800, h: 600 }
const whole = mapCamera(all, size)

test('zooming in keeps the tile under the fingers where it was, and goes no further than the most', () => {
  const about = { x: 600, y: 200 }
  const closer = zoomMap(whole, 2, about, all, size)
  expect(closer?.scale).toBeCloseTo(whole.scale * 2)
  const tile = (c: NonNullable<typeof closer>, px: { x: number; y: number }) => ({
    x: c.x + (px.x - size.w / 2) / c.scale,
    y: c.y + (px.y - size.h / 2) / c.scale,
  })
  const before = tile(whole, about)
  const after = tile(closer as NonNullable<typeof closer>, about)
  expect(after.x).toBeCloseTo(before.x)
  expect(after.y).toBeCloseTo(before.y)
  expect(zoomMap(whole, 1000, about, all, size)?.scale).toBe(MAP_MAX_SCALE)
})

test('zooming out stops at every level in sight, which is no view of its own', () => {
  const closer = zoomMap(whole, 4, { x: 400, y: 300 }, all, size)
  expect(closer).toBeDefined()
  expect(zoomMap(closer as NonNullable<typeof closer>, 0.01, { x: 400, y: 300 }, all, size)).toBeUndefined()
  expect(zoomMap(whole, 0.5, { x: 400, y: 300 }, all, size)).toBeUndefined()
})

test('sliding follows the fingers, and can not take the middle of the view off the levels', () => {
  const closer = zoomMap(whole, 4, { x: 400, y: 300 }, all, size) as NonNullable<ReturnType<typeof zoomMap>>
  const moved = slideMap(closer, { x: -100, y: 0 }, all)
  expect(moved.x).toBeCloseTo(closer.x + 100 / closer.scale)
  expect(moved.scale).toBe(closer.scale)
  const far = slideMap(closer, { x: -1e9, y: 1e9 }, all)
  expect(far.x).toBe(32)
  expect(far.y).toBe(0)
})

test('a level in sight leaves the view alone; one out of sight is brought to the middle', () => {
  const closer = zoomMap(whole, 4, { x: 400, y: 300 }, all, size) as NonNullable<ReturnType<typeof zoomMap>>
  const inSight = { x: 100, y: 100, w: 200, h: 100 }
  expect(reveal(closer, inSight, all, size)).toBe(closer)
  const off = { x: 2000, y: 100, w: 200, h: 100 }
  const brought = reveal(closer, off, all, size)
  expect(brought.scale).toBe(closer.scale)
  expect(brought.x).toBeGreaterThan(closer.x)
})

test('a level under the buttons along the top is not in sight: it is brought down into the free ground', () => {
  const closer = zoomMap(whole, 4, { x: 400, y: 300 }, all, size) as NonNullable<ReturnType<typeof zoomMap>>
  const covered = { x: 100, y: 10, w: 200, h: 100 }
  expect(covered.y).toBeLessThan(TOP_ROOM)
  const brought = reveal(closer, covered, all, size)
  expect(brought).not.toBe(closer)
  expect(brought.y).toBeLessThan(closer.y)
})
