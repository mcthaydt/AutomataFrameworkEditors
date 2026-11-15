import { expect, test } from 'vitest'
import {
  allClosed,
  keepClosed,
  PANEL_NAMES,
  type PanelName,
  readClosed,
  toggled,
} from '#src/features/ui/panels.ts'

/** A store in memory, as `localStorage` is to the page. */
function memory(initial?: string): Storage {
  const data = new Map<string, string>(initial === undefined ? [] : [['af.panels', initial]])
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  }
}
const throwing: Storage = new Proxy(memory(), {
  get() {
    return () => {
      throw new Error('no storage here')
    }
  },
})

test('the five parts a person can close', () => {
  expect([...PANEL_NAMES]).toEqual(['tools', 'card', 'block', 'switch', 'zoom'])
})

test('nothing is closed for an empty store, for rubbish and for a store that throws', () => {
  expect(readClosed(undefined).size).toBe(0)
  expect(readClosed(memory()).size).toBe(0)
  expect(readClosed(memory('not json {')).size).toBe(0)
  expect(readClosed(memory('{"tools":true}')).size).toBe(0)
  expect(readClosed(memory('["tools","nonsense",7]'))).toEqual(new Set(['tools']))
  expect(readClosed(throwing).size).toBe(0)
})

test('toggling twice is the start, and the start is not changed', () => {
  const start: ReadonlySet<PanelName> = new Set(['card'])
  const closed = toggled(start, 'tools')
  expect(closed).toEqual(new Set(['card', 'tools']))
  expect(start).toEqual(new Set(['card']))
  expect(toggled(closed, 'tools')).toEqual(start)
})

test('what is kept is read back, in a fixed order, and keeping never throws', () => {
  const store = memory()
  keepClosed(store, new Set<PanelName>(['zoom', 'tools']))
  expect(store.getItem('af.panels')).toBe('["tools","zoom"]')
  expect(readClosed(store)).toEqual(new Set(['tools', 'zoom']))
  expect(() => keepClosed(throwing, new Set(['tools']))).not.toThrow()
  expect(() => keepClosed(undefined, new Set(['tools']))).not.toThrow()
})

test('all closed looks only at the parts that float', () => {
  const closed: ReadonlySet<PanelName> = new Set(['tools', 'card'])
  expect(allClosed(closed, ['tools', 'card'])).toBe(true)
  expect(allClosed(closed, ['tools', 'card', 'zoom'])).toBe(false)
  expect(allClosed(closed, ['tools'])).toBe(true)
  expect(allClosed(closed, [])).toBe(false)
})
