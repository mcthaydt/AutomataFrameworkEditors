import { expect, test } from 'vitest'
import { startEdits } from '#src/features/game/changes.ts'
import { find, parseGo } from '#src/features/shell/find.ts'
import { KEYS } from '#src/features/shell/keys.ts'
import { wordsIn } from '#src/features/words/words.ts'
import { linksFiles } from '../../fixtures/links-game/links.ts'
import { openedGame } from '../../fixtures/open-game.ts'

const game = await openedGame(linksFiles())
const working = startEdits(game).now
const words = wordsIn('en')
const look = (query: string, open: string | undefined = 'room-1') =>
  find(query, working, game.content, KEYS, words, open)

test('nothing typed finds nothing', () => {
  expect(look('')).toEqual([])
  expect(look('   ')).toEqual([])
})

test('"crate" gives the crates, then the command to place a Crate', () => {
  const found = look('crate')
  const kinds = found.map((f) => f.kind)
  expect(kinds[0]).toBe('thing')
  expect(found[0]?.words).toBe('Crate 1')
  const place = found.find((f) => f.kind === 'command')
  expect(place?.words).toBe('Place a Crate')
  // Every thing comes before the command.
  expect(kinds.lastIndexOf('thing')).toBeLessThan(kinds.indexOf('command'))
})

test('"undo" gives the command with its key', () => {
  expect(look('undo')).toEqual([
    { kind: 'command', words: 'Undo', hint: 'Do this', key: '⌘Z', go: 'command:undo' },
  ])
})

test('things in the open level come before the same things in another level', () => {
  const inRoom2 = look('door', 'room-2').filter((f) => f.kind === 'thing')
  const hereFirst = inRoom2.findIndex((f) => f.hint !== 'In this level')
  const hereLast = inRoom2.map((f) => f.hint).lastIndexOf('In this level')
  expect(hereLast).toBeLessThan(hereFirst === -1 ? Number.POSITIVE_INFINITY : hereFirst)
  expect(inRoom2.some((f) => f.hint === 'In this level')).toBe(true)
})

test('a thing is found by name and lands on it, picked', () => {
  const gate = look('gate 1').find((f) => f.kind === 'thing')
  expect(gate?.words).toBe('Gate 1')
  expect(parseGo(gate?.go ?? '')).toEqual({ kind: 'thing', level: 'room-1', thing: 'gate-1' })
})

test('a level is found by its name, and a setting by its name', () => {
  const level = look('room 3').find((f) => f.kind === 'level')
  expect(level?.go).toBe('level:room-3')
  expect(parseGo('level:room-3')).toEqual({ kind: 'level', level: 'room-3' })
  const value = look('opens').find((f) => f.kind === 'value')
  expect(value?.words).toBe('Opens')
  expect(value?.hint).toBe('A setting of Plate 1')
})

test('a go says where it leads', () => {
  expect(parseGo('map')).toEqual({ kind: 'map' })
  expect(parseGo('command:undo')).toEqual({ kind: 'command', id: 'undo' })
  expect(parseGo('nonsense')).toBeUndefined()
})

test('at most twenty come back', () => {
  expect(look('e').length).toBeLessThanOrEqual(20)
})
