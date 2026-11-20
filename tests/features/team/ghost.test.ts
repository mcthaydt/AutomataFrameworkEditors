import { type Level, writeContent } from '@automataframework/framework/headless'
import { expect, test } from 'vitest'
import { startEdits, type Working } from '#src/features/game/changes.ts'
import { ghostOf, ghostOfPasted } from '#src/features/team/ghost.ts'
import { linksFiles } from '../../fixtures/links-game/links.ts'
import { openedGame } from '../../fixtures/open-game.ts'

const base: Working = startEdits(await openedGame(linksFiles())).now

const room = (w: Working, id: string): Level => w.levels[id] as Level
const moveCrate = (w: Working, x: number): Working => ({
  ...w,
  levels: {
    ...w.levels,
    'room-1': {
      ...room(w, 'room-1'),
      things: room(w, 'room-1').things.map((t) => (t.id === 'crate-1' ? { ...t, x } : t)),
    },
  },
})
const crateX = (w: Working): number | undefined => room(w, 'room-1').things.find((t) => t.id === 'crate-1')?.x

test('nothing changed in the game under the person is no ghost', () => {
  expect(ghostOf(base, base, base)).toBeUndefined()
  // Their own change, and nothing from the game, is not a ghost either.
  expect(ghostOf(base, moveCrate(base, 7.5), base)).toBeUndefined()
})

test('a crate the game moved is one line, and keeping it puts it where the helper put it', () => {
  const ghost = ghostOf(base, base, moveCrate(base, 7.5))
  expect(ghost?.lines).toEqual([{ kind: 'moved', level: 'room-1', thing: 'crate-1' }])
  expect(crateX(ghost?.merged.now as Working)).toBe(7.5)
})

test('what the person changed stays theirs when the game changed something else', () => {
  const mine = moveCrate(base, 6.5)
  const theirs = {
    ...base,
    levels: {
      ...base.levels,
      'room-2': { ...room(base, 'room-2'), things: room(base, 'room-2').things.slice(1) },
    },
  }
  const ghost = ghostOf(base, mine, theirs)
  expect(ghost?.lines.map((l) => l.kind)).toEqual(['deleted'])
  expect(crateX(ghost?.merged.now as Working)).toBe(6.5)
})

test('a pasted level file lays itself over the open level as a ghost', () => {
  const pasted = writeContent('level', room(moveCrate(base, 8.5), 'room-1') as never)
  const ghost = ghostOfPasted(pasted, base, base, 'room-1')
  if ('problem' in ghost) throw new Error(ghost.problem)
  expect(ghost.lines).toEqual([{ kind: 'moved', level: 'room-1', thing: 'crate-1' }])
  expect(crateX(ghost.merged.now)).toBe(8.5)
})

test('a pasted file that is the same as the level says nothing changes', () => {
  const same = writeContent('level', room(base, 'room-1') as never)
  const ghost = ghostOfPasted(same, base, base, 'room-1')
  if ('problem' in ghost) throw new Error(ghost.problem)
  expect(ghost.lines).toEqual([])
})

test('garbage is not a level, said in the framework\'s own sentence', () => {
  const ghost = ghostOfPasted('this is not a level', base, base, 'room-1')
  expect('problem' in ghost && ghost.problem.length > 0).toBe(true)
  const empty = ghostOfPasted('{"a":1}', base, base, 'room-1')
  expect('problem' in empty).toBe(true)
})
