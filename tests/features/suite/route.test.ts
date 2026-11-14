import { expect, test } from 'vitest'
import { needsPerson, parseRoute, type Route, routeHash } from '#src/features/suite/route.ts'

const ROUTES: readonly [Route, string][] = [
  [{ screen: 'games' }, '#/'],
  [{ screen: 'game', owner: 'grandma', name: 'crate-game' }, '#/game/grandma/crate-game'],
  [
    { screen: 'level', owner: 'grandma', name: 'crate-game', level: 'level-1' },
    '#/game/grandma/crate-game/level/level-1',
  ],
  [{ screen: 'waiting', owner: 'grandma', name: 'crate-game' }, '#/game/grandma/crate-game/waiting'],
  [
    { screen: 'change', owner: 'grandma', name: 'crate-game', number: 3 },
    '#/game/grandma/crate-game/waiting/3',
  ],
  [{ screen: 'share', owner: 'grandma', name: 'crate-game' }, '#/game/grandma/crate-game/share'],
]

test.each(ROUTES)('%j is %s, both ways', (route, hash) => {
  expect(routeHash(route)).toBe(hash)
  expect(parseRoute(hash)).toEqual(route)
})

test('names with dots and dashes round-trip', () => {
  const route: Route = { screen: 'game', owner: 'a.b-c_d', name: 'x.y-z' }
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
  '#/game/a/b/waiting/0',
  '#/game/a/b/waiting/-1',
  '#/game/a/b/waiting/1.5',
  '#/game/a/b/waiting/abc',
  '#/game/a/b/waiting/1/2',
  '#/game/a/b/share/x',
  '#/game/a/b/what',
  '#/game/a%2Fb/c',
])('the hash %j is the list of games', (hash) => {
  expect(parseRoute(hash)).toEqual({ screen: 'games' })
})

test('only the screens about a person ask a visitor to sign in', () => {
  expect(ROUTES.map(([route]) => [route.screen, needsPerson(route)])).toEqual([
    ['games', true],
    ['game', false],
    ['level', false],
    ['waiting', true],
    ['change', true],
    ['share', true],
  ])
})
