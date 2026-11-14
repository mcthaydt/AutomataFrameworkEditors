import { expect, test, vi } from 'vitest'
import type { Api } from '#src/features/api/api.ts'
import { type OpenGame, openGame, readPictureFor } from '#src/features/game/game.ts'
import type { Answer, OpenAnswer, PictureAsk, WirePicture } from '#src/features/wire/wire.ts'
import { blobSha } from '../../fixtures/fake-github/repos.ts'
import { fixturePictures } from '../../fixtures/game/pictures.ts'
import { fixtureFiles } from '../../fixtures/game/read.ts'

const REF = { owner: 'grandma', name: 'crate-game' }
const HERO = 'content/figures/hero.png'

const base64Of = (bytes: Uint8Array): string => {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

/** The fixture game, opened from an API that holds its files. */
async function opened(): Promise<OpenGame> {
  const files = Object.entries(fixtureFiles).map(([path, text]) => ({ path, text, version: blobSha(text) }))
  const value: OpenAnswer = {
    game: REF,
    login: 'grandma',
    level: 'owner',
    branch: 'main',
    mine: undefined,
    waiting: 0,
    files,
  }
  const api = { open: async () => ({ ok: true, value }) } as unknown as Api
  const result = await openGame(api, REF)
  if (!result.ok) throw new Error(result.problem)
  return result.game
}

/** An API that answers pictures from the painted fixture, and counts each ask. */
function apiWithPictures(answerFor: (ask: PictureAsk) => Promise<Answer<WirePicture>>): {
  api: Api
  picture: ReturnType<typeof vi.fn>
} {
  const picture = vi.fn(answerFor)
  return { api: { picture } as unknown as Api, picture }
}
const fromFixture = async (ask: PictureAsk): Promise<Answer<WirePicture>> => {
  const bytes = (await fixturePictures())[ask.path]
  return bytes === undefined
    ? { ok: false, problem: 'not-found' }
    : { ok: true, value: { path: ask.path, base64: base64Of(bytes) } }
}

test('a picture read is one call to the API, with the game, the branch and the path', async () => {
  const game = await opened()
  const { api, picture } = apiWithPictures(fromFixture)
  await readPictureFor(api, game)(HERO)
  expect(picture).toHaveBeenCalledTimes(1)
  expect(picture).toHaveBeenCalledWith({ game: REF, branch: 'main', path: HERO })
})

test('two reads of one path ask the API once', async () => {
  const game = await opened()
  const { api, picture } = apiWithPictures(fromFixture)
  const read = readPictureFor(api, game)
  await Promise.all([read(HERO), read(HERO)])
  await readPictureFor(api, game)(HERO)
  expect(picture).toHaveBeenCalledTimes(1)
})

test('the Blob holds the very bytes of the picture, and says it is a PNG', async () => {
  const game = await opened()
  const { api } = apiWithPictures(fromFixture)
  const blob = await readPictureFor(api, game)(HERO)
  expect(blob.type).toBe('image/png')
  expect(new Uint8Array(await blob.arrayBuffer())).toEqual((await fixturePictures())[HERO])
})

test('a problem from the API rejects, and the next read asks again', async () => {
  const game = await opened()
  const { api, picture } = apiWithPictures(async () => ({ ok: false, problem: 'not-found' }))
  const read = readPictureFor(api, game)
  await expect(read(HERO)).rejects.toThrow('not-found')
  await expect(read(HERO)).rejects.toThrow('not-found')
  expect(picture).toHaveBeenCalledTimes(2)
})

test('another path, and another branch, are other pictures', async () => {
  const game = await opened()
  const { api, picture } = apiWithPictures(fromFixture)
  const read = readPictureFor(api, game)
  await read(HERO)
  await read('content/figures/crate.png')
  await readPictureFor(api, { ...game, branch: 'automata/kid' })(HERO)
  expect(picture).toHaveBeenCalledTimes(3)
})
