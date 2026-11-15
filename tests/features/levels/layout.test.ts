import { expect, test } from 'vitest'
import { roomFor, roomWith, type Shape, shapeOf } from '#src/features/levels/layout.ts'

// The five sizes every screen is built and checked at (the same as the journeys' `SIZES`).
const SIZES = {
  phone: { w: 390, h: 844 },
  phoneSideways: { w: 844, h: 390 },
  ipadUpright: { w: 820, h: 1180 },
  ipadSideways: { w: 1180, h: 820 },
  desktop: { w: 1440, h: 900 },
} as const
const SHAPES: Record<keyof typeof SIZES, Shape> = {
  phone: 'narrow',
  phoneSideways: 'mid',
  ipadUpright: 'mid',
  ipadSideways: 'wide',
  desktop: 'wide',
}

test('the shape follows the frame’s box, not the device', () => {
  for (const [name, size] of Object.entries(SIZES)) {
    expect(shapeOf(size), name).toBe(SHAPES[name as keyof typeof SIZES])
  }
  expect(shapeOf({ w: 1024, h: 599 })).toBe('mid')
  expect(shapeOf({ w: 1024, h: 600 })).toBe('wide')
  expect(shapeOf({ w: 599, h: 2000 })).toBe('narrow')
  expect(shapeOf({ w: 600, h: 2000 })).toBe('mid')
})

test('the least room is the plan’s, as the zoom amendment changes it', () => {
  expect(roomFor('wide')).toEqual({ top: 80, right: 320, bottom: 88, left: 96 })
  expect(roomFor('mid')).toEqual({ top: 72, right: 92, bottom: 88, left: 16 })
  expect(roomFor('narrow')).toEqual({ top: 64, right: 8, bottom: 232, left: 8 })
})

test('measured parts make the room larger on their side only, and never smaller', () => {
  const least = roomFor('mid')
  expect(roomWith(least, {})).toEqual(least)
  expect(roomWith(least, { bottom: 120 })).toEqual({ ...least, bottom: 136 })
  expect(roomWith(least, { bottom: 40, left: 200 })).toEqual({ ...least, left: 216 })
})

test('at every size the clear cell is at least 160 px tall and half the shorter side wide', () => {
  for (const [name, size] of Object.entries(SIZES)) {
    const room = roomFor(shapeOf(size))
    const w = size.w - room.left - room.right
    const h = size.h - room.top - room.bottom
    expect(h, name).toBeGreaterThanOrEqual(160)
    expect(w, name).toBeGreaterThanOrEqual(Math.min(size.w, size.h) / 2)
  }
})
