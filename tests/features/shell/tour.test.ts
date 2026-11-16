import { expect, test } from 'vitest'
import {
  finishGuide,
  guideWanted,
  keepTick,
  readTicks,
  STEPS,
  stepsIn,
  type TourState,
  tourFrom,
  tourNext,
} from '#src/features/shell/tour.ts'
import { fullStore, memoryStore } from '../../fixtures/store.ts'

const at = (step: TourState['step'], did = false): TourState => ({ step, did })

test('the tour starts at the first step it has, or is finished when it has none', () => {
  expect(tourFrom(STEPS)).toEqual(at('tap-the-crate'))
  expect(tourFrom(STEPS, 'drag-a-value')).toEqual(at('drag-a-value'))
  expect(tourFrom(['tap-the-crate', 'drag-a-value'], 'tap-place')).toEqual(at('tap-the-crate'))
  expect(tourFrom([])).toEqual(at('done'))
})

test('only the steps whose job is on the screen are counted', () => {
  expect(stepsIn(new Set(['play-then-put', 'tap-the-crate']))).toEqual(['tap-the-crate', 'play-then-put'])
})

test('a step ignores what it did not ask for, and notices what it did', () => {
  expect(tourNext(at('tap-the-crate'), { kind: 'moved' })).toEqual(at('tap-the-crate'))
  expect(tourNext(at('tap-the-crate'), { kind: 'picked' })).toEqual(at('tap-the-crate', true))
  expect(tourNext(at('tap-place'), { kind: 'tool', what: 'erase' })).toEqual(at('tap-place'))
  expect(tourNext(at('tap-place'), { kind: 'tool', what: 'place' })).toEqual(at('tap-place', true))
  expect(tourNext(at('play-then-put'), { kind: 'picked' })).toEqual(at('play-then-put'))
  expect(tourNext(at('play-then-put'), { kind: 'put' })).toEqual(at('play-then-put', true))
})

test('step 3 ignores a pick, and moves on a changed value or a move with the arrows', () => {
  expect(tourNext(at('drag-a-value'), { kind: 'picked' })).toEqual(at('drag-a-value'))
  expect(tourNext(at('drag-a-value'), { kind: 'value' })).toEqual(at('drag-a-value', true))
  expect(tourNext(at('drag-a-value'), { kind: 'moved' })).toEqual(at('drag-a-value', true))
})

test('"Next" moves on only once the step is done, and the last step ends the tour', () => {
  expect(tourNext(at('tap-the-crate'), { kind: 'next' })).toEqual(at('tap-the-crate'))
  expect(tourNext(at('tap-the-crate', true), { kind: 'next' })).toEqual(at('tap-place'))
  expect(tourNext(at('play-then-put', true), { kind: 'next' })).toEqual(at('done'))
  const built = ['tap-the-crate', 'drag-a-value'] as const
  expect(tourNext(at('tap-the-crate', true), { kind: 'next' }, built)).toEqual(at('drag-a-value'))
})

test('Skip ends the tour at any step, and a tour that has ended stays ended', () => {
  for (const step of STEPS) expect(tourNext(at(step, true), { kind: 'skip' })).toEqual(at('skipped'))
  expect(tourNext(at('skipped'), { kind: 'picked' })).toEqual(at('skipped'))
  expect(tourNext(at('done'), { kind: 'skip' })).toEqual(at('done'))
})

test('the device keeps that the first run is finished, and a tick for each step done', () => {
  const store = memoryStore()
  expect(guideWanted(store)).toBe(true)
  expect(readTicks(store).size).toBe(0)
  keepTick(store, 'tap-the-crate')
  keepTick(store, 'play-then-put')
  expect([...readTicks(store)]).toEqual(['tap-the-crate', 'play-then-put'])
  finishGuide(store)
  expect(guideWanted(store)).toBe(false)
  expect(store.getItem('af.guide.done')).toBe('1')
  expect(store.getItem('af.tip.tap-the-crate')).toBe('1')
})

test('a device that will not keep anything still lets the tour run, and asks for the first run again', () => {
  const full = fullStore()
  finishGuide(full)
  keepTick(full, 'tap-place')
  expect(guideWanted(full)).toBe(true)
  expect(readTicks(full).size).toBe(0)
})
