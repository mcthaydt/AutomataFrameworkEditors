import { expect, test } from 'vitest'
import { openingOf, whenWords, whereWords } from '#src/features/team/history.ts'
import type { HistoryLine } from '#src/features/wire/wire.ts'
import { wordsIn } from '#src/features/words/words.ts'

const NOW = Date.UTC(2026, 10, 17, 12, 0, 0)
const line = (over: Partial<HistoryLine>): HistoryLine => ({
  commit: 'a',
  by: 'sam',
  at: NOW,
  words: 'Moved Crate 1',
  levels: [],
  map: false,
  ...over,
})

test('a time is said the way the person says it, nearest first', () => {
  expect(whenWords(NOW - 30_000, NOW, 'en')).toBe('now')
  expect(whenWords(NOW - 2 * 60_000, NOW, 'en')).toBe('2 minutes ago')
  expect(whenWords(NOW - 3 * 3_600_000, NOW, 'en')).toBe('3 hours ago')
  expect(whenWords(NOW - 30 * 3_600_000, NOW, 'en')).toBe('yesterday')
  expect(whenWords(NOW - 10 * 86_400_000, NOW, 'en')).toBe('Nov 7')
  expect(whenWords(NOW - 2 * 60_000, NOW, 'es')).toBe('hace 2 minutos')
})

test('a time in the future (a slow clock) is "now", never a negative', () => {
  expect(whenWords(NOW + 5 * 60_000, NOW, 'en')).toBe('now')
})

test('where a change was is its levels and the map, or the whole game when it was neither', () => {
  const t = wordsIn('en').team
  expect(whereWords(line({ levels: ['level-1'] }), t)).toBe('Level 1')
  expect(whereWords(line({ levels: ['level-1', 'level-2'], map: true }), t)).toBe('Level 1, Level 2, The map')
  expect(whereWords(line({ map: true }), t)).toBe('The map')
  expect(whereWords(line({}), t)).toBe('The whole game')
})

test('"Show me" opens the first level a change touched, else the map, else nothing', () => {
  expect(openingOf(line({ levels: ['level-2', 'level-1'], map: true }))).toEqual({ level: 'level-2' })
  expect(openingOf(line({ map: true }))).toEqual({ map: true })
  expect(openingOf(line({}))).toBeUndefined()
})
