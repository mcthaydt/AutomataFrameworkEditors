// Arranging the map in each real browser: levels pushed together and pulled apart, a wall's ways out, a level that
// goes back when dropped on another, and levels made, renamed and taken away. Each with its opposite.

import { type GameContent, loadGame } from '@automataframework/framework/headless'
import { mount, tick, unmount } from 'svelte'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { startEdits } from '#src/features/game/game.ts'
import { emptyKind, kindsOf, paint } from '#src/features/levels/levels.ts'
import { readFrom } from '../../fixtures/game/read.ts'
import { linksFiles } from '../../fixtures/links-game/links.ts'
import { linksMap } from '../../fixtures/links-game/read.ts'
import { openedGameWith } from '../../fixtures/open-game-with.ts'
import MapHolder from './MapHolder.svelte'

const loaded = await loadGame(readFrom(linksMap()))
if (!loaded.ok) throw new Error('the links game did not load')
const content: GameContent = loaded.value
const game = await openedGameWith((text) => `v${text.length}`, linksFiles())
const start = startEdits(game)

let box: HTMLDivElement
let holder: ReturnType<typeof mount> & {
  now: () => (typeof start)['now']
  undo: () => void
  steps: () => number
  pickedNow: () => string | undefined
}
let mounted: ReturnType<typeof mount> | undefined

function size(w: number, h: number): void {
  box.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:${h}px;display:flex;flex-direction:column`
}
beforeEach(() => {
  box = document.createElement('div')
  size(1000, 680)
  document.body.append(box)
})
afterEach(() => {
  if (mounted) void unmount(mounted)
  mounted = undefined
  box.remove()
})

async function show(from = start): Promise<void> {
  mounted = mount(MapHolder, { target: box, props: { content, start: from } })
  holder = mounted as typeof holder
  await tick()
  await vi.waitFor(() => expect(box.querySelector('[data-level]')).not.toBeNull())
}

const level = (id: string): HTMLElement =>
  box.querySelector<HTMLElement>(`[data-level="${id}"]`) as HTMLElement
const levels = (): string[] =>
  [...box.querySelectorAll<HTMLElement>('[data-level]')].map((el) => el.dataset.level ?? '')
const marks = (kind: string): number => box.querySelectorAll(`[data-mark="${kind}"]`).length
const scale = (): number => Number(box.querySelector<HTMLElement>('[data-scale]')?.dataset.scale)
const at = (id: string): { x: number; y: number } | undefined =>
  holder.now().world?.levels.find((e) => e.level === id)?.at
const button = (name: string): HTMLButtonElement =>
  [...box.querySelectorAll('button')].find(
    (b) => b.textContent?.trim().startsWith(name) || b.getAttribute('aria-label') === name,
  ) as HTMLButtonElement
const press = async (name: string): Promise<void> => {
  const found = button(name)
  if (found === undefined) throw new Error(`no button called ${name}`)
  found.click()
  await tick()
}
const said = (): string => box.querySelector('[role="status"]')?.textContent?.trim() ?? ''

function send(el: Element, type: string, x: number, y: number): void {
  el.dispatchEvent(
    new PointerEvent(type, {
      pointerId: 7,
      pointerType: 'mouse',
      isPrimary: true,
      clientX: x,
      clientY: y,
      button: 0,
      buttons: type === 'pointerup' ? 0 : 1,
      bubbles: true,
    }),
  )
}
/** Takes a level by its middle and moves it this many tiles, stopping before letting go when `hold` is set. */
async function drag(id: string, tiles: { x: number; y: number }, hold = false): Promise<void> {
  const el = level(id)
  const rect = el.getBoundingClientRect()
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2
  send(el, 'pointerdown', x, y)
  for (let step = 1; step <= 6; step += 1) {
    send(el, 'pointermove', x + (tiles.x * scale() * step) / 6, y + (tiles.y * scale() * step) / 6)
    await tick()
  }
  if (!hold) {
    send(el, 'pointerup', x + tiles.x * scale(), y + tiles.y * scale())
    await tick()
  }
}
/** Lets go of a level that is held mid-drag. */
async function letGo(id: string): Promise<void> {
  const rect = level(id).getBoundingClientRect()
  send(level(id), 'pointerup', rect.left + rect.width / 2, rect.top + rect.height / 2)
  await tick()
}

test('dragging a level shows what letting go would do, and a level let go in the open is simply moved', async () => {
  await show()
  const before = at('room-1')
  await drag('room-1', { x: -6, y: 4 }, true)
  expect(said()).toBe('Let go to leave it here.')
  expect(marks('soon')).toBe(0)
  await letGo('room-1')
  expect(at('room-1')).not.toEqual(before)
  expect(box.querySelector('[data-way]')).toBeNull()
})

test('pushing room-1 against room-2 meets a wall, and the card offers four ways out; leaving it keeps them as they are', async () => {
  await show()
  await drag('room-1', { x: 3.4, y: 0.2 }, true)
  expect(said()).toContain('Room 1 and Room 2 meet at a wall')
  await letGo('room-1')
  expect(at('room-1')).toEqual({ x: 4, y: 0 })
  expect(marks('wall')).toBe(1)
  await vi.waitFor(() => expect(box.querySelector('[data-way="clear"]')).not.toBeNull())
  expect(box.querySelector('[data-way="apart"]')).not.toBeNull()
  expect(box.querySelector('[data-way="leave"]')).not.toBeNull()
  await press('Leave it for now')
  expect(box.querySelector('[data-way]')).toBeNull()
  expect(marks('wall')).toBe(1)
  // The wall's own mark brings the card back.
  box.querySelector<HTMLButtonElement>('[data-wall]')?.click()
  await tick()
  expect(box.querySelector('[data-way="clear"]')).not.toBeNull()
})

test('the first way out clears the ground and joins them; undo puts the wall back, and again', async () => {
  await show()
  await drag('room-1', { x: 3.4, y: 0.2 })
  const joinsBefore = marks('join')
  const clear = (): HTMLElement => box.querySelector('[data-way="clear"]') as HTMLElement
  clear().click()
  await tick()
  expect(marks('wall')).toBe(0)
  expect(marks('join')).toBe(joinsBefore + 1)
  holder.undo()
  await tick()
  expect(marks('wall')).toBe(1)
  expect(marks('join')).toBe(joinsBefore)
  box.querySelector<HTMLButtonElement>('[data-wall]')?.click()
  await tick()
  clear().click()
  await tick()
  expect(marks('wall')).toBe(0)
  expect(marks('join')).toBe(joinsBefore + 1)
})

test('room-3 pulled apart from room-2 no longer joins; pushed back it joins; room-1, which touches nothing, has no Move apart', async () => {
  await show()
  level('room-1').click()
  await tick()
  expect(button('Move apart')).toBeUndefined()
  level('room-3').click()
  await tick()
  expect(marks('join')).toBe(1)
  await press('Move apart')
  expect(marks('join')).toBe(0)
  expect(said()).toContain('Room 2 and Room 3 no longer touch')
  expect(said()).toContain("Players can't walk across now")
  const apart = at('room-3')
  await drag('room-3', { x: -((apart?.x ?? 0) - (at('room-2')?.x ?? 0) - 16 - 0.2), y: 0 })
  expect(marks('join')).toBe(1)
  expect(said()).toContain('Room 2 and Room 3 now touch')
  expect(said()).toContain('Players walk straight from one into the other')
  holder.undo()
  await tick()
  expect(marks('join')).toBe(0)
})

test('a level dropped on another goes back, and says so', async () => {
  await show()
  const before = at('room-1')
  await drag('room-1', { x: 24, y: 1 }, true)
  expect(said()).toContain('Room 2 is already here')
  await letGo('room-1')
  expect(at('room-1')).toEqual(before)
  expect(said()).toContain('went back')
})

test('the Move card never covers the picked level or the one beside it, at iPad sideways', async () => {
  size(1180, 820)
  await show()
  level('room-3').click()
  await tick()
  await press('Move')
  const pad = box.querySelector<HTMLElement>('.pad')?.parentElement as HTMLElement
  const rect = pad.getBoundingClientRect()
  const crosses = (a: DOMRect, b: DOMRect): boolean =>
    a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
  for (const id of ['room-3', 'room-2'])
    expect(crosses(rect, level(id).getBoundingClientRect()), id).toBe(false)
  const sheet = box.querySelector('[role="region"]')?.getBoundingClientRect() as DOMRect
  expect(rect.left).toBeGreaterThanOrEqual(sheet.left)
  expect(rect.right).toBeLessThanOrEqual(sheet.right)
  expect(rect.bottom).toBeLessThanOrEqual(sheet.bottom)
})

test('the pad moves the picked level a tile a tap, and says when one more tap would join', async () => {
  await show()
  level('room-3').click()
  await tick()
  await press('Move apart')
  await press('Move')
  // Two tiles apart: one tap leaves a tile between them, so the pad only speaks of the keys.
  expect(box.textContent).toContain('On a keyboard')
  expect(box.textContent).not.toContain('One more tap')
  const x = at('room-3')?.x ?? 0
  await press('Move left')
  expect(at('room-3')?.x).toBe(x - 1)
  // One tap from touching: it says so, by name.
  expect(box.textContent).toContain('One more tap and Room 3 touches Room 2')
  await press('Move left')
  // Touching: they join, and the line is gone.
  expect(marks('join')).toBe(1)
  expect(box.textContent).not.toContain('One more tap')
})

test('a new level is made beside the others, with its card; renaming it says what it changes first; deleting it can be undone', async () => {
  await show()
  expect(levels()).toHaveLength(3)
  await press('New level')
  expect(levels()).toHaveLength(4)
  expect(box.textContent).toContain('A new level, ready to play')
  expect(holder.pickedNow()).toBe('level-1')
  await press('Got it')
  await press('More')
  await press('Rename')
  expect(box.textContent).toContain('This changes the name')
  const field = box.querySelector<HTMLInputElement>('input') as HTMLInputElement
  field.value = 'cellar'
  field.dispatchEvent(new Event('input', { bubbles: true }))
  box.querySelector('form')?.requestSubmit()
  await tick()
  expect(levels()).toContain('cellar')
  await press('More')
  await press('Delete')
  expect(levels()).not.toContain('cellar')
  expect(said()).toContain('Undo brings them all back')
  await press('Undo')
  expect(levels()).toContain('cellar')
})

test('the level the game starts in can not be deleted, and a refusal says why', async () => {
  await show()
  level('room-1').click()
  await tick()
  await press('More')
  await press('Delete')
  expect(levels()).toHaveLength(3)
  expect(said()).toContain('The game starts in this level')
})

// ---- Press and hold, a slow swipe, a pinch, a double tap, copies and the wall card's other ways out ----

const wait = (ms: number): Promise<void> => new Promise((done) => setTimeout(done, ms))
const sheet = (): HTMLElement => box.querySelector('[role="region"]') as HTMLElement
function finger(el: Element, type: string, id: number, x: number, y: number): void {
  el.dispatchEvent(
    new PointerEvent(type, {
      pointerId: id,
      pointerType: 'touch',
      isPrimary: id === 1,
      clientX: x,
      clientY: y,
      button: 0,
      buttons: type === 'pointerup' ? 0 : 1,
      bubbles: true,
    }),
  )
}
/** A spot on empty ground, clear of every level. */
const ground = (): { x: number; y: number } => {
  const at = sheet().getBoundingClientRect()
  return { x: at.left + 24, y: at.top + 120 }
}

test('a slow swipe on empty ground makes no level', async () => {
  await show()
  const from = ground()
  finger(sheet(), 'pointerdown', 1, from.x, from.y)
  for (let step = 1; step <= 6; step += 1) {
    finger(sheet(), 'pointermove', 1, from.x + step * 30, from.y)
    await wait(120)
  }
  finger(sheet(), 'pointerup', 1, from.x + 180, from.y)
  await tick()
  expect(levels()).toHaveLength(3)
})

test('a two-finger pinch on empty ground makes no level', async () => {
  await show()
  const from = ground()
  finger(sheet(), 'pointerdown', 1, from.x, from.y)
  finger(sheet(), 'pointerdown', 2, from.x + 60, from.y)
  for (let step = 1; step <= 4; step += 1) {
    finger(sheet(), 'pointermove', 2, from.x + 60 + step * 20, from.y)
    await wait(180)
  }
  finger(sheet(), 'pointerup', 2, from.x + 140, from.y)
  finger(sheet(), 'pointerup', 1, from.x, from.y)
  await tick()
  expect(levels()).toHaveLength(3)
})

test('a still hold on empty ground makes one level, with its card; a tap there only clears the pick', async () => {
  await show()
  level('room-1').click()
  await tick()
  expect(holder.pickedNow()).toBe('room-1')
  const from = ground()
  finger(sheet(), 'pointerdown', 1, from.x, from.y)
  finger(sheet(), 'pointerup', 1, from.x, from.y)
  await tick()
  expect(holder.pickedNow()).toBeUndefined()
  expect(levels()).toHaveLength(3)
  finger(sheet(), 'pointerdown', 1, from.x, from.y)
  await wait(700)
  finger(sheet(), 'pointerup', 1, from.x, from.y)
  await tick()
  expect(levels()).toHaveLength(4)
  expect(box.textContent).toContain('A new level, ready to play')
})

test('press and hold on a level opens its menu and picks it; a short press does not', async () => {
  await show()
  level('room-2').click()
  await tick()
  expect(button('Rename')).toBeUndefined()
  const rect = level('room-3').getBoundingClientRect()
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2
  finger(level('room-3'), 'pointerdown', 1, x, y)
  await wait(700)
  finger(level('room-3'), 'pointerup', 1, x, y)
  await tick()
  expect(holder.pickedNow()).toBe('room-3')
  expect(button('Rename')).not.toBeUndefined()
  expect(button('Make a copy')).not.toBeUndefined()
})

test('a second tap soon after the first goes in; two taps far apart only pick', async () => {
  const went: string[] = []
  mounted = mount(MapHolder, { target: box, props: { content, start, went: (id: string) => went.push(id) } })
  holder = mounted as typeof holder
  await tick()
  await vi.waitFor(() => expect(box.querySelector('[data-level]')).not.toBeNull())
  level('room-2').click()
  await wait(700)
  level('room-2').click()
  expect(went).toEqual([])
  level('room-2').click()
  expect(went).toEqual(['room-2'])
})

test('Make a copy adds a level beside the others, with a note that undoes it', async () => {
  await show()
  level('room-2').click()
  await tick()
  await press('More')
  await press('Make a copy')
  expect(levels()).toHaveLength(4)
  expect(said()).toContain('Made a copy')
  await press('Undo')
  expect(levels()).toHaveLength(3)
})

/** The links game with a gap in Room 2's left edge, three rows above where Room 1 is open: a slide can meet it. */
const holed = (): typeof start => {
  const room2 = start.now.levels['room-2']
  if (room2 === undefined) throw new Error('no room-2')
  const gap = paint(
    room2,
    content.characters,
    [{ col: 0, row: 2 }],
    emptyKind(kindsOf(room2, content.tilesets)),
  )
  if (!gap.ok) throw new Error('the gap did not open')
  const now = { ...start.now, levels: { ...start.now.levels, 'room-2': gap.value } }
  return { ...start, base: now, now }
}

test('the wall card slides the level so the openings meet, when there is a way', async () => {
  await show(holed())
  await drag('room-1', { x: 3.4, y: 0.2 })
  await vi.waitFor(() => expect(box.querySelector('[data-way="move"]')).not.toBeNull())
  expect(box.querySelector('[data-way="move"]')?.textContent).toContain('Room 1')
  const joins = marks('join')
  box.querySelector<HTMLElement>('[data-way="move"]')?.click()
  await tick()
  // Where the openings meet they join; the rest of the shared side is still a wall.
  expect(marks('join')).toBe(joins + 1)
  holder.undo()
  await tick()
  expect(marks('join')).toBe(joins)
})

test('the wall card has no slide when the other level has no opening to meet', async () => {
  await show()
  await drag('room-1', { x: 3.4, y: 0.2 })
  await vi.waitFor(() => expect(box.querySelector('[data-way="clear"]')).not.toBeNull())
  expect(box.querySelector('[data-way="move"]')).toBeNull()
})

test('the wall card can move them apart, and the wall is gone', async () => {
  await show()
  await drag('room-1', { x: 3.4, y: 0.2 })
  await vi.waitFor(() => expect(box.querySelector('[data-way="apart"]')).not.toBeNull())
  box.querySelector<HTMLElement>('[data-way="apart"]')?.click()
  await tick()
  expect(marks('wall')).toBe(0)
  expect(box.querySelector('[data-way]')).toBeNull()
  holder.undo()
  await tick()
  expect(marks('wall')).toBe(1)
})

test('what Move apart does is said on the screen, not in a hover tip, and only for a level that touches another', async () => {
  await show()
  level('room-3').click()
  await tick()
  await press('More')
  expect(box.textContent).toContain("Move it away from Room 2, so players can't walk across")
  // An icon's tooltip only repeats its name; what Move apart does is never kept in one.
  expect([...box.querySelectorAll('[title]')].map((el) => el.getAttribute('title'))).not.toContainEqual(
    expect.stringContaining('players'),
  )
  level('room-1').click()
  await tick()
  expect(box.textContent).not.toContain('so players can')
})

test('on a phone the bar and its menu stay inside the screen, whichever level was picked before', async () => {
  size(390, 700)
  await show()
  const sheetRect = (): DOMRect => sheet().getBoundingClientRect()
  // What a failure says: where the thing and the box it is placed by are, and how they are styled, now and once the
  // page has had time to lay out again, so a bound missed in one engine says why.
  const said = (el: Element, id: string): string => {
    const r = el.getBoundingClientRect()
    const parent = el.parentElement
    const p = parent?.getBoundingClientRect()
    const style = getComputedStyle(el)
    const held = parent === null ? undefined : getComputedStyle(parent)
    const px = (n: number | undefined): number => Math.round((n ?? Number.NaN) * 10) / 10
    return (
      `picked ${id}; it ${px(r.left)}..${px(r.right)} w${px(r.width)}, ${style.position} left ${style.left} right ` +
      `${style.right} width ${style.width} transform ${style.transform}; its holder ${px(p?.left)}..${px(p?.right)} ` +
      `w${px(p?.width)}, ${held?.position} left ${held?.left} width ${held?.width} transform ${held?.transform}`
    )
  }
  const settle = (): Promise<void> =>
    new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(done, 300))))
  const inside = async (el: Element, what: string, id: string): Promise<void> => {
    const r = el.getBoundingClientRect()
    const s = sheetRect()
    const fits = r.left >= s.left && r.top >= s.top && r.right <= s.right && r.bottom <= s.bottom
    const why = fits ? '' : `at 50 ms: ${said(el, id)}; later: ${await settle().then(() => said(el, id))}`
    expect(r.left, `${what} left; ${why}`).toBeGreaterThanOrEqual(s.left)
    expect(r.top, `${what} top; ${why}`).toBeGreaterThanOrEqual(s.top)
    expect(r.right, `${what} right; ${why}`).toBeLessThanOrEqual(s.right)
    expect(r.bottom, `${what} bottom; ${why}`).toBeLessThanOrEqual(s.bottom)
  }
  for (const id of ['room-1', 'room-3', 'room-2', 'room-3']) {
    level(id).click()
    await tick()
    await wait(50)
    await inside(box.querySelector('[role="toolbar"]') as Element, `${id}'s bar`, id)
    await press('More')
    await wait(50)
    await inside(box.querySelector('[role="menu"]') as Element, `${id}'s menu`, id)
    await press('More')
  }
})

// The bar is placed for the level it is drawn for, in the frame its buttons change: a wider bar picked after a narrower
// one is never placed by the narrower one's size first (the WebKit run of 2026-11-20 showed room-3's bar placed by
// room-1's for longer than 50 ms). No timed wait here: only Svelte's own flush.
test('a wider bar picked after a narrower one is on the screen in the frame it is drawn', async () => {
  size(390, 700)
  await show()
  level('room-1').click()
  await tick()
  await new Promise((done) => requestAnimationFrame(done))
  level('room-3').click()
  await tick()
  const bar = (box.querySelector('[role="toolbar"]') as Element).getBoundingClientRect()
  const screen = sheet().getBoundingClientRect()
  expect(bar.left, 'the bar runs off the left').toBeGreaterThanOrEqual(screen.left)
  expect(bar.right, 'the bar runs off the right').toBeLessThanOrEqual(screen.right)
})
