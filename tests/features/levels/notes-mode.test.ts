import { expect, test } from 'vitest'
import { keepNotesMode, NOTES_KEY, nextNotesMode, readNotesMode } from '#src/features/levels/levels.ts'

/** A device's storage in a Map, or one that refuses everything. */
function store(kept?: Record<string, string>, refuses = false): Storage {
  const map = new Map(Object.entries(kept ?? {}))
  const fail = (): never => {
    throw new Error('this device will not remember')
  }
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (key) => (refuses ? fail() : (map.get(key) ?? null)),
    key: (at) => [...map.keys()][at] ?? null,
    removeItem: (key) => void map.delete(key),
    setItem: (key, value) => (refuses ? fail() : void map.set(key, value)),
  }
}

test('nothing kept is on', () => expect(readNotesMode(store())).toBe('on'))

test.each(['on', 'faded', 'hidden'] as const)('%s is read back', (mode) => {
  const device = store()
  keepNotesMode(device, mode)
  expect(device.getItem(NOTES_KEY)).toBe(mode)
  expect(readNotesMode(device)).toBe(mode)
})

test.each(['', 'ON', 'dim', '1', 'null'])('rubbish (%j) is on', (rubbish) =>
  expect(readNotesMode(store({ [NOTES_KEY]: rubbish }))).toBe('on'),
)

test('a store that throws on reading is on, and on writing is ignored', () => {
  const refusing = store({}, true)
  expect(readNotesMode(refusing)).toBe('on')
  expect(() => keepNotesMode(refusing, 'hidden')).not.toThrow()
})

test('it is kept under af.notes', () => expect(NOTES_KEY).toBe('af.notes'))

test('on, faded, hidden, on', () => {
  expect(nextNotesMode('on')).toBe('faded')
  expect(nextNotesMode('faded')).toBe('hidden')
  expect(nextNotesMode('hidden')).toBe('on')
})
