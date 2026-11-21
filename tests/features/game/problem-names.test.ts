import { expect, test } from 'vitest'
import { type Problem, sayProblem, withNames } from '#src/features/game/game.ts'

const levels = ['room-1', 'room-2', 'room-3', 'room-10']

test("a framework sentence says each of the game's levels by the name the map gives it (design round 2, A10)", () => {
  expect(withNames('There is no level called "room-9". This game has: room-1, room-2, room-3.', levels)).toBe(
    'There is no level called "Room 9". This game has: Room 1, Room 2, Room 3.',
  )
  expect(withNames("room-10's right edge meets room-1.", levels)).toBe("Room 10's right edge meets Room 1.")
  expect(withNames('a bedroom-1 is not a level', levels)).toBe('a bedroom-1 is not a level')
})

test("a wall between two levels is said in the map card's own words; any other problem as it is", () => {
  const wall = (open: string, solid: string) => `${open} is open, ${solid} has a wall.`
  const walled: Problem = {
    words: 'x',
    file: 'f',
    where: { map: true },
    wall: { open: 'room-1', solid: 'room-2' },
  }
  expect(sayProblem(walled, wall)).toBe('Room 1 is open, Room 2 has a wall.')
  expect(sayProblem({ words: 'Room 1 is too big.', file: 'f', where: {} }, wall)).toBe('Room 1 is too big.')
})
