import type { Level } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import { change, type Edits, isChanged, startEdits, toPut, undo } from '#src/features/game/changes.ts'
import { dropDrafts, keepDrafts, takeDrafts } from '#src/features/game/drafts.ts'
import { levelOf, placed, roomText, slide } from '../../fixtures/edits.ts'
import { linksFiles } from '../../fixtures/links-game/links.ts'
import { openedGame } from '../../fixtures/open-game.ts'
import { brokenStore, fullStore, memoryStore } from '../../fixtures/store.ts'

const ROOM_1 = 'content/levels/room-1.json'
const ROOM_2 = 'content/levels/room-2.json'
const ROOM_4 = 'content/levels/room-4.json'
const WORLD = 'content/worlds/world.json'
const KEY = 'af.draft:grandma/links-game:'

const links = (over: Record<string, string | undefined> = {}) => openedGame(linksFiles(over))
const level = levelOf

test('nothing kept is nothing taken', async () => {
  const game = await links()
  expect(takeDrafts(memoryStore(), game)).toBeUndefined()
})

test('keep then take gives the same now: a moved level, a new one, one taken away and the world', async () => {
  const game = await links()
  const start = startEdits(game)
  const { 'room-3': _gone, ...rest } = start.now.levels
  const room4: Level = { ...level(start, 'room-2'), id: 'room-4' }
  const world = placed(start, { level: 'room-4', at: { x: 40, y: 0 } })
  const edits = slide(change(start, { ...start.now, levels: { ...rest, 'room-4': room4 }, world }), 6.5)
  const store = memoryStore()
  keepDrafts(store, game, edits)
  const taken = takeDrafts(store, game)
  expect(taken?.moved).toEqual([])
  expect(taken?.edits.now).toEqual(edits.now)
  expect(taken?.edits.base).toEqual(edits.base)
  expect(toPut(game, taken?.edits as Edits)).toEqual(toPut(game, edits))
})

test('there is one key for each changed file, named by the game and the path', async () => {
  const game = await links()
  const store = memoryStore()
  keepDrafts(store, game, slide(startEdits(game), 6.5))
  expect(store.length).toBe(1)
  expect(store.key(0)).toBe(`${KEY}${ROOM_1}`)
  const kept = JSON.parse(store.getItem(`${KEY}${ROOM_1}`) ?? '')
  expect(kept).toEqual({
    version: game.files.get(ROOM_1)?.version,
    base: game.files.get(ROOM_1)?.text,
    text: roomText(level(slide(startEdits(game), 6.5), 'room-1')),
  })
})

test('a file that is no longer changed loses its key', async () => {
  const game = await links()
  const store = memoryStore()
  const moved = slide(startEdits(game), 6.5)
  keepDrafts(store, game, moved)
  expect(store.length).toBe(1)
  keepDrafts(store, game, undo(moved))
  expect(store.length).toBe(0)
  expect(takeDrafts(store, game)).toBeUndefined()
})

test('a key for another game is never touched', async () => {
  const game = await links()
  const store = memoryStore()
  store.setItem('af.draft:grandma/other-game:content/levels/x.json', 'kept')
  keepDrafts(store, game, slide(startEdits(game), 6.5))
  keepDrafts(store, game, startEdits(game))
  dropDrafts(store, game)
  expect(store.length).toBe(1)
  expect(takeDrafts(store, game)).toBeUndefined()
})

test('dropping the drafts takes every key of the game away', async () => {
  const game = await links()
  const store = memoryStore()
  keepDrafts(store, game, slide(startEdits(game), 6.5))
  dropDrafts(store, game)
  expect(store.length).toBe(0)
})

test('garbage is removed, and the rest of the drafts are still taken (Review Focus 3)', async () => {
  const game = await links()
  const store = memoryStore()
  const moved = slide(startEdits(game), 6.5)
  keepDrafts(store, game, moved)
  const version = game.files.get(ROOM_2)?.version
  const text = roomText(level(moved, 'room-2'))
  const bad: Record<string, string> = {
    'content/levels/room-3.json': 'not json {',
    'content/levels/room-5.json': JSON.stringify({ version: 'x', base: 'y' }),
    [ROOM_2]: JSON.stringify({ version, level: level(moved, 'room-2') }),
    'content/characters/crate.json': JSON.stringify({ version, base: text, text }),
    'content/levels/gone.json': JSON.stringify({ version, base: text, text }),
    [ROOM_4]: JSON.stringify({ version: null, base: null, text: '{"id":7}' }),
    'content/levels/room-6.json': JSON.stringify({ version: null, base: null, text }),
    'content/worlds/other.json': JSON.stringify({ version: null, base: null, text: 'null' }),
    'content/levels/odd.json': 'null',
  }
  for (const [path, value] of Object.entries(bad)) store.setItem(`${KEY}${path}`, value)
  const taken = takeDrafts(store, game)
  expect(taken?.edits.now).toEqual(moved.now)
  expect(store.length).toBe(1)
  expect(store.key(0)).toBe(`${KEY}${ROOM_1}`)
})

test('a file that moved on in the game comes back in moved, with the base it started from (Review Focus 2)', async () => {
  const game = await links()
  const store = memoryStore()
  const mine = slide(startEdits(game), 6.5)
  keepDrafts(store, game, mine)
  const theirRoom: Level = { ...level(startEdits(game), 'room-1'), sky: '#445566' }
  const newer = await links({ [ROOM_1]: roomText(theirRoom) })
  const taken = takeDrafts(store, newer)
  expect(taken?.moved).toEqual([ROOM_1])
  expect(store.length).toBe(1)
  // Mine is what I changed; the base is the file I started from; the game's own is the other side.
  expect(taken?.edits.now.levels['room-1']).toEqual(level(mine, 'room-1'))
  expect(taken?.edits.base.levels['room-1']).toEqual(level(startEdits(game), 'room-1'))
  expect(startEdits(newer).now.levels['room-1']).toEqual(theirRoom)
})

test('a level made here whose name was taken in the game meanwhile comes back in moved, with no base', async () => {
  const game = await links()
  const store = memoryStore()
  const start = startEdits(game)
  const room4: Level = { ...level(start, 'room-2'), id: 'room-4' }
  keepDrafts(store, game, change(start, { ...start.now, levels: { ...start.now.levels, 'room-4': room4 } }))
  const theirs: Level = { ...room4, sky: '#445566' }
  const taken = takeDrafts(store, await links({ [ROOM_4]: roomText(theirs) }))
  expect(taken?.moved).toEqual([ROOM_4])
  expect(taken?.edits.now.levels['room-4']).toEqual(room4)
  expect(taken?.edits.base.levels['room-4']).toBeUndefined()
})

test('a level taken away is kept as taken away, and a world changed is kept as the world', async () => {
  const game = await links()
  const store = memoryStore()
  const start = startEdits(game)
  const { 'room-3': _gone, ...rest } = start.now.levels
  const edits = change(start, { ...start.now, levels: rest })
  keepDrafts(store, game, edits)
  expect(JSON.parse(store.getItem(`${KEY}content/levels/room-3.json`) ?? '').text).toBeNull()
  const taken = takeDrafts(store, game)
  expect(Object.keys(taken?.edits.now.levels ?? {})).toEqual(['room-1', 'room-2'])
  expect(isChanged(taken?.edits as Edits)).toBe(true)
  expect(taken?.edits.now.world).toEqual(start.now.world)
})

test('a world changed is kept under the world file, and taken as the world', async () => {
  const game = await links()
  const store = memoryStore()
  const start = startEdits(game)
  const world = placed(start, { level: 'room-1', at: { x: 0, y: 12 } })
  keepDrafts(store, game, change(start, { ...start.now, world }))
  expect(store.length).toBe(1)
  expect(store.key(0)).toBe(`${KEY}${WORLD}`)
  const taken = takeDrafts(store, game)
  expect(taken?.moved).toEqual([])
  expect(taken?.edits.now.world).toEqual(world)
  expect(taken?.edits.now.levels).toEqual(start.now.levels)
})

test('a full store, and a store that throws, lose nothing and break nothing', async () => {
  const game = await links()
  const moved = slide(startEdits(game), 6.5)
  expect(() => keepDrafts(fullStore(), game, moved)).not.toThrow()
  expect(() => keepDrafts(brokenStore(), game, moved)).not.toThrow()
  expect(takeDrafts(brokenStore(), game)).toBeUndefined()
  expect(() => dropDrafts(brokenStore(), game)).not.toThrow()
  const held = memoryStore()
  keepDrafts(held, game, moved)
  expect(() => keepDrafts(fullStore(held), game, startEdits(game))).not.toThrow()
})
