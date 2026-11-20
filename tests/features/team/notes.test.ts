import type { Level } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import type { Note, NotesFile } from '#src/features/files/files.ts'
import { noteExtras, noteIdOf, notesOfLevel } from '#src/features/team/notes.ts'

const level = {
  id: 'room-1',
  things: [{ id: 'crate-1', character: 'crate', x: 4, y: 3 }],
  starts: [],
} as unknown as Level

const note = (over: Partial<Note>): Note => ({
  id: 'n-1',
  level: 'room-1',
  by: 'grandma',
  when: '2026-11-20T10:00:00Z',
  words: 'Too heavy',
  answers: [],
  done: false,
  ...over,
})
const file = (...notes: Note[]): NotesFile => ({ format: 1, notes })
const say = (n: Note): string => `Note from ${n.by}: ${n.words}`

test('a note on a thing is pinned at the thing, and a note on a spot at the spot', () => {
  const pins = noteExtras(
    file(note({ id: 'n-1', thing: 'crate-1' }), note({ id: 'n-2', at: { x: 7, y: 2 } })),
    level,
    'room-1',
    false,
    say,
    () => ({ w: 1, h: 1 }),
  )
  expect(pins.map((p) => p.id)).toEqual(['note:n-1', 'note:n-2'])
  expect(pins[0]?.at).toEqual({ x: 4.5, y: 2.5 })
  expect(pins[1]?.at).toEqual({ x: 7, y: 2 })
  expect(pins[0]?.name).toBe('Note from grandma: Too heavy')
  expect(pins.every((p) => p.kind === 'note')).toBe(true)
})

test('a note on a thing that has gone stays at its last spot', () => {
  const pins = noteExtras(
    file(note({ thing: 'gone-1', at: { x: 9, y: 9 } })),
    level,
    'room-1',
    false,
    say,
    () => ({ w: 1, h: 1 }),
  )
  expect(pins[0]?.at).toEqual({ x: 9, y: 9 })
})

test('a note on a thing that has gone and has no spot is level wide', () => {
  const pins = noteExtras(file(note({ thing: 'gone-1' })), level, 'room-1', false, say, () => ({
    w: 1,
    h: 1,
  }))
  expect(pins).toHaveLength(1)
})

test('notes of other levels are not shown, and done ones only when asked for', () => {
  const all = file(note({ id: 'n-1' }), note({ id: 'n-2', level: 'room-2' }), note({ id: 'n-3', done: true }))
  expect(noteExtras(all, level, 'room-1', false, say, () => ({ w: 1, h: 1 })).map((p) => p.id)).toEqual([
    'note:n-1',
  ])
  const withDone = noteExtras(all, level, 'room-1', true, say, () => ({ w: 1, h: 1 }))
  expect(withDone.map((p) => p.id)).toEqual(['note:n-1', 'note:n-3'])
  expect(withDone[1]?.done).toBe(true)
  expect(notesOfLevel(all, 'room-2').map((n) => n.id)).toEqual(['n-2'])
})

test('a pin id says which note it is', () => {
  expect(noteIdOf('note:n-4')).toBe('n-4')
  expect(noteIdOf('crate-1')).toBeUndefined()
})
