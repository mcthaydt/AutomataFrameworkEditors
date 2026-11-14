// The three UI pieces in each real browser: sizes a finger can hit, keyboard use, roles and focus.
import { createRawSnippet, mount, tick, unmount } from 'svelte'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { Button, Choice, Notice, Screen, Stamp, Tool } from '#src/features/ui/ui.ts'

let box: HTMLDivElement
let mounted: ReturnType<typeof mount> | undefined

beforeEach(() => {
  box = document.createElement('div')
  box.style.cssText = 'position:fixed;left:0;top:0;width:390px'
  document.body.append(box)
})
afterEach(() => {
  if (mounted) void unmount(mounted)
  mounted = undefined
  box.remove()
})

const button = (): HTMLButtonElement => {
  const found = box.querySelector('button')
  if (!found) throw new Error('no button')
  return found
}

test('a primary Button is at least 48 tall and 44 wide', async () => {
  mounted = mount(Button, { target: box, props: { label: 'Save', kind: 'primary', onpress: () => {} } })
  await tick()
  const rect = button().getBoundingClientRect()
  expect(rect.height).toBeGreaterThanOrEqual(48)
  expect(rect.width).toBeGreaterThanOrEqual(44)
})

test('a plain and a danger Button are at least 44 by 44, and plain is the default', async () => {
  for (const kind of [undefined, 'plain', 'danger'] as const) {
    mounted = mount(Button, {
      target: box,
      props: { label: 'Go', ...(kind ? { kind } : {}), onpress: () => {} },
    })
    await tick()
    const rect = button().getBoundingClientRect()
    expect(rect.height).toBeGreaterThanOrEqual(44)
    expect(rect.width).toBeGreaterThanOrEqual(44)
    void unmount(mounted)
    mounted = undefined
    box.replaceChildren()
  }
})

test('pressing a disabled Button does not call onpress', async () => {
  const onpress = vi.fn()
  mounted = mount(Button, { target: box, props: { label: 'Save', disabled: true, onpress } })
  await tick()
  button().click()
  expect(button().disabled).toBe(true)
  expect(onpress).not.toHaveBeenCalled()
})

test('Enter and Space on a focused Button each call it once', async () => {
  const onpress = vi.fn()
  mounted = mount(Button, { target: box, props: { label: 'Save', onpress } })
  await tick()
  button().focus()
  await userEvent.keyboard('{Enter}')
  expect(onpress).toHaveBeenCalledTimes(1)
  await userEvent.keyboard(' ')
  expect(onpress).toHaveBeenCalledTimes(2)
})

test('a Button is a real button that does not submit a form', async () => {
  mounted = mount(Button, { target: box, props: { label: 'Save', onpress: () => {} } })
  await tick()
  expect(button().getAttribute('type')).toBe('button')
})

test('a Button with a 60-letter label wraps inside its box', async () => {
  const label = 'Keep going with this long button label that wraps onto lines'
  mounted = mount(Button, { target: box, props: { label, onpress: () => {} } })
  await tick()
  const rect = button().getBoundingClientRect()
  const edge = box.getBoundingClientRect()
  expect(rect.right).toBeLessThanOrEqual(edge.right)
  expect(rect.left).toBeGreaterThanOrEqual(edge.left)
})

test('a Button whose label is one 60-letter word still stays inside the box', async () => {
  mounted = mount(Button, { target: box, props: { label: 'w'.repeat(60), onpress: () => {} } })
  await tick()
  const rect = button().getBoundingClientRect()
  expect(rect.right).toBeLessThanOrEqual(box.getBoundingClientRect().right)
})

test('a problem Notice is an alert and the others are status', async () => {
  const roles: Record<string, string | null> = {}
  for (const kind of ['info', 'good', 'problem'] as const) {
    mounted = mount(Notice, { target: box, props: { kind, text: 'Hello' } })
    await tick()
    roles[kind] = box.querySelector('[role]')?.getAttribute('role') ?? null
    void unmount(mounted)
    mounted = undefined
    box.replaceChildren()
  }
  expect(roles).toEqual({ info: 'status', good: 'status', problem: 'alert' })
})

test('a Notice shows its kind as a word as well as a colour', async () => {
  mounted = mount(Notice, { target: box, props: { kind: 'problem', text: 'Nope' } })
  await tick()
  expect(box.textContent).toMatch(/Problem/i)
  expect(box.textContent).toContain('Nope')
})

test('a Screen has one h1, and it has the focus after it appears', async () => {
  const children = createRawSnippet(() => ({ render: () => '<p>Body</p>' }))
  mounted = mount(Screen, { target: box, props: { title: 'Pick a game', children } })
  await tick()
  const headings = box.querySelectorAll('h1')
  expect(headings).toHaveLength(1)
  expect(headings[0]?.textContent).toBe('Pick a game')
  expect(document.activeElement).toBe(headings[0])
  expect(box.textContent).toContain('Body')
})

test('a Screen with a back Button calls it', async () => {
  const onpress = vi.fn()
  const children = createRawSnippet(() => ({ render: () => '<p>Body</p>' }))
  mounted = mount(Screen, {
    target: box,
    props: { title: 'Game', back: { label: 'Back', onpress }, children },
  })
  await tick()
  const back = [...box.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Back')
  expect(back).toBeDefined()
  back?.click()
  expect(onpress).toHaveBeenCalledTimes(1)
})

// The look: the colours and corners every piece wears, as the browser computes them (the six are named in ui.css).
const GROUND = 'rgb(37, 49, 34)'
const TOUCH = 'rgb(238, 180, 128)'
const RAISED = 'rgb(49, 60, 44)'
const MARK = 'rgb(131, 126, 49)'
const style = (element: Element) => getComputedStyle(element)

test('a Button with an icon shows the icon before its words, and is named by its words alone', async () => {
  mounted = mount(Button, { target: box, props: { label: 'Save', icon: 'save', onpress: () => {} } })
  await tick()
  const icon = button().querySelector('.icon')
  expect(icon?.getAttribute('aria-hidden')).toBe('true')
  expect(icon?.querySelector('svg')).not.toBeNull()
  // The icon comes first, and holds no text, so the button's name is its label and nothing else.
  expect(button().firstElementChild).toBe(icon)
  expect(button().textContent?.trim()).toBe('Save')
})

test('a primary Button is touch with ground words', async () => {
  mounted = mount(Button, { target: box, props: { label: 'Save', kind: 'primary', onpress: () => {} } })
  await tick()
  expect(style(button()).backgroundColor).toBe(TOUCH)
  expect(style(button()).color).toBe(GROUND)
})

test("a plain Button's words are touch on raised", async () => {
  mounted = mount(Button, { target: box, props: { label: 'Go', onpress: () => {} } })
  await tick()
  expect(style(button()).backgroundColor).toBe(RAISED)
  expect(style(button()).color).toBe(TOUCH)
})

test('a danger Button has a mark edge on the ground', async () => {
  mounted = mount(Button, { target: box, props: { label: 'Remove', kind: 'danger', onpress: () => {} } })
  await tick()
  expect(style(button()).backgroundColor).toBe(GROUND)
  expect(style(button()).borderTopColor).toBe(MARK)
  expect(style(button()).borderTopWidth).toBe('2px')
  expect(style(button()).color).toBe(TOUCH)
})

test('a Tool is at least 56 by 56 and its word is at least 13 px, in capitals', async () => {
  const onpress = vi.fn()
  mounted = mount(Tool, { target: box, props: { label: 'Undo', icon: 'undo', onpress } })
  await tick()
  const rect = button().getBoundingClientRect()
  expect(rect.width).toBeGreaterThanOrEqual(56)
  expect(rect.height).toBeGreaterThanOrEqual(56)
  const word = button().querySelector('.label')
  expect(word).not.toBeNull()
  expect(Number.parseFloat(style(word as Element).fontSize)).toBeGreaterThanOrEqual(13)
  expect(style(word as Element).textTransform).toBe('uppercase')
  expect(button().textContent?.trim()).toBe('Undo')
  button().click()
  expect(onpress).toHaveBeenCalledTimes(1)
})

test("a Notice's icon is an svg and its kind is still a word", async () => {
  for (const kind of ['info', 'good', 'problem'] as const) {
    mounted = mount(Notice, { target: box, props: { kind, text: 'Hello' } })
    await tick()
    expect(box.querySelector('.icon svg')).not.toBeNull()
    expect(box.querySelector('.kind')?.textContent).toMatch(/\w/)
    void unmount(mounted)
    mounted = undefined
    box.replaceChildren()
  }
})

test('a problem Notice has a mark edge on the ground; the others are raised', async () => {
  mounted = mount(Notice, { target: box, props: { kind: 'problem', text: 'Nope' } })
  await tick()
  const problem = box.querySelector('.notice') as Element
  expect(style(problem).backgroundColor).toBe(GROUND)
  expect(style(problem).borderTopColor).toBe(MARK)
  void unmount(mounted)
  mounted = undefined
  box.replaceChildren()
  mounted = mount(Notice, { target: box, props: { kind: 'info', text: 'Hi' } })
  await tick()
  expect(style(box.querySelector('.notice') as Element).backgroundColor).toBe(RAISED)
})

test('a Stamp with a 39-letter name stays inside 390 px and is hidden from a screen reader', async () => {
  mounted = mount(Stamp, { target: box, props: { text: `Saved by ${'g'.repeat(39)}` } })
  await tick()
  const stamp = box.querySelector('[data-stamp]') as HTMLElement
  expect(stamp.getAttribute('aria-hidden')).toBe('true')
  const rect = stamp.getBoundingClientRect()
  const edge = box.getBoundingClientRect()
  expect(rect.left).toBeGreaterThanOrEqual(edge.left)
  expect(rect.right).toBeLessThanOrEqual(edge.right)
})

test('every corner is 2 px', async () => {
  const pieces: Array<[string, () => void]> = [
    ['.button', () => (mounted = mount(Button, { target: box, props: { label: 'Go', onpress: () => {} } }))],
    [
      '.tool',
      () => (mounted = mount(Tool, { target: box, props: { label: 'Go', icon: 'undo', onpress: () => {} } })),
    ],
    ['.notice', () => (mounted = mount(Notice, { target: box, props: { kind: 'info', text: 'Hi' } }))],
    ['.stamp', () => (mounted = mount(Stamp, { target: box, props: { text: 'Saved' } }))],
    [
      '.row',
      () =>
        (mounted = mount(Choice, {
          target: box,
          props: { label: 'Who', options: [{ value: 'a', label: 'A' }], value: 'a', onchange: () => {} },
        })),
    ],
  ]
  for (const [selector, make] of pieces) {
    make()
    await tick()
    const found = box.querySelector(selector)
    expect(found, selector).not.toBeNull()
    expect(style(found as Element).borderTopLeftRadius, selector).toBe('2px')
    void unmount(mounted as ReturnType<typeof mount>)
    mounted = undefined
    box.replaceChildren()
  }
})
