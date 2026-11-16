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

const font = 'http://127.0.0.1:4800/assets/fraunces-latin-wght-normal-ukD16Tqj.woff2'
// Word for word what Firefox logged in CI (Editors PR 90, the phone's pick-a-game-cant-reach), but the status.
const fontFailed = (status: string) =>
  `console: [JavaScript Error: "downloadable font: download failed (font-family: "Fraunces Variable" ` +
  `style:normal weight:100..900 width:100 src index:0): status=${status} source: ${font}"]`

test('a font Firefox dropped because the page moved on is not a fault', () => {
  const track = cutOffTracker()
  track.started(font)
  track.navigated()
  expect(track.explains(fontFailed('2152398850'))).toBe(true)
})

test('a font that really failed to download is a fault, even after the page moved', () => {
  const track = cutOffTracker()
  track.started(font)
  track.navigated()
  expect(track.explains(fontFailed('2147746065'))).toBe(false)
})

test('a dropped font with no move to explain it is a fault', () => {
  const track = cutOffTracker()
  track.started(font)
  expect(track.explains(fontFailed('2152398850'))).toBe(false)
  const later = cutOffTracker()
  later.navigated()
  later.started(font)
  expect(later.explains(fontFailed('2152398850'))).toBe(false)
})

test('a dropped font with no address to check is a fault', () => {
  const track = cutOffTracker()
  track.started(font)
  track.navigated()
  expect(track.explains(fontFailed('2152398850').replace(/ source: [^"]*/, ''))).toBe(false)
})
