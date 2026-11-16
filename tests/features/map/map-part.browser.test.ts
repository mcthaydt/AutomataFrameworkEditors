// The world map in each real browser: every level on one sheet with its doors, bars, start and key, fitted inside the
// window on opening (even for 64 levels), and each level reached by Tab and opened by Enter.
import { type GameContent, type Level, loadGame } from '@automataframework/framework/headless'
import { mount, tick, unmount } from 'svelte'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { startEdits, type Working } from '#src/features/game/game.ts'
import MapPart from '#src/features/map/MapPart.svelte'
import { readFrom } from '../../fixtures/game/read.ts'
import { linksFiles } from '../../fixtures/links-game/links.ts'
import { linksMap } from '../../fixtures/links-game/read.ts'
import { openedGameWith } from '../../fixtures/open-game-with.ts'

const loaded = await loadGame(readFrom(linksMap()))
if (!loaded.ok) throw new Error('the links game did not load')
const content: GameContent = loaded.value
const game = await openedGameWith((text) => `v${text.length}`, linksFiles())
const working = startEdits(game).now

let box: HTMLDivElement
let mounted: ReturnType<typeof mount> | undefined
let went: string[]
let picks: (string | undefined)[]

function size(w: number, h: number): void {
  box.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:${h}px;display:flex;flex-direction:column`
}
beforeEach(() => {
  box = document.createElement('div')
  size(820, 600)
  document.body.append(box)
  went = []
  picks = []
})
afterEach(() => {
  if (mounted) void unmount(mounted)
  mounted = undefined
  box.remove()
})

async function show(now: Working = working): Promise<void> {
  mounted = mount(MapPart, {
    target: box,
    props: {
      content,
      pictures: [],
      working: now,
      lang: 'en',
      picked: undefined,
      onpick: (level: string | undefined) => picks.push(level),
      ongo: (level: string) => went.push(level),
    },
  })
  await tick()
  await vi.waitFor(() => expect(box.querySelector('[data-level]')).not.toBeNull())
}
const marks = (kind: string): HTMLElement[] => [...box.querySelectorAll<HTMLElement>(`[data-mark="${kind}"]`)]
const levels = (): HTMLElement[] => [...box.querySelectorAll<HTMLElement>('[data-level]')]
const inside = (el: HTMLElement): boolean => {
  const at = el.getBoundingClientRect()
  const sheet = box.getBoundingClientRect()
  return (
    at.left >= sheet.left - 0.5 &&
    at.top >= sheet.top - 0.5 &&
    at.right <= sheet.right + 0.5 &&
    at.bottom <= sheet.bottom + 0.5
  )
}

test('the links game shows three levels, one bar, three arrows, the start mark and the key, each by name', async () => {
  await show()
  expect(levels().map((el) => el.dataset.level)).toEqual(['room-1', 'room-2', 'room-3'])
  expect(levels().map((el) => el.getAttribute('aria-label'))).toEqual(['Room 1', 'Room 2', 'Room 3'])
  expect(marks('join')).toHaveLength(1)
  expect(marks('join')[0]?.getAttribute('aria-label')).toBe('Players walk straight from Room 2 into Room 3')
  expect(marks('door')).toHaveLength(3)
  expect(marks('door')[0]?.getAttribute('aria-label')).toBe('A door in Room 1 leads to Room 2')
  expect(marks('wall')).toHaveLength(0)
  expect(marks('start')).toHaveLength(1)
  expect(marks('start')[0]?.dataset.on).toBe('room-1')
  const key = box.querySelector('[role="group"][aria-label="What the marks mean"]')
  expect(key?.textContent).toContain('Players walk straight across')
  expect(key?.textContent).toContain('Through a door')
  expect(key?.textContent).toContain('Where the game starts')
})

test('every level is fully inside the window when the map opens, even on a phone', async () => {
  size(390, 600)
  await show()
  for (const el of levels()) expect(inside(el), el.dataset.level).toBe(true)
})

test('64 levels still open fitted, and every one is inside the window', async () => {
  const room = working.levels['room-1'] as Level
  const many: Record<string, Level> = {}
  const placed: { level: string; at: { x: number; y: number } }[] = []
  for (let n = 0; n < 64; n += 1) {
    const id = `level-${n + 1}`
    many[id] = { ...room, id, things: [] }
    placed.push({ level: id, at: { x: (n % 8) * 18, y: Math.floor(n / 8) * 11 } })
  }
  size(390, 700)
  await show({ ...working, levels: many, world: { format: 1, id: 'world', levels: placed } })
  expect(levels()).toHaveLength(64)
  for (const el of levels()) expect(inside(el), el.dataset.level).toBe(true)
})

test('each level is reached by Tab, picked by a click and opened by Enter', async () => {
  await show()
  await userEvent.tab()
  expect(document.activeElement).toBe(levels()[0])
  await userEvent.tab()
  expect(document.activeElement).toBe(levels()[1])
  await userEvent.keyboard('{Enter}')
  expect(went).toEqual(['room-2'])
  levels()[2]?.click()
  expect(picks.at(-1)).toBe('room-3')
})
