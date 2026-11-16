// Arranging the map in each real browser: levels pushed together and pulled apart, a wall's ways out, a level that
// goes back when dropped on another, and levels made, renamed and taken away. Each with its opposite.

import { type GameContent, loadGame } from '@automataframework/framework/headless'
import { mount, tick, unmount } from 'svelte'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { startEdits } from '#src/features/game/game.ts'
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

async function show(): Promise<void> {
  mounted = mount(MapHolder, { target: box, props: { content, start } })
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
  const apart = at('room-3')
  await drag('room-3', { x: -((apart?.x ?? 0) - (at('room-2')?.x ?? 0) - 16 - 0.2), y: 0 })
  expect(marks('join')).toBe(1)
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
  expect(box.textContent).toContain('arrow keys')
  const x = at('room-3')?.x ?? 0
  await press('Move left')
  expect(at('room-3')?.x).toBe(x - 1)
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
