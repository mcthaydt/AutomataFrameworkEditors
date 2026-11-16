import { expect, test } from 'vitest'
import { cutOffTracker } from './cut-off.ts'

const message = '/127.0.0.1:4800/api/token due to access control checks.'

test("a request that was still open when the page moved on explains the browser's error about it", () => {
  const track = cutOffTracker()
  track.started('a', 'http://127.0.0.1:4800/api/token')
  track.navigated()
  expect(track.explains(message)).toBe(true)
})

test('a request that finished is never an excuse', () => {
  const track = cutOffTracker()
  track.started('a', 'http://127.0.0.1:4800/api/token')
  track.finished('a')
  track.navigated()
  expect(track.explains(message)).toBe(false)
})

test('a request that failed with no move of the page is a real fault', () => {
  const track = cutOffTracker()
  track.navigated()
  track.started('a', 'http://127.0.0.1:4800/api/token')
  expect(track.explains(message)).toBe(false)
})

test('an error about another address, or another kind of error, is not explained', () => {
  const track = cutOffTracker()
  track.started('a', 'http://127.0.0.1:4800/api/token')
  track.navigated()
  expect(track.explains('/127.0.0.1:4800/api/games due to access control checks.')).toBe(false)
  expect(track.explains('TypeError: undefined is not a function')).toBe(false)
})
