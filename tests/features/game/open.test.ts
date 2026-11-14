import { expect, test } from 'vitest'
import type { Api } from '#src/features/api/api.ts'
import { levelPath, openGame } from '#src/features/game/game.ts'
import type { Answer, OpenAnswer, ProblemKind } from '#src/features/wire/wire.ts'
import { blobSha } from '../../fixtures/fake-github/repos.ts'
import { fixtureFiles, LEVEL_PATH } from '../../fixtures/game/read.ts'

const REF = { owner: 'grandma', name: 'crate-game' }
const files = (over: Record<string, string> = {}) =>
  Object.entries({ ...fixtureFiles, ...over }).map(([path, text]) => ({ path, text, version: blobSha(text) }))
const answer = (over: Partial<OpenAnswer> = {}): OpenAnswer => ({
  game: REF,
  login: 'grandma',
  level: 'owner',
  branch: 'main',
  mine: undefined,
  waiting: 0,
  files: files(),
  ...over,
})
const apiGiving = (result: Answer<OpenAnswer>): Api => ({ open: async () => result }) as unknown as Api

test('the fixture game opens with its level, and mine and waiting pass through', async () => {
  const mine = { number: 4, title: 't', by: 'grandma', mine: true, checks: 'passing' as const }
  const opened = await openGame(
    apiGiving({ ok: true, value: answer({ mine, waiting: 2, level: 'suggest' }) }),
    REF,
  )
  if (!opened.ok) throw new Error(opened.problem)
  expect(opened.game).toMatchObject({
    ref: REF,
    login: 'grandma',
    level: 'suggest',
    mine,
    waiting: 2,
    branch: 'main',
  })
  expect(opened.game.content.project.name).toBe('Crate Game')
  expect(Object.keys(opened.game.content.levels)).toEqual(['level-1'])
  expect([...opened.game.files.keys()]).toEqual(Object.keys(fixtureFiles))
  expect(opened.game.files.get(LEVEL_PATH)?.text).toBe(fixtureFiles[LEVEL_PATH])
})

test('a visitor opens with no login', async () => {
  const opened = await openGame(
    apiGiving({ ok: true, value: answer({ login: undefined, level: 'look' }) }),
    REF,
  )
  expect(opened.ok && opened.game.login).toBeUndefined()
})

test("a level that is not JSON is broken, with the framework's sentence for that file", async () => {
  const opened = await openGame(
    apiGiving({ ok: true, value: answer({ files: files({ [LEVEL_PATH]: '{' }) }) }),
    REF,
  )
  expect(opened.ok).toBe(false)
  if (opened.ok || opened.problem !== 'broken') throw new Error('expected broken')
  expect(opened.diagnostics.map((d) => d.file)).toContain(LEVEL_PATH)
})

test('a file the project lists but the API left out is broken, and names it', async () => {
  const left = files().filter((f) => f.path !== 'content/characters/crate.json')
  const opened = await openGame(apiGiving({ ok: true, value: answer({ files: left }) }), REF)
  if (opened.ok || opened.problem !== 'broken') throw new Error('expected broken')
  expect(opened.diagnostics.some((d) => d.file === 'content/characters/crate.json')).toBe(true)
})

test.each([
  'signed-out',
  'not-found',
  'not-a-game',
  'not-allowed',
  'busy',
  'offline',
  'unknown',
] as ProblemKind[])('the problem %s from the API passes through', async (problem) => {
  const opened = await openGame(apiGiving({ ok: false, problem }), REF)
  expect(opened).toEqual({ ok: false, problem })
})

test('levelPath finds the file of a level by its id, and is undefined for an unknown id', async () => {
  const opened = await openGame(apiGiving({ ok: true, value: answer() }), REF)
  if (!opened.ok) throw new Error(opened.problem)
  expect(levelPath(opened.game, 'level-1')).toBe(LEVEL_PATH)
  expect(levelPath(opened.game, 'level-2')).toBeUndefined()
  expect(levelPath(opened.game, 'hero')).toBeUndefined()
})
