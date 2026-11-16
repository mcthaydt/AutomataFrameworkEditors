// Which screen the page is on, kept in the URL's hash so that a link opens a game, a level or a screen directly. A
// game opens on a level; a sheet (who can change it, what waits, one waiting change) is asked for as part of the
// address and opens over that level. The older addresses of a game's page, its Share page and its waiting pages are
// still understood, so a link someone kept still works.

/** A page that opens over the level: the old Share, Waiting and waiting change. */
export type Sheet =
  | { readonly kind: 'share' }
  | { readonly kind: 'waiting' }
  | { readonly kind: 'change'; readonly number: number }

export type Route =
  | { readonly screen: 'games' }
  /** No `level`: the game's start. */
  | {
      readonly screen: 'level'
      readonly owner: string
      readonly name: string
      readonly level?: string
      readonly sheet?: Sheet
    }
  /** The map, on a level: the one that was open, and is picked when the map opens. */
  | { readonly screen: 'map'; readonly owner: string; readonly name: string; readonly level?: string }

const PART = /^[A-Za-z0-9._-]+$/
const GAMES: Route = { screen: 'games' }

function sheetOf(parts: readonly (string | undefined)[]): Sheet | undefined | 'none' {
  const [word, number, ...rest] = parts
  if (word === undefined) return undefined
  if (rest.some((part) => part !== undefined)) return 'none'
  if (word === 'share' && number === undefined) return { kind: 'share' }
  if (word === 'waiting' && number === undefined) return { kind: 'waiting' }
  if (word === 'waiting' && number !== undefined && /^[1-9][0-9]*$/.test(number)) {
    return { kind: 'change', number: Number(number) }
  }
  return 'none'
}

/** Anything unknown, half-written or made of odd characters is the list of games. */
export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/')
  if (parts[0] !== 'game') return GAMES
  const [, owner, name, third, ...rest] = parts
  if (owner === undefined || name === undefined || !PART.test(owner) || !PART.test(name)) return GAMES
  if (third === undefined) return { screen: 'level', owner, name }
  if (third === 'map') {
    const [level, ...after] = rest
    if (after.length > 0) return GAMES
    if (level === undefined) return { screen: 'map', owner, name }
    return PART.test(level) ? { screen: 'map', owner, name, level } : GAMES
  }
  if (third === 'level') {
    const [level, ...after] = rest
    if (level === undefined || !PART.test(level)) return GAMES
    const sheet = sheetOf(after)
    if (sheet === 'none') return GAMES
    return sheet === undefined
      ? { screen: 'level', owner, name, level }
      : { screen: 'level', owner, name, level, sheet }
  }
  const sheet = sheetOf([third, ...rest])
  if (sheet === 'none' || sheet === undefined) return GAMES
  return { screen: 'level', owner, name, sheet }
}

function sheetHash(sheet: Sheet): string {
  return sheet.kind === 'change' ? `waiting/${sheet.number}` : sheet.kind
}

export function routeHash(route: Route): string {
  switch (route.screen) {
    case 'games':
      return '#/'
    case 'map':
      return `#/game/${route.owner}/${route.name}/map${route.level === undefined ? '' : `/${route.level}`}`
    case 'level': {
      const base = `#/game/${route.owner}/${route.name}`
      const level = route.level === undefined ? '' : `/level/${route.level}`
      const sheet = route.sheet === undefined ? '' : `/${sheetHash(route.sheet)}`
      return `${base}${level}${sheet}`
    }
  }
}

/** The same screen with the sheet shut. */
export function withoutSheet(route: Route): Route {
  if (route.screen !== 'level' || route.sheet === undefined) return route
  const { sheet: _sheet, ...rest } = route
  return rest
}

/** The screens that are about a person, so a visitor is asked to sign in for them; the game and its levels are not. */
export const needsPerson = (route: Route): boolean =>
  route.screen === 'games' || (route.screen === 'level' && route.sheet !== undefined)
