// The level's stage in each real browser: fingers, the wheel, a trackpad's gestures and the keys, on the real layout.
// The plain game, with no pictures: every thing is a box on sky, so a pixel says where a thing is drawn.
import { fitInRoom } from '@automataframework/framework'
import { type GameContent, type Level, levelSize, loadGame } from '@automataframework/framework/headless'
import { mount, tick, unmount } from 'svelte'
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest'
import Stage from '#src/features/levels/Stage.svelte'
import { fitOf, whole } from '#src/features/levels/view.ts'
import { readFrom } from '../../fixtures/game/read.ts'
import { plainFiles } from '../../fixtures/plain-game/read.ts'

const level = JSON.parse(plainFiles['content/levels/level-1.json'] ?? '{}') as Level
let content: GameContent
beforeAll(async () => {
  const loaded = await loadGame(readFrom(plainFiles))
  if (!loaded.ok) throw new Error('the plain game did not load')
  content = loaded.value
})

// A phone held upright: the stage is the window, the level is fitted in what the floating parts leave.
const WINDOW = { w: 390, h: 844 }
const ROOM = { top: 64, right: 8, bottom: 232, left: 8 }
const CLEAR = { x: 8, y: 64, w: 374, h: 548 }
const WORLD = levelSize(level)
const HOME = fitInRoom(WINDOW, ROOM, WORLD)
const CRATE_BOX = '#c9a227'
const SKY = '#9fd3f0'

let box: HTMLDivElement
let mounted: (ReturnType<typeof mount> & { zoom?: (way: 'in' | 'out' | 'whole') => void }) | undefined
let picks: (string | undefined)[]
let drags: { id: string; to: { x: number; y: number } }[]
let ends: number
let cancels: number
let views: string[]

beforeEach(() => {
  box = document.createElement('div')
  box.style.cssText = `position:fixed;left:0;top:0;width:${WINDOW.w}px;height:${WINDOW.h}px`
  document.body.append(box)
  picks = []
  drags = []
  ends = 0
  cancels = 0
  views = []
})
afterEach(() => {
  if (mounted) void unmount(mounted)
  mounted = undefined
  box.remove()
  vi.unstubAllGlobals()
})

async function show(over: { mode?: 'edit' | 'look' | 'read'; picked?: string } = {}): Promise<void> {
  mounted = mount(Stage, {
    target: box,
    props: {
      content,
      level,
      art: undefined,
      room: ROOM,
      picked: over.picked,
      mode: over.mode ?? 'edit',
      title: 'level-1',
      onpick: (id: string | undefined) => picks.push(id),
      ondrag: (id: string, to: { x: number; y: number }) => {
        drags.push({ id, to })
        return 'moved' as const
      },
      ondragend: () => {
        ends += 1
      },
      ondragcancel: () => {
        cancels += 1
      },
      onview: (view: { zoom: number }) => views.push(String(view.zoom)),
    },
  }) as typeof mounted
  await tick()
  await vi.waitFor(() => expect(Number(stage().dataset.scale)).toBeGreaterThan(0))
  await vi.waitFor(() => expect(pictureAt({ x: 195, y: 100 })).toBe(SKY))
}

const stage = (): HTMLElement => {
  const found = box.querySelector<HTMLElement>('.stage')
  if (!found) throw new Error('no stage')
  return found
}
const crate = (): HTMLButtonElement => {
  const found = box.querySelector<HTMLButtonElement>('[data-thing="crate-1"]')
  if (!found) throw new Error('no crate')
  return found
}
const centre = (el: Element): { x: number; y: number } => {
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}
const zoomNow = (): number => Number(stage().dataset.zoom)
const viewNow = (): { x: number; y: number } => {
  const [x = Number.NaN, y = Number.NaN] = (stage().dataset.view ?? '').split(',').map(Number)
  return { x, y }
}
/** One animation frame, and the page's update after it. */
const frame = async (): Promise<void> => {
  await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)))
  await tick()
}
const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

/** Fingers: real pointer events with `pointerType: 'touch'`, sent to whatever lies under the point, as a device does. */
function fingers(): {
  down: (id: number, at: { x: number; y: number }, on?: Element) => void
  move: (id: number, at: { x: number; y: number }) => void
  up: (id: number) => void
  cancel: (id: number) => void
} {
  const last = new Map<number, { x: number; y: number }>()
  const send = (type: string, id: number, at: { x: number; y: number }, on?: Element): void => {
    last.set(id, at)
    const target = on ?? document.elementFromPoint(at.x, at.y) ?? stage()
    target.dispatchEvent(
      new PointerEvent(type, {
        pointerId: id,
        pointerType: 'touch',
        isPrimary: id === 1,
        clientX: at.x,
        clientY: at.y,
        bubbles: true,
        cancelable: true,
      }),
    )
  }
  return {
    down: (id, at, on) => send('pointerdown', id, at, on),
    move: (id, at) => send('pointermove', id, at),
    up: (id) => send('pointerup', id, last.get(id) ?? { x: 0, y: 0 }),
    cancel: (id) => send('pointercancel', id, last.get(id) ?? { x: 0, y: 0 }),
  }
}
/** Two fingers on the clear cell's middle row, `gap` apart about its middle, then moved to `gapTo` apart. */
const MID = { x: 195, y: 338 }
const pair = (gap: number): [{ x: number; y: number }, { x: number; y: number }] => [
  { x: MID.x - gap / 2, y: MID.y },
  { x: MID.x + gap / 2, y: MID.y },
]
async function spread(f: ReturnType<typeof fingers>, from: number, to: number): Promise<void> {
  const [a1, b1] = pair(from)
  const [a2, b2] = pair(to)
  f.down(1, a1)
  f.down(2, b1)
  f.move(1, a2)
  f.move(2, b2)
  await frame()
  await frame()
}

/** A turn of the wheel (or a trackpad's two fingers) at the middle of the clear cell. */
function wheel(init: WheelEventInit): WheelEvent {
  const e = new WheelEvent('wheel', {
    bubbles: true,
    cancelable: true,
    clientX: MID.x,
    clientY: MID.y,
    ...init,
  })
  stage().dispatchEvent(e)
  return e
}

/** The colour of the level's picture at a point of the stage, as `#rrggbb`: what a person sees there. */
function pictureAt(at: { x: number; y: number }): string {
  const canvas = stage().querySelector('canvas')
  if (canvas === null) throw new Error('no picture')
  const rect = canvas.getBoundingClientRect()
  const ratio = canvas.width / rect.width
  const copy = document.createElement('canvas')
  copy.width = canvas.width
  copy.height = canvas.height
  const context = copy.getContext('2d')
  if (context === null) throw new Error('no 2D canvas')
  context.drawImage(canvas, 0, 0)
  const [r = 0, g = 0, b = 0] = context.getImageData(
    Math.round((at.x - rect.left) * ratio),
    Math.round((at.y - rect.top) * ratio),
    1,
    1,
  ).data
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}
const dataUrl = (): string => stage().querySelector('canvas')?.toDataURL() ?? ''

test('the canvas is as big as the stage, the clear cell is the stage less the room, and things lie inside it', async () => {
  await show()
  const s = stage().getBoundingClientRect()
  const canvas = stage().querySelector('canvas')?.getBoundingClientRect()
  expect(canvas?.width).toBeCloseTo(s.width, 0)
  expect(canvas?.height).toBeCloseTo(s.height, 0)
  const clear = box.querySelector('[data-clear]')?.getBoundingClientRect()
  expect([clear?.x, clear?.y, clear?.width, clear?.height]).toEqual([CLEAR.x, CLEAR.y, CLEAR.w, CLEAR.h])
  for (const thing of box.querySelectorAll('[data-thing]')) {
    const r = thing.getBoundingClientRect()
    expect(r.left).toBeGreaterThanOrEqual(s.left - 1)
    expect(r.right).toBeLessThanOrEqual(s.right + 1)
    expect(r.width).toBeGreaterThanOrEqual(48)
  }
  expect(stage().dataset.zoom).toBe('1')
  expect(Number(stage().dataset.scale)).toBeCloseTo(HOME.scale, 3)
  expect(getComputedStyle(stage()).touchAction).toBe('none')
})

test('two fingers spread to twice their distance zoom about the middle, the picture and the buttons together', async () => {
  await show()
  const before = dataUrl()
  const size = stage().querySelector('canvas')?.width
  await spread(fingers(), 187, 374)
  expect(zoomNow()).toBe(2)
  expect(stage().hasAttribute('data-moving')).toBe(true)
  const fit = fitOf({ zoom: 2, ...viewNow() }, HOME, CLEAR)
  expect(Number(stage().dataset.scale)).toBeCloseTo(fit.scale, 1)
  const at = centre(crate())
  expect(at.x).toBeCloseTo(fit.left + 6.5 * fit.scale, 0)
  expect(at.y).toBeCloseTo(fit.top + 7.5 * fit.scale, 0)
  await vi.waitFor(() => expect(pictureAt(at)).toBe(CRATE_BOX))
  expect(stage().querySelector('canvas')?.width).toBe(size)
  expect(dataUrl()).not.toBe(before)
})

test('the picture is the same after zooming in and showing the whole level again', async () => {
  await show()
  const before = dataUrl()
  mounted?.zoom?.('in')
  await vi.waitFor(() => expect(zoomNow()).toBe(1.5))
  mounted?.zoom?.('whole')
  await vi.waitFor(() => expect(zoomNow()).toBe(1))
  await vi.waitFor(() => expect(dataUrl()).toBe(before))
})

test('a finger dragging the crate, then a second finger: the drag is called off, and the two fingers zoom', async () => {
  await show()
  const f = fingers()
  const at = centre(crate())
  f.down(1, at)
  f.move(1, { x: at.x + 20, y: at.y })
  expect(drags.length).toBeGreaterThan(0)
  f.down(2, { x: 300, y: 338 })
  expect(cancels).toBe(1)
  expect(ends).toBe(0)
  f.move(1, { x: 100, y: 338 })
  f.move(2, { x: 380, y: 338 })
  await frame()
  await frame()
  expect(zoomNow()).toBeGreaterThan(1)
})

test('a pinch that starts on the crate with nothing picked leaves nothing picked', async () => {
  await show()
  const f = fingers()
  f.down(1, centre(crate()))
  expect(picks.at(-1)).toBe('crate-1')
  f.down(2, { x: 300, y: 338 })
  expect(picks.at(-1)).toBeUndefined()
})

test('when one of two fingers lifts the other does nothing, and one finger drags again once both are up', async () => {
  await show()
  const f = fingers()
  await spread(f, 187, 374)
  const zoomed = viewNow()
  f.up(2)
  await frame()
  expect(stage().hasAttribute('data-moving')).toBe(false)
  const calls = drags.length
  f.move(1, { x: 50, y: 400 })
  await frame()
  expect(drags.length).toBe(calls)
  expect(viewNow()).toEqual(zoomed)
  f.up(1)
  const at = centre(crate())
  const scale = Number(stage().dataset.scale)
  f.down(3, at)
  f.move(3, { x: at.x + 2 * scale, y: at.y })
  expect(drags.at(-1)?.to.x).toBeCloseTo(8.5, 3)
})

test('a clean tap on empty ground lets go on the lift, not on the press, and a pinch on it never does', async () => {
  await show()
  const f = fingers()
  f.down(1, { x: 100, y: 120 })
  expect(picks).toEqual([])
  f.up(1)
  expect(picks).toEqual([undefined])
  picks.length = 0
  await spread(f, 187, 374)
  f.up(1)
  f.up(2)
  expect(picks).toEqual([])
})

test('read only: one finger drags nothing, and two fingers still zoom', async () => {
  await show({ mode: 'read' })
  const f = fingers()
  const at = centre(crate())
  f.down(1, at)
  f.move(1, { x: at.x + 40, y: at.y })
  f.up(1)
  expect(drags).toEqual([])
  expect(picks).toEqual([])
  await spread(f, 187, 374)
  expect(zoomNow()).toBe(2)
})

test('a finger cut short in the middle of a pinch ends it where it is, and the next drag works', async () => {
  await show()
  const f = fingers()
  await spread(f, 187, 374)
  f.cancel(2)
  await frame()
  expect(zoomNow()).toBe(2)
  expect(stage().hasAttribute('data-moving')).toBe(false)
  f.up(1)
  const at = centre(crate())
  f.down(3, at)
  f.move(3, { x: at.x + 30, y: at.y })
  expect(drags.length).toBeGreaterThan(0)
})

test('a finger down outside the stage and one on it, spread apart, do not zoom it', async () => {
  await show()
  const outside = document.createElement('button')
  outside.style.cssText = 'position:fixed;left:0;top:0;width:40px;height:40px'
  document.body.append(outside)
  const f = fingers()
  f.down(1, { x: 20, y: 20 }, outside)
  f.down(2, { x: 195, y: 338 })
  f.move(1, { x: 5, y: 5 })
  f.move(2, { x: 300, y: 500 })
  await frame()
  outside.remove()
  expect(zoomNow()).toBe(1)
})

test('Safari’s own pinch events zoom once, and not while two fingers are down', async () => {
  await show()
  const gesture = (type: string, scale: number): Event => {
    const e = new Event(type, { bubbles: true, cancelable: true })
    Object.assign(e, { scale, clientX: MID.x, clientY: MID.y })
    return e
  }
  const f = fingers()
  f.down(1, pair(187)[0])
  f.down(2, pair(187)[1])
  stage().dispatchEvent(gesture('gesturestart', 1))
  stage().dispatchEvent(gesture('gesturechange', 3))
  await frame()
  expect(zoomNow()).toBe(1)
  f.up(1)
  f.up(2)
  stage().dispatchEvent(gesture('gestureend', 1))
  stage().dispatchEvent(gesture('gesturestart', 1))
  stage().dispatchEvent(gesture('gesturechange', 2))
  await frame()
  expect(zoomNow()).toBe(2)
})

test('Ctrl or Cmd with the wheel zooms about the pointer by about one button press, and the page never takes it', async () => {
  await show()
  const first = wheel({ ctrlKey: true, deltaY: -100 })
  await frame()
  expect(first.defaultPrevented).toBe(true)
  expect(zoomNow()).toBe(1.49)
  const meta = wheel({ metaKey: true, deltaY: 100 })
  await frame()
  expect(meta.defaultPrevented).toBe(true)
  expect(zoomNow()).toBe(1)
  wheel({ ctrlKey: true, deltaY: -5 })
  await frame()
  expect(zoomNow()).toBe(1.05)
  stage().dispatchEvent(new Event('gesturestart', { bubbles: true, cancelable: true }))
  wheel({ ctrlKey: true, deltaY: -100 })
  await frame()
  expect(zoomNow()).toBe(1.05)
})

test('a wheel without Ctrl moves the level (Shift sideways), and at zoom 1 moves nothing but is still taken', async () => {
  await show()
  const plain = wheel({ deltaY: 50 })
  await frame()
  expect(plain.defaultPrevented).toBe(true)
  expect(viewNow()).toEqual({ x: 8, y: 4.5 })
  await spread(fingers(), 187, 374)
  const scale = Number(stage().dataset.scale)
  const start = viewNow()
  wheel({ deltaX: 50 })
  await frame()
  expect(viewNow().x).toBeCloseTo(start.x + 50 / scale, 1)
  const afterX = viewNow().x
  wheel({ shiftKey: true, deltaY: -50 })
  await frame()
  expect(viewNow().x).toBeCloseTo(afterX - 50 / scale, 1)
})

test('arrow keys with nothing picked move the level one tile, and at zoom 1 they move nothing', async () => {
  await show()
  const press = (key: string): void => {
    stage().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  }
  press('ArrowRight')
  await frame()
  expect(viewNow()).toEqual({ x: 8, y: 4.5 })
  mounted?.zoom?.('in')
  await vi.waitFor(() => expect(zoomNow()).toBe(1.5))
  const start = viewNow()
  press('ArrowLeft')
  await frame()
  expect(viewNow().x).toBeCloseTo(start.x - 1, 1)
  press('ArrowRight')
  await frame()
  expect(viewNow().x).toBeCloseTo(start.x, 1)
})

test('a press on a thing near the clear cell’s edge moves nothing until the edge slide starts', async () => {
  await show()
  const f = fingers()
  await spread(f, 187, 374)
  f.up(1)
  f.up(2)
  const before = stage().dataset.view
  const at = centre(crate())
  f.down(3, at)
  f.move(3, { x: at.x + 3, y: at.y })
  await frame()
  expect(stage().dataset.view).toBe(before)
})

test('the keyboard’s focus brings a thing into the clear cell, a press’s focus does not', async () => {
  await show()
  const f = fingers()
  await spread(f, 187, 374)
  f.up(1)
  f.up(2)
  const start = viewNow()
  // Scroll the level so the crate is out of sight: far left.
  stage().dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaX: 800 }))
  await frame()
  expect(viewNow().x).toBeGreaterThan(start.x)
  const away = stage().dataset.view
  crate().focus()
  await wait(50)
  if (!crate().matches(':focus-visible')) {
    // A script's focus is not always the keyboard's in every engine; then it must not move the level.
    expect(stage().dataset.view).toBe(away)
    return
  }
  await vi.waitFor(() => {
    const r = crate().getBoundingClientRect()
    expect(r.right).toBeGreaterThan(CLEAR.x)
    expect(r.left).toBeLessThan(CLEAR.x + CLEAR.w)
  })
})

test('a thing held at the clear cell’s edge slides the level under it', async () => {
  await show()
  const f = fingers()
  await spread(f, 187, 374)
  f.up(1)
  f.up(2)
  const start = viewNow()
  const at = centre(crate())
  f.down(3, at)
  f.move(3, { x: at.x + 20, y: at.y })
  f.move(3, { x: CLEAR.x + CLEAR.w - 10, y: at.y })
  await wait(600)
  await tick()
  expect(viewNow().x).toBeGreaterThan(start.x)
  expect(drags.at(-1)?.to.x).toBeGreaterThan(8)
  f.up(3)
})

test('the buttons and keys glide in about 150 ms, and at once under reduced motion', async () => {
  await show()
  mounted?.zoom?.('in')
  await wait(400)
  expect(zoomNow()).toBe(1.5)
  mounted?.zoom?.('whole')
  await wait(400)
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('reduce'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
  mounted?.zoom?.('in')
  await frame()
  await frame()
  expect(zoomNow()).toBe(1.5)
})

test('a picked thing is ringed by the page, not the picture: the canvas is the same, the ring is dashed', async () => {
  await show()
  const plain = dataUrl()
  void unmount(mounted as ReturnType<typeof mount>)
  mounted = undefined
  box.replaceChildren()
  await show({ picked: 'crate-1' })
  await vi.waitFor(() => expect(dataUrl()).toBe(plain))
  const ring = getComputedStyle(crate())
  expect(ring.outlineStyle).toBe('dashed')
  expect(ring.animationName).toMatch(/draw$|fade$/)
  expect(crate().getAttribute('aria-pressed')).toBe('true')
})

test('a fresh whole level opens whole: the view starts at the level’s middle', async () => {
  await show()
  expect(viewNow()).toEqual({ x: whole(WORLD).x, y: whole(WORLD).y })
})
