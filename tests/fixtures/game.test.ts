import { loadGame, parseContent, writeContent } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import { fixtureFiles, readFrom } from './game/read.ts'

test('the fixture game loads', async () => {
  const loaded = await loadGame(readFrom(fixtureFiles))
  expect(loaded.ok).toBe(true)
})

test('each content file is byte for byte what the framework writes', () => {
  for (const [path, type] of [
    ['content/levels/level-1.json', 'level'],
    ['content/characters/hero.json', 'character'],
    ['content/characters/crate.json', 'character'],
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
