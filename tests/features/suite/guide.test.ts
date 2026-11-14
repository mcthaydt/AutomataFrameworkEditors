import { expect, test } from 'vitest'
import {
  finishGuide,
  type GuideFacts,
  guideStep,
  guideSteps,
  guideWanted,
} from '#src/features/suite/guide.ts'

const facts = (over: Partial<GuideFacts> = {}): GuideFacts => ({
  signedIn: true,
  games: 2,
  inGame: false,
  inLevel: false,
  dirty: false,
  savedOnce: false,
  keptCopy: false,
  ...over,
})

test('signed out with no game open is the start', () => {
  expect(guideStep(facts({ signedIn: false, games: undefined }))).toBe('start')
})

test('signed out with a game open is never sent back to the start: pick, move, save', () => {
  const visitor = { signedIn: false, games: undefined, inGame: true }
  expect(guideStep(facts(visitor))).toBe('pick-game')
  expect(guideStep(facts({ ...visitor, inLevel: true }))).toBe('move')
  expect(guideStep(facts({ ...visitor, inLevel: true, dirty: true }))).toBe('save')
})

test('signed in with no games and no game open is add-editor; while asking it is pick-game', () => {
  expect(guideStep(facts({ games: 0 }))).toBe('add-editor')
  expect(guideStep(facts({ games: undefined }))).toBe('pick-game')
  expect(guideStep(facts({ games: 3 }))).toBe('pick-game')
})

test('a game open and no level is pick-game; a level is move, and dirty is save', () => {
  expect(guideStep(facts({ inGame: true }))).toBe('pick-game')
  expect(guideStep(facts({ inGame: true, inLevel: true }))).toBe('move')
  expect(guideStep(facts({ inGame: true, inLevel: true, dirty: true }))).toBe('save')
})

test('a save is done whatever else; a kept copy is done when not signed in', () => {
  expect(guideStep(facts({ savedOnce: true, games: 0 }))).toBe('done')
  expect(guideStep(facts({ keptCopy: true, signedIn: false, inGame: true, inLevel: true }))).toBe('done')
  expect(guideStep(facts({ keptCopy: true, inGame: true, inLevel: true }))).toBe('move')
})

test('an owner counts four steps, someone who came by a link three', () => {
  expect(guideSteps(false)).toEqual(['add-editor', 'pick-game', 'move', 'save'])
  expect(guideSteps(true)).toEqual(['pick-game', 'move', 'save'])
})

function store(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => void map.delete(k),
    setItem: (k, v) => void map.set(k, v),
  }
}

test('the guide is wanted on a fresh store and not after it is finished', () => {
  const s = store()
  expect(guideWanted(s)).toBe(true)
  finishGuide(s)
  expect(guideWanted(s)).toBe(false)
})

test('a store that throws never throws, and the guide is still wanted', () => {
  const bad = {
    getItem: () => {
      throw new Error('no')
    },
    setItem: () => {
      throw new Error('no')
    },
  } as unknown as Storage
  expect(guideWanted(bad)).toBe(true)
  expect(() => finishGuide(bad)).not.toThrow()
})
