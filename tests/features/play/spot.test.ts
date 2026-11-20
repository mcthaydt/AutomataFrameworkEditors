import { expect, test } from 'vitest'
import { clock } from '#src/features/play/spot.ts'

test('the clock says minutes and seconds', () => {
  expect(clock(0, 60)).toBe('0:00')
  expect(clock(60 * 72 + 30, 60)).toBe('1:12')
  expect(clock(-5, 60)).toBe('0:00')
})
