// Playing a level where it is drawn, in each real browser: the game starts a canvas in the level's box, pause holds it,
// start again goes back to the first tick, stop takes it all away, and nothing the game keeps reaches the device.
import type { Frames } from '@automataframework/framework'
import { mount, tick, unmount } from 'svelte'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { type Edits, inLevel, startEdits } from '#src/features/game/game.ts'
import { CannotPlay, type Playing, PlayPart, play } from '#src/features/play/play.ts'
import { bytesToBase64 } from '#src/lib/base64.ts'
import { groundPicture } from '../../fixtures/game/ground-picture.ts'
import { fixtureFiles } from '../../fixtures/game/read.ts'
import { openedGameWith } from '../../fixtures/open-game-with.ts'

const FRAME = 1000 / 60

/** Frames the test delivers by hand, so no test waits on a real display. */
function handFrames(): Frames & { step(count?: number): void } {
  const waiting = new Map<number, (ms: number) => void>()
  let next = 1
  let now = 0
  return {
    request(callback) {
      const id = next++
      waiting.set(id, callback)
      return id
    },
    cancel(id) {
      waiting.delete(id)
    },
    step(count = 1) {
      for (let i = 0; i < count; i++) {
        now += FRAME
        const due = [...waiting.values()]
        waiting.clear()
        for (const callback of due) callback(now)
      }
    },
  }
}

const pictures = [{ path: 'art/ground.png', base64: bytesToBase64(groundPicture()) }]
const game = await openedGameWith((text) => `v${text.length}`, fixtureFiles, { pictures })
const edits = startEdits(game)

let box: HTMLDivElement
let playing: Playing | undefined
let mounted: ReturnType<typeof mount> | undefined
beforeEach(() => {
  box = document.createElement('div')
  box.style.cssText = 'position:fixed;left:0;top:0;width:480px;height:270px'
  document.body.append(box)
  localStorage.clear()
})
afterEach(() => {
  playing?.stop()
  playing = undefined
  if (mounted) void unmount(mounted)
  mounted = undefined
  box.remove()
  vi.restoreAllMocks()
})

const start = (over: Partial<Parameters<typeof play>[0]> = {}) =>
  play({ mount: box, game, edits, level: 'level-1', lang: 'en', ...over })

test('play puts the game in the level box; pause holds it, start again goes back to the start, stop takes it away', async () => {
  const frames = handFrames()
  playing = await start({ frames })
  expect(box.querySelector('canvas')).not.toBeNull()
  // The first frame only sets the clock; the next sixty are a second of play.
  frames.step(61)
  const going = playing.tick()
  expect(going).toBeGreaterThan(50)

  playing.pause()
  expect(playing.paused()).toBe(true)
  frames.step(30)
  expect(playing.tick()).toBe(going)

  playing.resume()
  expect(playing.paused()).toBe(false)
  frames.step(31)
  expect(playing.tick()).toBeGreaterThan(going)

  await playing.again()
  expect(playing.tick()).toBe(0)
  expect(box.querySelectorAll('canvas')).toHaveLength(1)

  playing.stop()
  expect(box.querySelector('canvas')).toBeNull()
})

test('playing changes nothing: the edits are the same, and nothing is kept on the device', async () => {
  const before: Edits = edits
  const frames = handFrames()
  playing = await start({ frames })
  frames.step(120)
  expect(edits).toBe(before)
  expect(localStorage.length).toBe(0)
})

test('on a touch screen the game brings its own controls', async () => {
  const real = window.matchMedia.bind(window)
  vi.spyOn(window, 'matchMedia').mockImplementation((query) =>
    query.includes('pointer: coarse') ? ({ ...real(query), matches: true } as MediaQueryList) : real(query),
  )
  playing = await start({ frames: handFrames() })
  // The game's own touch controls: a half of the screen to walk with and a half to jump with.
  const halves = [...box.querySelectorAll<HTMLElement>('.automata-thumb-half')]
  expect(halves.map((half) => half.dataset.half)).toEqual(['walk', 'jump'])
  for (const half of halves) expect(half.getBoundingClientRect().width).toBeGreaterThan(100)
})

test('a level that cannot be built is not started, and the first sentence says why', async () => {
  // A thing that names a character the game does not have: the framework's own loader refuses the game.
  const hurt = inLevel(edits, 'level-1', (level) => ({
    ...level,
    things: level.things.map((thing, n) => (n === 0 ? { ...thing, character: 'ghost' } : thing)),
  }))
  const caught = await start({ edits: hurt }).then(
    () => undefined,
    (error: unknown) => error,
  )
  expect(caught).toBeInstanceOf(CannotPlay)
  expect((caught as CannotPlay).message).toContain('ghost')
  expect(box.querySelector('canvas')).toBeNull()
})

test('the play part has its bar: Pause says Go on, and Bigger says Smaller', async () => {
  let bigger = false
  const frames = handFrames()
  mounted = mount(PlayPart, {
    target: box,
    props: {
      game,
      edits,
      level: 'level-1',
      lang: 'en',
      big: false,
      onbig: () => {
        bigger = true
      },
      onproblem: () => {},
      frames,
    },
  })
  const button = (what: string) => box.querySelector<HTMLButtonElement>(`[data-play="${what}"]`)
  await vi.waitFor(() => expect(button('pause')).not.toBeNull())
  expect(button('pause')?.textContent).toContain('Pause')
  button('pause')?.click()
  await tick()
  expect(button('pause')?.textContent).toContain('Go on')
  button('big')?.click()
  expect(bigger).toBe(true)
  for (const bar of box.querySelectorAll<HTMLElement>('[data-play] ')) {
    expect(bar.getBoundingClientRect().height).toBeGreaterThanOrEqual(44)
  }
})
