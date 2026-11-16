import { type Level, loadGame } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import { change, readerOf, startEdits, toPut, undo } from '#src/features/game/changes.ts'
import {
  copyLevel,
  deleteLevel,
  newLevel,
  nextLevelId,
  renameLevel,
} from '#src/features/levels/level-files.ts'
import { fixtureFiles } from '../../fixtures/game/read.ts'
import { linksFiles } from '../../fixtures/links-game/links.ts'
import { openedGame } from '../../fixtures/open-game.ts'

const links = await openedGame(linksFiles())
const crate = await openedGame(fixtureFiles)
const working = startEdits(links).now

const worked = (done: { ok: boolean }): typeof working => {
  if (!('value' in done)) throw new Error('expected a working game')
  return done.value as typeof working
}
/** The game as the edits would write it, loaded the way the framework loads any game. */
const loads = async (game: typeof links, edits: ReturnType<typeof startEdits>) =>
  (await loadGame(readerOf(game, edits))).ok
const textOf = async (game: typeof links, edits: ReturnType<typeof startEdits>, path: string) =>
  readerOf(game, edits)(path)

test('a new level number is one past the highest in use', () => {
  expect(nextLevelId(working)).toBe('level-1')
  expect(nextLevelId(startEdits(crate).now)).toBe('level-2')
  const gappy = { ...working, levels: { ...working.levels, 'level-7': working.levels['room-1'] as Level } }
  expect(nextLevelId(gappy)).toBe('level-8')
})

test('a new level in the links game is full of floor, has its goal and starts, and is listed in levels', async () => {
  const made = newLevel(working, links.content, { x: 0, y: 12 })
  expect(made.id).toBe('level-1')
  const level = made.working.levels['level-1'] as Level
  expect(level.tiles).toHaveLength(9)
  expect(level.tiles.every((row) => row.length === 16)).toBe(true)
  expect(level.tiles[8]).toBe('################')
  expect(level.tiles.slice(0, 8).every((row) => row === '................')).toBe(true)
  expect(level.starts).toEqual([
    { player: 1, x: 2.5, y: 7.5 },
    { player: 2, x: 3.5, y: 7.5 },
  ])
  expect(level.things).toEqual([{ id: 'goal-1', character: 'goal', x: 13.5, y: 7.5 }])
  expect(made.working.world?.levels.at(-1)).toEqual({ level: 'level-1', at: { x: 0, y: 12 } })
  const edits = change(startEdits(links), made.working)
  expect(await loads(links, edits)).toBe(true)
  expect(await textOf(links, edits, 'automata.toml')).toContain(
    'levels = ["room-1", "room-2", "room-3", "level-1"]',
  )
  expect(toPut(links, edits).files.map((f) => f.path)).toContain('content/levels/level-1.json')
})

test('a new level in the crate game is level-2, with no goal, one start, the same tileset, and no levels line', async () => {
  const start = startEdits(crate)
  const made = newLevel(start.now, crate.content, { x: 0, y: 12 })
  expect(made.id).toBe('level-2')
  const level = made.working.levels['level-2'] as Level
  expect(level).toMatchObject({ tileset: 'ground', things: [], starts: [{ player: 1, x: 2.5, y: 7.5 }] })
  expect(made.working.world?.levels).toEqual([
    { level: 'level-1', at: { x: 0, y: 0 } },
    { level: 'level-2', at: { x: 0, y: 12 } },
  ])
  const edits = change(start, made.working)
  expect(await loads(crate, edits)).toBe(true)
  expect(await textOf(crate, edits, 'automata.toml')).not.toContain('levels =')
})

test('a new level made beside a picked level takes its look', () => {
  const painted = {
    ...working,
    levels: {
      ...working.levels,
      'room-2': { ...(working.levels['room-2'] as Level), sky: '#112233', ground: '#445566' },
    },
  }
  const beside = newLevel(painted, links.content, { x: 0, y: 12 }, 'room-2').working.levels['level-1']
  expect(beside).toMatchObject({ sky: '#112233', ground: '#445566' })
  const start = newLevel(painted, links.content, { x: 0, y: 12 }).working.levels['level-1']
  expect(start?.sky).toBeUndefined()
})

test('renaming room-2 to Cellar mends the project, the world file and the door that led to it', async () => {
  const renamed = worked(renameLevel(working, 'room-2', 'Cellar'))
  expect(Object.keys(renamed.levels)).toEqual(['room-1', 'cellar', 'room-3'])
  expect((renamed.levels.cellar as Level).id).toBe('cellar')
  expect(renamed.world?.levels.map((l) => l.level)).toEqual(['room-1', 'cellar', 'room-3'])
  expect(renamed.levels['room-1']?.things.find((t) => t.id === 'exit')?.values).toEqual({
    to: { level: 'cellar', thing: 'door-in' },
  })
  const edits = change(startEdits(links), renamed)
  const put = toPut(links, edits)
  expect(put.files.find((f) => f.path === 'content/levels/room-2.json')?.value).toBeUndefined()
  expect(put.files.map((f) => f.path)).toContain('content/levels/cellar.json')
  expect(put.project).toEqual({
    add: [{ type: 'level', path: 'content/levels/cellar.json' }],
    remove: ['content/levels/room-2.json'],
    rename: { 'room-2': 'cellar' },
  })
  const text = await textOf(links, edits, 'automata.toml')
  expect(text).toContain('levels = ["room-1", "cellar", "room-3"]')
  expect(text).not.toContain('room-2')
  expect(await loads(links, edits)).toBe(true)
})

test('renaming the level the game starts in moves start with it', async () => {
  const edits = change(startEdits(links), worked(renameLevel(working, 'room-1', 'Hall')))
  expect(await textOf(links, edits, 'automata.toml')).toContain('start = "hall"')
  expect(await loads(links, edits)).toBe(true)
})

test('a level renamed twice is one rename from the id it had, and renamed back is none', async () => {
  const once = worked(renameLevel(working, 'room-2', 'Cellar'))
  const twice = worked(renameLevel(once, 'cellar', 'Vault'))
  expect(twice.renames).toEqual({ 'room-2': 'vault' })
  expect(toPut(links, change(startEdits(links), twice)).project?.rename).toEqual({ 'room-2': 'vault' })
  const back = worked(renameLevel(twice, 'vault', 'Room 2'))
  expect(back.renames).toBeUndefined()
  expect(back).toEqual(working)
})

test('a name that is taken, the same, nonsense or for no level is refused', () => {
  expect(renameLevel(working, 'room-2', 'Room 3')).toEqual({ ok: false, why: 'taken' })
  expect(renameLevel(working, 'room-2', 'room 2')).toEqual({ ok: false, why: 'same' })
  expect(renameLevel(working, 'room-2', '!!!')).toEqual({ ok: false, why: 'not-allowed' })
  expect(renameLevel(working, 'room-9', 'Cellar')).toEqual({ ok: false, why: 'no-such-thing' })
})

test('a rename that is put in is not asked for again, and a level made then renamed is just a new level', () => {
  const made = newLevel(working, links.content, { x: 0, y: 12 })
  const named = worked(renameLevel(made.working, 'level-1', 'Attic'))
  const put = toPut(links, change(startEdits(links), named))
  expect(put.project).toEqual({ add: [{ type: 'level', path: 'content/levels/attic.json' }] })
})

test('deleting room-2 takes its way out of the door, and one undo brings everything back', async () => {
  const gone = worked(deleteLevel(working, 'room-2'))
  expect(Object.keys(gone.levels)).toEqual(['room-1', 'room-3'])
  expect(gone.world?.levels.map((l) => l.level)).toEqual(['room-1', 'room-3'])
  expect(gone.levels['room-1']?.things.find((t) => t.id === 'exit')).toEqual({
    id: 'exit',
    character: 'door',
    x: 13.5,
    y: 7,
  })
  const edits = change(startEdits(links), gone)
  expect(await loads(links, edits)).toBe(true)
  expect(await textOf(links, edits, 'automata.toml')).toContain('levels = ["room-1", "room-3"]')
  const back = undo(edits).now
  expect(back).toEqual(working)
  expect(back.levels['room-1']?.things.find((t) => t.id === 'exit')?.values).toEqual({
    to: { level: 'room-2', thing: 'door-in' },
  })
})

test('the start level, the last level and a level that is not there are not deleted', () => {
  expect(deleteLevel(working, 'room-1')).toEqual({ ok: false, why: 'not-allowed' })
  expect(
    deleteLevel({ ...working, levels: { 'room-2': working.levels['room-2'] as Level } }, 'room-2'),
  ).toEqual({
    ok: false,
    why: 'not-allowed',
  })
  expect(deleteLevel(working, 'room-9')).toEqual({ ok: false, why: 'no-such-thing' })
  const hall = worked(renameLevel(working, 'room-1', 'Hall'))
  expect(deleteLevel(hall, 'hall')).toEqual({ ok: false, why: 'not-allowed' })
})

test('deleting a level that was renamed does not leave its rename behind', () => {
  const cellar = worked(renameLevel(working, 'room-2', 'Cellar'))
  const gone = worked(deleteLevel(cellar, 'cellar'))
  expect(gone.renames).toBeUndefined()
  const put = toPut(links, change(startEdits(links), gone))
  expect(put.project).toEqual({ remove: ['content/levels/room-2.json'] })
})

test('a copy is a new level with the same things, put on the map where it is dropped', async () => {
  const made = copyLevel(working, 'room-2', { x: 0, y: 12 })
  expect(made.id).toBe('level-1')
  expect(made.working.levels['level-1']).toEqual({ ...working.levels['room-2'], id: 'level-1' })
  expect(made.working.world?.levels.at(-1)).toEqual({ level: 'level-1', at: { x: 0, y: 12 } })
  expect(await loads(links, change(startEdits(links), made.working))).toBe(true)
  expect(copyLevel(working, 'room-9', { x: 0, y: 0 })).toEqual({ working, id: '' })
})
