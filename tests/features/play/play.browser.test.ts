// Playing a level where it is drawn, in each real browser: the game starts a canvas in the level's box, pause holds it,
// start again goes back to the first tick, stop takes it all away, and nothing the game keeps reaches the device.
import type { Frames } from '@automataframework/framework'
import { mount, tick, unmount } from 'svelte'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { type Edits, inLevel, type OpenGame, startEdits } from '#src/features/game/game.ts'
import { CannotPlay, type Playing, PlayPart, play } from '#src/features/play/play.ts'
import { bytesToBase64 } from '#src/lib/base64.ts'
import { groundPicture } from '../../fixtures/game/ground-picture.ts'
import { fixtureFiles } from '../../fixtures/game/read.ts'
import { linksFiles } from '../../fixtures/links-game/links.ts'
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
      waiting: false,
      onstarted: () => {},
      onproblem: () => {},
      frames,
    },
  })
  const button = (what: string) => box.querySelector<HTMLButtonElement>(`[data-play="${what}"]`)
  await vi.waitFor(() => expect(button('pause')).not.toBeNull())
  expect(button('pause')?.getAttribute('aria-label')).toContain('Pause')
  button('pause')?.click()
  await tick()
  expect(button('pause')?.getAttribute('aria-label')).toContain('Go on')
  // The words change with the state, so no button is also drawn as picked: Go on and Smaller never both stand out.
  expect(box.querySelector('[data-play][aria-pressed]')).toBeNull()
  button('big')?.click()
  expect(bigger).toBe(true)
  for (const bar of box.querySelectorAll<HTMLElement>('[data-play] ')) {
    expect(bar.getBoundingClientRect().height).toBeGreaterThanOrEqual(44)
  }
})

/** Where the thing drawn in `colour` is in the level, in tiles, as the game holds it now. */
const whereIn = (now: Playing, colour: string): { x: number; y: number } => {
  const want = Number.parseInt(colour.slice(1), 16)
  const found = now
    .view()
    .entities.find((one) => (one.components.look as { color?: number } | undefined)?.color === want)
  const at = found?.components.transform as { x: number; y: number } | undefined
  if (at === undefined) throw new Error(`Nothing drawn in ${colour} is in the play.`)
  return at
}
const HERO_COLOUR = '#e4572e'
const CRATE_COLOUR = '#c9a227'
const heroMiddle = (now: Playing) => whereIn(now, HERO_COLOUR)

test('paused, one step moves the tick by exactly one, and does nothing while the game runs', async () => {
  const frames = handFrames()
  playing = await start({ frames })
  frames.step(10)
  const running = playing.tick()
  playing.step()
  expect(playing.tick()).toBe(running)
  playing.pause()
  const held = playing.tick()
  playing.step()
  expect(playing.tick()).toBe(held + 1)
  playing.step()
  expect(playing.tick()).toBe(held + 2)
})

test('slow halves the ticks in a second, and slower quarters them', async () => {
  const frames = handFrames()
  playing = await start({ frames })
  frames.step(1)
  const ticksIn = (rate: number): number => {
    playing?.setSpeed(rate)
    const before = playing?.tick() ?? 0
    frames.step(120)
    return (playing?.tick() ?? 0) - before
  }
  const normal = ticksIn(1)
  expect(playing.speed()).toBe(1)
  const slow = ticksIn(0.5)
  expect(Math.abs(slow - normal / 2)).toBeLessThanOrEqual(2)
  const slower = ticksIn(0.25)
  expect(Math.abs(slower - normal / 4)).toBeLessThanOrEqual(2)
  expect(playing.speed()).toBe(0.25)
})

test('after five seconds of play, going back to the start of the strip shows the hero where it was then', async () => {
  const frames = handFrames()
  playing = await start({ frames })
  frames.step(2)
  const then = heroMiddle(playing)
  const from = playing.kept().from
  // The hero walks right for five seconds.
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', code: 'ArrowRight', bubbles: true }))
  frames.step(300)
  window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight', code: 'ArrowRight', bubbles: true }))
  const later = heroMiddle(playing)
  expect(later.x).toBeGreaterThan(then.x + 1)
  playing.pause()
  expect(playing.kept().from).toBeLessThanOrEqual(from + 60)
  playing.backTo(playing.kept().from)
  frames.step(2)
  const back = heroMiddle(playing)
  expect(Math.abs(back.x - then.x)).toBeLessThan((later.x - then.x) / 2)
  expect(playing.tick()).toBe(playing.kept().from)
})

test('play from a spot starts the hero there; from the start puts it back', async () => {
  const frames = handFrames()
  playing = await start({ frames, arrive: { x: 12, y: 3 } })
  frames.step(2)
  const spot = heroMiddle(playing)
  expect(Math.abs(spot.x - 12)).toBeLessThan(0.5)
  await playing.again()
  frames.step(2)
  expect(Math.abs(heroMiddle(playing).x - 2.5)).toBeLessThan(0.5)
  await playing.from({ x: 12, y: 3 })
  frames.step(2)
  expect(Math.abs(heroMiddle(playing).x - 12)).toBeLessThan(0.5)
})

const links = await openedGameWith((text) => `v${text.length}`, linksFiles(), { pictures })

test('walking through a door tells the screen where it leads, once', async () => {
  const frames = handFrames()
  const ways: unknown[] = []
  playing = await start({
    game: links,
    edits: startEdits(links),
    level: 'room-1',
    frames,
    arrive: { thing: 'exit' },
    ondoor: (way) => ways.push(way),
  })
  frames.step(2)
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', code: 'ArrowRight', bubbles: true }))
  frames.step(600)
  window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight', code: 'ArrowRight', bubbles: true }))
  expect(ways).toEqual([{ level: 'room-2', thing: 'door-in', through: { level: 'room-1', thing: 'exit' } }])
})

test('a thing whose character is gone is left out of the play, which still starts', async () => {
  const hurt = inLevel(edits, 'level-1', (level) => ({
    ...level,
    things: level.things.map((thing, n) => (n === 0 ? { ...thing, character: 'ghost' } : thing)),
  }))
  const frames = handFrames()
  playing = await start({ edits: hurt, frames })
  frames.step(5)
  expect(box.querySelector('canvas')).not.toBeNull()
  // The crate whose character is gone is not in the play; the hero is.
  expect(() => whereIn(playing as Playing, CRATE_COLOUR)).toThrow()
  expect(heroMiddle(playing)).toBeDefined()
})

test('a door into a level that is not there stops the play with the framework sentence', async () => {
  const hurt = inLevel(startEdits(links), 'room-1', (level) => ({
    ...level,
    things: level.things.map((thing) =>
      thing.id === 'exit' ? { ...thing, values: { to: { level: 'room-9', thing: 'door-in' } } } : thing,
    ),
  }))
  const caught = await start({ game: links, edits: hurt, level: 'room-1', frames: handFrames() }).then(
    () => undefined,
    (error: unknown) => error,
  )
  expect(caught).toBeInstanceOf(CannotPlay)
  expect((caught as CannotPlay).message).toContain('room-9')
  // Only the sentence: no file, no place in it.
  expect((caught as CannotPlay).lines.join(' ')).not.toMatch(/\.json|\[\d+\]/)
  expect(box.querySelector('canvas')).toBeNull()
})

test('with the world file naming a level that is not there, the level plays alone and its doors are shut', async () => {
  const text = links.files.get(links.worldPath ?? '')?.text ?? ''
  const broken = await openedGameWith(
    (one) => `v${one.length}`,
    {
      ...linksFiles(),
      [links.worldPath ?? '']: text.replace('room-3', 'room-9'),
    },
    { pictures },
  )
  const ways: unknown[] = []
  playing = await start({
    game: broken,
    edits: startEdits(broken),
    level: 'room-1',
    frames: handFrames(),
    ondoor: (way) => ways.push(way),
  })
  expect(playing.doorsShut).toBe(true)
  expect(box.querySelector('canvas')).not.toBeNull()
  expect((await start({ frames: handFrames() })).doorsShut).toBe(false)
})

test('a crate at How heavy 4 is pushed less than 0.7 times as far as one at 0.5 under the same 60 ticks of walking (the play passes the weight to the framework; its own test holds the physics)', async () => {
  const pushed = async (heavy: number): Promise<number> => {
    const set = inLevel(edits, 'level-1', (level) => ({
      ...level,
      things: level.things.map((thing) => (thing.id === 'crate-1' ? { ...thing, values: { heavy } } : thing)),
    }))
    const frames = handFrames()
    const now = await start({ edits: set, frames })
    try {
      frames.step(2)
      const before = whereIn(now, CRATE_COLOUR).x
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', code: 'ArrowRight', bubbles: true }),
      )
      frames.step(60)
      window.dispatchEvent(
        new KeyboardEvent('keyup', { key: 'ArrowRight', code: 'ArrowRight', bubbles: true }),
      )
      return whereIn(now, CRATE_COLOUR).x - before
    } finally {
      now.stop()
    }
  }
  const light = await pushed(0.5)
  const heavy = await pushed(4)
  expect(light).toBeGreaterThan(2)
  // The hero sets its own speed every tick, so a heavy crate slows the push (measured 0.67), it does not stop it.
  expect(heavy).toBeLessThan(light * 0.7)
})

/** Mounts the play part over `box` with the frames the test delivers; returns how to press its buttons. */
async function mountPart(over: { game?: OpenGame; edits?: Edits; level?: string } = {}) {
  const frames = handFrames()
  const props = {
    game,
    edits,
    level: 'level-1',
    lang: 'en' as const,
    big: false,
    onbig: () => {},
    waiting: false,
    onstarted: () => {},
    onproblem: () => {},
    frames,
    ...over,
  }
  mounted = mount(PlayPart, { target: box, props })
  const button = (what: string) => box.querySelector<HTMLButtonElement>(`[data-play="${what}"]`)
  await vi.waitFor(() => expect(button('pause')).not.toBeNull())
  return { frames, button }
}

test('one step shows only while it is held still, and takes a single step', async () => {
  const { frames, button } = await mountPart()
  frames.step(5)
  await tick()
  expect(button('step')).toBeNull()
  button('pause')?.click()
  await vi.waitFor(() => expect(button('step')).not.toBeNull())
  // An icon on its own keeps its spoken name.
  expect(button('step')?.getAttribute('aria-label')).toBe('One step')
  expect(button('step')?.getBoundingClientRect().height).toBeGreaterThanOrEqual(44)
  const before = Number(box.querySelector('[data-play="strip"] input')?.getAttribute('max') ?? 0)
  button('step')?.click()
  await tick()
  button('step')?.click()
  await tick()
  await vi.waitFor(() =>
    expect(Number(box.querySelector('[data-play="strip"] input')?.getAttribute('max'))).toBe(before + 2),
  )
})

test('speed says Normal, then Slow, then Slower, and round again', async () => {
  const { button } = await mountPart()
  expect(button('speed')?.textContent).toContain('Normal')
  button('speed')?.click()
  await tick()
  expect(button('speed')?.textContent).toContain('Slow')
  button('speed')?.click()
  await tick()
  expect(button('speed')?.textContent).toContain('Slower')
  button('speed')?.click()
  await tick()
  expect(button('speed')?.textContent).toContain('Normal')
})

test('the strip goes back through the last seconds: dragging it holds the game at that moment', async () => {
  const { frames, button } = await mountPart()
  frames.step(200)
  const range = () => box.querySelector<HTMLInputElement>('[data-play="strip"] input[type="range"]')
  await vi.waitFor(() => expect(range()).not.toBeNull())
  expect(range()?.getAttribute('aria-label')).toBe('Drag back to see it again')
  const middle = Math.floor((Number(range()?.min) + Number(range()?.max)) / 2)
  const input = range() as HTMLInputElement
  input.value = String(middle)
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await tick()
  expect(button('pause')?.getAttribute('aria-label')).toBe('Go on')
  // What was played after it is forgotten, so the strip now ends where the game is.
  await vi.waitFor(() => expect(Number(range()?.max)).toBe(middle))
  expect(Number(range()?.value)).toBe(middle)
})

test('Play from here waits for a tap with a strip that says so and has Cancel; a tap starts the hero there', async () => {
  const { frames, button } = await mountPart()
  frames.step(3)
  expect(box.querySelector('[data-play="pick-strip"]')).toBeNull()
  button('pick')?.click()
  await tick()
  const strip = box.querySelector('[data-play="pick-strip"]')
  expect(strip?.textContent).toContain('Tap the level where the hero should start')
  // Cancel is one more tap away from a button pressed by mistake.
  box.querySelector<HTMLButtonElement>('[data-play="pick-cancel"]')?.click()
  await tick()
  expect(box.querySelector('[data-play="pick-strip"]')).toBeNull()

  button('pick')?.click()
  await tick()
  const tap = box.querySelector<HTMLElement>('[data-play="tap"]') as HTMLElement
  const at = (box.querySelector('[data-play="box"]') as HTMLElement).getBoundingClientRect()
  // 16 by 9 tiles fill the box (480 by 270): a tap a quarter of the way across is at tile 4.
  tap.dispatchEvent(
    new PointerEvent('pointerdown', {
      bubbles: true,
      clientX: at.left + at.width / 4,
      clientY: at.top + at.height / 2,
    }),
  )
  await vi.waitFor(() => expect(box.querySelector('[data-play="pick-strip"]')).toBeNull())
  frames.step(3)
  await tick()
})

test('with the world file in trouble the bar says there are no doors', async () => {
  const text = links.files.get(links.worldPath ?? '')?.text ?? ''
  const broken = await openedGameWith(
    (one) => `v${one.length}`,
    { ...linksFiles(), [links.worldPath ?? '']: text.replace('room-3', 'room-9') },
    { pictures },
  )
  await mountPart({ game: broken, edits: startEdits(broken), level: 'room-1' })
  await vi.waitFor(() => expect(box.textContent).toContain('No doors in this play: the map has a problem'))
})
