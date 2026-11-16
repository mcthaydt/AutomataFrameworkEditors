// Asking for a change, turning one down, and bringing it back: each is a comment the App writes on the waiting change.
import { afterAll, beforeAll, beforeEach, expect, test } from 'vitest'
import { writeAccess } from '#src/features/access/access.ts'
import { ASKED, NOT_PUT_IN, readComment } from '#src/features/service/ask.ts'
import type { Answer, OpenAnswer, PutAnswer, WaitingChange } from '#src/features/wire/wire.ts'
import { LINKS, startTestApi, type TestApi } from '../../fixtures/api.ts'
import { blobSha } from '../../fixtures/fake-github/repos.ts'
import { ask, GAME, only, ROOM_3, room3 } from '../../fixtures/links-put.ts'

let api: TestApi
beforeAll(async () => {
  api = await startTestApi()
})
afterAll(() => api.close())

const repo = () => api.fake.repos.get(LINKS)!
const Q = '?owner=grandma&name=links-game'
const problem = (r: { answer: Answer<unknown> }): string | undefined =>
  r.answer.ok ? undefined : r.answer.problem
const WORDS = 'Make the last room easier, please.'
const T0 = Date.now()

const put = (person: Parameters<TestApi['call']>[0], body: unknown) =>
  api.call<PutAnswer>(person, 'POST', '/api/put', body)
const askFor = (person: Parameters<TestApi['call']>[0], body: unknown) =>
  api.call(person, 'POST', '/api/ask', body)
const opened = async (person: Parameters<TestApi['call']>[0]): Promise<OpenAnswer> => {
  const res = await api.call<OpenAnswer>(person, 'GET', `/api/game${Q}`)
  if (!res.answer.ok) throw new Error(res.answer.problem)
  return res.answer.value
}
const turnDown = (person: Parameters<TestApi['call']>[0]) =>
  api.call(person, 'POST', '/api/turn-down', { game: GAME, number: 1 })
const reopen = (person: Parameters<TestApi['call']>[0]) =>
  api.call(person, 'POST', '/api/reopen', { game: GAME, number: 1 })

beforeEach(async () => {
  api.fake.reset()
  api.fake.clock = T0
  repo().put(
    'main',
    'automata.access.toml',
    writeAccess({
      format: 1,
      everyone: 'look',
      people: [
        { github: 'grandpa', level: 'approve' },
        { github: 'kid', level: 'suggest' },
      ],
    }),
  )
  const made = await put('kid', ask())
  if (!made.answer.ok) throw new Error(made.answer.problem)
})

test('the two first lines are read back as what they are, and nothing else is', () => {
  expect(readComment(`${ASKED}grandpa\n\n${WORDS}`)).toEqual({ kind: 'asked', by: 'grandpa', words: WORDS })
  expect(readComment(`${NOT_PUT_IN}grandpa`)).toEqual({ kind: 'not-put-in', by: 'grandpa' })
  expect(readComment('Looks good to me')).toBeUndefined()
  expect(readComment(`${ASKED}grandpa\n\n`)).toBeUndefined()
  expect(readComment(`${ASKED}\n\nwords`)).toBeUndefined()
})

test('grandpa asks for a change: a comment from the App with his login, then the words', async () => {
  api.fake.clock = T0 + 1000
  const res = await askFor('grandpa', { game: GAME, number: 1, words: `  ${WORDS}  ` })
  expect(res.answer).toEqual({ ok: true, value: true })
  expect(repo().comments.get(1)).toEqual([{ at: T0 + 1000, text: `${ASKED}grandpa\n\n${WORDS}` }])
  expect(repo().pulls[0]?.state).toBe('open')
})

test('kid sees what was asked at the next open, and so does grandpa looking at the change', async () => {
  api.fake.clock = T0 + 1000
  await askFor('grandpa', { game: GAME, number: 1, words: WORDS })
  const mine = (await opened('kid')).mine
  expect(mine?.asked).toEqual({ by: 'grandpa', words: WORDS, at: T0 + 1000 })
  const shown = await api.call<WaitingChange>('grandpa', 'GET', `/api/change${Q}&number=1`)
  expect(shown.answer).toMatchObject({ ok: true, value: { asked: { by: 'grandpa', words: WORDS } } })
})

test('it is gone once the author sends again', async () => {
  api.fake.clock = T0 + 1000
  await askFor('grandpa', { game: GAME, number: 1, words: WORDS })
  api.fake.clock = T0 + 2000
  const onBranch = repo().branches.get('automata/kid')?.get(ROOM_3) ?? ''
  const shorter = { ...room3, things: room3.things.slice(0, 1) }
  const sent = await put('kid', only([{ path: ROOM_3, value: shorter, version: blobSha(onBranch) }]))
  expect(sent.answer).toMatchObject({ ok: true })
  expect((await opened('kid')).mine?.asked).toBeUndefined()
})

test('the newest ask is the one shown', async () => {
  api.fake.clock = T0 + 1000
  await askFor('grandpa', { game: GAME, number: 1, words: 'First' })
  api.fake.clock = T0 + 2000
  await askFor('grandpa', { game: GAME, number: 1, words: 'Second' })
  expect((await opened('kid')).mine?.asked?.words).toBe('Second')
})

test('you cannot ask on your own change, a suggester cannot ask, and the words must be 1 to 500 characters', async () => {
  repo().put(
    'main',
    'automata.access.toml',
    writeAccess({ format: 1, everyone: 'look', people: [{ github: 'kid', level: 'approve' }] }),
  )
  const own = await askFor('kid', { game: GAME, number: 1, words: WORDS })
  expect([own.status, problem(own)]).toEqual([403, 'own-change'])
  repo().put(
    'main',
    'automata.access.toml',
    writeAccess({ format: 1, everyone: 'look', people: [{ github: 'kid', level: 'suggest' }] }),
  )
  const low = await askFor('kid', { game: GAME, number: 1, words: WORDS })
  expect(problem(low)).toBe('not-allowed')
  repo().put(
    'main',
    'automata.access.toml',
    writeAccess({ format: 1, everyone: 'look', people: [{ github: 'grandpa', level: 'approve' }] }),
  )
  for (const words of ['', '   ', 'x'.repeat(501), 3]) {
    expect(problem(await askFor('grandpa', { game: GAME, number: 1, words }))).toBe('bad-request')
  }
  expect(problem(await askFor('grandpa', { game: GAME, number: 7, words: WORDS }))).toBe('not-found')
  expect(problem(await askFor('visitor', { game: GAME, number: 1, words: WORDS }))).toBe('signed-out')
  expect(repo().comments.get(1)).toBeUndefined()
})

test("grandpa turns kid's change down: it closes, the branch stays, and kid is told at the next open", async () => {
  const res = await turnDown('grandpa')
  expect(res.answer).toEqual({ ok: true, value: true })
  expect(repo().pulls[0]?.state).toBe('closed')
  expect(repo().branches.has('automata/kid')).toBe(true)
  expect(
    repo()
      .comments.get(1)
      ?.map((c) => c.text),
  ).toEqual([`${NOT_PUT_IN}grandpa`])
  const game = await opened('kid')
  expect(game.mine).toBeUndefined()
  expect(game.turnedDown).toEqual({ by: 'grandpa', at: T0 })
  expect((await opened('grandpa')).turnedDown).toBeUndefined()
})

test('reopen is the Undo: the change waits again; a second reopen is not-found', async () => {
  await turnDown('grandpa')
  expect((await reopen('grandpa')).answer).toEqual({ ok: true, value: true })
  expect(repo().pulls[0]?.state).toBe('open')
  expect((await opened('kid')).mine).toMatchObject({ number: 1 })
  expect((await opened('kid')).turnedDown).toBeUndefined()
  expect(problem(await reopen('grandpa'))).toBe('not-found')
})

test('reopen is for someone who may approve, and not for a change merged or one that was never turned down', async () => {
  await turnDown('grandpa')
  expect(problem(await reopen('kid'))).toBe('not-allowed')
  const unknown = await api.call('grandpa', 'POST', '/api/reopen', { game: GAME, number: 9 })
  expect(problem(unknown)).toBe('not-found')
  expect(repo().pulls[0]?.state).toBe('closed')
})

test('after kid sends again, the old turn-down cannot be brought back, and kid is no longer turned down', async () => {
  await turnDown('grandpa')
  const sent = await put('kid', ask())
  expect(sent.answer).toMatchObject({ ok: true, value: { how: 'suggestion', mine: { number: 2 } } })
  expect(problem(await reopen('grandpa'))).toBe('not-found')
  const game = await opened('kid')
  expect(game.turnedDown).toBeUndefined()
  expect(game.mine).toMatchObject({ number: 2 })
})

test('got it: the leftover branch goes and kid is no longer turned down; nothing to clear is fine', async () => {
  await turnDown('grandpa')
  const cleared = await api.call('kid', 'POST', '/api/clear-turned-down', { game: GAME })
  expect(cleared.answer).toEqual({ ok: true, value: true })
  expect(repo().branches.has('automata/kid')).toBe(false)
  expect((await opened('kid')).turnedDown).toBeUndefined()
  expect((await api.call('kid', 'POST', '/api/clear-turned-down', { game: GAME })).answer).toEqual({
    ok: true,
    value: true,
  })
  const visitor = await api.call('visitor', 'POST', '/api/clear-turned-down', { game: GAME })
  expect(problem(visitor)).toBe('signed-out')
})

test('clearing does not touch a live change', async () => {
  const cleared = await api.call('kid', 'POST', '/api/clear-turned-down', { game: GAME })
  expect(cleared.answer).toEqual({ ok: true, value: true })
  expect(repo().branches.has('automata/kid')).toBe(true)
  expect(repo().pulls[0]?.state).toBe('open')
})

test('kid taking their own change back deletes the branch and sets nothing', async () => {
  expect((await turnDown('kid')).answer).toEqual({ ok: true, value: true })
  expect(repo().branches.has('automata/kid')).toBe(false)
  expect((await opened('kid')).turnedDown).toBeUndefined()
})
