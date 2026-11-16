// The notes people leave on a game: `automata.notes.toml` at the root of the game's repo, on its own branch,
// `automata/notes`, which no pull request is ever opened from. A note is a few words about a level, a thing in it or a
// spot on it; anyone who may look can add one, and answer or finish one. It is a documented file like any other, so an
// agent can read it and answer; this is the one place it is read and the one place it is written.
import { parse } from 'smol-toml'
import { z } from 'zod'

// The page's rules forbid eval, and zod would otherwise try it. This turns that off for this copy of zod.
z.config({ jitless: true })

export const NOTES_FILE = 'automata.notes.toml'
export const NOTES_BRANCH = 'automata/notes'

export interface NoteAnswer {
  readonly by: string
  /** ISO time. */
  readonly when: string
  readonly words: string
}
export interface Note {
  readonly id: string
  readonly level: string
  /** The id of a thing in the level, when the note is about one. */
  readonly thing?: string
  /** A spot in the level, in tiles, when the note is about one. */
  readonly at?: { readonly x: number; readonly y: number }
  readonly by: string
  /** ISO time. */
  readonly when: string
  readonly words: string
  readonly answers: readonly NoteAnswer[]
  readonly done: boolean
}
export interface NotesFile {
  readonly format: 1
  readonly notes: readonly Note[]
}

const NONE: NotesFile = { format: 1, notes: [] }

const Answer = z.object({ by: z.string(), when: z.string(), words: z.string() })
const NoteSchema = z.object({
  id: z.string(),
  level: z.string(),
  thing: z.string().optional(),
  at: z.object({ x: z.number().finite(), y: z.number().finite() }).optional(),
  by: z.string(),
  when: z.string(),
  words: z.string(),
  // A note with no answers has no answer tables in the file, so none is the same as an empty list.
  answers: z.array(Answer).default([]),
  done: z.boolean(),
})
const Schema = z.object({ format: z.literal(1), notes: z.array(NoteSchema) })

/** No file, or one that cannot be read, is no notes: a note is never worth stopping a game for. */
export function parseNotes(text: string | undefined): NotesFile {
  if (text === undefined) return NONE
  let raw: unknown
  try {
    raw = parse(text)
  } catch {
    return NONE
  }
  const result = Schema.safeParse(raw)
  if (!result.success) return NONE
  return {
    format: 1,
    notes: result.data.notes.map((n) => ({
      id: n.id,
      level: n.level,
      ...(n.thing === undefined ? {} : { thing: n.thing }),
      ...(n.at === undefined ? {} : { at: { x: n.at.x, y: n.at.y } }),
      by: n.by,
      when: n.when,
      words: n.words,
      answers: n.answers.map((a) => ({ by: a.by, when: a.when, words: a.words })),
      done: n.done,
    })),
  }
}

/** A TOML string: JSON's escapes are TOML's, except that TOML will not take a bare DEL. */
const quoted = (text: string): string => JSON.stringify(text).replace(/\u007f/g, '\\u007F')

/** The one way to write the file: the same notes always give the same bytes. */
export function writeNotes(file: NotesFile): string {
  const lines = ['format = 1']
  if (file.notes.length === 0) lines.push('notes = []')
  for (const note of file.notes) {
    lines.push('', '[[notes]]', `id = ${quoted(note.id)}`, `level = ${quoted(note.level)}`)
    if (note.thing !== undefined) lines.push(`thing = ${quoted(note.thing)}`)
    if (note.at !== undefined) lines.push(`at = { x = ${Number(note.at.x)}, y = ${Number(note.at.y)} }`)
    lines.push(
      `by = ${quoted(note.by)}`,
      `when = ${quoted(note.when)}`,
      `words = ${quoted(note.words)}`,
      `done = ${note.done ? 'true' : 'false'}`,
    )
    for (const reply of note.answers) {
      lines.push(
        '',
        '[[notes.answers]]',
        `by = ${quoted(reply.by)}`,
        `when = ${quoted(reply.when)}`,
        `words = ${quoted(reply.words)}`,
      )
    }
  }
  return `${lines.join('\n')}\n`
}

/** The number a new note takes: one more than the biggest there has been, so a note taken away never gives its number back. */
function nextNumber(file: NotesFile): number {
  let biggest = 0
  for (const note of file.notes) {
    const match = /^note-(\d+)$/.exec(note.id)
    if (match !== null) biggest = Math.max(biggest, Number(match[1]))
  }
  return biggest + 1
}

export function addNote(file: NotesFile, note: Omit<Note, 'id' | 'answers' | 'done'>): NotesFile {
  return {
    format: 1,
    notes: [...file.notes, { ...note, id: `note-${nextNumber(file)}`, answers: [], done: false }],
  }
}

/** Puts `change` on the note named `id`; a note that is not there changes nothing. */
function change(file: NotesFile, id: string, apply: (note: Note) => Note): NotesFile {
  if (!file.notes.some((note) => note.id === id)) return file
  return { format: 1, notes: file.notes.map((note) => (note.id === id ? apply(note) : note)) }
}

export function answer(file: NotesFile, id: string, reply: NoteAnswer): NotesFile {
  return change(file, id, (note) => ({ ...note, answers: [...note.answers, { ...reply }] }))
}

export function setDone(file: NotesFile, id: string, done: boolean): NotesFile {
  return change(file, id, (note) => ({ ...note, done }))
}
