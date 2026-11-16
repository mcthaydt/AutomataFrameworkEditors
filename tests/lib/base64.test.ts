import { expect, test } from 'vitest'
import { bytesFromBase64, bytesToBase64, fromBase64, toBase64 } from '#src/lib/base64.ts'

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

test('any bytes go to base64 and back, line breaks ignored', () => {
  const bytes = Uint8Array.from({ length: 300 }, (_, i) => (i * 7) % 256)
  const text = bytesToBase64(bytes)
  expect(text).toBe(Buffer.from(bytes).toString('base64'))
  expect([...bytesFromBase64(text.replace(/(.{60})/g, '$1\n'))]).toEqual([...bytes])
})
