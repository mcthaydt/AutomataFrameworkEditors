// Where the World editor takes a person: a level, the map, a sheet, or the thing a problem or a change is about. These
// only decide the address to go to and what is picked there; the editor says what it holds through `Held` and is told
// where to go through `go`, so they can be read, and tested, apart from the screen.

import type { Edits, Problem } from '../game/game.ts'
import type { Route } from '../team/team.ts'

type Sheet = NonNullable<Extract<Route, { screen: 'level' }>['sheet']>

/** What the editor holds that going somewhere reads, and the two things it sets. */
export interface Held {
  go(route: Route): void
  /** Whose game is open. */
  game(): { readonly owner: string; readonly name: string }
  /** The level in view. */
  levelId(): string
  onMap(): boolean
  edits(): Edits
  /** The level that is picked on the map. */
  pickedLevel: string | undefined
  /** What is picked on the level: thing ids. */
  picked: readonly string[]
}

export function placesOf(held: Held) {
  /** Opens `next` with the door you come out of picked, when it has one there. */
  const goLevel = (next: string, door?: string): void => {
    held.go({ screen: 'level', ...held.game(), level: next })
    held.picked = held.edits().now.levels[next]?.things.some((t) => t.id === door) ? [door as string] : []
  }
  const asSheet = (next: Sheet): void =>
    held.go({ screen: 'level', ...held.game(), level: held.levelId(), sheet: next })

  /** The Map button: the map when a level is open, the level that was open when the map is. */
  function onmap(): void {
    if (held.onMap()) {
      held.go({ screen: 'level', ...held.game(), level: held.pickedLevel ?? held.levelId() })
      return
    }
    held.pickedLevel = held.levelId()
    held.go({ screen: 'map', ...held.game(), level: held.levelId() })
  }

  /** A part of the top bar was pressed: the levels, the map, or one level by its id. */
  function onpart(id: string): void {
    if (id === 'part:levels') {
      if (held.onMap())
        held.go({ screen: 'level', ...held.game(), level: held.pickedLevel ?? held.levelId() })
      return
    }
    if (id === 'map') {
      onmap()
      return
    }
    if (!id.startsWith('level:')) return
    const next = id.slice('level:'.length)
    // Another level is another file of the same game: nothing is left behind, so nothing is asked.
    if (next !== held.levelId() || held.onMap()) held.go({ screen: 'level', ...held.game(), level: next })
  }

  /** Opens the level or the map at a problem, and picks the thing it is about. */
  function show(where: Problem['where']): void {
    if (where.map === true) {
      held.pickedLevel = held.levelId()
      held.go({ screen: 'map', ...held.game(), level: held.levelId() })
      return
    }
    if (where.level !== undefined && (where.level !== held.levelId() || held.onMap())) {
      held.go({ screen: 'level', ...held.game(), level: where.level })
    }
    held.picked = where.thing === undefined ? [] : [where.thing]
  }

  /** "Show me" on a change in the history: its level, or the map, with the sheet shut. */
  function showChange(opening: { level: string } | { map: true }): void {
    if ('map' in opening) {
      held.pickedLevel = held.levelId()
      held.go({ screen: 'map', ...held.game(), level: held.levelId() })
    } else {
      held.go({ screen: 'level', ...held.game(), level: opening.level })
    }
    held.picked = []
  }

  return { goLevel, asSheet, onmap, onpart, show, showChange }
}
