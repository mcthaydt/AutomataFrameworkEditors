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

test('a call with a question in its address is explained by its whole address, not only its path', () => {
  const open = 'http://127.0.0.1:4800/api/game?owner=grandma&name=not-a-game'
  const track = cutOffTracker()
  track.started(open)
  track.navigated()
  expect(
    track.explains('/127.0.0.1:4800/api/game?owner=grandma&name=not-a-game due to access control checks.'),
  ).toBe(true)
  // Another game's open, never started, is not excused by this one.
  expect(
    track.explains('/127.0.0.1:4800/api/game?owner=grandma&name=other due to access control checks.'),
  ).toBe(false)
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

// Word for word what WebKit reported in CI (open-game and sign-in journeys): the in-memory picture of a game, which the
// page decodes with `createImageBitmap`, is named by a bare id on the site's own address. The page never asks for it
// (no request event), so only a page that moved after its first load can have cut it off.
const memoryPicture =
  'ttp://127.0.0.1:4800/6bc4b496-141f-4faf-8472-120ce82ca7b7 due to access control checks.'

test('a picture being decoded when the page moved on again is not a fault, though it was never a request', () => {
  const track = cutOffTracker()
  track.navigated() // the first load
  track.navigated() // the reload that cut it off
  expect(track.explains(memoryPicture)).toBe(true)
})

test('the same words on a page that has only loaded once are a fault', () => {
  const track = cutOffTracker()
  track.navigated()
  expect(track.explains(memoryPicture)).toBe(false)
})

test("a bare id that is not the engine's in-memory picture is still a fault", () => {
  const track = cutOffTracker()
  track.navigated()
  track.navigated()
  expect(track.explains('ttp://127.0.0.1:4800/not-an-id due to access control checks.')).toBe(false)
  expect(track.explains('TypeError: 6bc4b496-141f-4faf-8472-120ce82ca7b7')).toBe(false)
})
