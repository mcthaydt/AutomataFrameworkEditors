// What the page and the API say to each other. The two sides meet only here (and in `access`), so a change to what
// one says is a change to this file, which both can read. Later tasks add the rest of the messages.
import type { AccessFile, AccessLevel } from '../access/access.ts'
import type { EditorsFile, Note, ProjectChange } from '../files/files.ts'

export type ProblemKind =
  | 'signed-out'
  | 'not-found'
  | 'not-a-game'
  | 'not-allowed'
  | 'own-change'
  | 'changed-elsewhere'
  | 'not-ready'
  | 'checks-failed'
  | 'clashes'
  | 'broken'
  | 'blocked'
  | 'bad-request'
  | 'not-set-up'
  | 'busy'
  | 'offline'
  | 'unknown'

/** What every /api call answers: the value, or what went wrong (with plain sentences when there are some). */
export type Answer<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly problem: ProblemKind; readonly details?: readonly string[] }

export interface GameRef {
  readonly owner: string
  readonly name: string
}

/** What a commit's checks say. `none` means no check has been reported (yet). */
export type Checks = 'passing' | 'running' | 'failing' | 'none'

/**
 * The HTTP status each problem is sent with. `offline` is only ever made by the page, when a request throws, so it
 * has no status of its own.
 */
export const STATUS: Readonly<Record<ProblemKind, number>> = {
  'signed-out': 401,
  'not-allowed': 403,
  'own-change': 403,
  blocked: 403,
  'not-found': 404,
  'not-a-game': 404,
  'changed-elsewhere': 409,
  'not-ready': 409,
  'checks-failed': 409,
  clashes: 409,
  broken: 422,
  'bad-request': 422,
  'not-set-up': 500,
  unknown: 500,
  busy: 503,
  offline: 0,
}

/** What the page keeps after sign-in. The token runs out after some hours; `refresh` gets the next one. */
export interface Tokens {
  readonly token: string
  readonly refresh?: string
}

/** One file of a game, as GitHub has it: its text, and the version that changes exactly when the text does. */
export interface WireFile {
  readonly path: string
  readonly text: string
  readonly version: string
}

/** A change that is waiting for someone to approve it. */
export interface Waiting {
  readonly number: number
  readonly title: string
  /** The person it came from, in lower case. */
  readonly by: string
  /** True when it is the asking person's own. */
  readonly mine: boolean
  readonly checks: Checks
  /** Someone who may approve asked for a change and the author has not sent a new one yet. */
  readonly asked?: { readonly by: string; readonly words: string; readonly at: number }
}

/** What opening a game gives the page. */
export interface OpenAnswer {
  readonly game: GameRef
  /** Who the API says you are; undefined for a visitor. */
  readonly login: string | undefined
  /** What the API says you may do. */
  readonly level: AccessLevel
  /** Where these files were read from. */
  readonly branch: string
  /** Your own waiting change, if you have one. */
  readonly mine: Waiting | undefined
  /** How many changes wait in all. */
  readonly waiting: number
  /** Your own change was turned down: who did, and when. Undefined when nothing of yours was. */
  readonly turnedDown: { readonly by: string; readonly at: number } | undefined
  /** `automata.toml` and every file it lists (one that is missing is left out). */
  readonly files: readonly WireFile[]
  /** The editors' settings for everyone on this game: the default when the game has no file, or one that cannot be read. */
  readonly editors: EditorsFile
  /** The version of the settings file, to change it from; undefined when the game has no such file (yet). */
  readonly editorsVersion?: string | undefined
  /** Who is in the game, from its sharing file, so even a person who only looks sees the faces. */
  readonly people: readonly Person[]
  /** The pictures the game's tilesets name, as bytes in base64; one that is too big, or not where it should be, is left out. */
  readonly pictures: readonly OpenPicture[]
}

/** One person in the game's sharing file, and what they may do. */
export interface Person {
  readonly login: string
  readonly level: AccessLevel
}
/** One picture file of a game: its path, and its bytes in base64. */
export interface OpenPicture {
  readonly path: string
  readonly base64: string
}

/** What the page sends to save a level. */
export interface SaveAsk {
  readonly game: GameRef
  /** Which content file. */
  readonly path: string
  /** The level, as data; the API writes the bytes. */
  readonly value: unknown
  /** The version of the file the person opened. */
  readonly version: string
  /** What changed, in a few words. */
  readonly message: string
}
export interface SaveAnswer {
  readonly how: 'direct' | 'suggestion'
  /** The file's new version. */
  readonly version: string
  /** The waiting change the save is part of; undefined when it went straight in. */
  readonly mine: Waiting | undefined
}

/** One file in a Put: the content as data, and the version of the file the person started from. */
export interface PutFile {
  readonly path: string
  /** The content as data; the API writes the bytes. Undefined takes the file away. */
  readonly value: unknown | undefined
  /** Undefined for a file that is new. */
  readonly version: string | undefined
}
/** What the page sends to put every changed file into the game in one change. */
export interface PutAsk {
  readonly game: GameRef
  readonly files: readonly PutFile[]
  /** The lines of the project file to change: levels and worlds listed, taken out, or renamed. */
  readonly project?: ProjectChange
  /** The project file's version the person started from; needed with `project`. */
  readonly projectVersion?: string
  readonly message: string
}
export interface PutAnswer {
  readonly how: 'direct' | 'suggestion'
  /** The new version of each file that was written (a file taken away has none). */
  readonly versions: Readonly<Record<string, string>>
  /** The project file's new text when it changed. */
  readonly project?: WireFile
  /** The waiting change the put is part of; undefined when it went straight in. */
  readonly mine: Waiting | undefined
}

/** One content file a waiting change touches: as the game has it now, and as it would be. */
export interface FileChange {
  readonly path: string
  /** Undefined when the game has no such file. */
  readonly before: string | undefined
  /** Undefined when the change takes the file away. */
  readonly after: string | undefined
}
export interface WaitingChange extends Waiting {
  /** Each content file it changes. */
  readonly changes: readonly FileChange[]
  /** Can it be approved in the editor at all? False when it touches anything but this game's content files. */
  readonly here: boolean
}
/** Which waiting change an approve or a turn-down is about. */
export interface ChangeAsk {
  readonly game: GameRef
  readonly number: number
}

export interface SharingAnswer {
  readonly access: AccessFile
  /** Undefined: the game has no sharing file yet. */
  readonly version: string | undefined
  /** The account that owns the game: always an Owner, never in the list. */
  readonly owner: string
  /** The file on the game cannot be read; saving this screen mends it. */
  readonly broken: boolean
}
export interface SharingAsk {
  readonly game: GameRef
  readonly access: AccessFile
  readonly version: string | undefined
}

/** One saved change to the game's content, as the history shows it. */
export interface HistoryLine {
  readonly commit: string
  /** Who made it. */
  readonly by: string
  /** Milliseconds. */
  readonly at: number
  /** The first line of what they said it was. */
  readonly words: string
  /** The ids of the levels it touched. */
  readonly levels: readonly string[]
  /** The world file was touched. */
  readonly map: boolean
}
/** Ten changes, newest first, and whether older ones are there to ask for. */
export interface HistoryPage {
  readonly lines: readonly HistoryLine[]
  readonly more: boolean
}

/** What the page sends about a note: a new one (the API says who and when), an answer to one, or one done or not. */
export type NoteAsk = { readonly game: GameRef } & (
  | { readonly add: Omit<Note, 'id' | 'answers' | 'done' | 'by' | 'when'> }
  | { readonly answer: { readonly id: string; readonly words: string } }
  | { readonly done: { readonly id: string; readonly done: boolean } }
)

/** What the page sends to change the editors' settings; `version` is the settings file's version, undefined when there is none. */
export interface SettingsAsk {
  readonly game: GameRef
  readonly editors: EditorsFile
  readonly version: string | undefined
}
