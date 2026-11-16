import { expect, test } from 'vitest'
import {
  addNote,
  answer,
  NOTES_BRANCH,
  NOTES_FILE,
  type NotesFile,
  parseNotes,
  setDone,
  writeNotes,
} from '#src/features/files/files.ts'

const EMPTY: NotesFile = { format: 1, notes: [] }
const first = {
  level: 'level-1',
  by: 'kid',
  when: '2026-11-16T10:00:00.000Z',
  words: 'The crate is too heavy.',
}

test('the notes file and its branch have the names the guide gives them', () => {
  expect(NOTES_FILE).toBe('automata.notes.toml')
  expect(NOTES_BRANCH).toBe('automata/notes')
})

test('no file, or one that does not read, is no notes', () => {
  expect(parseNotes(undefined)).toEqual(EMPTY)
  expect(parseNotes('')).toEqual(EMPTY)
  expect(parseNotes('this is [not toml')).toEqual(EMPTY)
  expect(parseNotes('format = 2\n')).toEqual(EMPTY)
  expect(parseNotes('format = 1\n[[notes]]\nid = 3\n')).toEqual(EMPTY)
})

test('the first note is note-1, with no answers, not done', () => {
  const file = addNote(EMPTY, first)
  expect(file.notes).toEqual([{ ...first, id: 'note-1', answers: [], done: false }])
})

test('a new note takes the next free number, even when an older one is gone', () => {
  let file = addNote(EMPTY, first)
  file = addNote(file, { ...first, words: 'Two' })
  file = addNote(file, { ...first, words: 'Three' })
  const without: NotesFile = { format: 1, notes: file.notes.filter((n) => n.id !== 'note-2') }
  expect(addNote(without, { ...first, words: 'Four' }).notes.map((n) => n.id)).toEqual([
    'note-1',
    'note-3',
    'note-4',
  ])
})

test('a note on a thing, and a note at a spot, keep them', () => {
  const file = addNote(EMPTY, { ...first, thing: 'crate-1', at: { x: 3.5, y: 4 } })
  expect(file.notes[0]).toMatchObject({ thing: 'crate-1', at: { x: 3.5, y: 4 } })
  expect(parseNotes(writeNotes(file))).toEqual(file)
})

test('write then parse is the same notes, answers and done included', () => {
  let file = addNote(EMPTY, first)
  file = addNote(file, {
    ...first,
    thing: 'crate-1',
    at: { x: 1, y: 2 },
    words: 'Another\nwith two lines "quoted"',
  })
  file = answer(file, 'note-1', {
    by: 'grandpa',
    when: '2026-11-16T11:00:00.000Z',
    words: 'Made it lighter.',
  })
  file = answer(file, 'note-1', { by: 'kid', when: '2026-11-16T12:00:00.000Z', words: 'Thanks!' })
  file = setDone(file, 'note-1', true)
  expect(parseNotes(writeNotes(file))).toEqual(file)
})

test('the text is stable: the same notes always write the same bytes, and it starts with the format', () => {
  const file = answer(addNote(EMPTY, first), 'note-1', {
    by: 'grandpa',
    when: '2026-11-16T11:00:00.000Z',
    words: 'Done.',
  })
  const text = writeNotes(file)
  expect(text).toBe(writeNotes(parseNotes(text)))
  expect(text.startsWith('format = 1\n')).toBe(true)
  expect(text.endsWith('\n')).toBe(true)
})

test('an answer goes to the note it names; a note that is not there changes nothing', () => {
  const file = addNote(addNote(EMPTY, first), { ...first, words: 'Two' })
  const reply = { by: 'grandpa', when: '2026-11-16T11:00:00.000Z', words: 'Yes.' }
  const answered = answer(file, 'note-2', reply)
  expect(answered.notes[0]?.answers).toEqual([])
  expect(answered.notes[1]?.answers).toEqual([reply])
  expect(answer(file, 'note-9', reply)).toEqual(file)
})

test('done can be set and unset, and an unknown note changes nothing', () => {
  const file = addNote(EMPTY, first)
  expect(setDone(file, 'note-1', true).notes[0]?.done).toBe(true)
  expect(setDone(setDone(file, 'note-1', true), 'note-1', false).notes[0]?.done).toBe(false)
  expect(setDone(file, 'note-7', true)).toEqual(file)
})

test('the functions never change the file they are given', () => {
  const file = addNote(EMPTY, first)
  const before = JSON.stringify(file)
  answer(file, 'note-1', { by: 'a', when: 'b', words: 'c' })
  setDone(file, 'note-1', true)
  addNote(file, first)
  expect(JSON.stringify(file)).toBe(before)
})
