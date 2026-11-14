import { expect, test } from 'vitest'
import { fromBase64, toBase64 } from '#src/lib/base64.ts'

test.each(['crate', '상자 📦', ''])('%j goes to base64 and back', (text) => {
  expect(fromBase64(toBase64(text))).toBe(text)
})

test('base64 is the usual base64 of the UTF-8 bytes', () => {
  expect(toBase64('crate')).toBe('Y3JhdGU=')
  expect(toBase64('📦')).toBe(Buffer.from('📦', 'utf8').toString('base64'))
})

test('the line breaks GitHub puts in are ignored', () => {
  expect(fromBase64('Y3Jh\ndGU=\n')).toBe('crate')
  expect(fromBase64('Y3Jh\r\ndGU=')).toBe('crate')
})
