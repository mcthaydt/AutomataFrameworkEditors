import { expect, test } from 'vitest'
import { change, startEdits } from '#src/features/game/changes.ts'
import { problemsOf } from '#src/features/game/problems.ts'
import { linksFiles } from '../../fixtures/links-game/links.ts'
import { openedGame } from '../../fixtures/open-game.ts'

const links = () => openedGame(linksFiles())

test('a clean game has no problems', async () => {
  const game = await links()
  expect(await problemsOf(game, startEdits(game))).toEqual([])
})

test("a door into a level that is gone is one problem, at that door, in the framework's own words", async () => {
  const game = await links()
  const edits = startEdits(game)
  // What taking a level away on the map does: its file and its place on the map go together.
  const { 'room-2': _gone, ...levels } = edits.now.levels
  const world = edits.now.world && {
    ...edits.now.world,
    levels: edits.now.world.levels.filter((entry) => entry.level !== 'room-2'),
  }
  const problems = await problemsOf(game, change(edits, { ...edits.now, levels, world }))
  expect(problems).toHaveLength(1)
  const [one] = problems
  expect(one?.words).toBe('There is no level called "room-2". This game has: room-1, room-3.')
  expect(one?.file).toBe('content/levels/room-1.json')
  const door = levels['room-1']?.things.find(
    (thing) => (thing.values?.to as { level?: string } | undefined)?.level === 'room-2',
  )
  expect(door).toBeDefined()
  expect(one?.where).toEqual({ level: 'room-1', thing: door?.id })
})

test('a wall on the map is one problem that is about the map', async () => {
  const game = await links()
  const edits = startEdits(game)
  const world = edits.now.world && {
    ...edits.now.world,
    levels: edits.now.world.levels.map((entry) =>
      entry.level === 'room-1' ? { ...entry, at: { x: 4, y: 0 } } : entry,
    ),
  }
  const problems = await problemsOf(game, change(edits, { ...edits.now, world }))
  expect(problems).toEqual([
    {
      words:
        "room-1's right edge is open at rows 5 to 7, but room-2, which touches it, is solid there. Open room-2's left edge at those rows, or move it.",
      file: 'content/worlds/world.json',
      where: { map: true },
    },
  ])
})
