import { expect, test } from 'vitest'
import {
  needsPerson,
  parseRoute,
  type Route,
  routeHash,
  type Sheet,
  withoutSheet,
} from '#src/features/team/route.ts'

const G = 'grandma/crate-game'
const HERE = { owner: 'grandma', name: 'crate-game' } as const
/** The game's level screen, with the level and the sheet it is asked for, if any. */
const level = (id?: string, sheet?: Sheet): Route => ({
  screen: 'level',
  ...HERE,
  ...(id === undefined ? {} : { level: id }),
  ...(sheet === undefined ? {} : { sheet }),
})

const ROUTES: readonly [Route, string][] = [
  [{ screen: 'games' }, '#/'],
  [level(), `#/game/${G}`],
  [level('level-1'), `#/game/${G}/level/level-1`],
  [{ screen: 'map', ...HERE }, `#/game/${G}/map`],
  [{ screen: 'map', ...HERE, level: 'level-2' }, `#/game/${G}/map/level-2`],
]

test.each(ROUTES)('%j is %s, both ways', (route, hash) => {
  expect(routeHash(route)).toBe(hash)
  expect(parseRoute(hash)).toEqual(route)
})

// A kept link to a game's page, its Share page or its waiting pages opens the level with that sheet asked for.
const KEPT: readonly [string, Route][] = [
  [`#/game/${G}/share`, level(undefined, { kind: 'share' })],
  [`#/game/${G}/waiting`, level(undefined, { kind: 'waiting' })],
  [`#/game/${G}/waiting/3`, level(undefined, { kind: 'change', number: 3 })],
]

test.each(KEPT)('the kept address %s opens %j', (hash, route) => {
  expect(parseRoute(hash)).toEqual(route)
  expect(routeHash(route)).toBe(hash)
})

test('a sheet over a level keeps its level, in the address and back', () => {
  const route = level('level-1', { kind: 'change', number: 3 })
  expect(routeHash(route)).toBe(`#/game/${G}/level/level-1/waiting/3`)
  expect(parseRoute(routeHash(route))).toEqual(route)
  expect(withoutSheet(route)).toEqual(level('level-1'))
})

test('names with dots and dashes round-trip', () => {
  const route: Route = { screen: 'level', owner: 'a.b-c_d', name: 'x.y-z' }
  expect(parseRoute(routeHash(route))).toEqual(route)
})

test.each([
  '',
  '#',
  '#/',
  '#/nope',
  '#/game',
  '#/game/grandma',
  '#/game//crate',
  '#/game/gran dma/crate-game',
  '#/game/a/b/level',
  '#/game/a/b/level/x/y',
  '#/game/a/b/level/x/share/y',
  '#/game/a/b/waiting/0',
  '#/game/a/b/waiting/-1',
  '#/game/a/b/waiting/1.5',
  '#/game/a/b/waiting/abc',
  '#/game/a/b/waiting/1/2',
  '#/game/a/b/share/x',
  '#/game/a/b/map/x/y',
  '#/game/a/b/map/a b',
  '#/game/a/b/what',
  '#/game/a%2Fb/c',
])('the hash %j is the list of games', (hash) => {
  expect(parseRoute(hash)).toEqual({ screen: 'games' })
})

test('only the screens about a person ask a visitor to sign in', () => {
  const asked = [...ROUTES.map(([route]) => route), level(undefined, { kind: 'share' })]
  expect(asked.map((route) => needsPerson(route))).toEqual([true, false, false, false, false, true])
})
