import { expect, test } from 'vitest'
import { createPeeker, type Peek } from '#src/features/team/pictures.ts'

const ref = (name: string) => ({ owner: 'grandma', name })
const seen: Peek = { picture: 'data:image/png;base64,AA', level: 'owner', login: 'grandma' }

/** A pretend open that waits until the test lets it go, so what is in flight can be counted. */
function slow() {
  const waiting: (() => void)[] = []
  let running = 0
  let most = 0
  const opened: string[] = []
  const peek = async (game: { owner: string; name: string }): Promise<Peek | undefined> => {
    opened.push(game.name)
    running += 1
    most = Math.max(most, running)
    await new Promise<void>((go) => waiting.push(go))
    running -= 1
    return game.name === 'broken' ? undefined : seen
  }
  const release = async (): Promise<void> => {
    await Promise.resolve()
    for (const go of waiting.splice(0)) go()
    await new Promise((done) => setTimeout(done, 0))
  }
  return { peek, release, opened, most: () => most }
}

test('with twenty games asked for at once, no more than two are opened at a time', async () => {
  const s = slow()
  const peeker = createPeeker(s.peek, 2)
  const all = Array.from({ length: 20 }, (_, i) => peeker.peek(ref(`game-${i}`)))
  for (let i = 0; i < 12; i++) await s.release()
  expect((await Promise.all(all)).every((one) => one === seen)).toBe(true)
  expect(s.most()).toBe(2)
  expect(s.opened).toHaveLength(20)
})

test('a game is opened once for the visit, and asking again gives the small copy it kept', async () => {
  const s = slow()
  const peeker = createPeeker(s.peek, 2)
  const first = peeker.peek(ref('crate-game'))
  const again = peeker.peek(ref('crate-game'))
  await s.release()
  expect(await first).toBe(seen)
  expect(await again).toBe(seen)
  expect(await peeker.peek(ref('crate-game'))).toBe(seen)
  expect(s.opened).toEqual(['crate-game'])
})

test('a game that cannot be opened keeps its tile, and does not hold up the next one', async () => {
  const s = slow()
  const peeker = createPeeker(s.peek, 1)
  const bad = peeker.peek(ref('broken'))
  const good = peeker.peek(ref('crate-game'))
  await s.release()
  await s.release()
  expect(await bad).toBeUndefined()
  expect(await good).toBe(seen)
})

test('a game whose name differs only in case is the same game', async () => {
  const s = slow()
  const peeker = createPeeker(s.peek, 2)
  const a = peeker.peek({ owner: 'Grandma', name: 'Crate-Game' })
  const b = peeker.peek({ owner: 'grandma', name: 'crate-game' })
  await s.release()
  await Promise.all([a, b])
  expect(s.opened).toHaveLength(1)
})

test('once the list is left, games still waiting are never opened and nothing new is asked for', async () => {
  const s = slow()
  const peeker = createPeeker(s.peek, 1)
  const first = peeker.peek(ref('one'))
  const second = peeker.peek(ref('two'))
  await Promise.resolve()
  peeker.stop()
  await s.release()
  await s.release()
  expect(await first).toBe(seen)
  expect(await second).toBeUndefined()
  expect(await peeker.peek(ref('three'))).toBeUndefined()
  expect(s.opened).toEqual(['one'])
})
