import { expect, test } from 'vitest'
import { deviceWord, sizeClass } from '#src/features/device/size.ts'

test('every window is one of four sizes, by the design language', () => {
  expect(sizeClass(1210, 834)).toBe('wide')
  expect(sizeClass(834, 1210)).toBe('tablet-upright')
  expect(sizeClass(390, 844)).toBe('phone')
  expect(sizeClass(844, 390)).toBe('phone-sideways')
  expect(sizeClass(1280, 800)).toBe('wide')
  expect(sizeClass(700, 650)).toBe('wide')
  expect(sizeClass(600, 700)).toBe('tablet-upright')
})

test('a phone upright with its keyboard up is still a phone', () => {
  expect(sizeClass(390, 400)).toBe('phone')
})

const IPAD = 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
const MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15'
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
const WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36'

test('an iPad sideways and a computer are told apart by who they say they are, not by size', () => {
  expect(deviceWord(IPAD, 'wide', true)).toBe('ipad')
  expect(deviceWord(MAC, 'wide', true)).toBe('ipad') // iPadOS says it is a Mac, but a Mac has no touch
  expect(deviceWord(MAC, 'wide', false)).toBe('computer')
  expect(deviceWord(WINDOWS, 'wide', false)).toBe('computer')
  expect(deviceWord(IPAD, 'tablet-upright', true)).toBe('ipad')
})

test('a phone is a phone, whatever its window says', () => {
  expect(deviceWord(IPHONE, 'phone', true)).toBe('phone')
  expect(deviceWord(IPHONE, 'phone-sideways', true)).toBe('phone')
  expect(deviceWord(WINDOWS, 'phone', false)).toBe('phone')
})
