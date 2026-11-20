import { type Level, writeContent } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import type { Api } from '#src/features/api/api.ts'
import { type OpenGame, openGame } from '#src/features/game/game.ts'
import { changeAsWorking } from '#src/features/team/check.ts'
import type { Answer, OpenAnswer, WaitingChange } from '#src/features/wire/wire.ts'
import { blobSha } from '../../fixtures/fake-github/repos.ts'
import { fixtureFiles } from '../../fixtures/game/read.ts'

const REF = { owner: 'grandma', name: 'crate-game' }
const LEVEL = 'content/levels/level-1.json'
const opened = async (): Promise<OpenGame> => {
  const files = Object.entries(fixtureFiles).map(([path, text]) => ({ path, text, version: blobSha(text) }))
  const api = {
    open: async (): Promise<Answer<OpenAnswer>> => ({
      ok: true,
      value: {
        game: REF,
        login: 'mia',
        level: 'approve',
        branch: 'main',
        mine: undefined,
        waiting: 1,
        turnedDown: undefined,
        editors: { format: 1, problems: 'warn' },
        people: [],
        pictures: [],
        files,
      },
    }),
  } as unknown as Api
  const result = await openGame(api, REF)
  if (!result.ok) throw new Error('did not open')
  return result.game
}
const waiting = (changes: WaitingChange['changes']): WaitingChange => ({
  number: 7,
  title: 'Moved Crate 1',
  by: 'sam',
  mine: false,
  checks: 'passing',
  changes,
  here: true,
})
const before = fixtureFiles[LEVEL]

test('a moved crate is the level with the crate moved, and one line that says so', async () => {
  const game = await opened()
  const level = game.content.levels['level-1'] as Level
  const after = writeContent('level', {
    ...level,
    things: level.things.map((t) => (t.id === 'crate-1' ? { ...t, x: 9.5 } : t)),
  } as never)
  const made = changeAsWorking(game, waiting([{ path: LEVEL, before, after }]))
  expect(made?.working.levels['level-1']?.things.find((t) => t.id === 'crate-1')?.x).toBe(9.5)
  expect(made?.lines).toEqual([{ kind: 'moved', level: 'level-1', thing: 'crate-1' }])
  expect(made?.other).toBe(0)
})

test('a new level is the game with a level more, and the project file that lists it', async () => {
  const game = await opened()
  const level = game.content.levels['level-1'] as Level
  const fresh = writeContent('level', { ...level, id: 'level-2' } as never)
  const project = `${fixtureFiles['automata.toml']}\n[[content]]\ntype = "level"\npath = "content/levels/level-2.json"\n`
  const made = changeAsWorking(
    game,
    waiting([
      { path: 'content/levels/level-2.json', before: undefined, after: fresh },
      { path: 'automata.toml', before: fixtureFiles['automata.toml'], after: project },
    ]),
  )
  expect(Object.keys(made?.working.levels ?? {}).sort()).toEqual(['level-1', 'level-2'])
  expect(made?.lines).toContainEqual({ kind: 'level-new', level: 'level-2' })
})

test('a change to a file that is not a level or the map is counted, not shown', async () => {
  const game = await opened()
  const crate = fixtureFiles['content/characters/crate.json'] ?? ''
  const made = changeAsWorking(
    game,
    waiting([
      { path: 'content/characters/crate.json', before: crate, after: crate.replace('#c9a227', '#c9a228') },
    ]),
  )
  expect(made?.lines).toEqual([])
  expect(made?.other).toBe(1)
})

test('a file that does not read gives nothing to play', async () => {
  const game = await opened()
  expect(changeAsWorking(game, waiting([{ path: LEVEL, before, after: '{ not a level' }]))).toBeUndefined()
})
