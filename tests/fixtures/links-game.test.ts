import { loadGame, parseContent, writeContent } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import { readFrom } from './game/read.ts'
import { linksMap } from './links-game/read.ts'

test('the links game loads with no problem', async () => {
  const loaded = await loadGame(readFrom(linksMap()))
  expect(loaded.ok).toBe(true)
})

test('each content file is byte for byte what the framework writes', async () => {
  const files = linksMap()
  const loaded = await loadGame(readFrom(files))
  if (!loaded.ok) throw new Error('the links game did not load')
  for (const ref of loaded.value.project.content) {
    const text = files.get(ref.path) ?? ''
    const parsed = parseContent(ref.type, text, ref.path)
    expect(parsed.ok, ref.path).toBe(true)
    if (parsed.ok) expect(writeContent(ref.type, parsed.value as never), ref.path).toBe(text)
  }
})

test('it has three rooms, a hero that moves and a world file that places them', async () => {
  const loaded = await loadGame(readFrom(linksMap()))
  if (!loaded.ok) throw new Error('the links game did not load')
  expect(Object.keys(loaded.value.levels).sort()).toEqual(['room-1', 'room-2', 'room-3'])
  expect(loaded.value.characters.hero?.moves?.tuning).toBe('hero-moves')
  expect(loaded.value.worlds?.world?.levels.map((l) => l.level)).toEqual(['room-1', 'room-2', 'room-3'])
})

test("room-1's right edge is open where room-2's left edge is solid, so pushing them together makes a wall", async () => {
  const loaded = await loadGame(readFrom(linksMap()))
  if (!loaded.ok) throw new Error('the links game did not load')
  const edge = (room: string, side: 'left' | 'right'): string[] =>
    (loaded.value.levels[room]?.tiles ?? []).map(
      (row) => (side === 'left' ? row[0] : row[row.length - 1]) ?? '',
    )
  // Rows 5 to 7 (counting from 0) are the lower rows.
  for (const row of [5, 6, 7]) {
    expect(edge('room-1', 'right')[row]).toBe('.')
    expect(edge('room-2', 'left')[row]).toBe('#')
    // Room 2 and room 3 still join there: open on the right, open on the left.
    expect(edge('room-2', 'right')[row]).toBe('.')
    expect(edge('room-3', 'left')[row]).toBe('.')
  }
})
