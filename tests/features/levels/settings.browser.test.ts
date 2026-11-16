// A picked thing's settings in each real browser: every control keeps to its limits, a value put back to its default
// leaves no key in the level, a value the character does not declare is shown and never edited, what a switch opens is a
// list with "Nothing" first, a door says where it leads, and several things show "Not the same" where they differ.
import { type GameContent, type Level, loadGame } from '@automataframework/framework/headless'
import { mount, tick, unmount } from 'svelte'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { fixtureFiles, LEVEL_PATH, readFrom } from '../../fixtures/game/read.ts'
import { linksMap } from '../../fixtures/links-game/read.ts'
import SettingsHolder from './SettingsHolder.svelte'

const links = await loadGame(readFrom(linksMap()))
if (!links.ok) throw new Error('the links game did not load')
const linksContent: GameContent = links.value
const crates = await loadGame(readFrom({ ...fixtureFiles }))
if (!crates.ok) throw new Error('the Crate Game did not load')
const crateContent: GameContent = crates.value
const crateLevel = JSON.parse(fixtureFiles[LEVEL_PATH] ?? '{}') as Level
const room1 = linksContent.levels['room-1'] as Level
const room2 = linksContent.levels['room-2'] as Level

let box: HTMLDivElement
let mounted: ReturnType<typeof mount> | undefined
let held: { now(): Level; steps(): number; undo(): void }

beforeEach(() => {
  box = document.createElement('div')
  box.className = 'look'
  box.style.cssText = 'position:fixed;left:0;top:0;width:340px;height:700px;overflow:auto'
  document.body.append(box)
})
afterEach(() => {
  if (mounted) void unmount(mounted)
  mounted = undefined
  box.remove()
})

async function show(
  content: GameContent,
  start: Level,
  ids: readonly string[],
  over: Record<string, unknown> = {},
): Promise<void> {
  const made = mount(SettingsHolder, { target: box, props: { content, start, ids, ...over } })
  mounted = made
  held = made as unknown as typeof held
  await tick()
}
const thing = (id: string) => held.now().things.find((t) => t.id === id)
const value = (id: string): HTMLElement => {
  const found = box.querySelector<HTMLElement>(`[data-value="${id}"]`)
  if (found === null) throw new Error(`no value ${id}`)
  return found
}
const named = (name: string): HTMLButtonElement => {
  const found = [...box.querySelectorAll<HTMLButtonElement>('button')].find(
    (b) => (b.getAttribute('aria-label') ?? b.textContent ?? '').trim() === name,
  )
  if (found === undefined) throw new Error(`no button called ${name}`)
  return found
}

test('typing 99 into a number with a limit of 8 gives 8, and the pad and the slider hold the same limits', async () => {
  await show(linksContent, room2, ['critter-1'])
  await userEvent.click(value('reach').querySelector('button.num') as HTMLElement)
  const field = box.querySelector<HTMLInputElement>('input[inputmode="decimal"]') as HTMLInputElement
  await userEvent.clear(field)
  await userEvent.type(field, '99{Enter}')
  expect(thing('critter-1')?.values).toMatchObject({ reach: 8 })
  const range = value('reach').querySelector<HTMLInputElement>('input[type="range"]') as HTMLInputElement
  expect([range.min, range.max, range.step]).toEqual(['1', '8', '0.5'])
  await userEvent.clear(field)
  await userEvent.type(field, '0{Enter}')
  expect(thing('critter-1')?.values).toMatchObject({ reach: 1 })
})

test('a value put back to its default leaves no key, and the settings of the Crate Game hold "How heavy" to halves', async () => {
  await show(crateContent, crateLevel, ['crate-1'])
  const range = value('heavy').querySelector<HTMLInputElement>('input[type="range"]') as HTMLInputElement
  expect([range.min, range.max, range.step]).toEqual(['0.5', '4', '0.5'])
  await userEvent.click(value('heavy').querySelector('button.num') as HTMLElement)
  const field = box.querySelector<HTMLInputElement>('input[inputmode="decimal"]') as HTMLInputElement
  await userEvent.clear(field)
  await userEvent.type(field, '2.5{Enter}')
  expect(thing('crate-1')?.values).toEqual({ heavy: 2.5 })
  await userEvent.clear(field)
  await userEvent.type(field, '1{Enter}')
  expect(thing('crate-1')?.values).toBeUndefined()
  expect(box.textContent).toContain('Every crate starts like this: a change here is for this one only')
})

test('"Every crate starts like this" is under a crate\'s values and absent for a character with none', async () => {
  await show(linksContent, room1, ['exit'])
  expect(box.textContent).not.toContain('starts like this')
  void unmount(mounted as never)
  box.replaceChildren()
  await show(linksContent, room2, ['critter-1'])
  expect(box.textContent).toContain('Every critter starts like this: a change here is for this one only')
})

test('a value the character does not declare is shown and has no control', async () => {
  const odd: Level = {
    ...room2,
    things: room2.things.map((t) => (t.id === 'critter-1' ? { ...t, values: { ...t.values, speed: 7 } } : t)),
  }
  await show(linksContent, odd, ['critter-1'])
  const speed = value('speed')
  expect(speed.textContent).toContain('7')
  expect(speed.querySelector('input, button, select')).toBeNull()
})

test('past the first four values the rest wait behind "N more settings"', async () => {
  const many: Level = {
    ...room2,
    things: room2.things.map((t) =>
      t.id === 'critter-1' ? { ...t, values: { ...t.values, speed: 7, jump: 2, luck: 1 } } : t,
    ),
  }
  await show(linksContent, many, ['critter-1'])
  expect(box.querySelector('[data-value="luck"]')).toBeNull()
  await userEvent.click(named('1 more setting'))
  expect(value('luck').textContent).toContain('1')
})

test('what a switch opens is a list with "Nothing" first, and each press is one step', async () => {
  await show(linksContent, room1, ['plate-1'])
  const list = value('opens').querySelectorAll('.opens button')
  expect([...list].map((b) => b.textContent?.trim())).toEqual(['Nothing', 'Gate 1'])
  await userEvent.click(named('Nothing'))
  expect(thing('plate-1')?.values).toBeUndefined()
  await userEvent.click(named('Gate 1'))
  expect(thing('plate-1')?.values).toEqual({ opens: ['gate-1'] })
  expect(held.steps()).toBe(2)
})

test('a door says where it leads, where you come out, and goes to look', async () => {
  const gone = vi.fn()
  await show(linksContent, room1, ['exit'], { ongo: gone, levelId: 'room-1' })
  const level = box.querySelector<HTMLSelectElement>('select') as HTMLSelectElement
  expect([...level.options].map((o) => o.textContent?.trim())).toEqual(['Nothing', 'Room 2', 'Room 3'])
  await userEvent.selectOptions(level, 'room-3')
  expect(thing('exit')?.values).toEqual({ to: { level: 'room-3' } })
  await userEvent.click(named('By a door'))
  expect(thing('exit')?.values).toEqual({ to: { level: 'room-3', thing: 'back' } })
  await userEvent.click(named('Go to Room 3'))
  expect(gone).toHaveBeenCalledWith('room-3')
})

test('several things show "Not the same" where they differ, and one change is for each of them', async () => {
  const two: Level = {
    ...room2,
    things: [
      ...room2.things.map((t) => (t.id === 'critter-1' ? { ...t, values: { ...t.values, reach: 5 } } : t)),
      { id: 'critter-2', character: 'critter', x: 4.5, y: 7.5 },
    ],
  }
  await show(linksContent, two, ['critter-1', 'critter-2'])
  expect(value('reach').textContent).toContain('Not the same')
  await userEvent.click(value('reach').querySelector('button.num') as HTMLElement)
  const field = box.querySelector<HTMLInputElement>('input[inputmode="decimal"]') as HTMLInputElement
  await userEvent.clear(field)
  await userEvent.type(field, '6{Enter}')
  expect(thing('critter-1')?.values).toMatchObject({ reach: 6 })
  expect(thing('critter-2')?.values).toEqual({ reach: 6 })
  await vi.waitFor(() => expect(value('reach').textContent).not.toContain('Not the same'))
})

test('the first thing a person sees of a thing is its settings, and each control is at least 44 by 44', async () => {
  await show(crateContent, crateLevel, ['crate-1'])
  const small = [...box.querySelectorAll<HTMLElement>('button, input, select, summary')].filter((one) => {
    const { width, height } = one.getBoundingClientRect()
    return width > 0 && (width < 44 || height < 44)
  })
  expect(small.map((one) => one.outerHTML.slice(0, 60))).toEqual([])
})
