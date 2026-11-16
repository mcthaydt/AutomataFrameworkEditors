// Repo's calls about a waiting change's talk and its closed and reopened pulls, against the pretend GitHub.
import { afterAll, beforeAll, beforeEach, expect, test } from 'vitest'
import { openRepo, type Repo } from '#src/features/github/github.ts'
import type { Answer } from '#src/features/wire/wire.ts'
import { type FakeGitHub, startFakeGitHub } from '../../fixtures/fake-github/server.ts'

let fake: FakeGitHub
beforeAll(async () => {
  fake = await startFakeGitHub(0, 'http://site.test')
})
afterAll(() => fake.close())
beforeEach(() => fake.reset())

const crate = () => {
  const repo = fake.repos.get('grandma/crate-game')
  if (repo === undefined) throw new Error('no crate game')
  return repo
}
const value = <T>(answer: Answer<T>): T => {
  if (!answer.ok) throw new Error(`expected ok, got ${answer.problem}`)
  return answer.value
}
const open = async (): Promise<Repo> =>
  value(
    await openRepo(
      { env: fake.env, fetcher: (input, init) => fetch(input, init), now: () => Date.now() },
      { owner: 'grandma', name: 'crate-game' },
    ),
  )

test('comment then comments: newest first, with the time and the text', async () => {
  const repo = await open()
  const pull = crate().addPull('automata/kid')
  fake.clock = 1_000_000
  expect(value(await repo.comment(pull.number, 'first'))).toBe(true)
  fake.clock = 2_000_000
  value(await repo.comment(pull.number, 'second'))
  expect(value(await repo.comments(pull.number))).toEqual([
    { at: 2_000_000, text: 'second' },
    { at: 1_000_000, text: 'first' },
  ])
})

test('a pull that is not there has no comments to read or write', async () => {
  const repo = await open()
  expect((await repo.comments(42)).ok).toBe(false)
  expect(await repo.comment(42, 'x')).toMatchObject({ ok: false, problem: 'not-found' })
})

test('closedPull gives the newest closed one that was not merged, from that branch only', async () => {
  const repo = await open()
  expect(value(await repo.closedPull('automata/kid'))).toBeUndefined()
  const older = crate().addPull('automata/kid')
  older.state = 'closed'
  const merged = crate().addPull('automata/kid')
  merged.state = 'merged'
  const other = crate().addPull('automata/other')
  other.state = 'closed'
  expect(value(await repo.closedPull('automata/kid'))?.number).toBe(older.number)
  const newer = crate().addPull('automata/kid')
  newer.state = 'closed'
  expect(value(await repo.closedPull('automata/kid'))?.number).toBe(newer.number)
})

test('anyPull says open, closed or merged; reopenPull opens a closed one and refuses a merged one', async () => {
  const repo = await open()
  const pull = crate().addPull('automata/kid')
  expect(value(await repo.anyPull(pull.number))).toMatchObject({ number: pull.number, state: 'open' })
  value(await repo.closePull(pull.number))
  expect(value(await repo.anyPull(pull.number)).state).toBe('closed')
  expect(value(await repo.reopenPull(pull.number))).toBe(true)
  expect(pull.state).toBe('open')
  pull.state = 'merged'
  expect(value(await repo.anyPull(pull.number)).state).toBe('merged')
  expect(await repo.reopenPull(pull.number)).toMatchObject({ ok: false, problem: 'not-found' })
  expect((await repo.anyPull(99)).ok).toBe(false)
})
