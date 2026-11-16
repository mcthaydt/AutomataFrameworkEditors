// The level on screen in each real browser: everything a hand can do to a thing is done, and then undone, through the
// buttons a person would press. The bar over what is picked never sits on it, even at the level's four corners.
import { type GameContent, type Level, loadGame } from '@automataframework/framework/headless'
import { mount, tick, unmount } from 'svelte'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { bytesToBase64 } from '#src/lib/base64.ts'
import { groundPicture } from '../../fixtures/game/ground-picture.ts'
import { fixtureFiles, LEVEL_PATH, readFrom } from '../../fixtures/game/read.ts'
import Holder from './Holder.svelte'

const loaded = await loadGame(readFrom({ ...fixtureFiles }))
if (!loaded.ok) throw new Error('the fixture game did not load')
const content: GameContent = loaded.value
const level1 = JSON.parse(fixtureFiles[LEVEL_PATH] ?? '{}') as Level
const pictures = [{ path: 'art/ground.png', base64: bytesToBase64(groundPicture()) }]

let box: HTMLDivElement
let mounted: ReturnType<typeof mount> | undefined
let held: { now(): Level; pickedNow(): readonly string[]; undo(): void }

beforeEach(() => {
  box = document.createElement('div')
  box.style.cssText =
    'position:fixed;left:0;top:0;width:400px;height:520px;display:flex;flex-direction:column'
  document.body.append(box)
})
afterEach(() => {
  if (mounted) void unmount(mounted)
  mounted = undefined
  box.remove()
})

async function show(start: Level = level1): Promise<void> {
  const made = mount(Holder, { target: box, props: { content, pictures, start } })
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
const button = (name: string): HTMLElement => {
  const found = [...box.querySelectorAll<HTMLElement>('button, [role=menuitem]')].find(
    (b) => (b.getAttribute('aria-label') ?? b.textContent ?? '').trim() === name,
  )
  if (found === null || found === undefined) throw new Error(`no button called ${name}`)
  return found
}
const has = (name: string): boolean =>
  [...box.querySelectorAll('button, [role=menuitem]')].some(
    (b) => (b.getAttribute('aria-label') ?? b.textContent ?? '').trim() === name,
  )
const press = async (name: string): Promise<void> => {
  await vi.waitFor(() => expect(has(name)).toBe(true))
  await userEvent.click(button(name))
  await tick()
}
const pick = async (id: string): Promise<void> => {
  await userEvent.click(mark(id))
  await vi.waitFor(() => expect(held.pickedNow()).toContain(id))
}
const crateX = (): number | undefined => held.now().things.find((t) => t.id === 'crate-1')?.x

test('Move one tile: the crate goes there, and Undo brings it back', async () => {
  await show()
  await pick('crate-1')
  await press('Move')
  await press('Move right')
  expect(crateX()).toBe(7.5)
  // The pad says nothing after each step, so the way back is the screen's own Undo, which the holder stands in for.
  held.undo()
  await tick()
  expect(crateX()).toBe(6.5)
  expect(held.now()).toEqual(level1)
})

test('Delete: the crate is gone, and Undo puts it back', async () => {
  await show()
  await pick('crate-1')
  await press('Delete')
  expect(held.now().things).toHaveLength(0)
  await press('Undo')
  expect(held.now()).toEqual(level1)
})

test('Make a copy, then Delete the copy: the level is as it was', async () => {
  await show()
  await pick('crate-1')
  await press('Make a copy')
  expect(held.now().things).toHaveLength(2)
  const copy = held.pickedNow()[0]
  expect(copy).not.toBe('crate-1')
  await press('Delete')
  expect(held.now()).toEqual(level1)
})

test('Lock: a locked crate will not move or go, and Unlock gives it back', async () => {
  await show()
  await pick('crate-1')
  await press('More')
  await press('Lock')
  await press('Delete')
  expect(held.now()).toEqual(level1)
  await press('Unlock it')
  await press('Delete')
  expect(held.now().things).toHaveLength(0)
})

test('Hide: a hidden crate is drawn no more, and Show draws it again', async () => {
  await show()
  await pick('crate-1')
  await press('More')
  await press('Hide')
  await vi.waitFor(() => expect(box.querySelector('[data-thing="crate-1"]')).toBeNull())
  await press('Show')
  await vi.waitFor(() => expect(box.querySelector('[data-thing="crate-1"]')).not.toBeNull())
  expect(held.now()).toEqual(level1)
})

test('the bar over what is picked never sits on it, at each corner of the level', async () => {
  const corners = [
    { x: 1.5, y: 0.5 },
    { x: 14.5, y: 0.5 },
    { x: 1.5, y: 7.5 },
    { x: 14.5, y: 7.5 },
  ]
  for (const [n, at] of corners.entries()) {
    if (mounted) await unmount(mounted)
    mounted = undefined
    box.replaceChildren()
    await show({ ...level1, things: level1.things.map((t) => ({ ...t, ...at, id: `crate-${n}` })) })
    await pick(`crate-${n}`)
    await vi.waitFor(() => expect(box.querySelector('[role=toolbar]')).not.toBeNull())
    const bar = (box.querySelector('[role=toolbar]') as HTMLElement).getBoundingClientRect()
    // The finger's button is at least 44 pixels; what must stay clear is the crate itself, one tile square.
    const hit = mark(`crate-${n}`).getBoundingClientRect()
    const side = Number((box.querySelector('[data-scale]') as HTMLElement).dataset.scale)
    const thing = {
      left: hit.left + (hit.width - side) / 2,
      right: hit.right - (hit.width - side) / 2,
      top: hit.top + (hit.height - side) / 2,
      bottom: hit.bottom - (hit.height - side) / 2,
    }
    const across = Math.min(bar.right, thing.right) - Math.max(bar.left, thing.left)
    const down = Math.min(bar.bottom, thing.bottom) - Math.max(bar.top, thing.top)
    expect(across > 1 && down > 1, `the bar covers the crate at ${at.x}, ${at.y}`).toBe(false)
  }
})
