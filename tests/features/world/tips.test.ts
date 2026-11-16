import { expect, test } from 'vitest'
import type { Saying } from '#src/features/world/events.ts'
import { playTip } from '#src/features/world/tips.ts'
import { brokenStore, memoryStore } from '../../fixtures/store.ts'

const note: Saying = { id: 'saved', kind: 'good', text: 'Saved' }

test('the tip about what Play leaves out is added once, and marked as seen when it is given', () => {
  const store = memoryStore()
  expect(playTip([note], store, true, 'words')).toEqual([
    note,
    { id: 'tip-play-code', kind: 'info', text: 'words', dismiss: true },
  ])
  expect(store.getItem('af.tip.play-code')).not.toBeNull()
  expect(playTip([note], store, true, 'words')).toEqual([note])
})

test('with tips turned off there is none, and it is not marked as seen', () => {
  const store = memoryStore()
  expect(playTip([], store, false, 'words')).toEqual([])
  expect(store.getItem('af.tip.play-code')).toBeNull()
})

test('a device that will not keep anything shows it each time', () => {
  expect(playTip([], brokenStore(), true, 'words')).toHaveLength(1)
})
