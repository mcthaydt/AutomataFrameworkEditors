import { expect, test } from 'vitest'
import type { Edits } from '#src/features/game/game.ts'
import type { Route } from '#src/features/team/team.ts'
import { type Held, placesOf } from '#src/features/world/places.ts'

const at = { owner: 'grandma', name: 'crate-game' }
// Only what the places read of the edits: which things each level has.
const edits = {
  now: { levels: { 'level-2': { things: [{ id: 'door-1' }] }, 'level-1': { things: [] } } },
} as unknown as Edits

function held(over: { levelId?: string; onMap?: boolean; pickedLevel?: string } = {}) {
  const went: Route[] = []
  const state: Held & { went: Route[] } = {
    went,
    go: (route) => void went.push(route),
    game: () => at,
    levelId: () => over.levelId ?? 'level-1',
    onMap: () => over.onMap ?? false,
    edits: () => edits,
    pickedLevel: over.pickedLevel,
    picked: [],
  }
  return state
}

test('a level opens with the door you come out of picked, when it has one there', () => {
  const h = held()
  const { goLevel } = placesOf(h)
  goLevel('level-2', 'door-1')
  expect(h.went).toEqual([{ screen: 'level', ...at, level: 'level-2' }])
  expect(h.picked).toEqual(['door-1'])
  goLevel('level-2', 'no-such-door')
  expect(h.picked).toEqual([])
  goLevel('level-1')
  expect(h.picked).toEqual([])
})

test('a sheet opens over the level in view', () => {
  const h = held({ levelId: 'level-2' })
  placesOf(h).asSheet({ kind: 'history' })
  expect(h.went).toEqual([{ screen: 'level', ...at, level: 'level-2', sheet: { kind: 'history' } }])
})

test('the map button opens the map on this level and picks it; from the map it goes back to the picked level', () => {
  const onLevel = held({ levelId: 'level-2' })
  placesOf(onLevel).onmap()
  expect(onLevel.went).toEqual([{ screen: 'map', ...at, level: 'level-2' }])
  expect(onLevel.pickedLevel).toBe('level-2')

  const onMap = held({ onMap: true, pickedLevel: 'level-1', levelId: 'level-2' })
  placesOf(onMap).onmap()
  expect(onMap.went).toEqual([{ screen: 'level', ...at, level: 'level-1' }])
})

test('the parts of the top bar: levels go back from the map, a level opens by its id, anything else does nothing', () => {
  const fromMap = held({ onMap: true, pickedLevel: 'level-2' })
  placesOf(fromMap).onpart('part:levels')
  expect(fromMap.went).toEqual([{ screen: 'level', ...at, level: 'level-2' }])

  const onLevel = held()
  const { onpart } = placesOf(onLevel)
  onpart('part:levels')
  onpart('level:level-1') // the level already open on a level: nothing to leave, nothing to do
  onpart('something-else')
  expect(onLevel.went).toEqual([])
  onpart('level:level-2')
  expect(onLevel.went).toEqual([{ screen: 'level', ...at, level: 'level-2' }])
  onpart('map')
  expect(onLevel.went.at(-1)).toEqual({ screen: 'map', ...at, level: 'level-1' })

  const mapToSame = held({ onMap: true, levelId: 'level-1' })
  placesOf(mapToSame).onpart('level:level-1')
  expect(mapToSame.went).toEqual([{ screen: 'level', ...at, level: 'level-1' }])
})

test('a problem is shown on the map, on its level or on the level already open, with its thing picked', () => {
  const map = held()
  placesOf(map).show({ map: true })
  expect(map.went).toEqual([{ screen: 'map', ...at, level: 'level-1' }])
  expect(map.pickedLevel).toBe('level-1')

  const other = held()
  placesOf(other).show({ level: 'level-2', thing: 'door-1' })
  expect(other.went).toEqual([{ screen: 'level', ...at, level: 'level-2' }])
  expect(other.picked).toEqual(['door-1'])

  const same = held()
  placesOf(same).show({ level: 'level-1' })
  expect(same.went).toEqual([])
  expect(same.picked).toEqual([])

  const fromMap = held({ onMap: true })
  placesOf(fromMap).show({ level: 'level-1', thing: 'crate-1' })
  expect(fromMap.went).toEqual([{ screen: 'level', ...at, level: 'level-1' }])
})

test('"Show me" on a change opens its level or the map, with nothing picked and the sheet shut', () => {
  const level = held()
  level.picked = ['crate-1']
  placesOf(level).showChange({ level: 'level-2' })
  expect(level.went).toEqual([{ screen: 'level', ...at, level: 'level-2' }])
  expect(level.picked).toEqual([])

  const map = held({ levelId: 'level-2' })
  placesOf(map).showChange({ map: true })
  expect(map.went).toEqual([{ screen: 'map', ...at, level: 'level-2' }])
  expect(map.pickedLevel).toBe('level-2')
})
