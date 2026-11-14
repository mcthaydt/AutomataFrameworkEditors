import { type Level, writeContent } from '@automataframework/framework/headless'
import { expect, test, vi } from 'vitest'
import type { Api } from '#src/features/api/api.ts'
import { keepCopy, levelCopy, type OpenGame, openGame } from '#src/features/game/game.ts'
import type { Answer, OpenAnswer } from '#src/features/wire/wire.ts'
import { blobSha } from '../../fixtures/fake-github/repos.ts'
import { fixtureFiles } from '../../fixtures/game/read.ts'

const REF = { owner: 'grandma', name: 'crate-game' }
const opened = async (): Promise<OpenGame> => {
  const files = Object.entries(fixtureFiles).map(([path, text]) => ({ path, text, version: blobSha(text) }))
  const api = {
    open: async (): Promise<Answer<OpenAnswer>> => ({
      ok: true,
      value: {
        game: REF,
        login: undefined,
        level: 'look',
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

test('the copy is named for the level file and holds exactly the bytes writeContent writes', async () => {
  const game = await opened()
  const copy = levelCopy(game, moved(game))
  expect(copy).toEqual({ name: 'level-1.json', text: writeContent('level', moved(game) as never) })
})

test('a level the project does not list has no copy', async () => {
  const game = await opened()
  expect(levelCopy(game, { ...moved(game), id: 'level-9' })).toBeUndefined()
})

test('keeping a copy makes one link with the name, clicks it once, removes it, and frees the address', () => {
  const link = { href: '', download: '', click: vi.fn(), remove: vi.fn() }
  const doc = { createElement: vi.fn(() => link), body: { append: vi.fn() } } as unknown as Document
  const create = vi.fn(() => 'blob:made')
  const revoke = vi.fn()
  vi.stubGlobal('URL', { createObjectURL: create, revokeObjectURL: revoke })
  try {
    keepCopy(doc, { name: 'level-1.json', text: 'text' })
  } finally {
    vi.unstubAllGlobals()
  }
  expect(doc.createElement).toHaveBeenCalledTimes(1)
  expect(link.download).toBe('level-1.json')
  expect(link.href).toBe('blob:made')
  expect(link.click).toHaveBeenCalledTimes(1)
  expect(link.remove).toHaveBeenCalledTimes(1)
  expect(revoke).toHaveBeenCalledWith('blob:made')
})
