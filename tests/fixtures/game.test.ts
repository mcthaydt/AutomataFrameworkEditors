import { loadGame, parseContent, writeContent } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import { fixtureBytes, fixtureFiles, readFrom } from './game/read.ts'

test('the fixture game loads', async () => {
  const loaded = await loadGame(readFrom(fixtureFiles))
  expect(loaded.ok).toBe(true)
})

test('each content file is byte for byte what the framework writes', () => {
  for (const [path, type] of [
    ['content/levels/level-1.json', 'level'],
    ['content/characters/hero.json', 'character'],
    ['content/characters/crate.json', 'character'],
    ['content/tunings/hero-moves.json', 'tuning'],
    ['content/tilesets/ground.json', 'tileset'],
  ] as const) {
    const text = fixtureFiles[path] ?? ''
    const parsed = parseContent(type, text, path)
    expect(parsed.ok, path).toBe(true)
    if (parsed.ok) expect(writeContent(type, parsed.value), path).toBe(text)
  }
})

test('the level is 16 by 9, a floor on the bottom row, a wall at each side, a crate and a start', async () => {
  const loaded = await loadGame(readFrom(fixtureFiles))
  if (!loaded.ok) throw new Error('the fixture did not load')
  const level = loaded.value.levels['level-1']
  expect(level?.tiles).toHaveLength(9)
  expect(level?.tiles.every((row) => row.length === 16)).toBe(true)
  expect(level?.tiles[8]).toBe('#'.repeat(16))
  for (const row of level?.tiles.slice(0, 8) ?? []) expect([row[0], row[15]]).toEqual(['#', '#'])
  expect(level?.things).toEqual([{ id: 'crate-1', character: 'crate', x: 6.5, y: 7.5 }])
  expect(level?.starts).toEqual([{ player: 1, x: 2.5, y: 7.5 }])
})

test('readFrom rejects for a file that is not there, as a real read does', async () => {
  await expect(readFrom(fixtureFiles)('nope.json')).rejects.toThrow('no such file')
})

test('the hero moves: its character names a tuning file the game lists, so startGame has controls', async () => {
  const loaded = await loadGame(readFrom(fixtureFiles))
  if (!loaded.ok) throw new Error('the fixture did not load')
  expect(loaded.value.characters.hero?.moves).toEqual({
    tuning: 'hero-moves',
    'double-jump': false,
    'wall-jump': false,
    dash: false,
  })
  expect(loaded.value.tunings?.['hero-moves']?.controls?.length).toBeGreaterThan(0)
})

test('the crate says how heavy it is, and has no weight of its own yet', async () => {
  const loaded = await loadGame(readFrom(fixtureFiles))
  if (!loaded.ok) throw new Error('the fixture did not load')
  expect(loaded.value.characters.crate?.values).toEqual([
    { id: 'heavy', name: 'How heavy', type: 'number', least: 0.5, most: 4, step: 0.5, default: 1 },
  ])
})

test('the level uses a tileset with ground and water, and its picture is two squares of 16', async () => {
  const loaded = await loadGame(readFrom(fixtureFiles))
  if (!loaded.ok) throw new Error('the fixture did not load')
  expect(loaded.value.levels['level-1']?.tileset).toBe('ground')
  const tileset = loaded.value.tilesets?.ground
  expect(tileset?.tiles.map((t) => [t.letter, t.solid])).toEqual([
    ['#', true],
    ['~', false],
  ])
  expect([tileset?.tileSize, tileset?.columns, tileset?.image]).toEqual([16, 2, 'art/ground.png'])
  const picture = fixtureBytes()['art/ground.png']
  if (picture === undefined) throw new Error('the fixture has no picture')
  // A PNG: its signature, then the IHDR chunk with the width and height (big-endian) at bytes 16 to 23.
  expect([...picture.slice(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10])
  const view = new DataView(picture.buffer, picture.byteOffset, picture.byteLength)
  expect([view.getUint32(16), view.getUint32(20)]).toEqual([32, 16])
})
