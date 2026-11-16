import { expect, test } from 'vitest'
import { keepMe, ME_DEFAULT, type Me, readMe } from '#src/features/device/me.ts'

function memory(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial))
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (key) => map.get(key) ?? null,
    key: (index) => [...map.keys()][index] ?? null,
    removeItem: (key) => void map.delete(key),
    setItem: (key, value) => void map.set(key, value),
  }
}

test('nothing kept is the default', () => {
  expect(readMe(memory())).toEqual(ME_DEFAULT)
})

test('what is kept comes back, under the af.me.* keys and no others', () => {
  const store = memory()
  const me: Me = { glass: 'off', rows: 'small', fingerDraws: true, leftHand: true, tips: false, language: 'ko' }
  keepMe(store, me)
  expect(readMe(store)).toEqual(me)
  const keys = Array.from({ length: store.length }, (_, i) => store.key(i))
  expect(keys.sort()).toEqual(
    ['af.me.finger', 'af.me.glass', 'af.me.language', 'af.me.left', 'af.me.rows', 'af.me.tips'].sort(),
  )
})

test('garbage is the default, a field at a time', () => {
  const store = memory({ 'af.me.glass': 'sparkly', 'af.me.rows': '{', 'af.me.finger': 'maybe', 'af.me.tips': 'false' })
  expect(readMe(store)).toEqual({ ...ME_DEFAULT, tips: false })
})

test('a store that throws is the default', () => {
  const broken = { ...memory(), getItem: () => { throw new Error('blocked') } } as unknown as Storage
  expect(readMe(broken)).toEqual(ME_DEFAULT)
  const noWrite = { ...memory(), setItem: () => { throw new Error('full') } } as unknown as Storage
  expect(() => keepMe(noWrite, ME_DEFAULT)).not.toThrow()
})

test('a language the editors do not speak is not kept', () => {
  expect(readMe(memory({ 'af.me.language': 'xx' })).language).toBeUndefined()
})
