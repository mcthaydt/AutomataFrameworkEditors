// The kit in each real browser: sizes a finger can hit, keys, focus, glass, and a long list that stays short.
import { createRawSnippet, mount, tick, unmount } from 'svelte'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import Button from '#src/features/ui/Button.svelte'
import Dock from '#src/features/ui/Dock.svelte'
import Knob from '#src/features/ui/Knob.svelte'
import Menu from '#src/features/ui/Menu.svelte'
import Note from '#src/features/ui/Note.svelte'
import NumberPad from '#src/features/ui/NumberPad.svelte'
import Rows from '#src/features/ui/Rows.svelte'
import Segment from '#src/features/ui/Segment.svelte'
import Sheet from '#src/features/ui/Sheet.svelte'
import Slider from '#src/features/ui/Slider.svelte'
import Tip from '#src/features/ui/Tip.svelte'
import { snap } from '#src/features/ui/slider.ts'

let box: HTMLDivElement
let mounted: ReturnType<typeof mount> | undefined

beforeEach(() => {
  box = document.createElement('div')
  box.className = 'look'
  box.style.cssText = 'position:fixed;left:0;top:0;width:390px;height:600px'
  document.body.append(box)
})
afterEach(() => {
  if (mounted) void unmount(mounted)
  mounted = undefined
  box.remove()
  delete document.documentElement.dataset.glass
})

const mountIt = async (component: Parameters<typeof mount>[0], props: Record<string, unknown>) => {
  mounted = mount(component, { target: box, props } as never)
  await tick()
}
const words = (text: string) => createRawSnippet(() => ({ render: () => `<p>${text}</p>` }))
const boxes = (selector: string) => [...box.querySelectorAll<HTMLElement>(selector)]

test('every control of the kit is at least 44 by 44, and a primary Button at least 48 tall', async () => {
  await mountIt(Button, { label: 'Put in game', kind: 'primary', onpress: () => {} })
  expect(box.querySelector('button')?.getBoundingClientRect().height).toBeGreaterThanOrEqual(48)
  void unmount(mounted as never)
  await mountIt(Segment, {
    label: 'Zoom',
    options: [
      { id: 'a', words: 'Whole level' },
      { id: 'b', words: 'Close up' },
    ],
    value: 'a',
    onchange: () => {},
  })
  for (const el of boxes('button, [role=radio]')) {
    const r = el.getBoundingClientRect()
    expect(r.height, el.textContent ?? '').toBeGreaterThanOrEqual(44)
    expect(r.width, el.textContent ?? '').toBeGreaterThanOrEqual(44)
  }
  void unmount(mounted as never)
  await mountIt(Knob, { on: true, label: 'Lock', onchange: () => {} })
  const knob = box.querySelector('[role=switch]')?.getBoundingClientRect()
  expect(knob?.height).toBeGreaterThanOrEqual(44)
  expect(knob?.width).toBeGreaterThanOrEqual(44)
  void unmount(mounted as never)
  await mountIt(Slider, { value: 1, least: 0, most: 4, step: 0.5, label: 'How heavy', onchange: () => {} })
  expect(box.querySelector('input')?.getBoundingClientRect().height).toBeGreaterThanOrEqual(44)
})

test('snap keeps a value between least and most, on a step', () => {
  expect(snap(9, 0, 4, 0.5)).toBe(4)
  expect(snap(-3, 0, 4, 0.5)).toBe(0)
  expect(snap(1.3, 0, 4, 0.5)).toBe(1.5)
  expect(snap(0.1 + 0.2, 0, 1, 0.1)).toBe(0.3)
  expect(snap(Number.NaN, 0, 4, 0.5)).toBe(0)
})

test('Slider never gives a value outside its limits or off its step (keys, Home, End)', async () => {
  const seen: number[] = []
  await mountIt(Slider, { value: 1, least: 0, most: 4, step: 0.5, label: 'How heavy', onchange: (n: number) => seen.push(n) })
  const input = box.querySelector('input') as HTMLInputElement
  input.focus()
  await userEvent.keyboard('{ArrowRight}')
  await userEvent.keyboard('{End}')
  await userEvent.keyboard('{ArrowRight}')
  await userEvent.keyboard('{Home}')
  await userEvent.keyboard('{ArrowLeft}')
  expect(seen.length).toBeGreaterThan(0)
  for (const n of seen) {
    expect(n).toBeGreaterThanOrEqual(0)
    expect(n).toBeLessThanOrEqual(4)
    expect((n * 2) % 1).toBe(0)
  }
  expect(seen).toContain(4)
  expect(seen).toContain(0)
})

test('Slider dragged past both ends stays inside', async () => {
  const seen: number[] = []
  await mountIt(Slider, { value: 2, least: 0, most: 4, step: 0.5, label: 'How heavy', onchange: (n: number) => seen.push(n) })
  const input = box.querySelector('input') as HTMLInputElement
  const r = input.getBoundingClientRect()
  await userEvent.pointer([
    { keys: '[MouseLeft>]', target: input, coords: { x: r.width / 2, y: r.height / 2 } },
    { coords: { x: r.width + 80, y: r.height / 2 } },
    { coords: { x: -80, y: r.height / 2 } },
    { keys: '[/MouseLeft]' },
  ])
  for (const n of seen) {
    expect(n).toBeGreaterThanOrEqual(0)
    expect(n).toBeLessThanOrEqual(4)
  }
})

test('NumberPad: plus and minus stop at the limits, and its field is a decimal input', async () => {
  const seen: number[] = []
  await mountIt(NumberPad, { value: 3.5, least: 0.5, most: 4, step: 0.5, onchange: (n: number) => seen.push(n), onclose: () => {} })
  const field = box.querySelector('input') as HTMLInputElement
  expect(field.getAttribute('inputmode')).toBe('decimal')
  const plus = box.querySelector<HTMLButtonElement>('button[data-step="up"]')
  const minus = box.querySelector<HTMLButtonElement>('button[data-step="down"]')
  plus?.click()
  plus?.click()
  expect(seen.at(-1)).toBe(4)
  for (let i = 0; i < 10; i += 1) minus?.click()
  expect(seen.at(-1)).toBe(0.5)
  await userEvent.fill(field, '99')
  await userEvent.keyboard('{Enter}')
  expect(seen.at(-1)).toBe(4)
})

test('Sheet closes on its button and on Escape, and gives focus back to what opened it', async () => {
  const opener = document.createElement('button')
  opener.textContent = 'Open'
  document.body.append(opener)
  opener.focus()
  const onclose = vi.fn()
  await mountIt(Sheet, { title: 'Settings', close: 'Close', onclose, children: words('Hello') })
  expect(box.querySelector('[role=dialog]')).not.toBeNull()
  expect(box.querySelector('h2')?.textContent).toBe('Settings')
  await userEvent.keyboard('{Escape}')
  expect(onclose).toHaveBeenCalledTimes(1)
  box.querySelector<HTMLButtonElement>('[data-close]')?.click()
  expect(onclose).toHaveBeenCalledTimes(2)
  void unmount(mounted as never)
  mounted = undefined
  await tick()
  expect(document.activeElement).toBe(opener)
  opener.remove()
})

test('Menu moves with the arrow keys, picks with Enter, and a row that is off says why and cannot be picked', async () => {
  const picked: string[] = []
  await mountIt(Menu, {
    items: [
      { id: 'move', words: 'Move' },
      { id: 'start', words: 'Make a copy', off: 'A level has one Start' },
      { id: 'delete', words: 'Delete' },
    ],
    onpick: (id: string) => picked.push(id),
    onclose: () => {},
  })
  expect(box.textContent).toContain('A level has one Start')
  const items = boxes('[role=menuitem]')
  items[0]?.focus()
  await userEvent.keyboard('{ArrowDown}')
  await userEvent.keyboard('{ArrowDown}')
  expect(document.activeElement?.textContent).toContain('Delete')
  await userEvent.keyboard('{Enter}')
  expect(picked).toEqual(['delete'])
  items[1]?.click()
  expect(picked).toEqual(['delete'])
  expect(items[1]?.getAttribute('aria-disabled')).toBe('true')
})

test('glass is solid when the settings or the device say so', async () => {
  await mountIt(Dock, { label: 'Top', children: words('Top bar') })
  const dock = box.querySelector('.dock') as HTMLElement
  const filter = () => getComputedStyle(dock).backdropFilter
  document.documentElement.dataset.glass = 'on'
  await tick()
  const on = filter()
  document.documentElement.dataset.glass = 'off'
  await tick()
  expect(filter()).toBe('none')
  expect(on === 'none').toBe(false)
})

test('Rows with 5,000 rows keeps fewer than 100 in the page, and scrolling brings the later ones', async () => {
  box.style.height = '440px'
  const row = createRawSnippet<[number]>((index) => ({ render: () => `<div class="r">Row ${index()}</div>` }))
  await mountIt(Rows, { count: 5000, height: 44, label: 'Things', row })
  expect(boxes('.r').length).toBeLessThan(100)
  expect(boxes('.r').length).toBeGreaterThan(5)
  const list = box.querySelector('[role=list]') as HTMLElement
  list.scrollTop = 44 * 4000
  list.dispatchEvent(new Event('scroll'))
  await tick()
  await new Promise((done) => requestAnimationFrame(() => done(undefined)))
  const text = boxes('.r').map((r) => r.textContent)
  expect(text.some((t) => t === 'Row 4000')).toBe(true)
  expect(boxes('.r').length).toBeLessThan(100)
})

test('Note says what happened with one button, and Tip stands on its own with one', async () => {
  const pressed = vi.fn()
  await mountIt(Note, { words: 'Moved Crate 1', button: 'Undo', onpress: pressed })
  expect(box.querySelector('[role=status]')?.textContent).toContain('Moved Crate 1')
  box.querySelector('button')?.click()
  expect(pressed).toHaveBeenCalledTimes(1)
  void unmount(mounted as never)
  const got = vi.fn()
  await mountIt(Tip, { words: 'Tap the crate to pick it.', gotIt: 'Got it', ongotit: got })
  expect(box.textContent).toContain('Tap the crate')
  box.querySelector('button')?.click()
  expect(got).toHaveBeenCalledTimes(1)
})
