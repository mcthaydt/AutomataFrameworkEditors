import { expect, test } from 'vitest'
import { commandFor, KEYS } from '#src/features/shell/shell.ts'

interface Held {
  meta?: boolean
  ctrl?: boolean
  shift?: boolean
  inField?: boolean
}
const press = (key: string, over: Held = {}) =>
  commandFor({ key, meta: false, ctrl: false, shift: false, inField: false, ...over })

test('nothing is asked for while the person is typing in a field', () => {
  for (const key of ['v', 'a', 'Delete', ' ', 'Escape', 'ArrowLeft', '?']) {
    expect(press(key, { inField: true }), key).toBeUndefined()
  }
  expect(press('z', { meta: true, inField: true })).toBeUndefined()
})

test('the five tools have their keys', () => {
  expect(press('v')).toBe('tool:pick')
  expect(press('a')).toBe('tool:place')
  expect(press('b')).toBe('tool:paint')
  expect(press('e')).toBe('tool:erase')
  expect(press('l')).toBe('tool:join')
  expect(press('V')).toBe('tool:pick')
})

test('Undo is Command Z or Control Z, and Redo adds Shift', () => {
  expect(press('z', { meta: true })).toBe('undo')
  expect(press('z', { ctrl: true })).toBe('undo')
  expect(press('Z', { meta: true, shift: true })).toBe('redo')
  expect(press('z', { ctrl: true, shift: true })).toBe('redo')
})

test('Find, copy, paste and make a copy are Command or Control with a letter', () => {
  expect(press('k', { meta: true })).toBe('find')
  expect(press('d', { ctrl: true })).toBe('duplicate')
  expect(press('c', { meta: true })).toBe('copy')
  expect(press('v', { meta: true })).toBe('paste')
})

test('Space plays, the question mark opens Help, Delete and the arrows and Escape do their jobs', () => {
  expect(press(' ')).toBe('play')
  expect(press('?')).toBe('help')
  expect(press('Delete')).toBe('delete')
  expect(press('Backspace')).toBe('delete')
  expect(press('ArrowLeft')).toBe('nudge:left')
  expect(press('ArrowDown')).toBe('nudge:down')
  expect(press('Escape')).toBe('escape')
})

test('a key that means nothing here, or a letter held with Command that has no job, asks for nothing', () => {
  expect(press('q')).toBeUndefined()
  expect(press('q', { meta: true })).toBeUndefined()
  expect(press('Enter')).toBeUndefined()
})

test('every key on the list is asked for by a key press, and no two share a command', () => {
  const ids = KEYS.map((key) => key.id)
  expect(new Set(ids).size).toBe(ids.length)
  expect(ids).toEqual(
    expect.arrayContaining(['tool:pick', 'undo', 'redo', 'find', 'play', 'help', 'delete', 'escape']),
  )
})
