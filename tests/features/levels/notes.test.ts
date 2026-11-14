import type { Level } from '@automataframework/framework/headless'
import { SKY_COLOR, TILE_COLOR } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import { type Box, notesFor } from '#src/features/levels/levels.ts'
import { contrast, mix } from '../../fixtures/contrast.ts'
import { fixtureFiles, LEVEL_PATH } from '../../fixtures/game/read.ts'

const level = JSON.parse(fixtureFiles[LEVEL_PATH] ?? '{}') as Level
const fit = { scale: 40, left: 100, top: 50 }
const clear: Box = { x: 100, y: 50, w: 640, h: 360 }
const block = { w: 180, h: 96 }
/** A thing's button, 44 square, with its middle at (x, y). */
const button = (x: number, y: number): Box => ({ x: x - 22, y: y - 22, w: 44, h: 44 })
const crate = button(360, 350) // level-1's crate at (6.5, 7.5)

const notes = (thing: Box | undefined, cell: Box = clear, f = fit) =>
  notesFor({ level, fit: f, thing, clear: cell, block })
const overlaps = (a: Box, b: Box): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

test("the grid is the level's area", () =>
  expect(notes(crate).grid).toEqual({ x: 100, y: 50, w: 640, h: 360, tile: 40 }))

test("the measures run from the left edge and the top edge to the thing's middle", () =>
  expect(notes(crate).measures).toEqual([
    { from: { x: 100, y: 350 }, to: { x: 360, y: 350 } },
    { from: { x: 360, y: 50 }, to: { x: 360, y: 350 } },
  ]))

test('the block goes to the right when it fits, joined by a leader to the thing', () => {
  const placed = notes(crate).block
  expect(placed?.side).toBe('right')
  expect(placed?.at).toEqual({ x: 398, y: 302 })
  expect(placed?.leader).toEqual({ from: { x: 398, y: 350 }, to: { x: 382, y: 350 } })
})

test('at the right edge it goes left', () => {
  const placed = notes(button(700, 350)).block
  expect(placed?.side).toBe('left')
  expect(placed?.at.x).toBe(700 - 22 - 16 - 180)
})

test('in a corner with no room either side it goes above', () => {
  const narrow: Box = { x: 100, y: 50, w: 300, h: 360 }
  const placed = notes(button(250, 222), narrow).block
  expect(placed?.side).toBe('above')
  expect(placed?.at.y).toBe(222 - 22 - 16 - 96)
})

test('with no room anywhere it goes below, inside the clear cell', () => {
  const small: Box = { x: 100, y: 50, w: 300, h: 200 }
  const placed = notes(button(250, 150), small).block
  expect(placed?.side).toBe('below')
  expect(placed?.at.x).toBeGreaterThanOrEqual(small.x)
  expect(placed?.at.y).toBeGreaterThanOrEqual(small.y)
  expect((placed?.at.x ?? 0) + block.w).toBeLessThanOrEqual(small.x + small.w)
  expect((placed?.at.y ?? 0) + block.h).toBeLessThanOrEqual(small.y + small.h)
})

test('it never overlaps the thing when a side fits (the crate in each of the four corners)', () => {
  const corners = [
    button(clear.x + 22, clear.y + 22),
    button(clear.x + clear.w - 22, clear.y + 22),
    button(clear.x + 22, clear.y + clear.h - 22),
    button(clear.x + clear.w - 22, clear.y + clear.h - 22),
  ]
  for (const thing of corners) {
    const placed = notes(thing).block
    expect(placed).toBeDefined()
    const at = placed?.at ?? { x: 0, y: 0 }
    expect(overlaps({ ...at, ...block }, thing)).toBe(false)
    expect(at.x).toBeGreaterThanOrEqual(clear.x)
    expect(at.y).toBeGreaterThanOrEqual(clear.y)
    expect(at.x + block.w).toBeLessThanOrEqual(clear.x + clear.w)
    expect(at.y + block.h).toBeLessThanOrEqual(clear.y + clear.h)
  }
})

test('nothing picked has a grid and no notes', () => {
  const none = notes(undefined)
  expect(none.grid.tile).toBe(40)
  expect(none.measures).toEqual([])
  expect(none.block).toBeUndefined()
})

test('a scale of zero has nothing, and no NaN', () => {
  const none = notes(crate, clear, { scale: 0, left: 0, top: 0 })
  expect(none.grid).toEqual({ x: 0, y: 0, w: 0, h: 0, tile: 0 })
  expect(none.measures).toEqual([])
  expect(none.block).toBeUndefined()
  expect(JSON.stringify(none)).not.toContain('NaN')
  expect(notes(crate, clear, { scale: Number.NaN, left: 0, top: 0 }).block).toBeUndefined()
})

test('one stroke of the grid shows on any art', () => {
  const hex = (n: number): string => `#${n.toString(16).padStart(6, '0')}`
  const WORDS = '#f5ecc2'
  const GROUND = '#253122'
  for (const art of [hex(SKY_COLOR), hex(TILE_COLOR), '#ffffff', '#000000']) {
    const best = Math.max(contrast(mix(WORDS, art, 0.25), art), contrast(mix(GROUND, art, 0.25), art))
    expect(best).toBeGreaterThanOrEqual(1.5)
  }
})
