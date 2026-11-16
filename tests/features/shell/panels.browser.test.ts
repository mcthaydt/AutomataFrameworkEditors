// The toolbar, the list, the settings and the free thumb's buttons in each real browser: sizes a finger can hit, panels
// that fold and come back, a long list that stays short, and hold buttons on the other side for a left hand.
import { createRawSnippet, mount, tick, unmount } from 'svelte'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { Hold, ListPanel, SettingsPanel, Toolbar } from '#src/features/shell/shell.ts'
import { WORLD } from '../../fixtures/shell.ts'

let box: HTMLDivElement
let mounted: ReturnType<typeof mount> | undefined

beforeEach(() => {
  box = document.createElement('div')
  box.className = 'look'
  box.style.cssText = 'position:fixed;left:0;top:0;width:1000px;height:700px'
  document.body.append(box)
})
afterEach(() => {
  if (mounted) void unmount(mounted)
  mounted = undefined
  box.remove()
})

async function put(component: unknown, props: Record<string, unknown>) {
  const args = { target: box, props }
  mounted = mount(component as never, args as never)
  await tick()
}
const text = (words: string) => createRawSnippet(() => ({ render: () => `<p>${words}</p>` }))
const row = createRawSnippet((at: () => number) => ({ render: () => `<span class="r">Thing ${at()}</span>` }))
const hit = (el: Element) => el.getBoundingClientRect()

const toolbar = {
  workspace: WORLD,
  lang: 'en',
  tool: 'pick',
  side: 'bottom',
  keys: false,
  undoHere: false,
  canUndo: false,
  canRedo: false,
  onpick: () => {},
  onundo: () => {},
  onredo: () => {},
}

test('the toolbar draws only the tools this editor has a job for, each at least 44 by 44', async () => {
  await put(Toolbar, toolbar)
  const names = [...box.querySelectorAll('.tool')].map((el) => el.textContent?.trim())
  expect(names).toEqual(['Pick', 'Place', 'Erase'])
  for (const el of box.querySelectorAll('button')) {
    expect(hit(el).width).toBeGreaterThanOrEqual(44)
    expect(hit(el).height).toBeGreaterThanOrEqual(44)
  }
})

test('picking a tool says which, and the picked one is marked', async () => {
  const seen: string[] = []
  await put(Toolbar, { ...toolbar, onpick: (tool: string) => seen.push(tool) })
  const pick = [...box.querySelectorAll('button')]
  expect(pick[0]?.getAttribute('aria-pressed')).toBe('true')
  await userEvent.click(pick[2] as HTMLElement)
  expect(seen).toEqual(['erase'])
})

test('down the left edge the tools are a column, along the bottom a row; a computer shows each key', async () => {
  await put(Toolbar, { ...toolbar, side: 'left' })
  const [first, second] = [...box.querySelectorAll('.tool')]
  expect(hit(second as Element).top).toBeGreaterThan(hit(first as Element).top)
  expect(hit(second as Element).left).toBe(hit(first as Element).left)
  unmount(mounted as never)
  await put(Toolbar, { ...toolbar, keys: true })
  const [a, b] = [...box.querySelectorAll('.tool')]
  expect(hit(b as Element).left).toBeGreaterThan(hit(a as Element).left)
  expect(a?.querySelector('kbd')?.textContent).toBe('V')
})

test('an upright phone has Undo and Redo in the toolbar, and Undo says it cannot act with nothing to undo', async () => {
  const seen: string[] = []
  await put(Toolbar, { ...toolbar, undoHere: true, onundo: () => seen.push('undo') })
  const undo = box.querySelector('[aria-label=Undo]') as HTMLElement
  expect(undo.getAttribute('aria-disabled')).toBe('true')
  await userEvent.click(undo)
  expect(seen).toEqual([])
})

const list = {
  lang: 'en',
  mode: 'beside',
  tab: 'list',
  name: 'In this level',
  count: 3,
  rowHeight: 44,
  row,
  onopen: () => {},
  onhide: () => {},
}

test('shut to a rail the list has a List button, and an Add button only when there are things to add', async () => {
  await put(ListPanel, { ...list, mode: 'rail' })
  expect([...box.querySelectorAll('button')].map((b) => b.textContent?.trim())).toEqual(['List'])
  unmount(mounted as never)
  await put(ListPanel, { ...list, mode: 'rail', add: text('things') })
  expect([...box.querySelectorAll('button')].map((b) => b.textContent?.trim())).toEqual(['List', 'Add'])
  for (const el of box.querySelectorAll('button')) expect(hit(el).height).toBeGreaterThanOrEqual(44)
})

test('open, the list has its rows at the height it was given, and a way to hide it', async () => {
  const seen: string[] = []
  await put(ListPanel, { ...list, rowHeight: 30, onhide: () => seen.push('hide') })
  const rows = [...box.querySelectorAll('[role=listitem]')]
  expect(rows.length).toBe(3)
  for (const el of rows) expect(hit(el).height).toBe(30)
  await userEvent.click(box.querySelector('[aria-label="Hide the list"]') as HTMLElement)
  expect(seen).toEqual(['hide'])
})

test('a level of 1,024 things draws fewer than 100 rows', async () => {
  await put(ListPanel, { ...list, count: 1024 })
  expect(box.querySelectorAll('[role=listitem]').length).toBeLessThan(100)
  expect(box.querySelectorAll('[role=listitem]').length).toBeGreaterThan(0)
})

test('the Add tab shows the things to add instead of the list', async () => {
  await put(ListPanel, { ...list, tab: 'add', add: text('Crates and flags') })
  expect(box.textContent).toContain('Crates and flags')
  expect(box.querySelectorAll('[role=listitem]').length).toBe(0)
})

const settings = {
  lang: 'en',
  mode: 'side',
  name: 'Crate 1',
  onhide: () => {},
  onshow: () => {},
  children: text('Where it is'),
}

test('a picked thing shows its settings, Hide folds them to a tab with its name, and a tap brings them back', async () => {
  const seen: string[] = []
  const props = { ...settings, onhide: () => seen.push('hide'), onshow: () => seen.push('show') }
  await put(SettingsPanel, props)
  expect(box.textContent).toContain('Where it is')
  await userEvent.click(box.querySelector('[aria-label="Hide the settings"]') as HTMLElement)
  unmount(mounted as never)
  await put(SettingsPanel, { ...props, mode: 'tab' })
  const tab = box.querySelector('button') as HTMLElement
  expect(tab.textContent).toContain('Crate 1 · settings')
  expect(hit(tab).width).toBeGreaterThanOrEqual(44)
  expect(box.textContent).not.toContain('Where it is')
  await userEvent.click(tab)
  expect(seen).toEqual(['hide', 'show'])
})

test('on a small screen the settings are a bar that pulls up into a sheet closed with Done', async () => {
  const seen: string[] = []
  const props = { ...settings, onhide: () => seen.push('done'), onshow: () => seen.push('open') }
  await put(SettingsPanel, { ...props, mode: 'bar' })
  expect(box.textContent).toContain('Crate 1 · settings')
  await userEvent.click(box.querySelector('button') as HTMLElement)
  unmount(mounted as never)
  await put(SettingsPanel, { ...props, mode: 'sheet' })
  expect(box.textContent).toContain('Where it is')
  const done = [...box.querySelectorAll('button')].find((b) => b.textContent?.includes('Done'))
  await userEvent.click(done as HTMLElement)
  expect(seen).toEqual(['open', 'done'])
})

const buttons = [
  { id: 'several', icon: 'plus-circle', words: 'pickSeveral' },
  { id: 'copy', icon: 'copy', words: 'dragCopy' },
]
const hold = { lang: 'en', buttons, touch: true, open: true, onhold: () => {}, ontoggle: () => {} }

test("the free thumb's buttons are drawn on a touch screen only", async () => {
  await put(Hold, { ...hold, touch: false })
  expect(box.querySelector('button')).toBeNull()
})

test("the free thumb's buttons are at least 44 by 44, and fold away behind one button", async () => {
  await put(Hold, hold)
  const all = [...box.querySelectorAll('button')]
  expect(all.length).toBe(3)
  for (const el of all) {
    expect(hit(el).width).toBeGreaterThanOrEqual(44)
    expect(hit(el).height).toBeGreaterThanOrEqual(44)
  }
  unmount(mounted as never)
  await put(Hold, { ...hold, open: false })
  expect(box.querySelectorAll('button').length).toBe(1)
})

test('a quick tap keeps a hold button on until it is tapped again, and a key press does the same', async () => {
  const seen: string[] = []
  await put(Hold, { ...hold, onhold: (id: string, held: boolean) => seen.push(`${id}:${held}`) })
  const first = box.querySelectorAll('.button')[0] as HTMLElement
  first.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
  first.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
  await tick()
  expect(first.getAttribute('aria-pressed')).toBe('true')
  first.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
  first.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
  await tick()
  expect(first.getAttribute('aria-pressed')).toBe('false')
  const second = box.querySelectorAll('.button')[1] as HTMLElement
  second.focus()
  await userEvent.keyboard(' ')
  expect(second.getAttribute('aria-pressed')).toBe('true')
  expect(seen.at(-1)).toBe('copy:true')
})

test('with a left hand the hold buttons are on the other side', async () => {
  await put(Hold, hold)
  const right = hit(box.querySelector('[role=group]') as Element).left
  unmount(mounted as never)
  await put(Hold, { ...hold, mirror: true })
  const left = hit(box.querySelector('[role=group]') as Element).left
  expect(right).toBeLessThan(500)
  expect(left).toBeGreaterThan(500)
})
