import { expect, test } from 'vitest'
import {
  ACCESS_FILE,
  type AccessFile,
  CLOSED,
  defaultAccess,
  levelOf,
  MAX_PEOPLE,
  parseAccess,
  writeAccess,
} from '#src/features/access/access.ts'
import { bannedIn } from '../../fixtures/banned.ts'

const HEAD = 'format = 1\neveryone = "look"\n'
const person = (github: string, level: string): string =>
  `\n[[people]]\ngithub = "${github}"\nlevel = "${level}"\n`

/** The file the plan shows under "Access levels", without its comments. */
const EXAMPLE = `${HEAD}${person('grandpa', 'approve')}`
const EXAMPLE_FILE: AccessFile = {
  format: 1,
  everyone: 'look',
  people: [{ github: 'grandpa', level: 'approve' }],
}

const file = (everyone: AccessFile['everyone'], ...people: AccessFile['people'][number][]): AccessFile => ({
  format: 1,
  everyone,
  people,
})

test('the file is called automata.access.toml', () => expect(ACCESS_FILE).toBe('automata.access.toml'))

test('the repo owner is an owner whatever the file says', () =>
  expect(levelOf(CLOSED, 'Grandma', 'grandma')).toBe('owner'))

test('a listed person has their level', () =>
  expect(levelOf(file('nothing', { github: 'grandpa', level: 'approve' }), 'grandpa', 'grandma')).toBe(
    'approve',
  ))

test('names are compared without regard to case', () =>
  expect(levelOf(file('nothing', { github: 'grandpa', level: 'edit' }), 'GrandPa', 'grandma')).toBe('edit'))

test('a person gets the higher of their row and everyone', () => {
  const f = file('suggest', { github: 'kid', level: 'look' })
  expect(levelOf(f, 'kid', 'grandma')).toBe('suggest')
  const g = file('look', { github: 'kid', level: 'approve' })
  expect(levelOf(g, 'kid', 'grandma')).toBe('approve')
})

test('someone not listed gets everyone', () => {
  expect(levelOf(file('suggest'), 'stranger', 'grandma')).toBe('suggest')
  expect(levelOf(file('nothing'), 'stranger', 'grandma')).toBe('nothing')
})

test('no file: a public game lets everyone look, a private one lets nobody in', () => {
  expect(defaultAccess(true)).toEqual({ format: 1, everyone: 'look', people: [] })
  expect(defaultAccess(false)).toEqual({ format: 1, everyone: 'nothing', people: [] })
})

test('what a broken file counts as is closed to everyone', () =>
  expect(CLOSED).toEqual({ format: 1, everyone: 'nothing', people: [] }))

test('what writeAccess writes, parseAccess reads back the same', () => {
  const wrote = writeAccess(EXAMPLE_FILE)
  expect(parseAccess(wrote)).toEqual({ ok: true, value: EXAMPLE_FILE })
  expect(parseAccess(writeAccess(CLOSED))).toEqual({ ok: true, value: CLOSED })
})

test('two writers of the same list make the same bytes, whatever order the people came in', () => {
  const a = file('suggest', { github: 'Zed', level: 'edit' }, { github: 'amy', level: 'look' })
  const b = file('suggest', { github: 'amy', level: 'look' }, { github: 'Zed', level: 'edit' })
  expect(writeAccess(a)).toBe(writeAccess(b))
  expect(writeAccess(a).indexOf('amy')).toBeLessThan(writeAccess(a).indexOf('Zed'))
})

test('the written file is the example in the plan, byte for byte', () => {
  expect(writeAccess(EXAMPLE_FILE)).toBe(EXAMPLE)
  expect(writeAccess(CLOSED)).toBe('format = 1\neveryone = "nothing"\n')
})

test('a file may leave out the people', () =>
  expect(parseAccess(HEAD)).toEqual({ ok: true, value: { format: 1, everyone: 'look', people: [] } }))

const MANY = Array.from({ length: MAX_PEOPLE + 1 }, (_, i) => person(`person-${i}`, 'look')).join('')

test.each([
  ['not TOML at all', 'format = '],
  ['an unknown key', 'format = 1\neveryone = "look"\nadmins = []\n'],
  ['everyone set to owner', 'format = 1\neveryone = "owner"\n'],
  ['a level that does not exist', `${HEAD}${person('grandpa', 'god')}`],
  ['a name GitHub would not allow', `${HEAD}${person('-bad-', 'look')}`],
  ['a name with two dashes in a row', `${HEAD}${person('bad--name', 'look')}`],
  ['a name that is too long', `${HEAD}${person('a'.repeat(40), 'look')}`],
  [
    'the same person twice, in different case',
    `${HEAD}${person('Grandpa', 'look')}${person('grandpa', 'edit')}`,
  ],
  ['more than 100 people', `${HEAD}${MANY}`],
  ['a format that is not 1', 'format = 2\neveryone = "look"\n'],
])('%s is refused with a plain sentence', (_name, text) => {
  const result = parseAccess(text)
  expect(result.ok).toBe(false)
  if (result.ok) return
  expect(result.problems.length).toBeGreaterThan(0)
  for (const problem of result.problems) {
    expect(problem).toMatch(/[.?!]$/)
    expect(bannedIn(problem), problem).toEqual([])
  }
})

test('the problem for a level that does not exist names the place and the choices', () => {
  const result = parseAccess(`${HEAD}${person('grandpa', 'approve')}${person('kid', 'god')}`)
  expect(result).toEqual({
    ok: false,
    problems: ['people[1].level: This must be one of: look, suggest, approve, edit, owner.'],
  })
})

test('writeAccess throws on a list parseAccess would refuse', () => {
  expect(() =>
    writeAccess({ format: 1, everyone: 'look', people: [{ github: '-bad-', level: 'look' }] }),
  ).toThrow()
  expect(() => writeAccess({ ...CLOSED, everyone: 'owner' } as unknown as AccessFile)).toThrow()
})
