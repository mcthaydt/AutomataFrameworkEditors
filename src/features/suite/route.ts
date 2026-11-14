// Which screen the page is on, kept in the URL's hash so that a link opens a game, a level or a screen directly.
export type Route =
  | { screen: 'games' }
  | { screen: 'game'; owner: string; name: string }
  | { screen: 'level'; owner: string; name: string; level: string }
  | { screen: 'waiting'; owner: string; name: string }
  | { screen: 'change'; owner: string; name: string; number: number }
  | { screen: 'share'; owner: string; name: string }

const PART = /^[A-Za-z0-9._-]+$/
const GAMES: Route = { screen: 'games' }

/** Anything unknown, half-written or made of odd characters is the list of games. */
export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/')
  if (parts[0] !== 'game') return GAMES
  const [, owner, name, third, fourth, ...rest] = parts
  if (owner === undefined || name === undefined || !PART.test(owner) || !PART.test(name)) return GAMES
  if (third === undefined && fourth === undefined && rest.length === 0) return { screen: 'game', owner, name }
  if (third === 'share' && fourth === undefined && rest.length === 0) return { screen: 'share', owner, name }
  if (third === 'level' && fourth !== undefined && rest.length === 0 && PART.test(fourth)) {
    return { screen: 'level', owner, name, level: fourth }
  }
  if (third === 'waiting' && rest.length === 0) {
    if (fourth === undefined) return { screen: 'waiting', owner, name }
    if (/^[1-9][0-9]*$/.test(fourth)) return { screen: 'change', owner, name, number: Number(fourth) }
  }
  return GAMES
}

export function routeHash(route: Route): string {
  switch (route.screen) {
    case 'games':
      return '#/'
    case 'game':
      return `#/game/${route.owner}/${route.name}`
    case 'level':
      return `#/game/${route.owner}/${route.name}/level/${route.level}`
    case 'waiting':
      return `#/game/${route.owner}/${route.name}/waiting`
    case 'change':
      return `#/game/${route.owner}/${route.name}/waiting/${route.number}`
    case 'share':
      return `#/game/${route.owner}/${route.name}/share`
  }
}

/** The screens that are about a person, so a visitor is asked to sign in for them; the game and its levels are not. */
export const needsPerson = (route: Route): boolean =>
  route.screen === 'games' ||
  route.screen === 'waiting' ||
  route.screen === 'change' ||
  route.screen === 'share'
