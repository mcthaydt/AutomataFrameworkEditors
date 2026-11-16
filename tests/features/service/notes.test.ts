import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, expect, test } from 'vitest'
import { writeAccess } from '#src/features/access/access.ts'
import { NOTES_BRANCH, NOTES_FILE, type NotesFile, parseNotes } from '#src/features/files/files.ts'
import type { Pull } from '#src/features/github/github.ts'
import { suggestionBranch } from '#src/features/service/enter.ts'
import { isWaiting, toWaiting } from '#src/features/service/pulls.ts'
import type { Answer, OpenAnswer } from '#src/features/wire/wire.ts'
import { DEMO, startTestApi, type TestApi } from '../../fixtures/api.ts'
import type { FakeRepo } from '../../fixtures/fake-github/repos.ts'

let api: TestApi
beforeAll(async () => {
  api = await startTestApi()
})
afterAll(() => api.close())
beforeEach(() => {
  api.fake.reset()
  // grandpa approves, kid suggests; stranger is not listed, so he may only look. (grandma owns the game.)
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
})

const GAME = { owner: 'grandma', name: 'crate-game' }
const repo = (): FakeRepo => api.fake.repos.get(DEMO)!
type Person = Parameters<TestApi['call']>[0]
const note = (person: Person, ask: Record<string, unknown>) =>
  api.call<NotesFile>(person, 'POST', '/api/notes', { game: GAME, ...ask })
const NOTES = '/api/notes?owner=grandma&name=crate-game'
const read = (person: Person) => api.call<NotesFile>(person, 'GET', NOTES)
const problem = (r: { answer: Answer<unknown> }): string | undefined =>
  r.answer.ok ? undefined : r.answer.problem
const notesOf = async (person: Person): Promise<NotesFile> => {
  const res = await read(person)
  if (!res.answer.ok) throw new Error(`no notes: ${res.answer.problem}`)
  return res.answer.value
}
const add = (person: Person, words: string, extra: Record<string, unknown> = {}) =>
  note(person, { add: { level: 'level-1', words, ...extra } })
const onBranch = (): string | undefined => repo().branches.get(NOTES_BRANCH)?.get(NOTES_FILE)

test('there are no notes before the first one, and no branch', async () => {
  expect((await notesOf('kid')).notes).toEqual([])
  expect(repo().branches.has(NOTES_BRANCH)).toBe(false)
})

test("the first note makes the notes branch from the game's head, and the game does not move", async () => {
  const head = repo().heads.get('main')
  const mainFiles = new Map(repo().branches.get('main'))
  const res = await add('kid', 'The crate is too heavy.')
  expect(res.answer.ok).toBe(true)
  expect(repo().heads.get('main')).toBe(head)
  expect(repo().branches.get('main')).toEqual(mainFiles)
  expect(repo().pulls).toEqual([])
  // The branch holds the game as it was, plus the one notes file and nothing else.
  const branch = repo().branches.get(NOTES_BRANCH)
  expect(branch).toBeDefined()
  expect([...(branch?.keys() ?? [])].filter((p) => !mainFiles.has(p))).toEqual([NOTES_FILE])
  expect(repo().commits.map((c) => [c.branch, c.files.map((f) => f.path)])).toEqual([
    [NOTES_BRANCH, [NOTES_FILE]],
  ])
})

test('the note is by the person the API says, at the time the API says, with no answers and not done', async () => {
  const before = Date.now()
  const res = await add('kid', 'The crate is too heavy.', { thing: 'crate-1', at: { x: 3.5, y: 2 } })
  if (!res.answer.ok) throw new Error(res.answer.problem)
  const [first] = res.answer.value.notes
  expect(first).toMatchObject({
    id: 'note-1',
    level: 'level-1',
    thing: 'crate-1',
    at: { x: 3.5, y: 2 },
    by: 'kid',
    words: 'The crate is too heavy.',
    answers: [],
    done: false,
  })
  const when = Date.parse(first?.when ?? '')
  expect(when).toBeGreaterThanOrEqual(before - 1000)
  expect(when).toBeLessThanOrEqual(Date.now() + 1000)
  expect(parseNotes(onBranch()).notes).toEqual(res.answer.value.notes)
})

test('a person who only looks can add a note, and everyone reads the same notes', async () => {
  expect((await add('stranger', 'Nice level.')).answer.ok).toBe(true)
  expect((await notesOf('grandma')).notes.map((n) => n.words)).toEqual(['Nice level.'])
  expect((await notesOf('grandpa')).notes[0]?.by).toBe('stranger')
})

test('a visitor reads the demo game notes and writes none', async () => {
  await add('kid', 'Hello.')
  const seen = await api.call<NotesFile>('visitor', 'GET', NOTES)
  expect(seen.answer.ok && seen.answer.value.notes.map((n) => n.words)).toEqual(['Hello.'])
  const wrote = await note('visitor', { add: { level: 'level-1', words: 'Hi' } })
  expect(problem(wrote)).toBe('signed-out')
  expect(repo().commits).toHaveLength(1)
})

test('another game is not-found to a visitor, and a person with no access gets not-found', async () => {
  const other = await api.call<NotesFile>('visitor', 'GET', '/api/notes?owner=grandma&name=other-game')
  expect(problem(other)).toBe('not-found')
  repo().put('main', 'automata.access.toml', writeAccess({ format: 1, everyone: 'nothing', people: [] }))
  expect(problem(await read('stranger'))).toBe('not-found')
  expect(problem(await add('stranger', 'Hello'))).toBe('not-found')
})

test('notes are numbered one after the other, and answers and done are kept on the same branch', async () => {
  await add('kid', 'One')
  await add('grandpa', 'Two')
  const answered = await note('grandma', { answer: { id: 'note-2', words: 'Fixed it.' } })
  if (!answered.answer.ok) throw new Error(answered.answer.problem)
  expect(answered.answer.value.notes.map((n) => n.id)).toEqual(['note-1', 'note-2'])
  expect(answered.answer.value.notes[1]?.answers).toMatchObject([{ by: 'grandma', words: 'Fixed it.' }])
  const done = await note('kid', { done: { id: 'note-2', done: true } })
  expect(done.answer.ok && done.answer.value.notes[1]?.done).toBe(true)
  const undone = await note('kid', { done: { id: 'note-2', done: false } })
  expect(undone.answer.ok && undone.answer.value.notes[1]?.done).toBe(false)
  expect(repo().pulls).toEqual([])
  expect([...repo().branches.keys()].sort()).toEqual([NOTES_BRANCH, 'main'])
})

test('answering or finishing a note that is not there is not-found, and writes nothing', async () => {
  await add('kid', 'One')
  const commits = repo().commits.length
  expect(problem(await note('kid', { answer: { id: 'note-9', words: 'Hi' } }))).toBe('not-found')
  expect(problem(await note('kid', { done: { id: 'note-9', done: true } }))).toBe('not-found')
  expect(repo().commits).toHaveLength(commits)
})

test('two people adding at once both land, with different numbers', async () => {
  const [a, b] = await Promise.all([add('kid', 'From kid'), add('grandpa', 'From grandpa')])
  expect(a.answer.ok).toBe(true)
  expect(b.answer.ok).toBe(true)
  const notes = (await notesOf('grandma')).notes
  expect(notes.map((n) => n.words).sort()).toEqual(['From grandpa', 'From kid'])
  expect(notes.map((n) => n.id).sort()).toEqual(['note-1', 'note-2'])
})

test('two people adding at once to notes that already exist both land too', async () => {
  await add('kid', 'First')
  const [a, b] = await Promise.all([add('kid', 'Second'), add('grandpa', 'Third')])
  expect(a.answer.ok && b.answer.ok).toBe(true)
  const ids = (await notesOf('grandma')).notes.map((n) => n.id)
  expect(ids.sort()).toEqual(['note-1', 'note-2', 'note-3'])
})

test('the words are 1 to 500 characters, and a blank note is bad-request', async () => {
  expect(problem(await add('kid', ''))).toBe('bad-request')
  expect(problem(await add('kid', '   \n '))).toBe('bad-request')
  expect(problem(await add('kid', 'x'.repeat(501)))).toBe('bad-request')
  expect((await add('kid', 'x'.repeat(500))).answer.ok).toBe(true)
})

test('a note with no level, a spot that is not numbers, or no act at all is bad-request', async () => {
  expect(problem(await note('kid', { add: { words: 'Hi' } }))).toBe('bad-request')
  expect(problem(await add('kid', 'Hi', { at: { x: 'one', y: 2 } }))).toBe('bad-request')
  expect(problem(await add('kid', 'Hi', { thing: 7 }))).toBe('bad-request')
  expect(problem(await note('kid', {}))).toBe('bad-request')
  expect(problem(await api.call('kid', 'POST', '/api/notes', { game: 'nope' }))).toBe('bad-request')
  expect(repo().commits).toEqual([])
})

test("the by and the when are the API's: a page cannot say them", async () => {
  const res = await add('kid', 'Hi', { by: 'grandma', when: '1999-01-01T00:00:00.000Z' })
  if (!res.answer.ok) throw new Error(res.answer.problem)
  expect(res.answer.value.notes[0]?.by).toBe('kid')
  expect(res.answer.value.notes[0]?.when).not.toBe('1999-01-01T00:00:00.000Z')
})

test('a notes file that cannot be read is no notes, and the next note writes it afresh', async () => {
  await add('kid', 'One')
  repo().put(NOTES_BRANCH, NOTES_FILE, 'this is [not toml')
  expect((await notesOf('kid')).notes).toEqual([])
  const res = await add('kid', 'Again')
  expect(res.answer.ok && res.answer.value.notes.map((n) => n.words)).toEqual(['Again'])
})

test('a login called notes saves to automata/notes-, which is not the notes branch', () => {
  expect(NOTES_BRANCH).toBe('automata/notes')
  expect(suggestionBranch('notes')).toBe('automata/notes-')
  expect(suggestionBranch('Notes')).toBe('automata/notes-')
  expect(suggestionBranch('notes')).not.toBe(NOTES_BRANCH)
  expect(suggestionBranch('kid')).toBe('automata/kid')
  expect(suggestionBranch('notes-fan')).toBe('automata/notes-fan')
})

test('the notes branch is never a waiting change, and a person called notes is shown as notes', async () => {
  const pull = (head: string): Pull => ({
    number: 1,
    title: 't',
    head,
    headCommit: 'a'.repeat(40),
    headIsHere: true,
    base: 'main',
    createdAt: 0,
  })
  expect(isWaiting(pull(NOTES_BRANCH))).toBe(false)
  expect(isWaiting(pull('automata/kid'))).toBe(true)
  expect(isWaiting(pull('automata/notes-'))).toBe(true)
  const stub = { checks: async () => ({ ok: true, value: 'passing' }) } as never
  const waiting = await toWaiting(stub, pull('automata/notes-'), 'notes')
  expect(waiting).toMatchObject({ by: 'notes', mine: true })
})

test('the guide names the notes file and its branch', () => {
  const guide = readFileSync(new URL('../../../docs/teams.md', import.meta.url), 'utf8')
  expect(guide).toContain(NOTES_FILE)
  expect(guide).toContain(NOTES_BRANCH)
})

test('opening the game does not count the notes branch as a waiting change', async () => {
  await add('kid', 'One')
  const res = await api.call<OpenAnswer>('grandma', 'GET', '/api/game?owner=grandma&name=crate-game')
  expect(res.answer.ok && res.answer.value.waiting).toBe(0)
})
