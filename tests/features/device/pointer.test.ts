import { expect, test } from 'vitest'
import { ME_DEFAULT, nextPointers, type Pointers, rowSize } from '#src/features/device/device.ts'

const start: Pointers = { last: 'touch', penSeen: false, hovering: false }
const event = (pointerType: string, type: string, buttons = 0) => ({ pointerType, type, buttons })

test('a pen pressing down sets penSeen for good', () => {
  const after = nextPointers(start, event('pen', 'pointerdown', 1))
  expect(after.penSeen).toBe(true)
  expect(nextPointers(after, event('touch', 'pointerdown', 1)).penSeen).toBe(true)
})

test('a pen moving with no button is hovering, and leaving ends it', () => {
  const hovering = nextPointers(start, event('pen', 'pointermove', 0))
  expect(hovering).toMatchObject({ last: 'pen', hovering: true })
  expect(nextPointers(hovering, event('pen', 'pointerdown', 1)).hovering).toBe(false)
  expect(nextPointers(hovering, event('pen', 'pointerleave', 0)).hovering).toBe(false)
})

test('the last kind of pointer is remembered', () => {
  expect(nextPointers(start, event('mouse', 'pointermove', 0)).last).toBe('mouse')
  expect(nextPointers(start, event('touch', 'pointerdown', 1)).last).toBe('touch')
})

test('rows are small for a mouse and a hovering pen, touch size otherwise, and a choice wins', () => {
  expect(rowSize({ last: 'mouse', penSeen: false, hovering: false }, 'auto')).toBe('small')
  expect(rowSize({ last: 'pen', penSeen: true, hovering: true }, 'auto')).toBe('small')
  expect(rowSize({ last: 'pen', penSeen: true, hovering: false }, 'auto')).toBe('touch')
  expect(rowSize({ last: 'touch', penSeen: false, hovering: false }, 'auto')).toBe('touch')
  expect(rowSize({ last: 'touch', penSeen: false, hovering: false }, 'small')).toBe('small')
  expect(rowSize({ last: 'mouse', penSeen: false, hovering: false }, 'touch')).toBe('touch')
  expect(ME_DEFAULT.rows).toBe('auto')
})
