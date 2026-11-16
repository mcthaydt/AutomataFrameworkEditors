// The small map in each real browser: absent when the whole level is on screen, and moved by a tap, a drag and the keys.
import { type Level, levelSize, loadGame } from '@automataframework/framework/headless'
import { mount, tick, unmount } from 'svelte'
import { afterEach, beforeEach, expect, test } from 'vitest'
import MiniMap from '#src/features/levels/MiniMap.svelte'
import { type Camera, wholeLevel } from '#src/features/levels/view.ts'
import { fixtureFiles, LEVEL_PATH, readFrom } from '../../fixtures/game/read.ts'

const loaded = await loadGame(readFrom(fixtureFiles))
if (!loaded.ok) throw new Error('the fixture game did not load')
const level = loaded.value.levels[LEVEL_PATH.replace(/^.*\/|\.json$/g, '')] as Level
const size = levelSize(level)
const screen = { w: 820, h: 600 }

let box: HTMLDivElement
let mounted: ReturnType<typeof mount> | undefined
let moves: Camera[]

beforeEach(() => {
  box = document.createElement('div')
  box.style.cssText = `position:fixed;left:0;top:0;width:${screen.w}px;height:${screen.h}px`
  document.body.append(box)
  moves = []
})
afterEach(() => {
  if (mounted) void unmount(mounted)
  mounted = undefined
  box.remove()
})

async function show(camera: Camera): Promise<void> {
  mounted = mount(MiniMap, {
    target: box,
    props: { level, camera, screen, lang: 'en', onmove: (c: Camera) => moves.push(c) },
  })
  await tick()
}
const slider = (): HTMLElement | null => box.querySelector('[role="slider"]')
const map = (): HTMLElement => {
  const found = box.querySelector<HTMLElement>('.map')
  if (!found) throw new Error('no small map')
  return found
}

test('the small map is absent while the whole level is on screen', async () => {
  await show(wholeLevel(level, screen, { top: 0, right: 0, bottom: 0, left: 0 }))
  expect(slider()).toBeNull()
})

test('it shows when part of the level is off the screen, and its box is a slider with a name', async () => {
  await show({ x: size.w / 2, y: size.h / 2, scale: 96 })
  const found = slider()
  expect(found).not.toBeNull()
  expect(found?.getAttribute('aria-label')).toBe('The part you can see')
  expect(found?.getAttribute('aria-valuetext')).toContain('across')
})

test('a tap on the map goes there, and a drag keeps going', async () => {
  await show({ x: size.w / 2, y: size.h / 2, scale: 96 })
  const at = map().getBoundingClientRect()
  map().dispatchEvent(
    new PointerEvent('pointerdown', {
      pointerId: 1,
      clientX: at.left + at.width * 0.25,
      clientY: at.top + 4,
      bubbles: true,
    }),
  )
  map().dispatchEvent(
    new PointerEvent('pointermove', {
      pointerId: 1,
      clientX: at.left + at.width * 0.75,
      clientY: at.top + 4,
      bubbles: true,
    }),
  )
  map().dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, bubbles: true }))
  expect(moves.length).toBeGreaterThanOrEqual(2)
  const [first, second] = moves as [Camera, Camera]
  expect(first.x).toBeCloseTo(size.w * 0.25, 0)
  expect(second.x).toBeCloseTo(size.w * 0.75, 0)
  expect(second.scale).toBe(96)
})

test('the arrow keys move the box one tile', async () => {
  await show({ x: 8, y: 4.5, scale: 96 })
  const found = slider()
  found?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
  found?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
  expect(moves).toEqual([
    { x: 9, y: 4.5, scale: 96 },
    { x: 8, y: 3.5, scale: 96 },
  ])
})
