import { loadGame, parseContent, writeContent } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import { fixtureFiles, readFrom } from './game/read.ts'
import { plainFiles } from './plain-game/read.ts'

test('the fixture game loads', async () => {
  const loaded = await loadGame(readFrom(fixtureFiles))
  expect(loaded.ok).toBe(true)
})

test('the plain game loads, with no art at all', async () => {
  const loaded = await loadGame(readFrom(plainFiles))
  expect(loaded.ok).toBe(true)
  if (loaded.ok) {
    expect(loaded.value.figures ?? {}).toEqual({})
    expect(loaded.value.levels['level-1']?.tileset).toBeUndefined()
  }
})

test('each content file is byte for byte what the framework writes', () => {
  for (const [files, path, type] of [
    [fixtureFiles, 'content/levels/level-1.json', 'level'],
    [fixtureFiles, 'content/characters/hero.json', 'character'],
    [fixtureFiles, 'content/characters/crate.json', 'character'],
    [fixtureFiles, 'content/tilesets/meadow.json', 'tileset'],
    [fixtureFiles, 'content/figures/hero.json', 'figure'],
    [fixtureFiles, 'content/figures/crate.json', 'figure'],
    [fixtureFiles, 'content/figures/meadow.json', 'figure'],
    [fixtureFiles, 'content/figures/tree.json', 'figure'],
    [fixtureFiles, 'content/backdrops/valley.json', 'backdrop'],
    [plainFiles, 'content/levels/level-1.json', 'level'],
    [plainFiles, 'content/characters/hero.json', 'character'],
    [plainFiles, 'content/characters/crate.json', 'character'],
  ] as const) {
    const text = files[path] ?? ''
    const parsed = parseContent(type, text, path)
    expect(parsed.ok, path).toBe(true)
    if (parsed.ok) expect(writeContent(type, parsed.value), path).toBe(text)
  }
})

test('the level is 16 by 9, a floor on the bottom row, a wall at each side, a crate and a start', async () => {
  const loaded = await loadGame(readFrom(fixtureFiles))
  if (!loaded.ok) throw new Error('the fixture did not load')
  const level = loaded.value.levels['level-1']
  expect(level?.tileset).toBe('meadow')
  expect(level?.backdrop).toBe('valley')
  expect(level?.tiles).toHaveLength(9)
  expect(level?.tiles.every((row) => row.length === 16)).toBe(true)
  expect(level?.tiles[8]).toBe('G'.repeat(16))
  for (const row of level?.tiles.slice(0, 8) ?? []) expect([row[0], row[15]]).toEqual(['G', 'G'])
  expect(level?.things).toEqual([{ id: 'crate-1', character: 'crate', x: 6.5, y: 7.5 }])
  expect(level?.starts).toEqual([{ player: 1, x: 2.5, y: 7.5 }])
})

test('the plain level has the same shape, in `#` tiles, with the crate and the start in the same places', async () => {
  const loaded = await loadGame(readFrom(plainFiles))
  if (!loaded.ok) throw new Error('the plain game did not load')
  const level = loaded.value.levels['level-1']
  expect(level?.tiles[8]).toBe('#'.repeat(16))
  expect(level?.things).toEqual([{ id: 'crate-1', character: 'crate', x: 6.5, y: 7.5 }])
  expect(level?.starts).toEqual([{ player: 1, x: 2.5, y: 7.5 }])
})

test('the fixture game’s hero and crate have figures, and the plain game’s have none', async () => {
  const art = await loadGame(readFrom(fixtureFiles))
  const plain = await loadGame(readFrom(plainFiles))
  if (!art.ok || !plain.ok) throw new Error('a fixture did not load')
  expect(art.value.characters.hero?.figure).toBe('hero')
  expect(art.value.characters.crate?.figure).toBe('crate')
  expect(plain.value.characters.hero?.figure).toBeUndefined()
  expect(plain.value.characters.crate?.figure).toBeUndefined()
})

test('readFrom rejects for a file that is not there, as a real read does', async () => {
  await expect(readFrom(fixtureFiles)('nope.json')).rejects.toThrow('no such file')
})
