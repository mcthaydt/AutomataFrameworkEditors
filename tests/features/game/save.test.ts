import { type Level, writeContent } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import type { Api } from '#src/features/api/api.ts'
import { type OpenGame, openGame, saveLevel } from '#src/features/game/game.ts'
import type { Answer, OpenAnswer, SaveAnswer, SaveAsk } from '#src/features/wire/wire.ts'
import { blobSha } from '../../fixtures/fake-github/repos.ts'
import { fixtureFiles, LEVEL_PATH } from '../../fixtures/game/read.ts'

const REF = { owner: 'grandma', name: 'crate-game' }
const opened = async (): Promise<OpenGame> => {
  const files = Object.entries(fixtureFiles).map(([path, text]) => ({ path, text, version: blobSha(text) }))
  const api = {
    open: async (): Promise<Answer<OpenAnswer>> => ({
      ok: true,
      value: {
        game: REF,
        login: 'grandma',
        level: 'owner',
        branch: 'main',
        mine: undefined,
        waiting: 0,
        files,
      },
    }),
  } as unknown as Api
  const result = await openGame(api, REF)
  if (!result.ok) throw new Error('did not open')
  return result.game
}
const moved = (game: OpenGame): Level => {
  const level = game.content.levels['level-1'] as Level
  return { ...level, things: level.things.map((t) => ({ ...t, x: 8.5 })) }
}
const apiSaving = (answer: Answer<SaveAnswer>, asked: SaveAsk[] = []): Api =>
  ({
    save: async (ask: SaveAsk) => {
      asked.push(ask)
      return answer
    },
  }) as unknown as Api

test('the ask is the path, the level as data, the opened version and the message', async () => {
  const game = await opened()
  const asked: SaveAsk[] = []
  const level = moved(game)
  await saveLevel(
    apiSaving({ ok: true, value: { how: 'direct', version: 'v2', mine: undefined } }, asked),
    game,
    level,
    'Move crate-1',
  )
  expect(asked).toEqual([
    {
      game: REF,
      path: LEVEL_PATH,
      value: level,
      version: blobSha(fixtureFiles[LEVEL_PATH] ?? ''),
      message: 'Move crate-1',
    },
  ])
})

test('after a save the game holds the new level, its version and its bytes; other files are untouched', async () => {
  const game = await opened()
  const level = moved(game)
  const mine = { number: 3, title: 't', by: 'grandma', mine: true, checks: 'none' as const }
  const result = await saveLevel(
    apiSaving({ ok: true, value: { how: 'suggestion', version: 'v2', mine } }),
    game,
    level,
    'm',
  )
  if (!result.ok) throw new Error(result.problem)
  expect(result.how).toBe('suggestion')
  expect(result.game.mine).toEqual(mine)
  expect(result.game.content.levels['level-1']).toEqual(level)
  expect(result.game.files.get(LEVEL_PATH)).toEqual({
    path: LEVEL_PATH,
    text: writeContent('level', level as never),
    version: 'v2',
  })
  for (const [path, file] of game.files)
    if (path !== LEVEL_PATH) expect(result.game.files.get(path)).toBe(file)
})

test('a direct save keeps whatever waiting change the game already had', async () => {
  const game = await opened()
  const result = await saveLevel(
    apiSaving({ ok: true, value: { how: 'direct', version: 'v2', mine: undefined } }),
    game,
    moved(game),
    'm',
  )
  expect(result.ok && result.game.mine).toBeUndefined()
})

test('each problem passes through, with its details', async () => {
  const game = await opened()
  const level = moved(game)
  const broken = await saveLevel(
    apiSaving({ ok: false, problem: 'broken', details: ['a', 'b'] }),
    game,
    level,
    'm',
  )
  expect(broken).toEqual({ ok: false, problem: 'broken', details: ['a', 'b'] })
  const clash = await saveLevel(apiSaving({ ok: false, problem: 'changed-elsewhere' }), game, level, 'm')
  expect(clash).toEqual({ ok: false, problem: 'changed-elsewhere' })
})

test('a level the project does not list is unknown and nothing is sent', async () => {
  const game = await opened()
  const asked: SaveAsk[] = []
  const level = { ...moved(game), id: 'level-9' }
  const result = await saveLevel(
    apiSaving({ ok: true, value: { how: 'direct', version: 'v', mine: undefined } }, asked),
    game,
    level,
    'm',
  )
  expect(result).toEqual({ ok: false, problem: 'unknown' })
  expect(asked).toEqual([])
})
