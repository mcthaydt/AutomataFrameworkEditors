import { expect, test } from 'vitest'
import { same } from '#src/lib/same.ts'

test('plain values are the same when they are equal', () => {
  expect(same(1, 1)).toBe(true)
  expect(same('a', 'a')).toBe(true)
  expect(same(1, 2)).toBe(false)
  expect(same(1, '1')).toBe(false)
  expect(same(null, undefined)).toBe(false)
  expect(same(null, {})).toBe(false)
})

test('lists are the same item by item, in order', () => {
  expect(same([1, [2, 3]], [1, [2, 3]])).toBe(true)
  expect(same([1, 2], [2, 1])).toBe(false)
  expect(same([1], [1, 2])).toBe(false)
  expect(same([], {})).toBe(false)
})

test('objects are the same by their keys in any order, and a key that is undefined is no key', () => {
  expect(same({ a: 1, b: { c: 2 } }, { b: { c: 2 }, a: 1 })).toBe(true)
  expect(same({ a: 1, b: undefined }, { a: 1 })).toBe(true)
  expect(same({ a: 1 }, { a: 1, b: 2 })).toBe(false)
  expect(same({ a: 1 }, { a: 2 })).toBe(false)
})
