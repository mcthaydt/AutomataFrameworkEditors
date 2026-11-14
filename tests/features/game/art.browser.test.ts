// A level's art loaded the way the editor does, in each real browser: the framework decodes the bytes, so only a browser
// can say whether the pictures read through the API are pictures.
import { expect, test, vi } from 'vitest'
import type { Api } from '#src/features/api/api.ts'
import { loadLevelArt, type OpenGame, openGame } from '#src/features/game/game.ts'
import type { Answer, OpenAnswer, PictureAsk, WirePicture } from '#src/features/wire/wire.ts'
import { fixturePictures } from '../../fixtures/game/pictures.ts'
import { fixtureFiles } from '../../fixtures/game/read.ts'
import { plainFiles } from '../../fixtures/plain-game/read.ts'

const REF = { owner: 'grandma', name: 'crate-game' }

const base64Of = (bytes: Uint8Array): string => {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

async function opened(files: Readonly<Record<string, string>>): Promise<OpenGame> {
  const value: OpenAnswer = {
    game: REF,
    login: 'grandma',
    level: 'owner',
    branch: 'main',
    mine: undefined,
    waiting: 0,
    files: Object.entries(files).map(([path, text]) => ({ path, text, version: 'v1' })),
  }
  const result = await openGame({ open: async () => ({ ok: true, value }) } as unknown as Api, REF)
  if (!result.ok) throw new Error(result.problem)
  return result.game
}

const picturesFrom =
  (served: (path: string) => Promise<Uint8Array | undefined>) =>
  async (ask: PictureAsk): Promise<Answer<WirePicture>> => {
    const bytes = await served(ask.path)
    return bytes === undefined
      ? { ok: false, problem: 'not-found' }
      : { ok: true, value: { path: ask.path, base64: base64Of(bytes) } }
  }
const apiOf = (served: (path: string) => Promise<Uint8Array | undefined>) => {
  const picture = vi.fn(picturesFrom(served))
  return { api: { picture } as unknown as Api, picture }
}

test('the game with art loads the level’s art, and frees it', async () => {
  const game = await opened(fixtureFiles)
  const { api, picture } = apiOf(async (path) => (await fixturePictures())[path])
  const art = await loadLevelArt(api, game, 'level-1')
  expect(art).toBeDefined()
  expect(art).not.toBe('missing')
  expect(picture).toHaveBeenCalled()
  if (art !== undefined && art !== 'missing') art.destroy()
})

test('asking again costs no second call for a picture the API has given', async () => {
  const game = await opened(fixtureFiles)
  const { api, picture } = apiOf(async (path) => (await fixturePictures())[path])
  const first = await loadLevelArt(api, game, 'level-1')
  const calls = picture.mock.calls.length
  const second = await loadLevelArt(api, game, 'level-1')
  expect(picture.mock.calls.length).toBe(calls)
  expect(second).not.toBe(first)
  for (const art of [first, second]) if (art !== undefined && art !== 'missing') art.destroy()
})

test('a game with no art needs none, and the API is not asked', async () => {
  const game = await opened(plainFiles)
  const { api, picture } = apiOf(async () => undefined)
  expect(await loadLevelArt(api, game, 'level-1')).toBeUndefined()
  expect(picture).not.toHaveBeenCalled()
})

test('a picture the API does not have is "missing"', async () => {
  const game = await opened(fixtureFiles)
  const { api } = apiOf(async () => undefined)
  expect(await loadLevelArt(api, game, 'level-1')).toBe('missing')
})

test('bytes a browser cannot read as a picture are "missing" too', async () => {
  const game = await opened(fixtureFiles)
  const { api } = apiOf(async () => new Uint8Array([1, 2, 3, 4]))
  expect(await loadLevelArt(api, game, 'level-1')).toBe('missing')
})
