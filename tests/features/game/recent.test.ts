import { expect, test } from 'vitest'
import { forgetGame, recentGames, rememberGame } from '#src/features/game/game.ts'

class Store implements Storage {
  data = new Map<string, string>()
  get length(): number {
    return this.data.size
  }
  clear(): void {
    this.data.clear()
  }
  getItem(key: string): string | null {
    return this.data.get(key) ?? null
  }
  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null
  }
  removeItem(key: string): void {
    this.data.delete(key)
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value)
  }
}
const g = (n: number) => ({ owner: 'o', name: `game-${n}` })

test('remembered games come back newest first, once each', () => {
  const store = new Store()
  rememberGame(store, g(1))
  rememberGame(store, g(2))
  rememberGame(store, g(1))
  expect(recentGames(store)).toEqual([g(1), g(2)])
})

test('a game is the same game whatever the case of its names', () => {
  const store = new Store()
  rememberGame(store, { owner: 'Grandma', name: 'Crate-Game' })
  rememberGame(store, { owner: 'grandma', name: 'crate-game' })
  expect(recentGames(store)).toEqual([{ owner: 'grandma', name: 'crate-game' }])
})

test('at most 20 are kept, the oldest dropped', () => {
  const store = new Store()
  for (let i = 1; i <= 25; i++) rememberGame(store, g(i))
  const kept = recentGames(store)
  expect(kept).toHaveLength(20)
  expect(kept[0]).toEqual(g(25))
  expect(kept.at(-1)).toEqual(g(6))
})

test('forgetting removes one', () => {
  const store = new Store()
  rememberGame(store, g(1))
  rememberGame(store, g(2))
  forgetGame(store, g(1))
  expect(recentGames(store)).toEqual([g(2)])
})

test('garbage in the store is an empty list, and bad rows are skipped', () => {
  for (const raw of ['not json', '{}', '3', 'null']) {
    const store = new Store()
    store.setItem('af.recent', raw)
    expect(recentGames(store)).toEqual([])
  }
  const store = new Store()
  store.setItem('af.recent', JSON.stringify([{ owner: 'o' }, null, 4, { owner: 'o', name: 'ok' }]))
  expect(recentGames(store)).toEqual([{ owner: 'o', name: 'ok' }])
})

test('a Storage that throws never throws out', () => {
  const broken = new Store()
  broken.getItem = () => {
    throw new Error('private mode')
  }
  broken.setItem = () => {
    throw new Error('private mode')
  }
  expect(recentGames(broken)).toEqual([])
  expect(() => rememberGame(broken, g(1))).not.toThrow()
  expect(() => forgetGame(broken, g(1))).not.toThrow()
})
