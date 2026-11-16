import { type Level, loadGame, PROJECT_FILE, writeContent } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import { changeProject } from '#src/features/files/files.ts'
import {
  afterPut,
  change,
  HISTORY,
  inLevel,
  isChanged,
  readerOf,
  redo,
  startEdits,
  toPut,
  undo,
} from '#src/features/game/changes.ts'
import type { PutAnswer } from '#src/features/wire/wire.ts'
import { levelOf, placed, slide } from '../../fixtures/edits.ts'
import { blobSha } from '../../fixtures/fake-github/repos.ts'
import { fixtureFiles } from '../../fixtures/game/read.ts'
import { linksFiles } from '../../fixtures/links-game/links.ts'
import { openedGame } from '../../fixtures/open-game.ts'

const ROOM_1 = 'content/levels/room-1.json'
const ROOM_2 = 'content/levels/room-2.json'
const ROOM_4 = 'content/levels/room-4.json'
const WORLD = 'content/worlds/world.json'

const links = () => openedGame(linksFiles())
const level = levelOf

test('a game as opened has nothing changed and nothing to put in', async () => {
  const game = await links()
  const edits = startEdits(game)
  expect(isChanged(edits)).toBe(false)
  expect(toPut(game, edits)).toEqual({ files: [], project: undefined })
  expect(edits.now.world?.id).toBe('world')
  expect(Object.keys(edits.now.levels)).toEqual(['room-1', 'room-2', 'room-3'])
  expect(edits.now.project).toBe(game.files.get(PROJECT_FILE)?.text)
})

test('a move and its undo leave nothing changed and nothing to put in', async () => {
  const game = await links()
  const moved = slide(startEdits(game), 6.5)
  expect(isChanged(moved)).toBe(true)
  expect(toPut(game, moved).files).toHaveLength(1)
  const back = undo(moved)
  expect(isChanged(back)).toBe(false)
  expect(toPut(game, back)).toEqual({ files: [], project: undefined })
})

test('a move and the same thing moved back is no change, though two steps were taken', async () => {
  const game = await links()
  const edits = slide(slide(startEdits(game), 6.5), 5.5)
  expect(edits.past).toHaveLength(2)
  expect(isChanged(edits)).toBe(false)
  expect(toPut(game, edits).files).toEqual([])
})

test('undo then redo is the same now', async () => {
  const game = await links()
  const moved = slide(startEdits(game), 6.5)
  expect(redo(undo(moved)).now).toEqual(moved.now)
  expect(undo(startEdits(game))).toEqual(startEdits(game))
  expect(redo(moved)).toBe(moved)
})

test('a change after an undo empties what redo would bring back', async () => {
  const game = await links()
  const two = slide(slide(startEdits(game), 6.5), 7.5)
  const one = undo(two)
  expect(one.future).toHaveLength(1)
  const other = slide(one, 9.5)
  expect(other.future).toEqual([])
  expect(redo(other)).toBe(other)
})

test('a change that gives the same value is not a step, and a level the game lacks is left alone', async () => {
  const game = await links()
  const edits = startEdits(game)
  expect(change(edits, edits.now)).toBe(edits)
  expect(inLevel(edits, 'room-1', (l) => ({ ...l }))).toBe(edits)
  expect(inLevel(edits, 'nowhere', (l) => ({ ...l, sky: '#000000' }))).toBe(edits)
})

test('201 changes keep 200 steps, and the oldest is the one dropped', async () => {
  const game = await links()
  let edits = startEdits(game)
  for (let i = 1; i <= 201; i += 1) edits = slide(edits, 5.5 + i / 10)
  expect(HISTORY).toBe(200)
  expect(edits.past).toHaveLength(200)
  expect(edits.past[0]?.levels['room-1']?.things[0]?.x).toBe(5.5 + 1 / 10)
  let back = edits
  for (let i = 0; i < 300; i += 1) back = undo(back)
  expect(back.past).toEqual([])
  expect(back.future).toHaveLength(200)
})

test('a changed level is one put file with the version it started from', async () => {
  const game = await links()
  const moved = slide(startEdits(game), 6.5)
  const { files, project } = toPut(game, moved)
  expect(project).toBeUndefined()
  expect(files).toEqual([
    { path: ROOM_1, value: level(moved, 'room-1'), version: game.files.get(ROOM_1)?.version },
  ])
})

test('a new level is a new file with no version, and a line for the project', async () => {
  const game = await links()
  const room4: Level = { ...level(startEdits(game), 'room-2'), id: 'room-4' }
  const edits = change(startEdits(game), {
    ...startEdits(game).now,
    levels: { ...startEdits(game).now.levels, 'room-4': room4 },
  })
  const put = toPut(game, edits)
  expect(put.files).toEqual([{ path: ROOM_4, value: room4, version: undefined }])
  expect(put.project).toEqual({ add: [{ type: 'level', path: ROOM_4 }] })
})

test('a level taken away is a put file with no value, and the project forgets it', async () => {
  const game = await links()
  const start = startEdits(game)
  const { 'room-2': _gone, ...rest } = start.now.levels
  const edits = change(start, { ...start.now, levels: rest })
  const put = toPut(game, edits)
  expect(put.files).toEqual([{ path: ROOM_2, value: undefined, version: game.files.get(ROOM_2)?.version }])
  expect(put.project).toEqual({ remove: [ROOM_2] })
})

test('a level made and another taken away are in one put, in a fixed order, with the world last', async () => {
  const game = await links()
  const start = startEdits(game)
  const { 'room-2': _gone, ...rest } = start.now.levels
  const room4: Level = { ...level(start, 'room-1'), id: 'room-4' }
  const edits = change(start, {
    ...start.now,
    levels: { ...rest, 'room-4': room4 },
    world: placed(start, { level: 'room-4', at: { x: 40, y: 0 } }),
  })
  const put = toPut(game, edits)
  expect(put.files.map((f) => f.path)).toEqual([ROOM_4, ROOM_2, WORLD])
  expect(put.project).toEqual({ add: [{ type: 'level', path: ROOM_4 }], remove: [ROOM_2] })
})

test('a changed world file is one put file at the path the project lists', async () => {
  const game = await links()
  const start = startEdits(game)
  const moved = placed(start, { level: 'room-1', at: { x: 0, y: 12 } })
  const edits = change(start, { ...start.now, world: moved })
  const put = toPut(game, edits)
  expect(put.files.map((f) => [f.path, f.version])).toEqual([[WORLD, game.files.get(WORLD)?.version]])
  expect(put.project).toBeUndefined()
})

test('a game with no world file gets a new one at content/worlds, listed by the project', async () => {
  const game = await openedGame(fixtureFiles, {}, { owner: 'grandma', name: 'crate-game' })
  const start = startEdits(game)
  expect(start.now.world).toBeUndefined()
  const world = { format: 1 as const, id: 'world', levels: [{ level: 'level-1', at: { x: 0, y: 0 } }] }
  const put = toPut(game, change(start, { ...start.now, world }))
  expect(put.files).toEqual([{ path: WORLD, value: world, version: undefined }])
  expect(put.project).toEqual({ add: [{ type: 'world', path: WORLD }] })
})

test('readerOf gives writeContent for a changed level and the opened bytes for the rest', async () => {
  const game = await links()
  const moved = slide(startEdits(game), 6.5)
  const read = readerOf(game, moved)
  expect(await read(ROOM_1)).toBe(writeContent('level', level(moved, 'room-1') as never))
  expect(await read(ROOM_1)).not.toBe(game.files.get(ROOM_1)?.text)
  expect(await read(ROOM_2)).toBe(game.files.get(ROOM_2)?.text)
  expect(await read(PROJECT_FILE)).toBe(game.files.get(PROJECT_FILE)?.text)
  await expect(read('content/levels/none.json')).rejects.toThrow('no such file')
})

test('readerOf lists a new level in the project, and the framework loads the edited game', async () => {
  const game = await links()
  const start = startEdits(game)
  const room4: Level = { ...level(start, 'room-2'), id: 'room-4' }
  const edits = change(start, { ...start.now, levels: { ...start.now.levels, 'room-4': room4 } })
  const read = readerOf(game, edits)
  expect(await read(ROOM_4)).toBe(writeContent('level', room4 as never))
  const text = game.files.get(PROJECT_FILE)?.text ?? ''
  expect(await read(PROJECT_FILE)).toBe(changeProject(text, { add: [{ type: 'level', path: ROOM_4 }] }))
  const loaded = await loadGame(read)
  expect(loaded.ok).toBe(true)
  if (loaded.ok) expect(Object.keys(loaded.value.levels)).toContain('room-4')
})

test('readerOf refuses a level taken away', async () => {
  const game = await links()
  const start = startEdits(game)
  const { 'room-3': _gone, ...rest } = start.now.levels
  const read = readerOf(game, change(start, { ...start.now, levels: rest }))
  await expect(read('content/levels/room-3.json')).rejects.toThrow('no such file')
})

test('afterPut gives the game the new versions and texts, and moves base up to now', async () => {
  const game = await links()
  const moved = slide(startEdits(game), 6.5)
  const text = writeContent('level', level(moved, 'room-1') as never)
  const answer: PutAnswer = { how: 'direct', versions: { [ROOM_1]: blobSha(text) }, mine: undefined }
  const after = afterPut(game, moved, answer)
  expect(after.game.files.get(ROOM_1)).toEqual({ path: ROOM_1, text, version: blobSha(text) })
  expect(after.game.content.levels['room-1']).toEqual(level(moved, 'room-1'))
  expect(after.game.files.get(ROOM_2)).toEqual(game.files.get(ROOM_2))
  expect(isChanged(after.edits)).toBe(false)
  expect(toPut(after.game, after.edits).files).toEqual([])
  expect(after.edits.past).toEqual(moved.past)
  expect(undo(after.edits).now.levels['room-1']).toEqual(game.content.levels['room-1'])
})

test('afterPut for a new level and a level taken away lists the new project and drops the file', async () => {
  const game = await links()
  const start = startEdits(game)
  const { 'room-3': _gone, ...rest } = start.now.levels
  const room4: Level = { ...level(start, 'room-2'), id: 'room-4' }
  const edits = change(start, { ...start.now, levels: { ...rest, 'room-4': room4 } })
  const projectText = changeProject(game.files.get(PROJECT_FILE)?.text ?? '', {
    add: [{ type: 'level', path: ROOM_4 }],
    remove: ['content/levels/room-3.json'],
  })
  if (projectText === undefined) throw new Error('the project reads')
  const text = writeContent('level', room4 as never)
  const answer: PutAnswer = {
    how: 'direct',
    versions: { [ROOM_4]: blobSha(text) },
    project: { path: PROJECT_FILE, text: projectText, version: blobSha(projectText) },
    mine: undefined,
  }
  const after = afterPut(game, edits, answer)
  expect(after.game.files.has('content/levels/room-3.json')).toBe(false)
  expect(after.game.files.get(ROOM_4)?.text).toBe(text)
  expect(after.game.files.get(PROJECT_FILE)?.text).toBe(projectText)
  expect(after.game.content.project.content.map((ref) => ref.path)).toContain(ROOM_4)
  expect(after.edits.now.project).toBe(projectText)
  expect(isChanged(after.edits)).toBe(false)
  expect(toPut(after.game, after.edits)).toEqual({ files: [], project: undefined })
})

test('afterPut keeps my own waiting change that the answer names', async () => {
  const game = await links()
  const moved = slide(startEdits(game), 6.5)
  const mine = { number: 3, title: 'A move', by: 'grandma', mine: true, checks: 'none' as const }
  const text = writeContent('level', level(moved, 'room-1') as never)
  const after = afterPut(game, moved, { how: 'suggestion', versions: { [ROOM_1]: blobSha(text) }, mine })
  expect(after.game.mine).toEqual(mine)
})
