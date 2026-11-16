import { expect, test } from 'vitest'
import { BAR_HEIGHT, barPlace, menuPlace, PAD_SIDE, padPlace } from '#src/features/levels/float.ts'

const screen = { w: 820, h: 560 }
const crosses = (
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
const at = (x: number, y: number) => ({ x, y, w: 48, h: 48 })

test('the bar is over a thing in the middle, below one at the top, and never on any of the four corners', () => {
  const width = 360
  for (const box of [at(400, 300), at(400, 0), at(0, 0), at(772, 0), at(0, 512), at(772, 512)]) {
    const place = barPlace(box, screen, width)
    expect(crosses({ ...place, w: width, h: BAR_HEIGHT }, box), JSON.stringify(box)).toBe(false)
    expect(place.x).toBeGreaterThanOrEqual(8)
    expect(place.x + width).toBeLessThanOrEqual(screen.w - 8 + 1e-9)
    expect(place.y).toBeGreaterThanOrEqual(8)
  }
  expect(barPlace(at(400, 300), screen, width).y).toBeLessThan(300)
  expect(barPlace(at(400, 0), screen, width).y).toBeGreaterThan(48)
})

test('the pad takes the first corner that is clear of what is picked', () => {
  expect(padPlace(undefined, screen)).toEqual({ x: screen.w - PAD_SIDE - 8, y: screen.h - PAD_SIDE - 8 })
  const place = padPlace(at(700, 450), screen)
  expect(crosses({ ...place, w: PAD_SIDE, h: PAD_SIDE }, at(700, 450))).toBe(false)
  expect(place).toEqual({ x: 8, y: screen.h - PAD_SIDE - 8 })
})

test('a menu is kept inside the stage', () => {
  expect(menuPlace({ x: 900, y: 700 }, screen)).toEqual({ x: screen.w - 260, y: screen.h - 260 })
  expect(menuPlace({ x: -5, y: -5 }, screen)).toEqual({ x: 8, y: 8 })
})
