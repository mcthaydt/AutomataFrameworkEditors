// The editors' settings for everyone on a game: `automata.editors.toml` at the root of the game's repo. It is a
// documented file like any other, so an agent can read and change it; the editors only read it. This is the one place it
// is read and the one place it is written.
import { parse } from 'smol-toml'
import { z } from 'zod'

// The page's rules forbid eval, and zod would otherwise try it. This turns that off for this copy of zod.
z.config({ jitless: true })

export const EDITORS_FILE = 'automata.editors.toml'

export interface EditorsFile {
  readonly format: 1
  /** What a change that leaves a problem in the game does: 'warn' saves it and shows the problem, 'stop' refuses it. */
  readonly problems: 'warn' | 'stop'
}

/** With no file: a problem is shown, never in the way. */
export const EDITORS_DEFAULT: EditorsFile = { format: 1, problems: 'warn' }

const Schema = z.strictObject({ format: z.literal(1), problems: z.enum(['warn', 'stop']) })

type Parsed =
  | { readonly ok: true; readonly value: EditorsFile }
  | { readonly ok: false; readonly why: string }

/** No file is the default. A file that cannot be read, or says something else, is one plain sentence. */
export function parseEditors(text: string | undefined): Parsed {
  if (text === undefined) return { ok: true, value: EDITORS_DEFAULT }
  let raw: unknown
  try {
    raw = parse(text)
  } catch {
    return { ok: false, why: `${EDITORS_FILE} can't be read. Write it the way the example shows.` }
  }
  const result = Schema.safeParse(raw)
  if (result.success) return { ok: true, value: result.data }
  const issue = result.error.issues[0]
  if (issue?.code === 'unrecognized_keys') {
    return { ok: false, why: `${EDITORS_FILE} doesn't use ${issue.keys.join(', ')}. Take it out.` }
  }
  if (issue?.path[0] === 'problems') {
    return { ok: false, why: `In ${EDITORS_FILE}, write problems = "warn" or problems = "stop".` }
  }
  return {
    ok: false,
    why: `${EDITORS_FILE} must start with format = 1 and then say problems = "warn" or "stop".`,
  }
}

/** What a page sent, as settings, when it is exactly what the file can hold; undefined otherwise. */
export function checkEditors(value: unknown): EditorsFile | undefined {
  const result = Schema.safeParse(value)
  return result.success ? result.data : undefined
}

/** The one way to write the file. */
export function writeEditors(file: EditorsFile): string {
  return `format = 1\nproblems = ${JSON.stringify(file.problems)}\n`
}
