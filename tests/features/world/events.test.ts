import { expect, test } from 'vitest'
import { cantPlay, type Saying, say, unsay } from '#src/features/world/events.ts'

const one: Saying = { id: 'a', kind: 'info', text: 'one' }
const two: Saying = { id: 'b', kind: 'good', text: 'two' }

test('a new saying goes last, and one with the same id takes the old one’s place', () => {
  expect(say([one], two)).toEqual([one, two])
  expect(say([one, two], { ...one, text: 'again' })).toEqual([{ ...one, text: 'again' }, two])
})

test('a saying can be taken away by its id, and one that is not there changes nothing', () => {
  expect(unsay([one, two], 'a')).toEqual([two])
  expect(unsay([one], 'zzz')).toEqual([one])
})

test('a level that cannot be played says the first sentence and every line, or says it does not know why', () => {
  const words = { cantPlay: 'Cannot play.', cantPlayNothing: 'Not now.' }
  expect(cantPlay(words, ['one', 'two'])).toEqual({
    id: 'play',
    kind: 'problem',
    text: 'Cannot play.',
    details: ['one', 'two'],
    dismiss: true,
  })
  expect(cantPlay(words, []).text).toBe('Not now.')
})
