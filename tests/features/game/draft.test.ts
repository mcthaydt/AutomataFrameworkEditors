import type { Level } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import type { Api } from '#src/features/api/api.ts'
import { dropDraft, keepDraft, type OpenGame, openGame, takeDraft } from '#src/features/game/game.ts'
import type { Answer, OpenAnswer } from '#src/features/wire/wire.ts'
import { blobSha } from '../../fixtures/fake-github/repos.ts'
import { fixtureFiles, LEVEL_PATH } from '../../fixtures/game/read.ts'

const REF = { owner: 'grandma', name: 'crate-game' }
const open = async (over: Record<string, string> = {}): Promise<OpenGame> => {
  const files = Object.entries({ ...fixtureFiles, ...over }).map(([path, text]) => ({
    path,
    text,
    version: blobSha(text),
  }))
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
const store = (): Storage => {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => void map.delete(k),
    setItem: (k, v) => void map.set(k, v),
  }
}
const moved = (game: OpenGame): Level => {
  const level = game.content.levels['level-1'] as Level
  return { ...level, things: level.things.map((t) => ({ ...t, x: 8.5 })) }
}

test('a kept draft is taken back as the same level', async () => {
  const game = await open()
  const s = store()
  keepDraft(s, game, moved(game))
  expect(takeDraft(s, game, 'level-1')).toEqual({ level: moved(game) })
})

test('the key names the game and the file', async () => {
  const game = await open()
  const s = store()
  keepDraft(s, game, moved(game))
  expect(s.key(0)).toBe(`af.draft:grandma/crate-game:${LEVEL_PATH}`)
})

test('dropping a draft takes it away', async () => {
  const game = await open()
  const s = store()
  keepDraft(s, game, moved(game))
  dropDraft(s, game, 'level-1')
  expect(takeDraft(s, game, 'level-1')).toBeUndefined()
  expect(s.length).toBe(0)
})

test('a draft made against an older version of the file is changed, and the key is gone', async () => {
  const game = await open()
  const s = store()
  keepDraft(s, game, moved(game))
  const newer = await open({ [LEVEL_PATH]: `${fixtureFiles[LEVEL_PATH]}\n` })
  expect(takeDraft(s, newer, 'level-1')).toBe('changed')
  expect(s.length).toBe(0)
})

test('garbage in the store is no draft, and the key is gone', async () => {
  const game = await open()
  for (const garbage of [
    'not json',
    'null',
    '{"version":1}',
    JSON.stringify({ version: blobSha(fixtureFiles[LEVEL_PATH] ?? ''), level: { id: 7 } }),
  ]) {
    const s = store()
    s.setItem(`af.draft:grandma/crate-game:${LEVEL_PATH}`, garbage)
    expect(takeDraft(s, game, 'level-1')).toBeUndefined()
    expect(s.length).toBe(0)
  }
})

test('a level the project does not list has no draft', async () => {
  const game = await open()
  const s = store()
  keepDraft(s, game, { ...moved(game), id: 'level-9' })
  expect(s.length).toBe(0)
  expect(takeDraft(s, game, 'level-9')).toBeUndefined()
})

test('a store that throws never throws out of the three functions', async () => {
  const game = await open()
  const bad = {
    getItem: () => {
      throw new Error('no')
    },
    setItem: () => {
      throw new Error('no')
    },
    removeItem: () => {
      throw new Error('no')
    },
  } as unknown as Storage
  expect(() => keepDraft(bad, game, moved(game))).not.toThrow()
  expect(() => dropDraft(bad, game, 'level-1')).not.toThrow()
  expect(takeDraft(bad, game, 'level-1')).toBeUndefined()
})
