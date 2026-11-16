import { expect, test } from 'vitest'
import { playTip } from '#src/features/world/tips.ts'
import { brokenStore, memoryStore } from '../../fixtures/store.ts'

test('the tip about what Play leaves out is given once, and marked as seen when it is given', () => {
  const store = memoryStore()
  expect(playTip(store, true, 'words')).toEqual({
    id: 'tip-play-code',
    kind: 'info',
    text: 'words',
    dismiss: true,
  })
  expect(store.getItem('af.tip.play-code')).not.toBeNull()
  expect(playTip(store, true, 'words')).toBeUndefined()
})

test('with tips turned off there is none, and it is not marked as seen', () => {
  const store = memoryStore()
  expect(playTip(store, false, 'words')).toBeUndefined()
  expect(store.getItem('af.tip.play-code')).toBeNull()
})

test('a device that will not keep anything shows it each time', () => {
  expect(playTip(brokenStore(), true, 'words')).toBeDefined()
})
