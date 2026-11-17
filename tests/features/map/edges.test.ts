import { type GameContent, loadGame } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import { edgeBar } from '#src/features/levels/edges.ts'
import { edgesOf } from '#src/features/map/edges.ts'
import { readFrom } from '../../fixtures/game/read.ts'
import { linksMap } from '../../fixtures/links-game/read.ts'

const loaded = await loadGame(readFrom(linksMap()))
if (!loaded.ok) throw new Error('the links game did not load')
const content: GameContent = loaded.value
const working = {
  levels: content.levels,
  world: content.worlds?.world,
  project: '',
} as never

test('where two levels touch and are open, each says which edge, from where to where, and what is across', () => {
  expect(edgesOf(working, content, 'room-2')).toEqual([{ side: 'right', from: 5, to: 8, other: 'room-3' }])
  expect(edgesOf(working, content, 'room-3')).toEqual([{ side: 'left', from: 5, to: 8, other: 'room-2' }])
  expect(edgesOf(working, content, 'room-1')).toEqual([])
})

test('an edge is a bar along the level side the screen draws', () => {
  const level = content.levels['room-2']
  if (level === undefined) throw new Error('no room-2')
  // 16 by 9 tiles at 10 pixels a tile, the tile at the middle of the screen the middle of the level.
  const camera = { x: 8, y: 4.5, scale: 10 }
  const screen = { w: 160, h: 90 }
  expect(edgeBar({ side: 'right', from: 5, to: 8, other: 'room-3' }, level, camera, screen)).toEqual({
    x: 160,
    y: 50,
    w: 0,
    h: 30,
  })
  expect(edgeBar({ side: 'left', from: 5, to: 8, other: 'room-1' }, level, camera, screen)).toMatchObject({
    x: 0,
    h: 30,
  })
  expect(edgeBar({ side: 'bottom', from: 2, to: 4, other: 'x' }, level, camera, screen)).toEqual({
    x: 20,
    y: 90,
    w: 20,
    h: 0,
  })
})
