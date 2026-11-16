// The marks over a level in each real browser: each is a real button with the thing's name, the picked one is ringed with
// four handles, and Tab goes through the things in the order the level lists them.
import { type Level, loadGame } from '@automataframework/framework/headless'
import { mount, tick, unmount } from 'svelte'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import Marks from '#src/features/levels/Marks.svelte'
import { marksFor } from '#src/features/levels/marks.ts'
import type { Way } from '#src/features/levels/nudge.ts'
import { nameOf } from '#src/features/words/words.ts'
import { readFrom } from '../../fixtures/game/read.ts'
import { linksMap } from '../../fixtures/links-game/read.ts'

const loaded = await loadGame(readFrom(linksMap()))
if (!loaded.ok) throw new Error('the links game did not load')
const characters = loaded.value.characters
const level = loaded.value.levels['room-1'] as Level
const screen = { w: 820, h: 460 }
const marks = marksFor(
  level,
  characters,
  {
    tool: 'pick',
    picked: [],
    locked: new Set(),
    hidden: new Set(),
    camera: { x: 8, y: 4.5, scale: 50 },
    ground: false,
  },
  screen,
  nameOf,
)

let box: HTMLDivElement
let mounted: ReturnType<typeof mount> | undefined
let picks: string[]
let nudges: [string, Way][]

beforeEach(() => {
  box = document.createElement('div')
  box.style.cssText = `position:fixed;left:0;top:0;width:${screen.w}px;height:${screen.h}px`
  document.body.append(box)
  picks = []
  nudges = []
})
afterEach(() => {
  if (mounted) void unmount(mounted)
  mounted = undefined
  box.remove()
})

async function show(picked: readonly string[] = [], readOnly = false): Promise<void> {
  mounted = mount(Marks, {
    target: box,
    props: {
      marks,
      picked,
      readOnly,
      onpick: (id: string) => picks.push(id),
      onnudge: (id: string, way: Way) => nudges.push([id, way]),
    },
  })
  await tick()
}
const named = (name: string): HTMLButtonElement => {
  const found = [...box.querySelectorAll<HTMLButtonElement>('button')].find(
    (b) => b.getAttribute('aria-label') === name,
  )
  if (!found) throw new Error(`no mark called ${name}`)
  return found
}

test('each thing is a real button found by its name, at least 44 by 44', async () => {
  await show()
  for (const thing of level.things) {
    const button = named(nameOf(thing.id))
    const r = button.getBoundingClientRect()
    expect(r.width, thing.id).toBeGreaterThanOrEqual(43.9)
    expect(r.height, thing.id).toBeGreaterThanOrEqual(43.9)
  }
})

test('the picked crate has an accent ring with four handles, and the others have none', async () => {
  await show(['crate-1'])
  expect(named('Crate 1').querySelectorAll('.ring .handle')).toHaveLength(4)
  expect(named('Gate 1').querySelector('.ring')).toBeNull()
  expect(named('Crate 1').getAttribute('aria-pressed')).toBe('true')
  expect(named('Gate 1').getAttribute('aria-pressed')).toBe('false')
})

test('Tab goes through the things in the order of the level, and the arrows nudge the one that is focused', async () => {
  await show()
  const first = box.querySelector<HTMLButtonElement>('button')
  first?.focus()
  const seen: string[] = [first?.getAttribute('aria-label') ?? '']
  for (let i = 1; i < level.things.length; i++) {
    await userEvent.tab()
    seen.push(document.activeElement?.getAttribute('aria-label') ?? '')
  }
  expect(seen).toEqual(level.things.map((t) => nameOf(t.id)))
  await userEvent.keyboard('{ArrowLeft}')
  expect(nudges).toEqual([[level.things.at(-1)?.id ?? '', 'left']])
})

test('a key press on a mark picks it, and a looking-only view picks nothing', async () => {
  await show()
  named('Crate 1').focus()
  expect(picks).toContain('crate-1')
  picks.length = 0
  await userEvent.keyboard('{Enter}')
  expect(picks).toEqual(['crate-1'])
  void unmount(mounted as ReturnType<typeof mount>)
  box.replaceChildren()
  picks.length = 0
  await show([], true)
  named('Crate 1').focus()
  await userEvent.keyboard('{ArrowRight}')
  expect(picks).toEqual([])
  expect(nudges).toEqual([])
})
