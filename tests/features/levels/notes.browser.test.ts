// The drawing notes in each real browser: what they say, where they sit, what they do when pressed, and that they never
// touch the game's picture.
import type { Character, Level } from '@automataframework/framework/headless'
import { mount, tick, unmount } from 'svelte'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { type LevelEdit, Levels, type NotesMode } from '#src/features/levels/levels.ts'
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
const edits: LevelEdit[] = []

/** `width` by `height` of page for the editor; the iPad upright unless a test says otherwise. */
function sized(width: number, height: number): void {
  box.style.cssText = `position:fixed;left:0;top:0;width:${width}px;height:${height}px;display:flex;flex-direction:column`
}
beforeEach(() => {
  box = document.createElement('div')
  sized(820, 1180)
  document.body.append(box)
  edits.length = 0
})
afterEach(() => {
  if (mounted) void unmount(mounted)
  mounted = undefined
  box.remove()
})

interface Over {
  notes?: NotesMode
  readOnly?: boolean
  marked?: string[]
  characters?: Record<string, Character>
}
const props = (over: Over = {}) =>
  live({
    level,
    characters: over.characters ?? characters,
    hero: 'hero',
    canSave: true,
    status: 'dirty' as const,
    statusText: 'Nothing has changed yet.',
    title: 'level-1',
    notes: over.notes ?? ('on' as NotesMode),
    readOnly: over.readOnly ?? false,
    marked: over.marked ?? [],
    onchange: (edit: LevelEdit) => edits.push(edit),
    onsave: () => {},
  })

async function show(over: Over = {}): Promise<ReturnType<typeof props>> {
  const p = props(over)
  mounted = mount(Levels, { target: box, props: p })
  await tick()
  await vi.waitFor(() => expect(Number(stage().dataset.scale)).toBeGreaterThan(0))
  return p
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
const note = (axis: 'x' | 'y'): HTMLButtonElement | null =>
  box.querySelector<HTMLButtonElement>(`[data-note="${axis}"]`)
const named = (label: string): HTMLButtonElement => {
  const found = [...box.querySelectorAll('button')].find((b) => b.textContent?.trim() === label)
  if (!found) throw new Error(`no button ${label}`)
  return found
}
const centre = (el: Element): { x: number; y: number } => {
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}
const touch = (el: Element, type: string, at: { x: number; y: number }): void => {
  el.dispatchEvent(
    new PointerEvent(type, {
      pointerId: 1,
      pointerType: 'touch',
      isPrimary: true,
      clientX: at.x,
      clientY: at.y,
      bubbles: true,
      cancelable: true,
    }),
  )
}
/** Taps the crate: a press and a lift in the same place. */
async function pick(): Promise<void> {
  touch(crate(), 'pointerdown', centre(crate()))
  touch(crate(), 'pointerup', centre(crate()))
  await tick()
  await vi.waitFor(() => expect(note('x')).not.toBeNull())
}
const wholePicture = (): string => {
  const canvas = stage().querySelector('canvas')
  if (canvas === null) throw new Error('no picture')
  return canvas.toDataURL()
}
/** Waits for Pixi to have drawn the level once: the picture is not blank. */
const drawn = (): Promise<void> =>
  vi.waitFor(() => {
    const canvas = stage().querySelector('canvas')
    expect(canvas).not.toBeNull()
    expect(wholePicture().length).toBeGreaterThan(2000)
  })
const overlaps = (a: DOMRect, b: DOMRect): boolean =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
const GROUND = 'rgb(37, 49, 34)'
const TOUCH = 'rgb(238, 180, 128)'

test('picking the crate writes Across 6.5 tiles and Down 7.5 tiles beside it', async () => {
  await show()
  await pick()
  expect(note('x')?.textContent).toContain(WORDS.noteAcross)
  expect(note('x')?.textContent).toContain('6.5 tiles')
  expect(note('y')?.textContent).toContain(WORDS.noteDown)
  expect(note('y')?.textContent).toContain('7.5 tiles')
  // Beside it, not on it.
  expect(overlaps(note('x')?.getBoundingClientRect() as DOMRect, crate().getBoundingClientRect())).toBe(false)
})

test('nothing picked has a grid and no notes', async () => {
  await show()
  expect(box.querySelector('.notes svg')).not.toBeNull()
  expect(note('x')).toBeNull()
  expect(box.querySelectorAll('.stroke').length).toBe(0)
})

test('the numbers follow the arrows', async () => {
  await show()
  await pick()
  named(WORDS.moveRight).click()
  await tick()
  await vi.waitFor(() => expect(note('x')?.textContent).toContain('7 tiles'))
})

test('pressing the Across note puts the focus on Move left, and Down on Move up', async () => {
  await show()
  await pick()
  note('x')?.click()
  await tick()
  expect(document.activeElement).toBe(named(WORDS.moveLeft))
  note('y')?.click()
  await tick()
  expect(document.activeElement).toBe(named(WORDS.moveUp))
})

test('pressing a note by touch marks its pair of arrows in the card, in view, until the next press', async () => {
  await show()
  await pick()
  const card = box.querySelector<HTMLElement>('.card')
  note('y')?.click()
  await tick()
  expect(card?.dataset.asked).toBe('y')
  const up = getComputedStyle(named(WORDS.moveUp))
  expect(up.outlineStyle).toBe('solid')
  expect(up.outlineWidth).toBe('3px')
  const view = window.innerHeight
  for (const label of [WORDS.moveUp, WORDS.moveDown]) {
    const r = named(label).getBoundingClientRect()
    expect(r.top).toBeGreaterThanOrEqual(0)
    expect(r.bottom).toBeLessThanOrEqual(view)
  }
  // The other pair is not marked.
  expect(getComputedStyle(named(WORDS.moveLeft)).outlineWidth).not.toBe('3px')
  touch(named(WORDS.moveUp), 'pointerdown', centre(named(WORDS.moveUp)))
  await tick()
  expect(card?.dataset.asked).toBeUndefined()
})

test('a note is named for a screen reader', async () => {
  await show()
  await pick()
  expect(note('x')?.getAttribute('aria-label')).toBe('Across 6.5 tiles. Press to change it.')
  expect(note('y')?.getAttribute('aria-label')).toBe('Down 7.5 tiles. Press to change it.')
})

test('faded is 35% and hidden is not drawn, and the ring stays in both', async () => {
  const p = await show()
  await pick()
  expect(box.querySelector('.notes')?.getAttribute('data-notes')).toBe('on')
  p.notes = 'faded'
  await tick()
  const faded = box.querySelector('.notes')
  expect(faded?.getAttribute('data-notes')).toBe('faded')
  expect(getComputedStyle(faded?.querySelector('.art') as Element).opacity).toBe('0.35')
  expect(getComputedStyle(crate()).outlineStyle).toBe('dashed')
  p.notes = 'hidden'
  await tick()
  expect(box.querySelector('.notes')).toBeNull()
  expect(getComputedStyle(crate()).outlineStyle).toBe('dashed')
  expect(getComputedStyle(crate()).outlineColor).toBe(TOUCH)
})

test('the notes change nothing in the picture', async () => {
  const p = await show()
  await drawn()
  const nothing = wholePicture()
  await pick()
  for (const mode of ['on', 'faded', 'hidden'] as const) {
    p.notes = mode
    await tick()
    expect(wholePicture()).toBe(nothing)
  }
})

test('a crate the colour of the ring is still ringed', async () => {
  const same = { ...characters, crate: { ...(characters.crate as Character), color: '#eeb480' } }
  await show({ characters: same })
  await pick()
  const style = getComputedStyle(crate())
  expect(style.outlineStyle).toBe('dashed')
  expect(style.outlineColor).toBe(TOUCH)
  expect(style.borderTopColor).toBe(GROUND)
  expect(style.borderTopWidth).toBe('2px')
})

test('in a clear cell under 30rem there is one note with both numbers', async () => {
  sized(390, 844)
  await show()
  await pick()
  expect(box.querySelectorAll('.note').length).toBe(1)
  const text = note('x')?.textContent ?? ''
  expect(text).toContain('6.5 tiles')
  expect(text).toContain('7.5 tiles')
  expect(note('y')).toBeNull()
})

test('a note is at least 44 px tall', async () => {
  await show()
  await pick()
  for (const axis of ['x', 'y'] as const) {
    expect(note(axis)?.getBoundingClientRect().height).toBeGreaterThanOrEqual(44)
  }
})

test('read only, there is a grid and a ring on the marked thing and no note', async () => {
  await show({ readOnly: true, marked: ['crate-1'] })
  expect(box.querySelector('.notes svg line')).not.toBeNull()
  expect(box.querySelectorAll('.note').length).toBe(0)
  expect(crate().hasAttribute('data-marked')).toBe(true)
  expect(getComputedStyle(crate()).outlineStyle).toBe('dashed')
  expect(getComputedStyle(crate()).outlineColor).toBe(TOUCH)
  touch(crate(), 'pointerdown', centre(crate()))
  await tick()
  expect(box.querySelectorAll('.note').length).toBe(0)
})

test('the lines draw in and the notes fade in', async () => {
  await show()
  await pick()
  const stroke = box.querySelector('.stroke')
  expect(stroke).not.toBeNull()
  expect(getComputedStyle(stroke as Element).animationName).toMatch(/draw$/)
  expect(getComputedStyle(box.querySelector('.block') as Element).animationName).toMatch(/fade$/)
})

test("a note is above another thing's button", async () => {
  await show()
  await pick()
  // The hero stands near the crate; whichever button is under a note's middle, the note is on top.
  for (const axis of ['x', 'y'] as const) {
    const el = note(axis) as HTMLElement
    const at = centre(el)
    expect(document.elementFromPoint(at.x, at.y)?.closest('.note')).toBe(el)
  }
})

test('letting go fades the notes out and then takes them away', async () => {
  await show()
  await pick()
  const s = stage().getBoundingClientRect()
  touch(stage(), 'pointerdown', { x: s.left + 5, y: s.top + 5 })
  await tick()
  await vi.waitFor(() => expect(note('x')).toBeNull(), { timeout: 2000 })
})
