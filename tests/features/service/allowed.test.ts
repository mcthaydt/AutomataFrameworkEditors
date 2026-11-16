import { expect, test } from 'vitest'
import { allowedFiles, allowedPaths, isNewPathFor } from '#src/features/service/allowed.ts'

const LISTED = [
  { type: 'level', path: 'content/levels/room-1.json' },
  { type: 'world', path: 'content/worlds/world.json' },
  { type: 'character', path: 'content/characters/hero.json' },
  { type: 'tuning', path: 'content/tunings/hero-moves.json' },
] as const

test('the level and world files the game lists are allowed, and nothing else it lists', () => {
  expect([...allowedPaths(LISTED, undefined)].sort()).toEqual([
    'content/levels/room-1.json',
    'content/worlds/world.json',
  ])
  expect(allowedFiles(LISTED, undefined).get('content/worlds/world.json')).toBe('world')
})

test('what the change adds is allowed when it is where a new level or world goes', () => {
  const project = {
    add: [
      { type: 'level', path: 'content/levels/room-4.json' },
      { type: 'world', path: 'content/worlds/second.json' },
    ],
  } as const
  const allowed = allowedFiles(LISTED, project)
  expect(allowed.get('content/levels/room-4.json')).toBe('level')
  expect(allowed.get('content/worlds/second.json')).toBe('world')
})

test('an added path outside its folder, with a bad id or of the wrong kind is not allowed', () => {
  const bad = [
    { type: 'level', path: 'content/characters/crate.json' },
    { type: 'level', path: 'content/levels/../../automata.access.toml' },
    { type: 'level', path: 'content/levels/Room 4.json' },
    { type: 'level', path: 'content/worlds/w.json' },
    { type: 'world', path: 'content/levels/room-4.json' },
    { type: 'level', path: 'src/main.ts' },
    { type: 'level', path: 'content/levels/sub/room-4.json' },
  ] as const
  expect(allowedPaths(LISTED, { add: bad })).toEqual(allowedPaths(LISTED, undefined))
})

test('a new path is for one kind of folder, with an id of at most 64 characters', () => {
  expect(isNewPathFor('level', 'content/levels/level-2.json')).toBe(true)
  expect(isNewPathFor('level', 'content/levels/level-2.txt')).toBe(false)
  expect(isNewPathFor('level', `content/levels/a${'b'.repeat(64)}.json`)).toBe(false)
  expect(isNewPathFor('world', 'content/worlds/world.json')).toBe(true)
})
