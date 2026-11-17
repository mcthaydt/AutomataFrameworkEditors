// The ground of a level: which letter each tile is, and the ways to change it. Pure functions of the level that give
// the new level or the reason it will not. A letter the level's tileset does not list is met as it is: `kindAt` says
// it, and painting elsewhere leaves it alone.
import type { GameContent, Level } from '@automataframework/framework/headless'
import { type Done, no, ok } from './done.ts'
import type { Characters } from './edit.ts'
import type { Point, Size } from './place.ts'

/** A tile by its column and row, counted from the level's top left. */
export interface Cell {
  readonly col: number
  readonly row: number
}

/** One thing the ground can be: its letter, the tileset's id for it (or 'solid' and 'empty'), and whether it blocks. */
export interface Kind {
  readonly letter: string
  readonly id: string
  readonly solid: boolean
}

const SOLID: Kind = { letter: '#', id: 'solid', solid: true }
const EMPTY: Kind = { letter: '.', id: 'empty', solid: false }
const TOLERANCE = 1e-9

/** What the ground can be: the level's tileset's kinds, or Solid ('#') and Empty ('.') without one. */
export function kindsOf(level: Level, tilesets: GameContent['tilesets']): readonly Kind[] {
  const tileset = level.tileset === undefined ? undefined : tilesets?.[level.tileset]
  if (tileset === undefined) return [SOLID, EMPTY]
  const kinds = tileset.tiles.map((t) => ({ letter: t.letter, id: t.id, solid: t.solid }))
  return kinds.some((k) => !k.solid) ? kinds : [...kinds, EMPTY]
}

/** What erasing paints: the first kind that is not solid. */
export const emptyKind = (kinds: readonly Kind[]): Kind => kinds.find((k) => !k.solid) ?? EMPTY

/** The letter at a cell, or undefined outside the level. */
export function kindAt(level: Level, cell: Cell): string | undefined {
  return level.tiles[cell.row]?.[cell.col]
}

const insideLevel = (level: Level, cell: Cell): boolean =>
  Number.isInteger(cell.col) && Number.isInteger(cell.row) && kindAt(level, cell) !== undefined

/** The size a hero's start takes up: the biggest character that moves by a player, or one tile. */
function heroSize(characters: Characters): Size {
  let best: Size = { w: 1, h: 1 }
  for (const character of Object.values(characters)) {
    if (character.moves !== undefined && character.size.w * character.size.h > best.w * best.h) {
      best = character.size
    }
  }
  return best
}

/** Whether a box centred at `at` overlaps the tile; touching is not overlapping. */
const overlaps = (size: Size, at: Point, cell: Cell): boolean =>
  at.x + size.w / 2 > cell.col + TOLERANCE &&
  at.x - size.w / 2 < cell.col + 1 - TOLERANCE &&
  at.y + size.h / 2 > cell.row + TOLERANCE &&
  at.y - size.h / 2 < cell.row + 1 - TOLERANCE

/** Whether a thing or a start stands on the tile. */
function occupied(level: Level, characters: Characters, cell: Cell): boolean {
  if (level.things.some((t) => overlaps(characters[t.character]?.size ?? { w: 1, h: 1 }, t, cell)))
    return true
  const hero = heroSize(characters)
  return level.starts.some((s) => overlaps(hero, s, cell))
}

/** The cells a solid kind would leave alone because a thing or a start stands on them. */
export function leftAlone(
  level: Level,
  characters: Characters,
  cells: readonly Cell[],
  kind: Kind,
): readonly Cell[] {
  return kind.solid ? cells.filter((c) => insideLevel(level, c) && occupied(level, characters, c)) : []
}

/**
 * Paints cells with one kind. Cells outside the level are skipped, and so, for a solid kind, are cells under a thing or
 * a start. `occupied` when everything inside was skipped, `same` when nothing changed. A row is changed only at the
 * painted columns, so every other letter stays as it was.
 */
export function paint(level: Level, characters: Characters, cells: readonly Cell[], kind: Kind): Done {
  const inside = cells.filter((c) => insideLevel(level, c))
  if (inside.length === 0) return no('outside')
  const open = kind.solid ? inside.filter((c) => !occupied(level, characters, c)) : inside
  if (open.length === 0) return no('occupied')
  const rows = new Map<number, string[]>()
  let changed = false
  for (const { col, row } of open) {
    const letters = rows.get(row) ?? [...(level.tiles[row] ?? '')]
    if (letters[col] !== kind.letter) changed = true
    letters[col] = kind.letter
    rows.set(row, letters)
  }
  if (!changed) return no('same')
  const tiles = level.tiles.map((text, row) => {
    const letters = rows.get(row)
    return letters === undefined ? text : letters.join('')
  })
  return ok({ ...level, tiles })
}

/** Every cell of the box with these two corners, whichever way round they are given. */
export function boxCells(a: Cell, b: Cell): readonly Cell[] {
  const cells: Cell[] = []
  for (let row = Math.min(a.row, b.row); row <= Math.max(a.row, b.row); row++)
    for (let col = Math.min(a.col, b.col); col <= Math.max(a.col, b.col); col++) cells.push({ col, row })
  return cells
}

/** A finger's path between two moves: every cell on the line from `a` to `b`, with no gap. */
export function lineCells(a: Cell, b: Cell): readonly Cell[] {
  const cells: Cell[] = []
  const dx = Math.abs(b.col - a.col)
  const dy = Math.abs(b.row - a.row)
  const stepX = a.col < b.col ? 1 : -1
  const stepY = a.row < b.row ? 1 : -1
  let col = a.col
  let row = a.row
  let error = dx - dy
  for (;;) {
    cells.push({ col, row })
    if (col === b.col && row === b.row) return cells
    const twice = 2 * error
    if (twice > -dy) {
      error -= dy
      col += stepX
    }
    if (twice < dx) {
      error += dx
      row += stepY
    }
  }
}

/** Every cell joined to `from` by its sides with the same letter, inside the level. */
export function fillCells(level: Level, from: Cell): readonly Cell[] {
  const letter = kindAt(level, from)
  if (letter === undefined || !insideLevel(level, from)) return []
  const width = level.tiles[0]?.length ?? 0
  const seen = new Uint8Array(width * level.tiles.length)
  const found: Cell[] = []
  const queue: Cell[] = [from]
  seen[from.row * width + from.col] = 1
  for (let at = 0; at < queue.length; at++) {
    const cell = queue[at] as Cell
    found.push(cell)
    for (const next of [
      { col: cell.col - 1, row: cell.row },
      { col: cell.col + 1, row: cell.row },
      { col: cell.col, row: cell.row - 1 },
      { col: cell.col, row: cell.row + 1 },
    ]) {
      if (kindAt(level, next) !== letter || seen[next.row * width + next.col] === 1) continue
      seen[next.row * width + next.col] = 1
      queue.push(next)
    }
  }
  return found
}
