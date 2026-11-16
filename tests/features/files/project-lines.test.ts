import { parseProject } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import { changeProject } from '#src/features/files/files.ts'
import { fixtureFiles } from '../../fixtures/game/read.ts'
import { linksFiles } from '../../fixtures/links-game/links.ts'

const LINKS = linksFiles()['automata.toml'] ?? ''
const CRATE = fixtureFiles['automata.toml'] ?? ''
const HAND = `format = 1
# What the game is called.
name = "Hand Game"
start = "a"
hero = "hero"
levels = ["a", "b"] # the play order

[[content]]
type = "level"
path = "content/levels/a.json"

[[content]]
type = "level"
path = "content/levels/b.json"

# The hero.
[[content]]
type = "character"
path = "content/characters/hero.json"
`
const WINDOWS = HAND.replaceAll('\n', '\r\n')
const level = (id: string) => ({ type: 'level', path: `content/levels/${id}.json` }) as const

const reads = (text: string | undefined): boolean => text !== undefined && parseProject(text).ok

test('the texts the tests start from are project files', () => {
  expect([LINKS, CRATE, HAND, WINDOWS].every(reads)).toBe(true)
})

test.each([
  ['the links game', LINKS],
  ['a hand-written file with comments', HAND],
  ['the same with Windows line ends', WINDOWS],
])('%s: adding a level then taking it away gives the first text back, byte for byte', (_name, text) => {
  const added = changeProject(text, { add: [level('level-4')] })
  expect(added).not.toBe(text)
  expect(reads(added)).toBe(true)
  const removed = changeProject(added ?? '', { remove: ['content/levels/level-4.json'] })
  expect(removed).toBe(text)
})

test('adding level-4 lists it at the end of levels and as a block of three lines at the end of the file', () => {
  const added = changeProject(LINKS, { add: [level('level-4')] })
  const levels = LINKS.replace(
    'levels = ["room-1", "room-2", "room-3"]',
    'levels = ["room-1", "room-2", "room-3", "level-4"]',
  )
  const block = '\n[[content]]\ntype = "level"\npath = "content/levels/level-4.json"\n'
  expect(added).toBe(levels + block)
})

test('a text with no levels line never gets one', () => {
  const added = changeProject(CRATE, { add: [level('level-2')] })
  expect(reads(added)).toBe(true)
  expect(added).not.toContain('levels')
  expect(added).toBe(`${CRATE}\n[[content]]\ntype = "level"\npath = "content/levels/level-2.json"\n`)
})

test('a comment between blocks and one after a line survive an add and a take away', () => {
  const added = changeProject(HAND, { add: [level('c')] }) ?? ''
  expect(added).toContain('# What the game is called.')
  expect(added).toContain('# The hero.')
  expect(added).toContain('levels = ["a", "b", "c"] # the play order')
  const removed = changeProject(added, { remove: ['content/levels/b.json'] }) ?? ''
  expect(removed).toContain('# The hero.')
  expect(removed).toContain('levels = ["a", "c"] # the play order')
  expect(removed).not.toContain('b.json')
  expect(reads(removed)).toBe(true)
})

test('taking away a level removes its block and one blank line, and its id from levels', () => {
  const removed = changeProject(LINKS, { remove: ['content/levels/room-2.json'] })
  expect(reads(removed)).toBe(true)
  expect(removed).toContain('levels = ["room-1", "room-3"]')
  expect(removed).not.toContain('room-2')
  const block = '\n[[content]]\ntype = "level"\npath = "content/levels/room-2.json"\n'
  const levels = LINKS.replace('levels = ["room-1", "room-2", "room-3"]', 'levels = ["room-1", "room-3"]')
  expect(removed).toBe(levels.replace(block, ''))
})

test('taking away the only id left takes the levels line out', () => {
  const one = HAND.replace('levels = ["a", "b"] # the play order', 'levels = ["b"]')
  const removed = changeProject(one, { remove: ['content/levels/b.json'] })
  expect(reads(removed)).toBe(true)
  expect(removed).not.toContain('levels')
  expect(removed).toContain('start = "a"')
})

test('renaming a level id changes start and levels and nothing else', () => {
  const renamed = changeProject(LINKS, { rename: { 'room-1': 'hall' } }) ?? ''
  expect(reads(renamed)).toBe(true)
  const was = LINKS.split('\n')
  const now = renamed.split('\n')
  expect(now).toHaveLength(was.length)
  const changed = now.flatMap((line, i) => (line === was[i] ? [] : [line]))
  expect(changed).toEqual(['start = "hall"', 'levels = ["hall", "room-2", "room-3"]'])
})

test('taking away the start level is refused', () => {
  expect(changeProject(LINKS, { remove: ['content/levels/room-1.json'] })).toBeUndefined()
})

test('a path already listed is left alone, and a path that is not listed takes nothing away', () => {
  expect(changeProject(LINKS, { add: [level('room-2')] })).toBe(LINKS)
  expect(changeProject(LINKS, { remove: ['content/levels/nothing.json'] })).toBe(LINKS)
})

test('a world file is listed without touching levels', () => {
  const added = changeProject(LINKS, { add: [{ type: 'world', path: 'content/worlds/second.json' }] })
  expect(reads(added)).toBe(true)
  expect(added).toContain('levels = ["room-1", "room-2", "room-3"]')
  expect(added?.endsWith('\n[[content]]\ntype = "world"\npath = "content/worlds/second.json"\n')).toBe(true)
})

test('a result that does not read as a project file is undefined', () => {
  expect(changeProject(LINKS, { add: [{ type: 'level', path: 'src/main.ts' }] })).toBeUndefined()
  expect(changeProject('this is not a project\n', { add: [level('x')] })).toBeUndefined()
})

test('a levels list over several lines is not changed by guess', () => {
  const several = HAND.replace('levels = ["a", "b"] # the play order', 'levels = [\n  "a",\n  "b",\n]')
  expect(changeProject(several, { add: [level('c')] })).toBeUndefined()
})
