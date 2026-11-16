import { expect, test } from 'vitest'
import type { PointerKind } from '#src/features/device/pointer.ts'
import { type Act, createGestures, HOLD_MS, type PointerLike } from '#src/features/levels/gestures.ts'
import type { Tool } from '#src/features/shell/shell.ts'

interface Setup {
  tool?: Tool
  penSeen?: boolean
  fingerDraws?: boolean
}
const make = (setup: Setup = {}) =>
  createGestures({
    pointers: () => ({ last: 'touch', penSeen: setup.penSeen ?? false, hovering: false }),
    fingerDraws: () => setup.fingerDraws ?? false,
    tool: () => setup.tool ?? 'pick',
  })

const ev = (
  type: PointerLike['type'],
  id: number,
  x: number,
  y: number,
  t = 0,
  over: Partial<PointerLike> = {},
): PointerLike => ({
  type,
  id,
  kind: 'touch' as PointerKind,
  x,
  y,
  t,
  buttons: type === 'up' ? 0 : 1,
  ...over,
})

const play = (g: ReturnType<typeof make>, events: readonly PointerLike[]): Act[] =>
  events.flatMap((e) => [...g.feed(e)])
const kinds = (acts: readonly Act[]): string[] =>
  acts.map((a) => (a.kind === 'drag' ? `drag-${a.phase}${a.tool ? '' : '-view'}` : a.kind))

test('a finger that goes down and up is a tap, on what was under it', () => {
  const g = make()
  const acts = play(g, [ev('down', 1, 50, 60, 0, { on: 'crate-1' }), ev('up', 1, 52, 61, 90)])
  expect(acts).toEqual([{ kind: 'tap', at: { x: 52, y: 61 }, on: 'crate-1' }])
  expect(play(g, [ev('down', 2, 5, 5), ev('up', 2, 5, 5)])).toEqual([
    { kind: 'tap', at: { x: 5, y: 5 }, on: undefined },
  ])
})

test('a press that stays put for half a second is a hold, and then is not a tap', () => {
  const g = make()
  g.feed(ev('down', 1, 10, 10, 0, { on: 'crate-1' }))
  expect(g.tick(HOLD_MS - 1)).toEqual([])
  expect(g.tick(HOLD_MS)).toEqual([{ kind: 'hold', at: { x: 10, y: 10 }, on: 'crate-1' }])
  expect(g.tick(HOLD_MS + 100)).toEqual([])
  expect(g.feed(ev('up', 1, 10, 10, 700))).toEqual([])
})

test('a press that moves more than 8 pixels is never a hold, and under 8 still is', () => {
  const far = make()
  far.feed(ev('down', 1, 10, 10, 0))
  far.feed(ev('move', 1, 10, 19, 100))
  expect(far.tick(HOLD_MS + 50)).toEqual([])
  const near = make()
  near.feed(ev('down', 1, 10, 10, 0))
  near.feed(ev('move', 1, 14, 14, 100))
  expect(near.tick(HOLD_MS)).toHaveLength(1)
})

test('a finger on a thing drags it with the tool, from start to end', () => {
  const g = make({ tool: 'pick' })
  const acts = play(g, [
    ev('down', 1, 50, 50, 0, { on: 'crate-1' }),
    ev('move', 1, 53, 50, 10),
    ev('move', 1, 70, 52, 20),
    ev('move', 1, 90, 55, 30),
    ev('up', 1, 90, 55, 40),
  ])
  // The first 3 pixels are under the slop and say nothing.
  expect(kinds(acts)).toEqual(['drag-start', 'drag-move', 'drag-move', 'drag-end'])
  const end = acts.at(-1)
  expect(end).toMatchObject({
    kind: 'drag',
    phase: 'end',
    on: 'crate-1',
    tool: true,
    from: { x: 50, y: 50 },
    to: { x: 90, y: 55 },
  })
})

test('one finger on empty ground slides the view with Pick, and does the tool with any other tool', () => {
  const pick = make({ tool: 'pick' })
  const slid = play(pick, [
    ev('down', 1, 100, 100),
    ev('move', 1, 120, 110, 10),
    ev('move', 1, 130, 112, 20),
    ev('up', 1, 130, 112, 30),
  ])
  expect(kinds(slid)).toEqual(['view', 'view'])
  expect(slid[1]).toMatchObject({ kind: 'view', slide: { x: 10, y: 2 }, zoom: 1 })
  const place = make({ tool: 'place' })
  const drew = play(place, [ev('down', 1, 100, 100), ev('move', 1, 130, 100, 10), ev('up', 1, 130, 100, 20)])
  expect(kinds(drew)).toEqual(['drag-start', 'drag-move', 'drag-end'])
})

test('once a Pencil has been seen a finger slides the view with any tool, unless it was told to draw', () => {
  const slides = make({ tool: 'paint', penSeen: true, fingerDraws: false })
  expect(kinds(play(slides, [ev('down', 1, 0, 0), ev('move', 1, 30, 0, 5)]))).toEqual(['view'])
  const draws = make({ tool: 'paint', penSeen: true, fingerDraws: true })
  expect(kinds(play(draws, [ev('down', 1, 0, 0), ev('move', 1, 30, 0, 5)]))).toEqual([
    'drag-start',
    'drag-move',
  ])
})

test('a pen always does the tool, even on empty ground with Pick', () => {
  const g = make({ tool: 'pick', penSeen: true })
  const acts = play(g, [
    ev('down', 1, 100, 100, 0, { kind: 'pen' }),
    ev('move', 1, 140, 100, 10, { kind: 'pen' }),
    ev('up', 1, 140, 100, 20, { kind: 'pen' }),
  ])
  expect(kinds(acts)).toEqual(['drag-start', 'drag-move', 'drag-end'])
})

test('a pen moving with no button is a hover, and a mouse moving with none is nothing', () => {
  const g = make()
  expect(g.feed(ev('move', 9, 33, 44, 0, { kind: 'pen', buttons: 0 }))).toEqual([
    { kind: 'hover', at: { x: 33, y: 44 } },
  ])
  expect(g.feed(ev('move', 8, 33, 44, 0, { kind: 'mouse', buttons: 0 }))).toEqual([])
})

test('two fingers slide and zoom the view', () => {
  const g = make({ tool: 'place' })
  const acts = play(g, [
    ev('down', 1, 100, 100),
    ev('down', 2, 200, 100),
    ev('move', 2, 300, 100, 10),
    ev('move', 1, 100, 100, 20),
  ])
  expect(kinds(acts)).toEqual(['view', 'view'])
  const first = acts[0]
  if (first?.kind !== 'view') throw new Error('a view')
  expect(first.zoom).toBeCloseTo(2, 6)
  expect(first.slide).toEqual({ x: 50, y: 0 })
  expect(first.about).toEqual({ x: 200, y: 100 })
})

test('a second finger landing in the middle of a drag cancels the drag, and nothing is a tap or a drop after', () => {
  const g = make()
  const acts = play(g, [
    ev('down', 1, 50, 50, 0, { on: 'crate-1' }),
    ev('move', 1, 80, 50, 10),
    ev('down', 2, 200, 200, 20),
    ev('move', 2, 220, 200, 30),
    ev('up', 2, 220, 200, 40),
    ev('up', 1, 80, 50, 50),
  ])
  expect(kinds(acts)).toEqual(['drag-start', 'drag-move', 'drag-cancel', 'view'])
})

test('a cancelled pointer gives a drag up, and a tap that is cancelled is nothing', () => {
  const g = make()
  const acts = play(g, [
    ev('down', 1, 5, 5, 0, { on: 'crate-1' }),
    ev('move', 1, 40, 5, 10),
    ev('cancel', 1, 40, 5, 20),
  ])
  expect(kinds(acts)).toEqual(['drag-start', 'drag-move', 'drag-cancel'])
  expect(play(g, [ev('down', 2, 5, 5), ev('cancel', 2, 5, 5)])).toEqual([])
})
