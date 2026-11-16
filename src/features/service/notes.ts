// Notes: a few words about a level, a thing in it or a spot on it, that anyone who may look can leave, answer and finish.
// They live in `automata.notes.toml` on their own branch, `automata/notes`, made from the default branch's head the first
// time a note is written; no pull request is ever opened from it, so the game never moves and no note is ever "waiting".
import {
  addNote,
  answer,
  NOTES_BRANCH,
  NOTES_FILE,
  type Note,
  type NotesFile,
  parseNotes,
  setDone,
  writeNotes,
} from '../files/files.ts'
import type { Answer, GameRef } from '../wire/wire.ts'
import { isObject, type Json, readBody, readGame } from './body.ts'
import { type ApiDeps, enter } from './enter.ts'

const MOST_WORDS = 500
const MOST_NAME = 200
/** How many times a write that found the file changed reads it again and applies the same act once more. */
const TRIES = 6

const NONE: NotesFile = { format: 1, notes: [] }

export async function readNotes(deps: ApiDeps, request: Request, game: GameRef): Promise<Answer<NotesFile>> {
  const entered = await enter(deps, request, game, 'look', { visitors: true })
  if (!entered.ok) return entered
  const read = await entered.value.repo.readFile(NOTES_BRANCH, NOTES_FILE)
  if (read.ok) return { ok: true, value: parseNotes(read.value.text) }
  return read.problem === 'not-found' ? { ok: true, value: NONE } : read
}

/** A short piece of text a person wrote, trimmed; undefined when it is not text or is too long or too short. */
const words = (value: unknown, most: number): string | undefined =>
  typeof value === 'string' && value.trim() !== '' && value.trim().length <= most ? value.trim() : undefined

type Act =
  | { readonly kind: 'add'; readonly note: Omit<Note, 'id' | 'answers' | 'done' | 'by' | 'when'> }
  | { readonly kind: 'answer'; readonly id: string; readonly words: string }
  | { readonly kind: 'done'; readonly id: string; readonly done: boolean }

function readAct(body: Json): Act | undefined {
  const { add, answer: reply, done } = body
  if (isObject(add)) {
    const level = words(add.level, MOST_NAME)
    const said = words(add.words, MOST_WORDS)
    if (level === undefined || said === undefined) return undefined
    const thing = add.thing === undefined ? undefined : words(add.thing, MOST_NAME)
    if (add.thing !== undefined && thing === undefined) return undefined
    const spot = add.at
    let at: { x: number; y: number } | undefined
    if (spot !== undefined) {
      if (!isObject(spot) || typeof spot.x !== 'number' || typeof spot.y !== 'number') return undefined
      if (!Number.isFinite(spot.x) || !Number.isFinite(spot.y)) return undefined
      at = { x: spot.x, y: spot.y }
    }
    return {
      kind: 'add',
      note: {
        level,
        words: said,
        ...(thing === undefined ? {} : { thing }),
        ...(at === undefined ? {} : { at }),
      },
    }
  }
  if (isObject(reply)) {
    const said = words(reply.words, MOST_WORDS)
    return typeof reply.id === 'string' && said !== undefined
      ? { kind: 'answer', id: reply.id, words: said }
      : undefined
  }
  if (isObject(done)) {
    return typeof done.id === 'string' && typeof done.done === 'boolean'
      ? { kind: 'done', id: done.id, done: done.done }
      : undefined
  }
  return undefined
}

export async function writeNote(deps: ApiDeps, request: Request): Promise<Answer<NotesFile>> {
  const body = await readBody(request)
  if (!body.ok) return body
  const game = readGame(body.value.game)
  const act = readAct(body.value)
  if (game === undefined || act === undefined) return { ok: false, problem: 'bad-request' }

  const entered = await enter(deps, request, game, 'look')
  if (!entered.ok) return entered
  const { repo, who } = entered.value
  if (who === undefined) return { ok: false, problem: 'signed-out' }
  const author = { name: who.login, email: `${who.id}+${who.login}@users.noreply.github.com` }
  const when = new Date(deps.now()).toISOString()

  /** The notes with this act done, or undefined when the act is about a note that is not there. */
  const apply = (file: NotesFile): { next: NotesFile; message: string } | undefined => {
    if (act.kind === 'add') {
      const next = addNote(file, { ...act.note, by: who.login, when })
      return { next, message: `A note about ${act.note.level}` }
    }
    if (!file.notes.some((note) => note.id === act.id)) return undefined
    if (act.kind === 'answer') {
      const next = answer(file, act.id, { by: who.login, when, words: act.words })
      return { next, message: `An answer to ${act.id}` }
    }
    const next = setDone(file, act.id, act.done)
    return { next, message: act.done ? `${act.id} is done` : `${act.id} is open again` }
  }

  for (let attempt = 0; attempt < TRIES; attempt++) {
    const read = await repo.readFile(NOTES_BRANCH, NOTES_FILE)
    if (!read.ok && read.problem !== 'not-found') return read
    if (!read.ok) {
      // No file: the branch may not be there either. It starts from the game as it is now.
      const there = await repo.branchHead(NOTES_BRANCH)
      if (!there.ok) {
        if (there.problem !== 'not-found') return there
        const head = await repo.branchHead(repo.facts.branch)
        if (!head.ok) return head
        const made = await repo.createBranch(NOTES_BRANCH, head.value)
        // Someone else made it a moment ago: theirs is the branch, and the file is looked at again.
        if (!made.ok && made.problem !== 'changed-elsewhere') return made
      }
    }
    const file = read.ok ? parseNotes(read.value.text) : NONE
    const done = apply(file)
    if (done === undefined) return { ok: false, problem: 'not-found' }
    const saved = await repo.saveFile({
      branch: NOTES_BRANCH,
      path: NOTES_FILE,
      text: writeNotes(done.next),
      version: read.ok ? read.value.version : undefined,
      message: done.message,
      author,
    })
    if (saved.ok) return { ok: true, value: done.next }
    if (saved.problem !== 'changed-elsewhere') return saved
  }
  return { ok: false, problem: 'busy' }
}
