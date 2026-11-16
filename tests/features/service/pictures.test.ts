import { afterAll, beforeAll, beforeEach, expect, test } from 'vitest'
import type { OpenAnswer } from '#src/features/wire/wire.ts'
import { DEMO, startTestApi, type TestApi } from '../../fixtures/api.ts'
import type { FakeRepo } from '../../fixtures/fake-github/repos.ts'
import { fixtureBytes, fixtureFiles } from '../../fixtures/game/read.ts'

let api: TestApi
beforeAll(async () => {
  api = await startTestApi()
})
afterAll(() => api.close())
beforeEach(() => api.fake.reset())

const repo = (): FakeRepo => api.fake.repos.get(DEMO)!
const GROUND = 'art/ground.png'
const groundBytes = (): Uint8Array => fixtureBytes()[GROUND] ?? new Uint8Array()
const base64 = (bytes: Uint8Array): string => Buffer.from(bytes).toString('base64')
type Person = Parameters<TestApi['call']>[0]
const GAME = '/api/game?owner=grandma&name=crate-game'
const open = async (person: Person = 'grandma'): Promise<OpenAnswer> => {
  const res = await api.call<OpenAnswer>(person, 'GET', GAME)
  if (!res.answer.ok) throw new Error('not opened')
  return res.answer.value
}
const paths = (answer: OpenAnswer): string[] => answer.pictures.map((p) => p.path)

/** Lists a tileset file in the project file. */
function listTileset(path: string): void {
  const project = repo().branches.get('main')?.get('automata.toml') ?? ''
  repo().put('main', 'automata.toml', `${project}\n[[content]]\ntype = "tileset"\npath = "${path}"\n`)
}
/** Writes one more tileset and lists it: its file names `image`, which may or may not exist. */
function addTileset(id: string, image: string): void {
  const text = fixtureFiles['content/tilesets/ground.json'] ?? '{}'
  const tileset = JSON.parse(text) as Record<string, unknown>
  const path = `content/tilesets/${id}.json`
  repo().put('main', path, `${JSON.stringify({ ...tileset, id, image }, null, 2)}\n`)
  listTileset(path)
}
/** A picture of `size` bytes at `path`, with a tileset that names it. */
function addPicture(id: string, path: string, size: number): void {
  repo().putBytes(path, new Uint8Array(size).fill(7))
  addTileset(id, path)
}

test("opening the Crate Game sends the tileset's picture as the same bytes the pretend GitHub holds", async () => {
  const game = await open()
  expect(game.pictures).toHaveLength(1)
  const [picture] = game.pictures
  expect(picture?.path).toBe(GROUND)
  expect([...Buffer.from(picture?.base64 ?? '', 'base64')]).toEqual([...groundBytes()])
  expect(picture?.base64).toBe(base64(groundBytes()))
})

test('a visitor and a person who only looks get the picture too', async () => {
  expect(paths(await open('visitor'))).toEqual([GROUND])
  expect(paths(await open('stranger'))).toEqual([GROUND])
})

test('a picture over 1 MB is left out, and the game still opens', async () => {
  addPicture('big', 'art/big.png', 2 * 1024 * 1024)
  expect(paths(await open())).toEqual([GROUND])
})

test('a picture of exactly 1 MB is sent', async () => {
  addPicture('edge', 'art/edge.png', 1024 * 1024)
  expect(paths(await open())).toEqual([GROUND, 'art/edge.png'])
})

test('a path with .. in it, or outside the game, or not a .png, is left out, and the game still opens', async () => {
  repo().putBytes('outside.png', new Uint8Array(10).fill(1))
  repo().putBytes('art/photo.jpg', new Uint8Array(10).fill(2))
  repo().putBytes('art/ground.PNG', new Uint8Array(10).fill(3))
  addTileset('up', '../outside.png')
  addTileset('sneaky', 'art/../art/ground.png')
  addTileset('absolute', '/art/ground.png')
  addTileset('windows', 'art\\ground.png')
  addTileset('jpg', 'art/photo.jpg')
  addTileset('upper', 'art/ground.PNG')
  addTileset('empty', '')
  const game = await open()
  expect(paths(game)).toEqual([GROUND])
})

test('a tileset whose picture is not in the game is left out, and the game still opens', async () => {
  addTileset('missing', 'art/missing.png')
  expect(paths(await open())).toEqual([GROUND])
})

test('a tileset that does not read is left out', async () => {
  repo().put('main', 'content/tilesets/broken.json', '{ not json')
  listTileset('content/tilesets/broken.json')
  expect(paths(await open())).toEqual([GROUND])
})

test('the same picture named by two tilesets is sent once', async () => {
  addTileset('twin', GROUND)
  expect(paths(await open())).toEqual([GROUND])
})

test('pictures add up to at most 4 MB: the one that would pass it is left out, the ones before it are kept', async () => {
  for (let i = 1; i <= 5; i++) addPicture(`p${i}`, `art/p${i}.png`, 1_000_000)
  const sent = paths(await open())
  expect(sent).toEqual([GROUND, 'art/p1.png', 'art/p2.png', 'art/p3.png', 'art/p4.png'])
})

test('a game with no tileset has no pictures', async () => {
  const project = repo().branches.get('main')?.get('automata.toml') ?? ''
  const without = project.replace(/\n\[\[content\]\]\ntype = "tileset"\npath = "[^"]*"\n?/, '\n')
  expect(without).not.toBe(project)
  repo().put('main', 'automata.toml', without)
  const game = await open()
  expect(game.pictures).toEqual([])
})

test("pictures come from the branch the files come from: a person's own waiting change, when they have one", async () => {
  repo().addPull('automata/kid')
  const game = await open('kid')
  expect(game.branch).toBe('automata/kid')
  expect(paths(game)).toEqual([GROUND])
})
