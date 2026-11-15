// The three UI pieces in each real browser: sizes a finger can hit, keyboard use, roles and focus.
import { createRawSnippet, mount, tick, unmount } from 'svelte'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { Button, Notice, Screen } from '#src/features/ui/ui.ts'

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
