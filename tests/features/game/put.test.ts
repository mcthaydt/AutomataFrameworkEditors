import { type Level, PROJECT_FILE, writeContent } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import type { Api } from '#src/features/api/api.ts'
import { change, isChanged, startEdits, toPut } from '#src/features/game/changes.ts'
import { cameIn } from '#src/features/game/merge.ts'
import { laidOver, type PutResult, put, takeBack } from '#src/features/game/put.ts'
import type { Answer, OpenAnswer, PutAnswer, PutAsk, Waiting } from '#src/features/wire/wire.ts'
import { levelOf, slide } from '../../fixtures/edits.ts'
import { blobSha } from '../../fixtures/fake-github/repos.ts'
import { linksFiles } from '../../fixtures/links-game/links.ts'
import { openedGame } from '../../fixtures/open-game.ts'
import { OPEN_REF } from '../../fixtures/open-game-with.ts'

const ROOM_1 = 'content/levels/room-1.json'
const links = () => openedGame(linksFiles())
const wireOf = (files: Record<string, string | undefined>) =>
  Object.entries(files).flatMap(([path, text]) =>
    text === undefined ? [] : [{ path, text, version: blobSha(text) }],
  )

/** An API that answers a put with `answer`, opens the game from `files`, and notes what it was asked. */
function pretend(answer: Answer<PutAnswer>, files = linksFiles()) {
  const asked: { puts: PutAsk[]; opens: number; turnedDown: number[] } = {
    puts: [],
    opens: 0,
    turnedDown: [],
  }
  const api = {
    put: async (ask: PutAsk) => {
      asked.puts.push(ask)
      return answer
    },
    open: async (): Promise<Answer<OpenAnswer>> => {
      asked.opens += 1
      return {
        ok: true,
        value: {
          game: OPEN_REF,
          login: 'grandma',
          level: 'owner',
          branch: 'main',
          mine: undefined,
          waiting: 0,
          turnedDown: undefined,
          files: wireOf(files),
          editors: { format: 1, problems: 'warn' },
          people: [],
          pictures: [],
        },
      }
    },
    turnDown: async (ask: { number: number }) => {
      asked.turnedDown.push(ask.number)
      return { ok: true, value: true } as const
    },
  } as unknown as Api
  return { api, asked }
}
const good: Answer<PutAnswer> = {
  ok: true,
  value: { how: 'direct', versions: { [ROOM_1]: 'v2' }, mine: undefined },
}
const wrote = (result: PutResult) => {
  if (!result.ok) throw new Error(result.problem)
  return result
}

test('the ask is every changed file, the project lines, the version it started from and a title', async () => {
  const game = await links()
  const edits = slide(startEdits(game), 6.5)
  const { api, asked } = pretend(good)
  await put(api, game, edits)
  expect(asked.puts).toEqual([
    { game: OPEN_REF, files: toPut(game, edits).files, message: 'Move Crate 1 in Room 1' },
  ])
})

test('after a put the game holds the new version and bytes, and what is on screen is what was put in', async () => {
  const game = await links()
  const edits = slide(startEdits(game), 6.5)
  const { api } = pretend(good)
  const done = wrote(await put(api, game, edits))
  expect(done.how).toBe('direct')
  expect(isChanged(done.edits)).toBe(false)
  expect(done.edits.now).toBe(done.edits.base)
  expect(done.game.files.get(ROOM_1)).toEqual({
    path: ROOM_1,
    text: writeContent('level', levelOf(edits, 'room-1') as never),
    version: 'v2',
  })
})

test('a put that goes to be checked says so, and the game holds the waiting change', async () => {
  const game = await links()
  const mine: Waiting = { number: 4, title: 't', by: 'kid', mine: true, checks: 'none' }
  const { api } = pretend({ ok: true, value: { how: 'suggestion', versions: { [ROOM_1]: 'v2' }, mine } })
  const done = wrote(await put(api, game, slide(startEdits(game), 6.5)))
  expect(done.how).toBe('suggestion')
  expect(done.game.mine).toEqual(mine)
})

test('nothing changed is nothing sent', async () => {
  const game = await links()
  const { api, asked } = pretend(good)
  expect(await put(api, game, startEdits(game))).toEqual({ ok: false, problem: 'unknown' })
  expect(asked.puts).toEqual([])
})

test('a file that changed in the game meanwhile: the game is opened again and the changes are laid over it', async () => {
  const game = await links()
  const mine = slide(startEdits(game), 6.5)
  // Someone else moved the crate of room 2 while this person moved room 1's.
  const theirRoom2 = JSON.parse(linksFiles()['content/levels/room-2.json'] ?? '{}') as Level
  const moved = {
    ...theirRoom2,
    things: theirRoom2.things.map((t, i) => (i === 0 ? { ...t, x: t.x + 1 } : t)),
  }
  const files = { ...linksFiles(), 'content/levels/room-2.json': writeContent('level', moved as never) }
  const { api, asked } = pretend({ ok: false, problem: 'changed-elsewhere', details: [ROOM_1] }, files)
  const result = await put(api, game, mine)
  if (result.ok || result.problem !== 'changed-elsewhere') throw new Error('expected changed-elsewhere')
  expect(asked.opens).toBe(1)
  expect(result.merged.clashes).toEqual([])
  expect(result.merged.theirs.map((line) => line.kind)).toEqual(['moved'])
  expect(levelOf({ ...mine, now: result.merged.now }, 'room-1').things).toEqual(
    levelOf(mine, 'room-1').things,
  )
  expect(result.merged.now.levels['room-2']).toEqual(moved)
  expect(result.game.files.get('content/levels/room-2.json')?.text).toBe(
    writeContent('level', moved as never),
  )

  // Laid over, the screen shows both, the game is the base, and one Undo brings back what the person had.
  const laid = laidOver(mine, result.game, result.merged)
  expect(laid.now).toBe(result.merged.now)
  expect(laid.base.levels['room-2']).toEqual(moved)
  expect(laid.past.at(-1)).toBe(mine.now)
  expect(isChanged(laid)).toBe(true)
})

test('when the only change clashes, nothing came in, one clash is said, and nothing is left to put in', async () => {
  const game = await links()
  const mine = slide(startEdits(game), 6.5)
  // The same crate moved somewhere else by someone else.
  const theirs = slide(startEdits(game), 3.5)
  const files = { ...linksFiles(), [ROOM_1]: writeContent('level', levelOf(theirs, 'room-1') as never) }
  const { api } = pretend({ ok: false, problem: 'changed-elsewhere', details: [ROOM_1] }, files)
  const result = await put(api, game, mine)
  if (result.ok || result.problem !== 'changed-elsewhere') throw new Error('expected changed-elsewhere')
  expect(result.merged.clashes).toHaveLength(1)
  expect(cameIn(result.merged)).toEqual([])
  expect(isChanged(laidOver(mine, result.game, result.merged))).toBe(false)
})

test('each other problem passes through, with its details, and nothing is changed', async () => {
  const game = await links()
  const edits = slide(startEdits(game), 6.5)
  const broken = pretend({ ok: false, problem: 'broken', details: ['a', 'b'] })
  expect(await put(broken.api, game, edits)).toEqual({ ok: false, problem: 'broken', details: ['a', 'b'] })
  for (const problem of ['signed-out', 'offline', 'busy', 'blocked', 'not-allowed'] as const) {
    expect(await put(pretend({ ok: false, problem }).api, game, edits)).toEqual({ ok: false, problem })
  }
  expect(isChanged(edits)).toBe(true)
})

test('a new level is sent with the project file and the version of it the page holds', async () => {
  const game = await links()
  const start = startEdits(game)
  const room = levelOf(start, 'room-1')
  const edits = change(start, {
    ...start.now,
    levels: { ...start.now.levels, 'room-4': { ...room, id: 'room-4' } },
  })
  const { api, asked } = pretend(good)
  await put(api, game, edits)
  expect(asked.puts[0]?.projectVersion).toBe(game.files.get(PROJECT_FILE)?.version)
  expect(asked.puts[0]?.project).toEqual({ add: [{ type: 'level', path: 'content/levels/room-4.json' }] })
})

test('taking changes back: the game is opened as it is and everything the person had is theirs again', async () => {
  const game = {
    ...(await links()),
    mine: { number: 4, title: 't', by: 'kid', mine: true, checks: 'none' as const },
  }
  const sent = slide(startEdits(game), 6.5)
  const { api, asked } = pretend(good)
  const result = await takeBack(api, game, sent)
  if (!result.ok) throw new Error(result.problem)
  expect(asked.turnedDown).toEqual([4])
  expect(result.game.mine).toBeUndefined()
  expect(result.edits.now).toBe(sent.now)
  expect(isChanged(result.edits)).toBe(true)
})

test('a game with nothing waiting has nothing to take back', async () => {
  const game = await links()
  const { api, asked } = pretend(good)
  expect(await takeBack(api, game, startEdits(game))).toEqual({ ok: false, problem: 'unknown' })
  expect(asked.turnedDown).toEqual([])
})
