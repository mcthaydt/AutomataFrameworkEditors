// The sharing file, `automata.access.toml`, at the root of a game's repo on its default branch. It says who may do
// what in the editor. It is a documented file like any other: an agent can read and change it, and the Share screen
// is only a touch screen for it. This is the one place it is read and the one place it is written.
import { parse } from 'smol-toml'
import { z } from 'zod'
import { type AccessLevel, higher } from './levels.ts'

export const ACCESS_FILE = 'automata.access.toml'
export const MAX_PEOPLE = 100

const PERSON_LEVELS = ['look', 'suggest', 'approve', 'edit', 'owner'] as const
const EVERYONE_LEVELS = ['nothing', 'look', 'suggest'] as const

export interface AccessPerson {
  readonly github: string
  readonly level: Exclude<AccessLevel, 'nothing'>
}
export interface AccessFile {
  readonly format: 1
  /** What anyone who signs in can do. */
  readonly everyone: 'nothing' | 'look' | 'suggest'
  readonly people: readonly AccessPerson[]
}

/** A GitHub name: 1 to 39 letters, digits or single dashes, not starting or ending with a dash. */
const GITHUB_NAME = /^(?!-)(?!.*--)[A-Za-z0-9-]{1,39}(?<!-)$/

const same = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase()

export const AccessSchema: z.ZodType<AccessFile> = z
  .strictObject({
    format: z.literal(1),
    everyone: z.enum(EVERYONE_LEVELS),
    people: z
      .array(
        z.strictObject({
          github: z.string().regex(GITHUB_NAME, { error: "That doesn't look like a GitHub name." }),
          level: z.enum(PERSON_LEVELS),
        }),
      )
      .max(MAX_PEOPLE, { error: `There can be at most ${MAX_PEOPLE} people on the list.` })
      .default([])
      .superRefine((people, ctx) => {
        people.forEach((person, i) => {
          if (people.findIndex((other) => same(other.github, person.github)) !== i) {
            ctx.addIssue({
              code: 'custom',
              path: [i, 'github'],
              message: `${person.github} is on the list more than once.`,
            })
          }
        })
      }),
  })
  .transform((file): AccessFile => file)

type Parsed =
  | { readonly ok: true; readonly value: AccessFile }
  | { readonly ok: false; readonly problems: readonly string[] }

/** `people[1].level`, as the framework's sentences name a place. */
function place(path: readonly PropertyKey[]): string {
  return path.reduce<string>(
    (text, part) =>
      typeof part === 'number' ? `${text}[${part}]` : text === '' ? String(part) : `${text}.${String(part)}`,
    '',
  )
}

function sentence(issue: z.core.$ZodIssue): string {
  const where = place(issue.path)
  const say = (words: string): string => (where === '' ? words : `${where}: ${words}`)
  switch (issue.code) {
    case 'invalid_value':
      return say(`This must be one of: ${issue.values.map(String).join(', ')}.`)
    case 'unrecognized_keys':
      return say(`The sharing list doesn't use ${issue.keys.join(', ')}. Take it out.`)
    case 'invalid_type':
      return say('This is missing or is the wrong kind of value.')
    default:
      return say(issue.message.endsWith('.') ? issue.message : `${issue.message}.`)
  }
}

export function parseAccess(text: string): Parsed {
  let raw: unknown
  try {
    raw = parse(text)
  } catch {
    return {
      ok: false,
      problems: ["The sharing list can't be read. Check that it is written the way the example shows."],
    }
  }
  const result = AccessSchema.safeParse(raw)
  if (result.success) return { ok: true, value: result.data }
  return { ok: false, problems: result.error.issues.map(sentence) }
}

/**
 * The one way to write the file: keys in the order of `AccessFile`, people sorted by name without regard to case, so
 * two writers of the same list (the Share screen and an agent) make the same bytes. Throws on a list `parseAccess`
 * would refuse.
 */
export function writeAccess(file: AccessFile): string {
  const checked = AccessSchema.safeParse(file)
  if (!checked.success)
    throw new Error(`Not a good sharing list: ${checked.error.issues.map(sentence).join(' ')}`)
  const lines = ['format = 1', `everyone = ${JSON.stringify(checked.data.everyone)}`]
  const people = [...checked.data.people].sort((a, b) => {
    const [x, y] = [a.github.toLowerCase(), b.github.toLowerCase()]
    return x < y ? -1 : x > y ? 1 : 0
  })
  for (const person of people) {
    lines.push(
      '',
      '[[people]]',
      `github = ${JSON.stringify(person.github)}`,
      `level = ${JSON.stringify(person.level)}`,
    )
  }
  return `${lines.join('\n')}\n`
}

/** With no file: everyone may look at a public game, and nobody gets into a private one. */
export function defaultAccess(isPublic: boolean): AccessFile {
  return { format: 1, everyone: isPublic ? 'look' : 'nothing', people: [] }
}

/** What a file that cannot be read counts as: only the repo's owner gets in. */
export const CLOSED: AccessFile = { format: 1, everyone: 'nothing', people: [] }

/**
 * A person's level: the higher of their own row and `everyone`. The account that owns the repo is always an Owner,
 * whatever the file says, so a game can never be left without one. Names are compared without regard to case.
 */
export function levelOf(file: AccessFile, login: string, repoOwner: string): AccessLevel {
  if (same(login, repoOwner)) return 'owner'
  const row = file.people.find((person) => same(person.github, login))
  return higher(file.everyone, row?.level ?? 'nothing')
}
