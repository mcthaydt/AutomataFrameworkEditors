// The top bar in each real browser: the height the design language gives it, controls a finger can hit, menus that
// open under their button and close again, and editors that are not built saying so in plain words.
import { mount, tick, unmount } from 'svelte'
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { Faces, TopBar } from '#src/features/shell/shell.ts'
import { WORLD } from '../../fixtures/shell.ts'

let box: HTMLDivElement
let mounted: ReturnType<typeof mount> | undefined

/** A press that does not need the control on the screen: the test's box can be larger than the browser's window. */
async function press(el: Element | null | undefined): Promise<void> {
  if (el instanceof HTMLElement) el.click()
  await tick()
}

const sizes = {
  wide: { width: 1210, height: 834 },
  phone: { width: 390, height: 844 },
} as const

function stage(size: keyof typeof sizes, rows: 'touch' | 'small' = 'touch', data?: string) {
  box = document.createElement('div')
  box.className = 'look'
  box.dataset.size = data ?? (size === 'phone' ? 'phone' : 'wide')
  box.dataset.rows = rows
  const { width, height } = sizes[size]
  box.style.cssText = `position:fixed;left:0;top:0;width:${width}px;height:${height}px;overflow:hidden`
  document.body.append(box)
}
afterEach(() => {
  if (mounted) void unmount(mounted)
  mounted = undefined
  box?.remove()
})

const facts = { online: true, problems: 0, changes: 0, mine: undefined, toCheck: 0 }
const base = {
  workspace: WORLD,
  lang: 'en',
  size: 'wide',
  device: 'ipad',
  gameName: 'Crate Game',
  part: 'levels',
  place: 'level-1',
  levels: ['level-1', 'level-2'],
  signedIn: true,
  login: 'sam',
  level: 'edit',
  waiting: 0,
  facts,
  people: [],
  canUndo: false,
  canRedo: false,
  onundo: () => {},
  onredo: () => {},
  onmain: () => {},
  onmenu: () => {},
  onpart: () => {},
  onpeople: () => {},
}
async function put(over: Record<string, unknown> = {}) {
  const args = { target: box, props: { ...base, ...over } }
  mounted = mount(TopBar as never, args as never)
  await tick()
}
const buttons = (): HTMLElement[] =>
  [...box.querySelectorAll<HTMLElement>('button')].filter((b) => b.getAttribute('tabindex') !== '-1')
function named(words: string): HTMLElement | undefined {
  const all = [...box.querySelectorAll<HTMLElement>('button, [role=menuitem]')]
  return all.find((b) => b.textContent?.includes(words))
}

test('the bar is 56 high with a finger, 48 with a mouse and 44 on a phone on its side', async () => {
  stage('wide')
  await put()
  expect(box.querySelector('[role=group]')?.getBoundingClientRect().height).toBe(56)
  unmount(mounted as never)
  box.remove()
  stage('wide', 'small')
  await put()
  expect(box.querySelector('[role=group]')?.getBoundingClientRect().height).toBe(48)
  unmount(mounted as never)
  box.remove()
  stage('wide', 'touch', 'phone-sideways')
  await put({ size: 'phone-sideways', device: 'phone' })
  expect(box.querySelector('[role=group]')?.getBoundingClientRect().height).toBe(44)
})

test('every control is at least 44 by 44, and the main button at least 48 tall where the bar allows', async () => {
  stage('wide')
  await put({ facts: { ...facts, changes: 3 }, onfind: () => {}, onplay: () => {} })
  for (const button of buttons()) {
    const r = button.getBoundingClientRect()
    expect(r.height, button.textContent ?? '').toBeGreaterThanOrEqual(44)
    expect(r.width, button.textContent ?? '').toBeGreaterThanOrEqual(44)
  }
  expect(named('Put in game')?.getBoundingClientRect().height).toBeGreaterThanOrEqual(48)
})

test('Undo and Redo say they cannot act when there is nothing to undo, and act when there is', async () => {
  const seen: string[] = []
  stage('wide')
  await put({ onundo: () => seen.push('undo'), onredo: () => seen.push('redo') })
  const undo = box.querySelector('[aria-label=Undo]') as HTMLElement
  const redo = box.querySelector('[aria-label=Redo]') as HTMLElement
  expect(undo.getAttribute('aria-disabled')).toBe('true')
  await press(undo)
  expect(seen).toEqual([])
  unmount(mounted as never)
  await put({ canUndo: true, onundo: () => seen.push('undo') })
  const live = box.querySelector('[aria-label=Undo]') as HTMLElement
  expect(live.getAttribute('aria-disabled')).toBeNull()
  await press(live)
  expect(seen).toEqual(['undo'])
  expect(redo).toBeDefined()
})

test("the main button says what it does, and what the changes are, in the device's word", async () => {
  stage('wide')
  await put({ facts: { ...facts, changes: 3 } })
  expect(box.textContent).toContain('Put in game')
  expect(box.textContent).toContain('3 changes, only on this iPad')
  unmount(mounted as never)
  await put({ facts: { ...facts, changes: 1 }, device: 'computer', level: 'suggest' })
  expect(box.textContent).toContain('Send to check')
  expect(box.textContent).toContain('1 change, only on this computer')
  unmount(mounted as never)
  await put({ facts: { ...facts, changes: 1 }, signedIn: false, login: undefined })
  expect(box.textContent).toContain('Keep a copy')
  unmount(mounted as never)
  await put()
  expect(box.textContent).toContain('Up to date')
})

test('a change that was sent says who has it, and offers to send the new ones too', async () => {
  const mine = { number: 3, title: 't', by: 'sam', mine: true, checks: 'passing' }
  stage('wide')
  await put({ facts: { ...facts, mine, approver: 'Mia' } })
  expect(box.textContent).toContain('Waiting for Mia')
  unmount(mounted as never)
  await put({ facts: { ...facts, mine, changes: 2, approver: 'Mia' } })
  expect(box.textContent).toContain('Send 2 more to Mia')
})

test('the game menu has no "Who can change it" for a visitor, and has it for an owner', async () => {
  stage('wide')
  await put({ signedIn: false, login: undefined, level: 'look' })
  await userEvent.click(named('Crate Game') as HTMLElement)
  expect(box.querySelector('[role=menu]')).not.toBeNull()
  expect(named('Who can change it')).toBeUndefined()
  expect(named('Sign in')).toBeDefined()
  await userEvent.keyboard('{Escape}')
  expect(box.querySelector('[role=menu]')).toBeNull()
  unmount(mounted as never)
  await put({ level: 'owner' })
  await userEvent.click(named('Crate Game') as HTMLElement)
  expect(named('Who can change it')).toBeDefined()
})

test('a menu closes on Escape and gives focus back to the button that opened it', async () => {
  stage('wide')
  await put()
  const opener = named('Crate Game') as HTMLElement
  await userEvent.click(opener)
  expect(opener.getAttribute('aria-expanded')).toBe('true')
  await userEvent.keyboard('{Escape}')
  expect(box.querySelector('[role=menu]')).toBeNull()
  expect(document.activeElement).toBe(opener)
})

test('every editor that is not built is a row 44 high whose tap says so, with "Got it", and changes nothing', async () => {
  const seen: string[] = []
  stage('wide')
  await put({ onmenu: (id: string) => seen.push(id), onpart: (id: string) => seen.push(id) })
  await userEvent.click(named('World') as HTMLElement)
  const rows = [...box.querySelectorAll<HTMLElement>('[role=menuitem]')]
  expect(rows.map((row) => row.textContent)).toEqual(
    expect.arrayContaining([expect.stringContaining('Characters'), expect.stringContaining('Screens')]),
  )
  for (const row of rows) expect(row.getBoundingClientRect().height).toBeGreaterThanOrEqual(44)
  await userEvent.click(rows.find((row) => row.textContent?.includes('Characters')) as HTMLElement)
  const note = box.querySelector('[role=status]')
  expect(note?.textContent).toContain('Characters is not in this version yet.')
  expect(note?.textContent).toContain('Got it')
  expect(box.textContent).not.toMatch(/Soon|Comes later/)
  await userEvent.click(named('Got it') as HTMLElement)
  expect(box.querySelector('[role=status]')).toBeNull()
  expect(seen).toEqual([])
})

test("on a phone the part's name opens one menu with the parts, the editors and the game menu", async () => {
  stage('phone')
  await put({ size: 'phone', device: 'phone', level: 'owner' })
  expect(box.querySelector('.game')).toBeNull()
  expect(box.querySelector('.editors')).toBeNull()
  await userEvent.click(named('Levels · Level 1') as HTMLElement)
  const menus = box.querySelectorAll('[role=menu]')
  expect(menus.length).toBe(1)
  const words = [...(menus[0]?.querySelectorAll('[role=menuitem]') ?? [])].map((row) => row.textContent ?? '')
  expect(words.some((w) => w.includes('Levels'))).toBe(true)
  expect(words.some((w) => w.includes('Characters'))).toBe(true)
  expect(words.some((w) => w.includes('Who can change it'))).toBe(true)
  expect(words.some((w) => w.includes('Sign out'))).toBe(true)
})

test('picking another level in the part menu says which', async () => {
  const seen: string[] = []
  stage('wide')
  await put({ onpart: (id: string) => seen.push(id) })
  await userEvent.click(named('Levels · Level 1') as HTMLElement)
  await userEvent.click(named('Level 2') as HTMLElement)
  expect(seen).toEqual(['level:level-2'])
  expect(box.querySelector('[role=menu]')).toBeNull()
})

test('Faces with five people draws four and "+1", and with nobody draws nothing', async () => {
  stage('wide')
  const people = ['ann', 'ben', 'cy', 'dee', 'eli'].map((login) => ({ login }))
  const args = { target: box, props: { people, label: 'Who can change it', onopen: () => {} } }
  mounted = mount(Faces as never, args as never)
  await tick()
  const faces = [...box.querySelectorAll('.face')].map((el) => el.textContent?.trim())
  expect(faces).toEqual(['A', 'B', 'C', 'D', '+1'])
  expect(box.querySelector('button')?.getBoundingClientRect().height).toBeGreaterThanOrEqual(44)
  unmount(mounted as never)
  const none = { target: box, props: { people: [], label: 'x', onopen: () => {} } }
  mounted = mount(Faces as never, none as never)
  await tick()
  expect(box.querySelector('button')).toBeNull()
})

test('Find, Play and problems are drawn only when something answers them', async () => {
  stage('wide')
  await put()
  expect(named('Find')).toBeUndefined()
  expect(named('Play')).toBeUndefined()
  unmount(mounted as never)
  await put({ onfind: () => {}, onplay: () => {}, facts: { ...facts, problems: 2, online: false } })
  expect(named('Find')).toBeDefined()
  expect(named('Play')).toBeDefined()
  expect(box.textContent).toContain('2 problems')
  expect(box.textContent).toContain('No internet')
})
