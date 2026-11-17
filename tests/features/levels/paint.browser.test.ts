// Painting what the ground is, in each real browser: one stroke is one step back, Box, Fill and Erase, what is left alone
// and said so, the Show choices that change the picture, and the Pencil (it does the tool, a finger slides the view).
import { type GameContent, type Level, loadGame } from '@automataframework/framework/headless'
import { mount, tick, unmount } from 'svelte'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { bytesToBase64 } from '#src/lib/base64.ts'
import { groundPicture } from '../../fixtures/game/ground-picture.ts'
import { fixtureFiles, LEVEL_PATH, readFrom } from '../../fixtures/game/read.ts'
import Holder from './Holder.svelte'

const loaded = await loadGame(readFrom({ ...fixtureFiles }))
if (!loaded.ok) throw new Error('the fixture game did not load')
const content: GameContent = loaded.value
const level1 = JSON.parse(fixtureFiles[LEVEL_PATH] ?? '{}') as Level
const pictures = [{ path: 'art/ground.png', base64: bytesToBase64(groundPicture()) }]

interface Held {
  now(): Level
  pastNow(): number
  letterNow(): string | undefined
  setShow(next: Record<string, unknown>): void
  setLetter(next: string | undefined): void
  setHeld(ids: readonly string[]): void
  undo(): void
}
let box: HTMLDivElement
let mounted: ReturnType<typeof mount> | undefined
let held: Held

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

async function show(props: Record<string, unknown> = {}, start: Level = level1): Promise<HTMLElement> {
  const made = mount(Holder, { target: box, props: { content, pictures, start, tool: 'paint', ...props } })
  mounted = made
  held = made as unknown as Held
  held.setLetter('#')
  await tick()
  await vi.waitFor(() => expect(box.querySelector('[data-thing]')).not.toBeNull())
  return box.querySelector<HTMLElement>('[data-scale]') as HTMLElement
}

/** The middle of a tile, in the page's pixels: the level is 16 by 9 tiles, fitted to the stage. */
function at(stage: HTMLElement, col: number, row: number): { x: number; y: number } {
  const r = stage.getBoundingClientRect()
  const scale = Number(stage.dataset.scale)
  return {
    x: r.left + r.width / 2 + (col + 0.5 - 8) * scale,
    y: r.top + r.height / 2 + (row + 0.5 - 4.5) * scale,
  }
}
function send(stage: HTMLElement, type: string, to: { x: number; y: number }, kind = 'touch', id = 1): void {
  stage.dispatchEvent(
    new PointerEvent(type, {
      pointerId: id,
      pointerType: kind,
      clientX: to.x,
      clientY: to.y,
      buttons:
        type === 'pointerup' || type === 'pointercancel' || (kind === 'pen' && type === 'pointermove')
          ? 0
          : 1,
      bubbles: true,
    }),
  )
}
async function drag(
  stage: HTMLElement,
  from: { x: number; y: number },
  to: { x: number; y: number },
  kind = 'touch',
) {
  send(stage, 'pointerdown', from, kind)
  for (const f of [0.2, 0.4, 0.6, 0.8, 1]) {
    send(stage, 'pointermove', { x: from.x + (to.x - from.x) * f, y: from.y + (to.y - from.y) * f }, kind)
    await tick()
  }
  send(stage, 'pointerup', to, kind)
  await tick()
}
const row = (r: number): string => held.now().tiles[r] ?? ''
const said = (): string => box.querySelector('[role=status]')?.textContent ?? box.textContent ?? ''

test('one drag across twelve tiles paints them, and one step back takes them all away', async () => {
  const stage = await show()
  await drag(stage, at(stage, 2, 2), at(stage, 13, 2))
  expect(row(2)).toBe('#.############.#')
  expect(held.pastNow()).toBe(1)
  held.undo()
  await tick()
  expect(held.now()).toEqual(level1)
})

test('Box paints an area, Fill paints what is joined, Erase empties, and each is one step back', async () => {
  const stage = await show()
  held.setHeld(['box'])
  await drag(stage, at(stage, 2, 2), at(stage, 4, 3))
  expect(row(2).slice(2, 5)).toBe('###')
  expect(row(3).slice(2, 5)).toBe('###')
  expect(held.pastNow()).toBe(1)
  held.undo()
  await tick()
  expect(held.now()).toEqual(level1)

  held.setHeld(['fill'])
  const bit = at(stage, 5, 4)
  send(stage, 'pointerdown', bit)
  send(stage, 'pointerup', bit)
  await tick()
  // Everything joined to it is painted, except where the crate and the start stand.
  expect(
    held
      .now()
      .tiles.slice(0, 7)
      .every((r) => r.slice(1, 15) === '#'.repeat(14)),
  ).toBe(true)
  expect(row(7)).toBe('##.###.#########')
  expect(held.pastNow()).toBe(1)
  held.undo()
  await tick()
  expect(held.now()).toEqual(level1)

  held.setHeld(['erase'])
  await drag(stage, at(stage, 3, 8), at(stage, 6, 8))
  expect(row(8).slice(3, 7)).not.toBe('####')
  expect(held.pastNow()).toBe(1)
  held.undo()
  await tick()
  expect(held.now()).toEqual(level1)
})

test('a spot with a thing on it is left as it was, and the note says so', async () => {
  const stage = await show()
  // The crate stands on column 6, row 7.
  await drag(stage, at(stage, 4, 7), at(stage, 8, 7))
  expect(row(7)[6]).toBe('.')
  expect(row(7)[5]).toBe('#')
  expect(row(7)[7]).toBe('#')
  expect(said()).toContain('Left the spots with things on them as they were')
})

test('press and hold on the level picks the kind of ground that is there', async () => {
  const stage = await show()
  held.setLetter('~')
  const wall = at(stage, 0, 4)
  send(stage, 'pointerdown', wall)
  await new Promise((done) => setTimeout(done, 620))
  send(stage, 'pointerup', wall)
  await tick()
  expect(held.letterNow()).toBe('#')
  expect(held.now()).toEqual(level1)
})

test('the tray names each kind, and pressing one is what the next stroke paints', async () => {
  await show()
  const names = [...box.querySelectorAll<HTMLElement>('button.one[data-kind]')].map((el) =>
    el.textContent?.trim(),
  )
  expect(names).toEqual(['Ground', 'Water'])
  box.querySelector<HTMLElement>('button.one[data-kind="~"]')?.click()
  await tick()
  expect(held.letterNow()).toBe('~')
})

test('painting over an edge that touches another level says the way across closed, then open', async () => {
  const open = (l: Level): boolean => [3, 4].every((r) => l.tiles[r]?.[15] !== '#')
  const edgesFor = (l: Level) =>
    open(l) ? [{ side: 'right' as const, from: 3, to: 5, other: 'level-2' }] : []
  const walled: Level = {
    ...level1,
    tiles: level1.tiles.map((t, r) => (r === 3 || r === 4 ? `${t.slice(0, 15)}.` : t)),
  }
  const stage = await show({ edgesFor }, walled)
  await drag(stage, at(stage, 15, 3), at(stage, 15, 4))
  expect(said()).toContain('The way across to Level 2 is closed now')
  held.setHeld(['erase'])
  await drag(stage, at(stage, 15, 3), at(stage, 15, 4))
  expect(said()).toContain('The way across to Level 2 is open now')
})

test('the things go faint while the ground is picked, and Show what it is tints the tiles', async () => {
  const stage = await show()
  await vi.waitFor(() => expect(box.querySelector('canvas')).not.toBeNull())
  const canvas = box.querySelector('canvas') as HTMLCanvasElement
  const colour = (col: number, r: number): string => {
    const copy = document.createElement('canvas')
    copy.width = canvas.width
    copy.height = canvas.height
    copy.getContext('2d')?.drawImage(canvas, 0, 0)
    const p = at(stage, col, r)
    const rect = canvas.getBoundingClientRect()
    const ratio = canvas.width / rect.width
    const data = copy
      .getContext('2d')
      ?.getImageData(Math.round((p.x - rect.left) * ratio), Math.round((p.y - rect.top) * ratio), 1, 1).data
    return `${data?.[0]},${data?.[1]},${data?.[2]}`
  }
  await vi.waitFor(() => expect(colour(6, 7)).not.toBe('201,162,39'))
  const wall = colour(0, 3)
  held.setShow({ whatItIs: true })
  await vi.waitFor(() => expect(colour(0, 3)).not.toBe(wall))
})

test('with a Pencil, the Pencil paints and a finger slides the view and changes no tile', async () => {
  const stage = await show({ pen: true })
  await drag(stage, at(stage, 2, 2), at(stage, 6, 2), 'pen')
  expect(row(2).slice(2, 7)).toBe('#####')
  held.undo()
  await tick()
  const crate = box.querySelector<HTMLElement>('[data-thing="crate-1"]') as HTMLElement
  const before = crate.getBoundingClientRect().left
  await drag(stage, at(stage, 2, 2), at(stage, 6, 2), 'touch')
  expect(held.now()).toEqual(level1)
  expect(held.pastNow()).toBe(0)
  // The finger slid the picture along with it.
  expect(crate.getBoundingClientRect().left).toBeGreaterThan(before + 20)
})

test('with Draw with a finger too on, a finger paints even after a Pencil was seen', async () => {
  const stage = await show({ pen: true, fingerDraws: true })
  await drag(stage, at(stage, 2, 2), at(stage, 6, 2), 'touch')
  expect(row(2).slice(2, 7)).toBe('#####')
})

test('a hovering Pencil shows the brush outline and changes nothing', async () => {
  const stage = await show({ pen: true })
  send(stage, 'pointermove', at(stage, 5, 2), 'pen')
  await tick()
  const outline = box.querySelector<HTMLElement>('[data-hover="paint"]')
  expect(outline).not.toBeNull()
  const r = outline?.getBoundingClientRect()
  const centre = at(stage, 5, 2)
  expect(Math.abs((r?.left ?? 0) + (r?.width ?? 0) / 2 - centre.x)).toBeLessThan(2)
  expect(held.now()).toEqual(level1)
  expect(held.pastNow()).toBe(0)
})
