// Join, tags and edges in each real browser, on the links game: a line from the plate to the gate it opens, drawn with
// a pointer and taken away; a tag that says where a door leads; the bar and the card at an edge that touches the next
// level.
import { type GameContent, type Level, loadGame } from '@automataframework/framework/headless'
import { mount, tick, unmount } from 'svelte'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { readFrom } from '../../fixtures/game/read.ts'
import { linksMap } from '../../fixtures/links-game/read.ts'
import Holder from './Holder.svelte'

const loaded = await loadGame(readFrom(linksMap()))
if (!loaded.ok) throw new Error('the links game did not load')
const content: GameContent = loaded.value
const room1 = content.levels['room-1'] as Level
const room2 = content.levels['room-2'] as Level

let box: HTMLDivElement
let mounted: ReturnType<typeof mount> | undefined
let held: { now(): Level; pickedNow(): readonly string[]; undo(): void }

beforeEach(() => {
  box = document.createElement('div')
  box.className = 'look'
  box.style.cssText =
    'position:fixed;left:0;top:0;width:400px;height:520px;display:flex;flex-direction:column'
  document.body.append(box)
})
afterEach(() => {
  if (mounted) void unmount(mounted)
  mounted = undefined
  box.remove()
})

async function show(start: Level, over: Record<string, unknown> = {}): Promise<void> {
  const made = mount(Holder, { target: box, props: { content, pictures: [], start, ...over } })
  mounted = made
  held = made as unknown as typeof held
  await tick()
  await vi.waitFor(() => expect(box.querySelector('[data-thing]')).not.toBeNull())
}
const mark = (id: string): HTMLElement => {
  const found = box.querySelector<HTMLElement>(`[data-thing="${id}"]`)
  if (found === null) throw new Error(`no mark ${id}`)
  return found
}
const middle = (el: HTMLElement): { x: number; y: number } => {
  const r = el.getBoundingClientRect()
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
}
const named = (name: string): HTMLElement => {
  const found = [...box.querySelectorAll<HTMLElement>('button')].find(
    (b) => (b.getAttribute('aria-label') ?? b.textContent ?? '').trim() === name,
  )
  if (found === undefined) throw new Error(`no button called ${name}`)
  return found
}
/** A mouse drag from one thing to a point: down on the thing, moves on the way, then up there. */
async function draw(from: HTMLElement, to: { x: number; y: number }, letGo = true): Promise<void> {
  const start = middle(from)
  const send = (el: HTMLElement, type: string, at: { x: number; y: number }, buttons: number): void => {
    el.dispatchEvent(
      new PointerEvent(type, {
        pointerId: 1,
        pointerType: 'mouse',
        clientX: at.x,
        clientY: at.y,
        buttons,
        bubbles: true,
      }),
    )
  }
  send(from, 'pointerdown', start, 1)
  for (const f of [0.25, 0.5, 0.75, 1]) {
    send(from, 'pointermove', { x: start.x + (to.x - start.x) * f, y: start.y + (to.y - start.y) * f }, 1)
    await tick()
  }
  if (letGo) send(from, 'pointerup', to, 0)
  await tick()
}
const opens = (id: string) => held.now().things.find((t) => t.id === id)?.values?.opens

test('a line is drawn from the plate to the gate with a pointer, lights the gate on the way, and Undo takes it away', async () => {
  await show(
    {
      ...room1,
      things: room1.things.map((t) =>
        t.id === 'plate-1' ? { id: t.id, character: t.character, x: t.x, y: t.y } : t,
      ),
    },
    { tool: 'join' },
  )
  expect(opens('plate-1')).toBeUndefined()
  expect(box.textContent).toContain('Draw from the button to what it opens')
  await draw(mark('plate-1'), middle(mark('gate-1')), false)
  expect(box.querySelector('[data-near="gate-1"]')).not.toBeNull()
  mark('plate-1').dispatchEvent(
    new PointerEvent('pointerup', {
      pointerId: 1,
      pointerType: 'mouse',
      ...{ clientX: 0, clientY: 0 },
      bubbles: true,
    }),
  )
  await tick()
  expect(opens('plate-1')).toEqual(['gate-1'])
  expect(box.querySelector('[data-line-path]')).not.toBeNull()
  held.undo()
  await tick()
  expect(opens('plate-1')).toBeUndefined()
})

test('a drag that ends on nothing joins nothing', async () => {
  await show(
    {
      ...room1,
      things: room1.things.map((t) =>
        t.id === 'plate-1' ? { id: t.id, character: t.character, x: t.x, y: t.y } : t,
      ),
    },
    { tool: 'join' },
  )
  await draw(mark('plate-1'), { x: middle(mark('plate-1')).x - 150, y: middle(mark('plate-1')).y - 100 })
  expect(opens('plate-1')).toBeUndefined()
})

test('tap the line, "Take this line away", and both things stay where they are', async () => {
  await show(room1, { tool: 'join' })
  const before = JSON.stringify(held.now().things.map((t) => [t.id, t.x, t.y]))
  await userEvent.click(box.querySelector('[data-line]') as HTMLElement)
  expect(box.textContent).toContain('Plate 1 opens Gate 1')
  await userEvent.click(named('Take this line away'))
  // A list that opened one thing keeps its place, empty.
  expect(opens('plate-1')).toEqual([])
  expect(JSON.stringify(held.now().things.map((t) => [t.id, t.x, t.y]))).toBe(before)
  held.undo()
  await tick()
  expect(opens('plate-1')).toEqual(['gate-1'])
})

test('a door has a tag that says where it leads, faint until the door is picked', async () => {
  await show(room1)
  const tag = box.querySelector<HTMLElement>('[data-tag="exit"]')
  expect(tag?.textContent?.trim()).toBe('To Room 2')
  expect(tag?.classList.contains('on')).toBe(false)
  await userEvent.click(mark('exit'))
  await vi.waitFor(() => expect(box.querySelector('[data-tag="exit"]')?.classList.contains('on')).toBe(true))
})

test('an edge that touches the next level has a bar, and a card that says so and goes to look', async () => {
  const gone = vi.fn()
  await show(room2, { edges: [{ side: 'right', from: 5, to: 8, other: 'room-3' }], ongo: gone })
  expect(box.querySelector('[data-edge="right"]')).not.toBeNull()
  expect(box.textContent).toContain('Players walk straight into Room 3 here')
  await userEvent.click(named('Go to Room 3'))
  expect(gone).toHaveBeenCalledWith('room-3')
  // Picking something puts the card away; the bar stays.
  await userEvent.click(mark('crate-1'))
  await vi.waitFor(() => expect(box.querySelector('[data-edge-card]')).toBeNull())
  expect(box.querySelector('[data-edge="right"]')).not.toBeNull()
})
