import { expect, test } from 'vitest'
import { cutOffTracker } from './cut-off.ts'

const message = '/127.0.0.1:4800/api/token due to access control checks.'
const token = 'http://127.0.0.1:4800/api/token'

test("a call made before the page moved on explains the browser's error about it", () => {
  const track = cutOffTracker()
  track.started(token)
  track.navigated()
  expect(track.explains(message)).toBe(true)
})

test('a call made after the page last moved is a real fault', () => {
  const track = cutOffTracker()
  track.navigated()
  track.started(token)
  expect(track.explains(message)).toBe(false)
})

test('a page that never moved has nothing to excuse', () => {
  const track = cutOffTracker()
  track.started(token)
  expect(track.explains(message)).toBe(false)
})

test('an error about another address, or another kind of error, is not explained', () => {
  const track = cutOffTracker()
  track.started(token)
  track.navigated()
  expect(track.explains('/127.0.0.1:4800/api/games due to access control checks.')).toBe(false)
  expect(track.explains('TypeError: undefined is not a function')).toBe(false)
})
