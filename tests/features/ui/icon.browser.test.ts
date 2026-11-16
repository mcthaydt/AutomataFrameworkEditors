import { mount, tick, unmount } from 'svelte'
import { afterEach, expect, test } from 'vitest'
import { ICONS, Icon, type IconName } from '#src/features/ui/ui.ts'

let box: HTMLDivElement | undefined
let mounted: ReturnType<typeof mount> | undefined
afterEach(() => {
  if (mounted) void unmount(mounted)
  mounted = undefined
  box?.remove()
})

test('an icon is a drawing that a screen reader skips', async () => {
  box = document.createElement('div')
  document.body.append(box)
  mounted = mount(Icon, { target: box, props: { name: 'cursor' } })
  await tick()
  const svg = box.querySelector('svg')
  expect(svg?.getAttribute('aria-hidden')).toBe('true')
  expect(svg?.querySelector('path')).not.toBeNull()
  expect(svg?.getAttribute('viewBox')).toBe('0 0 256 256')
})

test('every icon has drawing in it, and the five tools are there', () => {
  for (const [name, drawing] of Object.entries(ICONS)) expect(drawing, name).toContain('<')
  for (const tool of ['cursor', 'plus-circle', 'paint-brush', 'eraser', 'link'] as const)
    expect(ICONS[tool]).toBeDefined()
})

test('a name that is not an icon is a type error', () => {
  // @ts-expect-error 'nope' is not an IconName
  const bad: IconName = 'nope'
  expect(bad).toBe('nope')
})
