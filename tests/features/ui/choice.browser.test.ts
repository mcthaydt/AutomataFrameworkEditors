// The Choice in each real browser: rows a finger can hit, taps, arrow keys, one checked, and the hints shown.
import { mount, tick, unmount } from 'svelte'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { Choice } from '#src/features/ui/ui.ts'

const OPTIONS = [
  { value: 'nothing', label: "Can't get in", hint: 'Only the people below can open the game.' },
  { value: 'look', label: 'Look', hint: 'Can see the game.' },
  { value: 'suggest', label: 'Suggest', hint: 'Can change things.' },
]
let box: HTMLDivElement
let mounted: ReturnType<typeof mount> | undefined
let chosen: string[]

beforeEach(() => {
  box = document.createElement('div')
  box.style.cssText = 'position:fixed;left:0;top:0;width:390px'
  document.body.append(box)
  chosen = []
  mounted = mount(Choice, {
    target: box,
    props: { label: 'Anyone:', options: OPTIONS, value: 'look', onchange: (v: string) => chosen.push(v) },
  })
})
afterEach(() => {
  if (mounted) void unmount(mounted)
  mounted = undefined
  box.remove()
})
const radios = (): HTMLInputElement[] => [...box.querySelectorAll<HTMLInputElement>('input[type=radio]')]
const rows = (): HTMLElement[] => [...box.querySelectorAll<HTMLElement>('label.row')]

test('it is a radio group with a name', async () => {
  await tick()
  expect(box.querySelector('[role=radiogroup]')?.getAttribute('aria-label')).toBe('Anyone:')
})

test('each option row is at least 48 px tall', async () => {
  await tick()
  expect(rows()).toHaveLength(3)
  for (const row of rows()) expect(row.getBoundingClientRect().height).toBeGreaterThanOrEqual(48)
})

test('the hints are shown under the names, and exactly one is checked', async () => {
  await tick()
  for (const option of OPTIONS) expect(box.textContent).toContain(option.hint)
  expect(
    radios()
      .filter((r) => r.checked)
      .map((r) => r.value),
  ).toEqual(['look'])
})

test('tapping a row calls onchange with its value', async () => {
  await tick()
  await userEvent.click(rows()[2] as HTMLElement)
  expect(chosen).toEqual(['suggest'])
})

test('the arrow keys move the choice', async () => {
  await tick()
  radios()[1]?.focus()
  await userEvent.keyboard('{ArrowDown}')
  expect(chosen.at(-1)).toBe('suggest')
  await userEvent.keyboard('{ArrowUp}')
  expect(chosen.at(-1)).toBe('look')
})
