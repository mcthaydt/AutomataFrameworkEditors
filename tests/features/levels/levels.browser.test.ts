// The levels editor in each real browser, driven with real touch pointer events on the real layout, in a box of each of
// the five sizes. The plain game, with no pictures: every thing is a box on sky, so a pixel says where a thing is drawn.
// The pictures with art are held in `level-picture.browser.test.ts`, and the gestures of the stage in
// `stage.browser.test.ts`.
import { type GameContent, type Level, levelSize, loadGame } from '@automataframework/framework/headless'
import { mount, tick, unmount } from 'svelte'
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest'
import { isDirty, type LevelEdit, Levels, type Shape, shapeOf } from '#src/features/levels/levels.ts'
import { EN } from '#src/features/words/en.ts'
import { useTables } from '#src/features/words/words.svelte.ts'
import { readFrom } from '../../fixtures/game/read.ts'
import { plainFiles } from '../../fixtures/plain-game/read.ts'
import { WORDS } from '../../fixtures/words.ts'

const LEVEL_FILE = 'content/levels/level-1.json'
const level = JSON.parse(plainFiles[LEVEL_FILE] ?? '{}') as Level
let content: GameContent
beforeAll(async () => {
  const loaded = await loadGame(readFrom(plainFiles))
  if (!loaded.ok) throw new Error('the plain game did not load')
  content = loaded.value
})

/** The five sizes, and the shape the frame's own box gives each. */
const SIZES = {
  ipadUpright: { w: 820, h: 1180, shape: 'mid' },
  ipadSideways: { w: 1180, h: 820, shape: 'wide' },
  phone: { w: 390, h: 844, shape: 'narrow' },
  phoneSideways: { w: 844, h: 390, shape: 'mid' },
  desktop: { w: 1440, h: 900, shape: 'wide' },
} as const satisfies Record<string, { w: number; h: number; shape: Shape }>
type SizeName = keyof typeof SIZES

let box: HTMLDivElement
let mounted: ReturnType<typeof mount> | undefined
let edits: LevelEdit[]
const onchange = (edit: LevelEdit): void => {
  edits.push(edit)
}

function place(size: SizeName): void {
  box.style.width = `${SIZES[size].w}px`
  box.style.height = `${SIZES[size].h}px`
}

beforeEach(() => {
  box = document.createElement('div')
  box.style.cssText = 'position:fixed;left:0;top:0;width:820px;height:1180px;--margin:16px'
  document.body.append(box)
  edits = []
})
afterEach(() => {
  if (mounted) void unmount(mounted)
  mounted = undefined
  box.remove()
  useTables()
})

const BLOCK = { game: 'Crate Game', level: 'Level 1', saved: 'No changes', status: 'Nothing to save.' }
async function show(size: SizeName = 'ipadUpright'): Promise<void> {
  place(size)
  mounted = mount(Levels, {
    target: box,
    props: {
      content,
      levelId: 'level-1',
      start: level,
      art: undefined,
      shape: shapeOf({ w: SIZES[size].w, h: SIZES[size].h }),
      block: BLOCK,
      onchange,
    },
  })
  await tick()
  await vi.waitFor(() => expect(Number(stage().dataset.scale)).toBeGreaterThan(0))
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
const part = (name: string): HTMLElement => {
  const found = box.querySelector<HTMLElement>(`[data-part="${name}"]`)
  if (!found) throw new Error(`no ${name}`)
  return found
}
const named = (label: string): HTMLButtonElement => {
  const found = [...box.querySelectorAll('button')].find((b) => b.textContent?.trim() === label)
  if (!found) throw new Error(`no button ${label}`)
  return found
}
const centre = (el: Element): { x: number; y: number } => {
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}
const scale = (): number => Number(stage().dataset.scale)
const clear = (): DOMRect => {
  const found = box.querySelector('[data-clear]')
  if (!found) throw new Error('no clear cell')
  return found.getBoundingClientRect()
}
/** Where the crate should be on the page: the level, fitted and centered in the clear cell. */
function expectedCentre(tileX: number, tileY: number): { x: number; y: number } {
  const cell = clear()
  const world = levelSize(level)
  const left = cell.left + (cell.width - world.w * scale()) / 2
  const top = cell.top + (cell.height - world.h * scale()) / 2
  return { x: left + tileX * scale(), y: top + tileY * scale() }
}

/** The colour of the level's picture at a point of the page, as `#rrggbb`: what a person sees there. */
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
const SKY = '#9fd3f0'
const CRATE = '#c9a227'
/** Waits for the first picture to be drawn: the canvas exists once Pixi has started, which is after the screen. */
const drawn = (): Promise<void> => vi.waitFor(() => expect(pictureAt(expectedCentre(6.5, 7.5))).toBe(CRATE))

function touch(el: Element, type: string, at: { x: number; y: number }, id = 1): void {
  el.dispatchEvent(
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
/** Presses on the crate and drags it to `to`, in steps of at most half a tile so it passes every spot on the way. */
function dragTo(to: { x: number; y: number }, finish = true): void {
  const from = centre(crate())
  touch(crate(), 'pointerdown', from)
  const steps = Math.max(2, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / (scale() / 2)))
  for (let i = 1; i <= steps; i++) {
    touch(crate(), 'pointermove', {
      x: from.x + ((to.x - from.x) * i) / steps,
      y: from.y + ((to.y - from.y) * i) / steps,
    })
  }
  if (finish) touch(crate(), 'pointerup', to)
}
const tap = (el: Element): void => {
  touch(el, 'pointerdown', centre(el))
  touch(el, 'pointerup', centre(el))
}
const at = (): [string | undefined, string | undefined] => [crate().dataset.x, crate().dataset.y]
const last = (): LevelEdit => {
  const edit = edits.at(-1)
  if (!edit) throw new Error('onchange was not called')
  return edit
}
const overlap = (a: DOMRect, b: DOMRect): boolean =>
  Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
  Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1

const PARTS = ['tools', 'block', 'undo'] as const

// ---- where everything sits ------------------------------------------------------------------------------------------

test.each(Object.keys(SIZES) as SizeName[])(
  'at %s every part is where its shape puts it, and clear of the level',
  async (name) => {
    await show(name)
    const { w, h, shape } = SIZES[name]
    expect(box.querySelector('[data-shape]')?.getAttribute('data-shape')).toBe(shape)
    const rects = Object.fromEntries(PARTS.map((p) => [p, part(p).getBoundingClientRect()])) as Record<
      (typeof PARTS)[number],
      DOMRect
    >
    const near = (value: number, want: number): void => expect(Math.abs(value - want)).toBeLessThanOrEqual(2)
    if (shape === 'wide') {
      // The tools are a column at the left edge, centered; undo and the block are in the bottom right corner.
      near(rects.tools.left, 16)
      near(centre(part('tools')).y, h / 2)
      near(rects.undo.right, w - 16)
      near(rects.undo.bottom, h - 16)
      expect(rects.block.right).toBeLessThanOrEqual(rects.undo.left)
    } else if (shape === 'mid') {
      // One row along the bottom: the tools, then the block, then undo.
      near(rects.tools.left, 16)
      near(rects.tools.bottom, h - 16)
      near(rects.undo.right, w - 16)
      near(rects.undo.bottom, h - 16)
      expect(rects.tools.right).toBeLessThanOrEqual(rects.block.left)
      expect(rects.block.right).toBeLessThanOrEqual(rects.undo.left)
    } else {
      // A phone upright: the tools the whole width along the bottom, undo above their right end, the block above that.
      near(rects.tools.left, 16)
      near(rects.tools.right, w - 16)
      near(rects.tools.bottom, h - 16)
      near(rects.undo.right, w - 16)
      expect(rects.undo.bottom).toBeLessThanOrEqual(rects.tools.top)
      expect(rects.block.bottom).toBeLessThanOrEqual(rects.undo.top)
    }
    for (let a = 0; a < PARTS.length; a += 1) {
      for (let b = a + 1; b < PARTS.length; b += 1) {
        expect(
          overlap(rects[PARTS[a] as 'tools'], rects[PARTS[b] as 'tools']),
          `${PARTS[a]} and ${PARTS[b]}`,
        ).toBe(false)
      }
    }
    const cell = clear()
    for (const p of PARTS) expect(overlap(rects[p], cell), `${p} lies over the level`).toBe(false)
    expect(cell.height).toBeGreaterThanOrEqual(160)
    expect(cell.width).toBeGreaterThanOrEqual(Math.min(w, h) / 2)
    const move = box.querySelector('[data-tool="move"]')
    expect(move?.getAttribute('aria-pressed')).toBe('true')
    const wide = part('block').querySelectorAll('.cell').length
    expect(wide).toBe(shape === 'narrow' ? 2 : 4)
    expect(part('block').getBoundingClientRect().height).toBeLessThanOrEqual(shape === 'narrow' ? 76 : 80)
  },
)

/** Every string 40% longer, as another language may be (audit I1). */
function longer(text: string): string {
  return text + text.slice(0, Math.ceil(text.length * 0.4))
}
function longTable(): typeof EN {
  const table: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(EN)) {
    table[key] =
      typeof value === 'string'
        ? longer(value)
        : (...args: never[]) => longer((value as (...a: never[]) => string)(...args))
  }
  return table as unknown as typeof EN
}

test.each(Object.keys(SIZES) as SizeName[])(
  'at %s words 40%% longer break nothing, and picking never refits the level',
  async (name) => {
    useTables({ en: longTable() })
    await show(name)
    const { w, h } = SIZES[name]
    const cell = clear()
    for (const p of PARTS) {
      const r = part(p).getBoundingClientRect()
      expect(r.left, p).toBeGreaterThanOrEqual(-0.5)
      expect(r.top, p).toBeGreaterThanOrEqual(-0.5)
      expect(r.right, p).toBeLessThanOrEqual(w + 0.5)
      expect(r.bottom, p).toBeLessThanOrEqual(h + 0.5)
      expect(overlap(r, cell), `${p} lies over the level`).toBe(false)
    }
    for (const tool of box.querySelectorAll('[data-tool]')) {
      const r = tool.getBoundingClientRect()
      expect(r.width).toBeGreaterThanOrEqual(56)
      expect(r.height).toBeGreaterThanOrEqual(56)
    }
    const before = scale()
    tap(crate())
    await tick()
    expect(crate().getAttribute('aria-pressed')).toBe('true')
    expect(scale()).toBe(before)
  },
)

// ---- what a finger does ---------------------------------------------------------------------------------------------

test('the crate has a button a finger can hit, centred on the crate', async () => {
  await show()
  const r = crate().getBoundingClientRect()
  expect(r.width).toBeGreaterThanOrEqual(48)
  expect(r.height).toBeGreaterThanOrEqual(48)
  const want = expectedCentre(6.5, 7.5)
  expect(Math.abs(centre(crate()).x - want.x)).toBeLessThanOrEqual(1)
  expect(Math.abs(centre(crate()).y - want.y)).toBeLessThanOrEqual(1)
})

test('a tap picks the crate and moves nothing; touching empty space lets go', async () => {
  await show()
  const before = scale()
  tap(crate())
  await tick()
  expect(crate().getAttribute('aria-pressed')).toBe('true')
  expect(edits).toEqual([])
  const cell = clear()
  touch(stage(), 'pointerdown', { x: cell.left + 4, y: cell.top + 4 })
  touch(stage(), 'pointerup', { x: cell.left + 4, y: cell.top + 4 })
  await tick()
  expect(crate().getAttribute('aria-pressed')).toBe('false')
  expect(scale()).toBe(before)
})

test('dragging two tiles right moves it two tiles, and a whole drag is one undo step', async () => {
  await show()
  const from = centre(crate())
  expect(named(WORDS.undo).disabled).toBe(true)
  dragTo({ x: from.x + 2 * scale(), y: from.y })
  await tick()
  expect(at()).toEqual(['8.5', '7.5'])
  expect(isDirty(last())).toBe(true)
  expect(named(WORDS.undo).disabled).toBe(false)
  expect(named(WORDS.redo).disabled).toBe(true)
  named(WORDS.undo).click()
  await tick()
  expect(at()).toEqual(['6.5', '7.5'])
  expect(isDirty(last())).toBe(false)
  expect(named(WORDS.undo).disabled).toBe(true)
  expect(named(WORDS.redo).disabled).toBe(false)
  named(WORDS.redo).click()
  await tick()
  expect(at()).toEqual(['8.5', '7.5'])
})

test('a cancelled touch puts the crate back, and a second finger does too', async () => {
  await show()
  const from = centre(crate())
  dragTo({ x: from.x + 2 * scale(), y: from.y }, false)
  await tick()
  expect(at()[0]).toBe('8.5')
  touch(crate(), 'pointercancel', from)
  await tick()
  expect(at()).toEqual(['6.5', '7.5'])
  expect(isDirty(last())).toBe(false)
  dragTo({ x: from.x + 2 * scale(), y: from.y }, false)
  touch(stage(), 'pointerdown', { x: from.x, y: from.y - 100 }, 2)
  await tick()
  expect(at()).toEqual(['6.5', '7.5'])
})

test('dragging far off keeps the crate inside the walls, and into the floor says why', async () => {
  await show()
  const from = centre(crate())
  dragTo({ x: from.x + 40 * scale(), y: from.y })
  await tick()
  expect(at()).toEqual(['14.5', '7.5'])
  named(WORDS.undo).click()
  await tick()
  dragTo({ x: from.x, y: from.y + 2 * scale() })
  await tick()
  expect(at()).toEqual(['6.5', '7.5'])
  expect(box.textContent).toContain(WORDS.solid)
})

test('arrow keys on the crate move it half a tile; Escape lets go', async () => {
  await show()
  const key = (name: string): void => {
    crate().dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }))
  }
  key('ArrowRight')
  await tick()
  expect(at()).toEqual(['7', '7.5'])
  expect(crate().getAttribute('aria-pressed')).toBe('true')
  key('ArrowUp')
  key('ArrowLeft')
  key('ArrowDown')
  await tick()
  expect(at()).toEqual(['6.5', '7.5'])
  key('Escape')
  await tick()
  expect(crate().getAttribute('aria-pressed')).toBe('false')
})

// The picture, not only the buttons over it: the first build moved the buttons and never redrew the crate.
test('the picture follows a drag, Undo and an arrow key', async () => {
  await show()
  await drawn()
  const from = centre(crate())
  dragTo({ x: from.x + 2 * scale(), y: from.y })
  await tick()
  expect(pictureAt(expectedCentre(8.5, 7.5))).toBe(CRATE)
  expect(pictureAt(expectedCentre(6.5, 7.5))).toBe(SKY)
  named(WORDS.undo).click()
  await tick()
  expect(pictureAt(expectedCentre(6.5, 7.5))).toBe(CRATE)
  expect(pictureAt(expectedCentre(8.5, 7.5))).toBe(SKY)
  crate().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }))
  await tick()
  expect(at()[0]).toBe('7')
})

test('the title block says what is saved in short, and the whole sentence is read out', async () => {
  await show()
  expect(part('block').textContent).toContain(BLOCK.saved)
  expect(part('block').textContent).toContain(BLOCK.game)
  expect(box.querySelector('.status')?.textContent).toBe(BLOCK.status)
})

test('at 390 by 844 every button is at least 44 px and nothing runs off the side', async () => {
  await show('phone')
  tap(crate())
  await tick()
  for (const b of box.querySelectorAll('button')) {
    if (b.hasAttribute('data-thing')) continue
    const r = b.getBoundingClientRect()
    expect(r.width, b.textContent ?? '').toBeGreaterThanOrEqual(44)
    expect(r.height, b.textContent ?? '').toBeGreaterThanOrEqual(44)
    expect(r.right).toBeLessThanOrEqual(390 + 0.5)
    expect(r.left).toBeGreaterThanOrEqual(-0.5)
  }
  expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth)
})
