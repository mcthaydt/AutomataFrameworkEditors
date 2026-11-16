// Sliding and zooming the map in each real browser: two fingers, one finger on empty ground, the wheel and the keys; the
// "Whole world" button that brings every level back; and a level picked from the list that is brought into sight.

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
let mounted: ReturnType<typeof mount> | undefined
let holder: ReturnType<typeof mount> & {
  pick: (level: string | undefined) => void
  pickedNow: () => string | undefined
}

beforeEach(() => {
  box = document.createElement('div')
  box.style.cssText =
    'position:fixed;left:0;top:0;width:1000px;height:680px;display:flex;flex-direction:column'
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
const sheet = (): HTMLElement => box.querySelector('[role="region"]') as HTMLElement
const scale = (): number => Number(sheet().dataset.scale)
const level = (id: string): HTMLElement =>
  box.querySelector<HTMLElement>(`[data-level="${id}"]`) as HTMLElement
const levels = (): number => box.querySelectorAll('[data-level]').length
const at = (id: string): DOMRect => level(id).getBoundingClientRect()
const whole = (): HTMLButtonElement | undefined =>
  [...box.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Whole world')

function finger(id: number, type: string, x: number, y: number, kind = 'touch'): void {
  sheet().dispatchEvent(
    new PointerEvent(type, {
      pointerId: id,
      pointerType: kind,
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
  const r = sheet().getBoundingClientRect()
  return { x: r.left + 24, y: r.top + 120 }
}
/** Two fingers on empty ground spread apart (or slide together) in a few steps. */
async function pinch(
  from: { x: number; y: number },
  gap: [number, number],
  slide = { x: 0, y: 0 },
): Promise<void> {
  finger(1, 'pointerdown', from.x - gap[0] / 2, from.y)
  finger(2, 'pointerdown', from.x + gap[0] / 2, from.y)
  for (let step = 1; step <= 6; step += 1) {
    const g = gap[0] + ((gap[1] - gap[0]) * step) / 6
    const m = { x: from.x + (slide.x * step) / 6, y: from.y + (slide.y * step) / 6 }
    finger(1, 'pointermove', m.x - g / 2, m.y)
    finger(2, 'pointermove', m.x + g / 2, m.y)
    await tick()
  }
  finger(1, 'pointerup', from.x, from.y)
  finger(2, 'pointerup', from.x, from.y)
  await tick()
}
/** The middle of the part's picture, where there are levels to be pinched over. */
const middle = (): { x: number; y: number } => {
  const r = sheet().getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

test('two fingers spreading zoom the map in; the levels get bigger', async () => {
  await show()
  const first = scale()
  const wide = at('room-1').width
  await pinch(middle(), [100, 300])
  expect(scale()).toBeGreaterThan(first * 2)
  expect(at('room-1').width).toBeGreaterThan(wide * 2)
  expect(levels()).toBe(3)
})

test('two fingers pinching in on the fitted map change nothing: it is already every level in sight', async () => {
  await show()
  const first = scale()
  const before = at('room-2')
  await pinch(middle(), [300, 100])
  expect(scale()).toBe(first)
  expect(at('room-2').left).toBeCloseTo(before.left)
})

test('two fingers sliding together slide a zoomed map; a single finger on empty ground does too, and makes no level', async () => {
  await show()
  await pinch(middle(), [100, 400])
  const here = at('room-2').left
  await pinch(middle(), [200, 200], { x: -120, y: 0 })
  expect(at('room-2').left).toBeLessThan(here - 60)
  const slid = at('room-2').left
  const from = ground()
  finger(1, 'pointerdown', from.x, from.y)
  for (let step = 1; step <= 6; step += 1) {
    finger(1, 'pointermove', from.x + step * 20, from.y)
    await tick()
  }
  finger(1, 'pointerup', from.x + 120, from.y)
  await tick()
  expect(at('room-2').left).toBeGreaterThan(slid + 60)
  expect(levels()).toBe(3)
})

test('a mouse dragging empty ground slides a zoomed map', async () => {
  await show()
  await pinch(middle(), [100, 400])
  const here = at('room-2').top
  const from = ground()
  finger(1, 'pointerdown', from.x, from.y, 'mouse')
  for (let step = 1; step <= 4; step += 1) {
    finger(1, 'pointermove', from.x, from.y + step * 25, 'mouse')
    await tick()
  }
  finger(1, 'pointerup', from.x, from.y + 100, 'mouse')
  await tick()
  expect(at('room-2').top).toBeGreaterThan(here + 50)
  expect(levels()).toBe(3)
})

test('the wheel zooms about the pointer, and "Whole world" brings every level back', async () => {
  await show()
  expect(whole()?.getAttribute('aria-pressed')).toBe('true')
  const fitted = scale()
  const where = middle()
  sheet().dispatchEvent(
    new WheelEvent('wheel', {
      deltaY: -400,
      ctrlKey: true,
      clientX: where.x,
      clientY: where.y,
      bubbles: true,
      cancelable: true,
    }),
  )
  await tick()
  expect(scale()).toBeGreaterThan(fitted * 1.5)
  expect(whole()?.getAttribute('aria-pressed')).toBe('false')
  whole()?.click()
  await tick()
  expect(scale()).toBe(fitted)
  expect(whole()?.getAttribute('aria-pressed')).toBe('true')
})

test('the wheel on its own slides a zoomed map, and does nothing to the fitted one', async () => {
  await show()
  const spin = (deltaY: number, ctrlKey = false): void => {
    const where = middle()
    sheet().dispatchEvent(
      new WheelEvent('wheel', {
        deltaY,
        ctrlKey,
        clientX: where.x,
        clientY: where.y,
        bubbles: true,
        cancelable: true,
      }),
    )
  }
  const fitted = scale()
  const first = at('room-2').top
  spin(120)
  await tick()
  expect(scale()).toBe(fitted)
  expect(at('room-2').top).toBe(first)
  spin(-400, true)
  await tick()
  const zoomed = at('room-2').top
  const size = scale()
  spin(120)
  await tick()
  expect(scale()).toBe(size)
  expect(at('room-2').top).toBeLessThan(zoomed - 60)
})

test('the plus and minus keys zoom and 0 is "Whole world", with a level in focus', async () => {
  await show()
  const fitted = scale()
  level('room-1').focus()
  level('room-1').dispatchEvent(new KeyboardEvent('keydown', { key: '+', bubbles: true }))
  await tick()
  expect(scale()).toBeGreaterThan(fitted)
  level('room-1').dispatchEvent(new KeyboardEvent('keydown', { key: '-', bubbles: true }))
  await tick()
  expect(scale()).toBeCloseTo(fitted)
  level('room-1').dispatchEvent(new KeyboardEvent('keydown', { key: '+', bubbles: true }))
  level('room-1').dispatchEvent(new KeyboardEvent('keydown', { key: '+', bubbles: true }))
  await tick()
  level('room-1').dispatchEvent(new KeyboardEvent('keydown', { key: '0', bubbles: true }))
  await tick()
  expect(scale()).toBe(fitted)
})

test('a level picked from the list that is out of sight is brought to the middle; one in sight is left where it is', async () => {
  await show()
  await pinch(middle(), [100, 500])
  const sight = sheet().getBoundingClientRect()
  const insideSight = (r: DOMRect): boolean =>
    r.left >= sight.left && r.right <= sight.right && r.top >= sight.top && r.bottom <= sight.bottom
  const out = ['room-1', 'room-2', 'room-3'].find((id) => !insideSight(at(id)))
  expect(out).toBeDefined()
  holder.pick(out)
  await tick()
  await vi.waitFor(() => {
    const r = at(out as string)
    expect(r.left + r.width / 2).toBeGreaterThan(sight.left)
    expect(r.left + r.width / 2).toBeLessThan(sight.right)
  })
  const stays = ['room-1', 'room-2', 'room-3'].find((id) => id !== out && insideSight(at(id)))
  if (stays !== undefined) {
    const before = at(stays).left
    holder.pick(stays)
    await tick()
    expect(at(stays).left).toBeCloseTo(before)
  }
})

test('tabbing to a level that is out of sight brings it into sight, without the sheet scrolling away', async () => {
  await show()
  await pinch(middle(), [100, 500])
  const sight = sheet().getBoundingClientRect()
  const centred = (r: DOMRect): boolean =>
    r.left + r.width / 2 > sight.left && r.left + r.width / 2 < sight.right
  const out = ['room-1', 'room-2', 'room-3'].find((id) => !centred(at(id)))
  expect(out).toBeDefined()
  level(out as string).focus()
  await vi.waitFor(() => expect(centred(at(out as string))).toBe(true))
  expect(sheet().scrollLeft).toBe(0)
  expect(sheet().scrollTop).toBe(0)
})

test('the bar of the picked level never covers the "Whole world" button, however the map is zoomed', async () => {
  box.style.cssText =
    'position:fixed;left:0;top:0;width:1030px;height:700px;display:flex;flex-direction:column'
  await show()
  holder.pick('room-1')
  await tick()
  const about = at('room-2')
  // Zoomed in over the second room, so the picked first one slides off to the top left, where the buttons are.
  for (const point of [about, about, about]) {
    sheet().dispatchEvent(
      new WheelEvent('wheel', {
        deltaY: -200,
        ctrlKey: true,
        clientX: point.left + point.width / 2,
        clientY: point.top + point.height / 2,
        bubbles: true,
        cancelable: true,
      }),
    )
    await tick()
    // The bar finds its place once the level has moved; the button is clear of it when it has.
    await vi.waitFor(() => {
      const button = whole() as HTMLButtonElement
      const r = button.getBoundingClientRect()
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
      expect(hit === button || button.contains(hit)).toBe(true)
    })
  }
})
