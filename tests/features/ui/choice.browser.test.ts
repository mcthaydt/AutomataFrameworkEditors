// A Choice is a real radio group, and two of them on a page never share the arrow keys.
import { mount, tick, unmount } from 'svelte'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { Choice } from '#src/features/ui/ui.ts'

let box: HTMLDivElement
const mounted: Array<ReturnType<typeof mount>> = []

beforeEach(() => {
  box = document.createElement('div')
  document.body.append(box)
})
afterEach(() => {
  for (const one of mounted) void unmount(one)
  mounted.length = 0
  box.remove()
  vi.restoreAllMocks()
})

const props = {
  label: 'Who may',
  options: [
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
  ],
  value: 'a',
  onchange: () => {},
}
const nameOf = (group: Element): string | null => group.querySelector('input')?.getAttribute('name') ?? null

test('two Choices on a page do not share a group', async () => {
  for (let i = 0; i < 2; i += 1) {
    const target = document.createElement('div')
    box.append(target)
    mounted.push(mount(Choice, { target, props }))
  }
  await tick()
  const [first, second] = [...box.querySelectorAll('[role="radiogroup"]')]
  expect(first).toBeDefined()
  expect(second).toBeDefined()
  expect(nameOf(first as Element)).not.toBeNull()
  expect(nameOf(first as Element)).not.toBe(nameOf(second as Element))
})

test('a Choice mounted twice with the same props gets a name without Math.random', async () => {
  const random = vi.spyOn(Math, 'random')
  for (let i = 0; i < 2; i += 1) {
    const target = document.createElement('div')
    box.append(target)
    mounted.push(mount(Choice, { target, props }))
  }
  await tick()
  expect(random).not.toHaveBeenCalled()
})
