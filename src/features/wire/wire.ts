// What the page and the API say to each other. The two sides meet only here (and in `access`), so a change to what
// one says is a change to this file, which both can read. Later tasks add the rest of the messages.

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
