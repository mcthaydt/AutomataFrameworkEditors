// The levels editor in each real browser, driven with real touch pointer events on the real layout.
import type { Character, Level } from '@automataframework/framework/headless'
import { createRawSnippet, mount, tick, unmount } from 'svelte'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { fitInside, isDirty, type LevelEdit, Levels } from '#src/features/levels/levels.ts'
import { WORDS } from '#src/features/words/words.ts'
import { fixtureFiles, LEVEL_PATH } from '../../fixtures/game/read.ts'
import { live } from '../../fixtures/live.svelte.ts'

const level = JSON.parse(fixtureFiles[LEVEL_PATH] ?? '{}') as Level
const characters: Record<string, Character> = {
  crate: JSON.parse(fixtureFiles['content/characters/crate.json'] ?? '{}'),
  hero: JSON.parse(fixtureFiles['content/characters/hero.json'] ?? '{}'),
}

let box: HTMLDivElement
let mounted: ReturnType<typeof mount> | undefined
let edits: LevelEdit[]
let onchange: (edit: LevelEdit) => void

beforeEach(() => {
  box = document.createElement('div')
  box.style.cssText =
    'position:fixed;left:0;top:0;width:820px;height:1180px;display:flex;flex-direction:column'
  document.body.append(box)
  edits = []
  onchange = (edit) => edits.push(edit)
})
afterEach(() => {
  if (mounted) void unmount(mounted)
  mounted = undefined
  box.remove()
})

type Status = 'clean' | 'dirty' | 'saving' | 'saved'
async function show(over: { canSave?: boolean; status?: Status; onsave?: () => void } = {}): Promise<void> {
  mounted = mount(Levels, {
    target: box,
    props: {
      level,
      characters,
      hero: 'hero',
      canSave: over.canSave ?? true,
      status: over.status ?? 'dirty',
      statusText: 'Nothing has changed yet.',
      title: 'level-1',
      back: { label: WORDS.back, onpress: () => {} },
      onchange,
      onsave: over.onsave ?? (() => {}),
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
const named = (label: string): HTMLButtonElement => {
  const found = [...box.querySelectorAll('button')].find((b) => b.textContent?.trim() === label)
  if (!found) throw new Error(`no button ${label}`)
  return found
}
const centre = (el: Element): { x: number; y: number } => {
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}
/** The clear cell the floating panels leave, as the level is fitted to it: its box against the stage's. */
function insetOfClear(): { top: number; right: number; bottom: number; left: number } {
  const s = stage().getBoundingClientRect()
  const clear = box.querySelector('[data-clear]')?.getBoundingClientRect()
  if (clear === undefined) return { top: 0, right: 0, bottom: 0, left: 0 }
  return {
    top: clear.top - s.top,
    right: s.right - clear.right,
    bottom: s.bottom - clear.bottom,
    left: clear.left - s.left,
  }
}
/** Where the crate should be on the page: from the stage's own fit, the way the framework fits a level. */
function expectedCentre(tileX: number, tileY: number): { x: number; y: number } {
  const s = stage()
  const rect = s.getBoundingClientRect()
  const fit = fitInside({ w: s.clientWidth, h: s.clientHeight }, insetOfClear(), { w: 16, h: 9 })
  return { x: rect.left + fit.left + tileX * fit.scale, y: rect.top + fit.top + tileY * fit.scale }
}
const scale = (): number => Number(stage().dataset.scale)

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
const place = (): [string | undefined, string | undefined] => [crate().dataset.x, crate().dataset.y]
const last = (): LevelEdit => {
  const edit = edits.at(-1)
  if (!edit) throw new Error('onchange was not called')
  return edit
}

test('the crate has a button a finger can hit, centred on the crate', async () => {
  await show()
  const r = crate().getBoundingClientRect()
  expect(r.width).toBeGreaterThanOrEqual(48)
  expect(r.height).toBeGreaterThanOrEqual(48)
  const want = expectedCentre(6.5, 7.5)
  expect(Math.abs(centre(crate()).x - want.x)).toBeLessThanOrEqual(1)
  expect(Math.abs(centre(crate()).y - want.y)).toBeLessThanOrEqual(1)
})

test('a tap selects and shows the arrows; nothing moved', async () => {
  await show()
  const at = centre(crate())
  touch(crate(), 'pointerdown', at)
  touch(crate(), 'pointerup', at)
  await tick()
  expect(crate().getAttribute('aria-pressed')).toBe('true')
  expect(box.textContent).toContain(WORDS.hintSelected('crate-1'))
  expect(named(WORDS.moveLeft)).toBeTruthy()
  expect(edits).toEqual([])
})

test('tapping the stage where no thing is unselects', async () => {
  await show()
  touch(crate(), 'pointerdown', centre(crate()))
  touch(crate(), 'pointerup', centre(crate()))
  await tick()
  const s = stage().getBoundingClientRect()
  touch(stage(), 'pointerdown', { x: s.left + 5, y: s.top + 5 })
  await tick()
  expect(crate().getAttribute('aria-pressed')).toBe('false')
  expect(box.textContent).toContain(WORDS.hintIdle)
})

test('dragging two tiles right moves it two tiles', async () => {
  await show()
  const from = centre(crate())
  dragTo({ x: from.x + 2 * scale(), y: from.y })
  await tick()
  expect(place()).toEqual(['8.5', '7.5'])
  expect(isDirty(last())).toBe(true)
})

test('a whole drag is one undo step', async () => {
  await show()
  const from = centre(crate())
  dragTo({ x: from.x + 2 * scale(), y: from.y })
  await tick()
  named(WORDS.undo).click()
  await tick()
  expect(place()).toEqual(['6.5', '7.5'])
  expect(isDirty(last())).toBe(false)
})

test('a cancelled touch puts the crate back', async () => {
  await show()
  const from = centre(crate())
  dragTo({ x: from.x + 2 * scale(), y: from.y }, false)
  await tick()
  expect(place()[0]).toBe('8.5')
  touch(crate(), 'pointercancel', from)
  await tick()
  expect(place()).toEqual(['6.5', '7.5'])
  expect(isDirty(last())).toBe(false)
})

test('a second finger cancels the drag', async () => {
  await show()
  const from = centre(crate())
  dragTo({ x: from.x + 2 * scale(), y: from.y }, false)
  touch(stage(), 'pointerdown', { x: from.x, y: from.y - 100 }, 2)
  await tick()
  expect(place()).toEqual(['6.5', '7.5'])
})

test('dragging far off the stage keeps the crate inside the walls', async () => {
  await show()
  const from = centre(crate())
  dragTo({ x: from.x + 40 * scale(), y: from.y })
  await tick()
  expect(place()).toEqual(['14.5', '7.5'])
})

test('dragging down into the floor leaves it on the floor and says why', async () => {
  await show()
  const from = centre(crate())
  dragTo({ x: from.x, y: from.y + 2 * scale() })
  await tick()
  expect(place()).toEqual(['6.5', '7.5'])
  expect(box.textContent).toContain(WORDS.solid)
})

test('each arrow button moves half a tile; so does each arrow key', async () => {
  await show()
  touch(crate(), 'pointerdown', centre(crate()))
  touch(crate(), 'pointerup', centre(crate()))
  await tick()
  named(WORDS.moveRight).click()
  await tick()
  expect(place()).toEqual(['7', '7.5'])
  named(WORDS.moveUp).click()
  await tick()
  expect(place()).toEqual(['7', '7'])
  named(WORDS.moveLeft).click()
  named(WORDS.moveLeft).click()
  await tick()
  expect(place()).toEqual(['6', '7'])
  named(WORDS.moveDown).click()
  await tick()
  expect(place()).toEqual(['6', '7.5'])
  const key = (name: string): void => {
    crate().dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }))
  }
  key('ArrowRight')
  await tick()
  expect(place()).toEqual(['6.5', '7.5'])
  key('ArrowUp')
  await tick()
  expect(place()).toEqual(['6.5', '7'])
  key('Escape')
  await tick()
  expect(crate().getAttribute('aria-pressed')).toBe('false')
})

test('Save is off until something changed, and off while saving', async () => {
  await show({ status: 'clean' })
  expect(named(WORDS.save).disabled).toBe(true)
  void unmount(mounted as object)
  box.replaceChildren()
  await show({ status: 'dirty' })
  expect(named(WORDS.save).disabled).toBe(false)
  void unmount(mounted as object)
  box.replaceChildren()
  await show({ status: 'saving' })
  expect(named(WORDS.save).disabled).toBe(true)
})

test('with canSave false, Save stays off after a move', async () => {
  await show({ canSave: false })
  expect(named(WORDS.save).disabled).toBe(true)
  touch(crate(), 'pointerdown', centre(crate()))
  touch(crate(), 'pointerup', centre(crate()))
  await tick()
  named(WORDS.moveRight).click()
  await tick()
  expect(named(WORDS.save).disabled).toBe(true)
})

test('pressing Save calls onsave once', async () => {
  const onsave = vi.fn()
  await show({ onsave })
  named(WORDS.save).click()
  expect(onsave).toHaveBeenCalledTimes(1)
})

async function turn(width: number, height: number): Promise<void> {
  const before = scale()
  box.style.width = `${width}px`
  box.style.height = `${height}px`
  await vi.waitFor(() => expect(scale()).not.toBe(before))
  await tick()
}

test('turning the box sideways refits: the button is still on the crate', async () => {
  await show()
  await turn(1180, 820)
  const want = expectedCentre(6.5, 7.5)
  expect(Math.abs(centre(crate()).x - want.x)).toBeLessThanOrEqual(1)
  expect(Math.abs(centre(crate()).y - want.y)).toBeLessThanOrEqual(1)
})

// The picture, not only the buttons over it: the first build moved the buttons and never redrew the crate.
test('the picture follows a drag: the crate is drawn at its new place and the old place is sky', async () => {
  await show()
  await drawn()
  const from = centre(crate())
  dragTo({ x: from.x + 2 * scale(), y: from.y })
  await tick()
  expect(pictureAt(expectedCentre(8.5, 7.5))).toBe(CRATE)
  expect(pictureAt(expectedCentre(6.5, 7.5))).toBe(SKY)
})

test('the picture follows an arrow button and Undo', async () => {
  await show()
  await drawn()
  touch(crate(), 'pointerdown', centre(crate()))
  touch(crate(), 'pointerup', centre(crate()))
  await tick()
  for (let step = 0; step < 4; step += 1) named(WORDS.moveRight).click()
  await tick()
  expect(pictureAt(expectedCentre(8.5, 7.5))).toBe(CRATE)
  expect(pictureAt(expectedCentre(6.5, 7.5))).toBe(SKY)
  for (let step = 0; step < 4; step += 1) named(WORDS.undo).click()
  await tick()
  expect(pictureAt(expectedCentre(6.5, 7.5))).toBe(CRATE)
  expect(pictureAt(expectedCentre(8.5, 7.5))).toBe(SKY)
})

test('the picture refits when the box turns: the crate is still drawn under its button', async () => {
  await show()
  await drawn()
  await turn(1180, 820)
  const where = expectedCentre(6.5, 7.5)
  await vi.waitFor(() => expect(pictureAt(where)).toBe(CRATE))
  // Under the button, and not in the place the first fit would have left it.
  expect(Math.abs(centre(crate()).x - where.x)).toBeLessThanOrEqual(1)
  expect(Math.abs(centre(crate()).y - where.y)).toBeLessThanOrEqual(1)
})

/** The whole picture, read as one data address: equal before and after only if not one pixel changed. */
const wholePicture = (): string => {
  const canvas = stage().querySelector('canvas')
  if (canvas === null) throw new Error('no picture')
  return canvas.toDataURL()
}

test('picking a thing changes nothing in the picture', async () => {
  await show()
  await drawn()
  const before = wholePicture()
  touch(crate(), 'pointerdown', centre(crate()))
  touch(crate(), 'pointerup', centre(crate()))
  await tick()
  expect(crate().getAttribute('aria-pressed')).toBe('true')
  expect(wholePicture()).toBe(before)
  // And no pixel at the crate's edge is the white the picture used to ring it in.
  const middle = expectedCentre(6.5, 7.5)
  const edge = middle.x - scale() / 2
  for (const dx of [-3, -2, -1, 1, 2, 3]) expect(pictureAt({ x: edge + dx, y: middle.y })).not.toBe('#ffffff')
  const s = stage().getBoundingClientRect()
  touch(stage(), 'pointerdown', { x: s.left + 5, y: s.top + 5 })
  await tick()
  expect(wholePicture()).toBe(before)
})

test('a picked thing is ringed by its button', async () => {
  await show()
  await drawn()
  expect(getComputedStyle(crate()).borderTopColor).toBe('rgba(0, 0, 0, 0)')
  touch(crate(), 'pointerdown', centre(crate()))
  touch(crate(), 'pointerup', centre(crate()))
  await tick()
  expect(getComputedStyle(crate()).borderTopColor).toBe('rgb(238, 180, 128)')
  expect(getComputedStyle(crate()).borderTopWidth).toBe('2px')
})

test('read only, a marked thing is ringed by its button', async () => {
  mounted = mount(Levels, {
    target: box,
    props: {
      readOnly: true,
      marked: ['crate-1'],
      level,
      characters,
      hero: 'hero',
      canSave: false,
      status: 'clean' as const,
      statusText: '',
      title: 'level-1',
      onchange,
      onsave: () => {},
    },
  })
  await tick()
  await vi.waitFor(() => expect(Number(stage().dataset.scale)).toBeGreaterThan(0))
  expect(crate().hasAttribute('data-marked')).toBe(true)
  expect(getComputedStyle(crate()).borderTopColor).toBe('rgb(238, 180, 128)')
  expect(getComputedStyle(crate()).borderTopWidth).toBe('2px')
})

test('turning mid-drag cancels the drag', async () => {
  await show()
  const from = centre(crate())
  dragTo({ x: from.x + 2 * scale(), y: from.y }, false)
  await tick()
  expect(place()[0]).toBe('8.5')
  await turn(1180, 820)
  expect(place()).toEqual(['6.5', '7.5'])
})

test('at 390 by 844 every button is at least 44 px and nothing runs off the side', async () => {
  box.style.width = '390px'
  box.style.height = '844px'
  await show()
  touch(crate(), 'pointerdown', centre(crate()))
  touch(crate(), 'pointerup', centre(crate()))
  await tick()
  for (const b of box.querySelectorAll('button')) {
    const r = b.getBoundingClientRect()
    expect(r.width, b.textContent ?? '').toBeGreaterThanOrEqual(44)
    expect(r.height, b.textContent ?? '').toBeGreaterThanOrEqual(44)
    expect(r.right).toBeLessThanOrEqual(390 + 0.5)
    expect(r.left).toBeGreaterThanOrEqual(-0.5)
  }
  expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth)
})

test('read only: a drag moves nothing, there is no arrow, Undo or Save, and a marked thing says so', async () => {
  mounted = mount(Levels, {
    target: box,
    props: {
      readOnly: true,
      marked: ['crate-1'],
      level,
      characters,
      hero: 'hero',
      canSave: false,
      status: 'clean' as const,
      statusText: '',
      title: 'level-1',
      back: { label: WORDS.back, onpress: () => {} },
      onchange,
      onsave: () => {},
    },
  })
  await tick()
  await vi.waitFor(() => expect(Number(stage().dataset.scale)).toBeGreaterThan(0))
  const from = centre(crate())
  touch(crate(), 'pointerdown', from)
  touch(crate(), 'pointermove', { x: from.x + 100, y: from.y })
  touch(crate(), 'pointerup', { x: from.x + 100, y: from.y })
  await tick()
  expect(place()).toEqual(['6.5', '7.5'])
  expect(edits).toEqual([])
  const labels = [...box.querySelectorAll('button')].map((b) => b.textContent?.trim())
  for (const word of [WORDS.save, WORDS.undo, WORDS.moveLeft, WORDS.moveRight]) {
    expect(labels).not.toContain(word)
  }
  expect(crate().hasAttribute('data-marked')).toBe(true)
})

test('the two copy buttons are at least 44 px, on with canSave false and status clean, and each calls its handler once', async () => {
  const text = vi.fn()
  const file = vi.fn()
  mounted = mount(Levels, {
    target: box,
    props: {
      level,
      characters,
      hero: 'hero',
      canSave: false,
      status: 'clean' as const,
      statusText: '',
      title: 'level-1',
      back: { label: WORDS.back, onpress: () => {} },
      onchange,
      onsave: () => {},
      oncopytext: text,
      oncopyfile: file,
    },
  })
  await tick()
  await vi.waitFor(() => expect(Number(stage().dataset.scale)).toBeGreaterThan(0))
  for (const [label, handler] of [
    [WORDS.copyLevel, text],
    [WORDS.copyKeep, file],
  ] as const) {
    const button = named(label)
    expect(button.disabled).toBe(false)
    expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(44)
    button.click()
    expect(handler).toHaveBeenCalledTimes(1)
  }
})

// The floating layout: the stage reaches every edge, the tools float, and nothing refits under a finger.
const SIZES = [
  [1180, 820],
  [390, 844],
] as const
const resize = async (width: number, height: number): Promise<void> => {
  box.style.width = `${width}px`
  box.style.height = `${height}px`
  await tick()
}
const within = (inner: DOMRect, outer: DOMRect, slack = 0.5): boolean =>
  inner.left >= outer.left - slack &&
  inner.right <= outer.right + slack &&
  inner.top >= outer.top - slack &&
  inner.bottom <= outer.bottom + slack
const clearCell = (): DOMRect => {
  const found = box.querySelector('[data-clear]')
  if (found === null) throw new Error('no clear cell')
  return found.getBoundingClientRect()
}
const pick = async (): Promise<void> => {
  touch(crate(), 'pointerdown', centre(crate()))
  touch(crate(), 'pointerup', centre(crate()))
  await tick()
}

test.each(SIZES)(
  'the stage reaches every edge and the level sits in the clear cell at %i by %i',
  async (w, h) => {
    await resize(w, h)
    await show()
    const edge = box.getBoundingClientRect()
    const s = stage().getBoundingClientRect()
    for (const [got, want] of [
      [s.left, edge.left],
      [s.top, edge.top],
      [s.right, edge.right],
      [s.bottom, edge.bottom],
    ] as const)
      expect(Math.abs(got - want)).toBeLessThanOrEqual(1)
    expect(within(crate().getBoundingClientRect(), clearCell())).toBe(true)
  },
)

test.each(SIZES)('picking a thing does not move the level at %i by %i', async (w, h) => {
  await resize(w, h)
  await show()
  const before = { scale: scale(), at: centre(crate()) }
  await pick()
  expect(crate().getAttribute('aria-pressed')).toBe('true')
  expect(scale()).toBe(before.scale)
  expect(centre(crate())).toEqual(before.at)
})

test('Redo puts back what Undo took, by the button', async () => {
  await show()
  await pick()
  const redoButton = (): HTMLButtonElement => named(WORDS.redo)
  expect(redoButton().disabled).toBe(true)
  const x = (): string | undefined => crate().dataset.x
  expect(x()).toBe('6.5')
  named(WORDS.moveRight).click()
  await tick()
  expect(x()).toBe('7')
  expect(redoButton().disabled).toBe(true)
  named(WORDS.undo).click()
  await tick()
  expect(x()).toBe('6.5')
  expect(redoButton().disabled).toBe(false)
  redoButton().click()
  await tick()
  expect(x()).toBe('7')
  expect(redoButton().disabled).toBe(true)
})

test('the card says where the picked thing is, and its arrows move it', async () => {
  await show()
  expect(box.querySelector('.card')?.textContent).toContain(WORDS.hintIdle)
  await pick()
  const card = box.querySelector('.card')?.textContent ?? ''
  expect(card).toContain(WORDS.noteAcross)
  expect(card).toContain(WORDS.noteDown)
  const numbers = [...(box.querySelectorAll('.card .measure') ?? [])].map((n) => n.textContent)
  expect(numbers).toEqual(['6.5', '7.5'])
  box.querySelector<HTMLButtonElement>('[data-move="right"]')?.click()
  await tick()
  expect(place()).toEqual(['7', '7.5'])
  expect([...box.querySelectorAll('.card .measure')].map((n) => n.textContent)).toEqual(['7', '7.5'])
})

test('a level with a 60-letter name keeps Save whole', async () => {
  const name = 'long-level-name-'.repeat(4).slice(0, 60)
  await resize(390, 844)
  mounted = mount(Levels, {
    target: box,
    props: {
      level,
      characters,
      hero: 'hero',
      canSave: true,
      status: 'dirty' as const,
      statusText: '',
      title: name,
      back: { label: WORDS.back, onpress: () => {} },
      onchange,
      onsave: () => {},
    },
  })
  await tick()
  await vi.waitFor(() => expect(scale()).toBeGreaterThan(0))
  const save = named(WORDS.save).getBoundingClientRect()
  expect(save.right).toBeLessThanOrEqual(390)
  expect(save.left).toBeGreaterThanOrEqual(0)
  expect(save.height).toBeGreaterThanOrEqual(48)
  const heading = box.querySelector('h1') as HTMLElement
  expect(heading.textContent).toBe(name)
  expect(getComputedStyle(heading).textOverflow).not.toBe('ellipsis')
  expect(heading.scrollWidth).toBeLessThanOrEqual(heading.clientWidth + 1)
})

test('read only, nothing floats', async () => {
  mounted = mount(Levels, {
    target: box,
    props: {
      readOnly: true,
      marked: ['crate-1'],
      level,
      characters,
      hero: 'hero',
      canSave: false,
      status: 'clean' as const,
      statusText: '',
      title: 'level-1',
      onchange,
      onsave: () => {},
    },
  })
  await tick()
  await vi.waitFor(() => expect(scale()).toBeGreaterThan(0))
  expect(box.querySelector('.floats')).toBeNull()
  expect(box.querySelector('[data-clear]')).toBeNull()
  const s = stage()
  const fit = fitInside(
    { w: s.clientWidth, h: s.clientHeight },
    { top: 0, right: 0, bottom: 0, left: 0 },
    { w: 16, h: 9 },
  )
  expect(scale()).toBeCloseTo(fit.scale, 3)
})

test.each(SIZES)('saving and the first move after it do not move the level at %i by %i', async (w, h) => {
  await resize(w, h)
  const props = live({
    level,
    characters,
    hero: 'hero',
    canSave: true,
    status: 'dirty' as 'dirty' | 'saved' | 'saving' | 'clean',
    statusText: WORDS.statusDirty as string,
    stamp: undefined as string | undefined,
    title: 'level-1',
    back: { label: WORDS.back, onpress: () => {} },
    onchange,
    onsave: () => {},
  })
  mounted = mount(Levels, { target: box, props })
  await tick()
  await vi.waitFor(() => expect(scale()).toBeGreaterThan(0))
  const before = { scale: scale(), at: centre(crate()), clear: clearCell().toJSON() }
  props.status = 'saved'
  props.statusText = WORDS.savedDirect
  props.stamp = 'Saved by grandma'
  await tick()
  expect(box.querySelector('[data-stamp]')).not.toBeNull()
  expect(scale()).toBe(before.scale)
  expect(centre(crate())).toEqual(before.at)
  expect(clearCell().toJSON()).toEqual(before.clear)
  props.status = 'dirty'
  props.statusText = WORDS.statusDirty
  props.stamp = undefined
  await tick()
  expect(box.querySelector('[data-stamp]')).toBeNull()
  expect(scale()).toBe(before.scale)
  expect(centre(crate())).toEqual(before.at)
})

test('the standing sentence is in the top panel and not over the level', async () => {
  const standing = createRawSnippet(() => ({
    render: () =>
      '<p class="standing">Try anything you like. To save your changes into the game, sign in.</p>',
  }))
  mounted = mount(Levels, {
    target: box,
    props: {
      level,
      characters,
      hero: 'hero',
      canSave: true,
      status: 'dirty' as const,
      statusText: '',
      title: 'level-1',
      standing,
      onchange,
      onsave: () => {},
    },
  })
  await tick()
  await vi.waitFor(() => expect(scale()).toBeGreaterThan(0))
  const sentence = (box.querySelector('.standing') as HTMLElement).getBoundingClientRect()
  const clear = clearCell()
  const meets =
    sentence.left < clear.right &&
    sentence.right > clear.left &&
    sentence.top < clear.bottom &&
    sentence.bottom > clear.top
  expect(meets).toBe(false)
  expect(box.querySelector('.top')?.contains(box.querySelector('.standing'))).toBe(true)
})
