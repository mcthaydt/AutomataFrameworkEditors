import { type Level, loadGame, type TilesetFile } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import {
  boxCells,
  emptyKind,
  fillCells,
  kindAt,
  kindsOf,
  lineCells,
  paint,
} from '#src/features/levels/ground.ts'
import { readFrom } from '../../fixtures/game/read.ts'
import { linksMap } from '../../fixtures/links-game/read.ts'

const loaded = await loadGame(readFrom(linksMap()))
if (!loaded.ok) throw new Error('the links game did not load')
const characters = loaded.value.characters
const room1 = loaded.value.levels['room-1'] as Level

const tileset: TilesetFile = {
  format: 1,
  id: 'cave',
  image: 'content/art/cave.png',
  tileSize: 16,
  columns: 4,
  tiles: [
    { id: 'rock', letter: 'R', solid: true, pictures: [{ frame: 0 }] },
    { id: 'moss', letter: 'M', solid: false, pictures: [{ frame: 1 }] },
  ],
}
const tilesets = { cave: tileset }

const SOLID = { letter: '#', id: 'solid', solid: true }
const EMPTY = { letter: '.', id: 'empty', solid: false }
const levelOf = (done: { ok: boolean }): Level => {
  if (!('value' in done)) throw new Error('expected a level')
  return done.value as Level
}

test('a level without a tileset can be Solid or Empty, and nothing else', () => {
  expect(kindsOf(room1, loaded.value.tilesets)).toEqual([SOLID, EMPTY])
  expect(emptyKind(kindsOf(room1, undefined))).toEqual(EMPTY)
})

test("a level with a tileset can be what the tileset's kinds are", () => {
  const cave: Level = { ...room1, tileset: 'cave' }
  expect(kindsOf(cave, tilesets)).toEqual([
    { letter: 'R', id: 'rock', solid: true },
    { letter: 'M', id: 'moss', solid: false },
  ])
  expect(emptyKind(kindsOf(cave, tilesets)).letter).toBe('M')
  const rockOnly = { cave: { ...tileset, tiles: tileset.tiles.slice(0, 1) } }
  expect(kindsOf(cave, rockOnly).map((k) => k.letter)).toEqual(['R', '.'])
})

test('one painted cell changes that cell and no other letter in its row', () => {
  const done = paint(room1, characters, [{ col: 3, row: 1 }], SOLID)
  const level = levelOf(done)
  expect(level.tiles[1]).toBe('#..#...........#')
  expect(level.tiles.filter((_, i) => i !== 1)).toEqual(room1.tiles.filter((_, i) => i !== 1))
  expect(kindAt(level, { col: 3, row: 1 })).toBe('#')
})

test('a letter the tileset lacks is the letter kindAt gives, and painting elsewhere leaves it alone', () => {
  const odd: Level = {
    ...room1,
    tileset: 'cave',
    tiles: room1.tiles.map((row, i) => (i === 0 ? `#?${row.slice(2)}` : row)),
  }
  expect(kindAt(odd, { col: 1, row: 0 })).toBe('?')
  const level = levelOf(
    paint(odd, characters, [{ col: 5, row: 0 }], { letter: 'M', id: 'moss', solid: false }),
  )
  expect(level.tiles[0]).toBe('#?...M.........#')
})

test('outside the level is skipped, and kindAt there is undefined', () => {
  expect(kindAt(room1, { col: 16, row: 0 })).toBeUndefined()
  expect(kindAt(room1, { col: 0, row: -1 })).toBeUndefined()
  const level = levelOf(
    paint(
      room1,
      characters,
      [
        { col: 30, row: 0 },
        { col: 2, row: 0 },
      ],
      SOLID,
    ),
  )
  expect(level.tiles[0]).toBe('#.#............#')
  expect(paint(room1, characters, [{ col: 30, row: 0 }], SOLID)).toEqual({ ok: false, why: 'outside' })
})

test('solid over the crate skips its cell, and when every cell is skipped it is occupied', () => {
  const both = levelOf(
    paint(
      room1,
      characters,
      [
        { col: 5, row: 7 },
        { col: 6, row: 7 },
      ],
      SOLID,
    ),
  )
  expect(both.tiles[7]).toBe('#.....#.........')
  expect(paint(room1, characters, [{ col: 5, row: 7 }], SOLID)).toEqual({ ok: false, why: 'occupied' })
})

test("solid under a hero's start is skipped, and erasing under a thing is fine", () => {
  expect(paint(room1, characters, [{ col: 2, row: 7 }], SOLID)).toEqual({ ok: false, why: 'occupied' })
  const level = levelOf(paint(room1, characters, [{ col: 0, row: 3 }], EMPTY))
  expect(level.tiles[3]).toBe('...............#')
  const crateGone = paint(
    room1,
    characters,
    [
      { col: 15, row: 8 },
      { col: 5, row: 7 },
    ],
    EMPTY,
  )
  expect(crateGone.ok).toBe(true)
})

test('painting what is already there is the same', () => {
  expect(paint(room1, characters, [{ col: 0, row: 0 }], SOLID)).toEqual({ ok: false, why: 'same' })
})

test('a box has every cell, whichever corner comes first', () => {
  const cells = boxCells({ col: 3, row: 2 }, { col: 1, row: 1 })
  expect(cells).toHaveLength(6)
  expect(cells).toContainEqual({ col: 1, row: 1 })
  expect(cells).toContainEqual({ col: 3, row: 2 })
})

test('a line from (0, 0) to (5, 2) has no gap', () => {
  const cells = lineCells({ col: 0, row: 0 }, { col: 5, row: 2 })
  expect(cells[0]).toEqual({ col: 0, row: 0 })
  expect(cells.at(-1)).toEqual({ col: 5, row: 2 })
  for (const [i, cell] of cells.entries()) {
    const before = cells[i - 1]
    if (before === undefined) continue
    expect(Math.abs(cell.col - before.col)).toBeLessThanOrEqual(1)
    expect(Math.abs(cell.row - before.row)).toBeLessThanOrEqual(1)
  }
  expect(lineCells({ col: 4, row: 4 }, { col: 4, row: 4 })).toEqual([{ col: 4, row: 4 }])
  expect(lineCells({ col: 3, row: 1 }, { col: 0, row: 1 })).toHaveLength(4)
})

test('filling an empty 256 by 256 level gives every cell and returns', () => {
  const big: Level = { ...room1, tiles: Array.from({ length: 256 }, () => '.'.repeat(256)) }
  expect(fillCells(big, { col: 0, row: 0 })).toHaveLength(65_536)
})

test('filling a walled pocket gives only the pocket', () => {
  const walled: Level = { ...room1, tiles: ['#####', '#..##', '#..##', '#####', '#...#'] }
  const pocket = fillCells(walled, { col: 1, row: 1 })
  expect(pocket).toHaveLength(4)
  expect(fillCells(walled, { col: 2, row: 4 })).toHaveLength(3)
  expect(fillCells(walled, { col: 9, row: 9 })).toEqual([])
})
