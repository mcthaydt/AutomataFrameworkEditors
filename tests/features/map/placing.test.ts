import { expect, test } from 'vitest'
import { startEdits } from '#src/features/game/changes.ts'
import { type Landing, landing } from '#src/features/map/arrange.ts'
import { freeSpot, landingWords, placeCard, type Rect } from '#src/features/map/placing.ts'
import { wordsIn } from '#src/features/words/words.ts'
import { linksFiles } from '../../fixtures/links-game/links.ts'
import { openedGame } from '../../fixtures/open-game.ts'

const screen: Rect = { x: 0, y: 0, w: 820, h: 600 }
const card = { w: 200, h: 120 }
const crosses = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
const inside = (r: Rect): boolean =>
  r.x >= screen.x && r.y >= screen.y && r.x + r.w <= screen.x + screen.w && r.y + r.h <= screen.y + screen.h

// Room 3 picked with Room 2 beside it on its left, as the mockup draws Level 4 and Level 3.
const picked: Rect = { x: 420, y: 200, w: 300, h: 170 }
const beside: Rect = { x: 110, y: 200, w: 310, h: 170 }

test('a card never covers the picked level or the one beside it, and stays inside the window', () => {
  const at = placeCard(card, picked, [beside], screen)
  expect(crosses(at, picked)).toBe(false)
  expect(crosses(at, beside)).toBe(false)
  expect(inside(at)).toBe(true)
  expect(at).toMatchObject(card)
})

test('a card goes below the level, else above it, else beside it', () => {
  expect(placeCard(card, picked, [], screen).y).toBeGreaterThan(picked.y + picked.h)
  const low: Rect = { x: 420, y: 440, w: 300, h: 150 }
  expect(placeCard(card, low, [], screen).y + card.h).toBeLessThanOrEqual(low.y)
  const tall: Rect = { x: 300, y: 10, w: 300, h: 580 }
  const side = placeCard(card, tall, [], screen)
  expect(crosses(side, tall)).toBe(false)
  expect(inside(side)).toBe(true)
})

test('a card keeps clear of the key and every other level it is told of', () => {
  const key: Rect = { x: 0, y: 544, w: 820, h: 56 }
  const low: Rect = { x: 420, y: 330, w: 300, h: 170 }
  const at = placeCard(card, low, [key], screen)
  expect(crosses(at, key)).toBe(false)
  expect(crosses(at, low)).toBe(false)
})

test('when nowhere is clear it still stays inside the window and takes the place that covers least', () => {
  const wide: Rect = { x: 10, y: 10, w: 800, h: 580 }
  const at = placeCard(card, wide, [], screen)
  expect(inside(at)).toBe(true)
})

const words = wordsIn('en')
const links = await openedGame(linksFiles())
const working = startEdits(links).now

test('landingWords says what letting go would do, for each kind of landing', () => {
  expect(landingWords({ kind: 'free', at: { x: 0, y: 0 } }, words)).toBe('Let go to leave it here.')
  const join: Landing = {
    kind: 'touch',
    at: { x: 0, y: 0 },
    joins: [{ a: 'room-2', b: 'room-3', along: 'y', from: 5, to: 8 }],
    walls: [],
  }
  expect(landingWords(join, words)).toContain('players walk straight from Room 2 into Room 3')
  const wall: Landing = {
    kind: 'touch',
    at: { x: 0, y: 0 },
    joins: [],
    walls: [{ a: 'room-1', b: 'room-2', along: 'y', from: 5, to: 8, open: 'a' }],
  }
  expect(landingWords(wall, words)).toContain('Room 1 and Room 2 meet at a wall')
  expect(landingWords({ kind: 'touch', at: { x: 0, y: 0 }, joins: [], walls: [] }, words)).toContain(
    'side by side',
  )
  expect(landingWords({ kind: 'overlap', over: 'room-2' }, words)).toBe(
    'Room 2 is already here. Let go and it goes back.',
  )
})

test('a level dropped beside another is a wall and says so, as the links game lays it out', () => {
  const dropped = landing(working, links.content.tilesets, 'room-1', { x: 3.4, y: 0.2 })
  expect(landingWords(dropped, words)).toContain('meet at a wall')
})

test('freeSpot is to the right of every level, on the top row, two tiles clear', () => {
  const boxes = [
    { level: 'a', x: 0, y: 1, w: 16, h: 9 },
    { level: 'b', x: 18, y: 0, w: 20, h: 9 },
  ]
  expect(freeSpot(boxes)).toEqual({ x: 40, y: 0 })
  expect(freeSpot([])).toEqual({ x: 0, y: 0 })
})
