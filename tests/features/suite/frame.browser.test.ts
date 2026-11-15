// The frame in each real browser: it is the box it is put in, it chooses its shape from that box, the pill shows the five
// editors (a row on a wide screen, a menu on a narrower one), an editor that is not built opens its card, and there is
// one heading.
import { mount, tick, unmount } from 'svelte'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { WORDS } from '../../fixtures/words.ts'
import FrameHost from '../../fixtures/FrameHost.svelte'

const SIZES = {
  phone: { w: 390, h: 844, shape: 'narrow' },
  phoneSideways: { w: 844, h: 390, shape: 'mid' },
  ipadUpright: { w: 820, h: 1180, shape: 'mid' },
  ipadSideways: { w: 1180, h: 820, shape: 'wide' },
  desktop: { w: 1440, h: 900, shape: 'wide' },
} as const
type SizeName = keyof typeof SIZES
const NAMES = Object.keys(SIZES) as SizeName[]

let box: HTMLDivElement
let mounted: ReturnType<typeof mount> | undefined
let told: string[]

beforeEach(() => {
  box = document.createElement('div')
  document.body.append(box)
  told = []
})
afterEach(() => {
  if (mounted) void unmount(mounted)
  mounted = undefined
  box.remove()
})

async function show(size: SizeName): Promise<void> {
  const { w, h } = SIZES[size]
  box.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:${h}px;display:flex;flex-direction:column`
  mounted = mount(FrameHost, { target: box, props: { told: (what: string) => told.push(what) } })
  await tick()
  await expect.poll(() => box.querySelector('[data-part="pill"]')).not.toBeNull()
}
const el = <T extends HTMLElement>(selector: string): T => {
  const found = box.querySelector<T>(selector)
  if (!found) throw new Error(`no ${selector}`)
  return found
}

test.each(NAMES)('at %s the frame is the box, and its shape comes from the box', async (name) => {
  await show(name)
  const { w, h, shape } = SIZES[name]
  const frame = el('[data-frame]')
  expect(frame.dataset.shape).toBe(shape)
  const r = frame.getBoundingClientRect()
  expect([r.width, r.height]).toEqual([w, h])
  expect(el('[data-page]').dataset.shapeOfPage).toBe(shape)
  expect(box.querySelectorAll('h1')).toHaveLength(1)
  expect(el('h1').textContent).toBe('Level 1')
  // The pill is top left and the cluster top right, each a margin from the edge, and neither covers the other.
  const pill = el('[data-part="pill"]').getBoundingClientRect()
  const cluster = el('[data-part="cluster"]').getBoundingClientRect()
  expect(Math.abs(pill.left - 16)).toBeLessThanOrEqual(2)
  expect(Math.abs(pill.top - 16)).toBeLessThanOrEqual(2)
  expect(Math.abs(cluster.right - (w - 16))).toBeLessThanOrEqual(2)
  expect(pill.right).toBeLessThanOrEqual(cluster.left)
  // Save is the one main button, at least 48 tall.
  const save = [...box.querySelectorAll('button')].find((b) => b.textContent?.trim() === WORDS.save)
  expect(save?.getBoundingClientRect().height).toBeGreaterThanOrEqual(47.5)
  expect(box.querySelectorAll('.button.primary')).toHaveLength(1)
})

test.each(['ipadSideways', 'desktop'] as const)('at %s five editors show, and Feel opens its card and gives focus back', async (name) => {
  await show(name)
  const editors = [...box.querySelectorAll<HTMLButtonElement>('[data-editor]')]
  expect(editors.map((b) => b.dataset.editor)).toEqual(['world', 'characters', 'feel', 'sound', 'story'])
  expect(editors[0]?.getAttribute('aria-current')).toBe('page')
  for (const b of editors) expect(b.getBoundingClientRect().height).toBeGreaterThanOrEqual(43.5)
  const feel = el<HTMLButtonElement>('[data-editor="feel"]')
  feel.click()
  await tick()
  expect(el('[data-part="soon"]').textContent).toContain(WORDS.soonFeel)
  expect(el('[data-part="soon"]').textContent).toContain(WORDS.comingSoon)
  const ok = [...box.querySelectorAll('button')].find((b) => b.textContent?.trim() === WORDS.ok)
  expect(document.activeElement).toBe(ok)
  ok?.click()
  await tick()
  expect(box.querySelector('[data-part="soon"]')).toBeNull()
  expect(document.activeElement).toBe(feel)
  // The game's name opens the game's page.
  el<HTMLButtonElement>('[data-home]').click()
  expect(told).toEqual(['home'])
})

test.each(['phone', 'phoneSideways', 'ipadUpright'] as const)('at %s the pill opens a menu with the five editors and the game\'s page', async (name) => {
  await show(name)
  expect(box.querySelector('[data-editor]')).toBeNull()
  const trigger = el<HTMLButtonElement>('[data-pill-menu]')
  expect(trigger.textContent).toContain(WORDS.edWorld)
  expect(trigger.getAttribute('aria-expanded')).toBe('false')
  trigger.click()
  await tick()
  expect(trigger.getAttribute('aria-expanded')).toBe('true')
  const rows = [...box.querySelectorAll<HTMLElement>('[role="menuitem"]')]
  expect(rows.map((r) => r.dataset.item)).toEqual([
    'editor-world',
    'editor-characters',
    'editor-feel',
    'editor-sound',
    'editor-story',
    'game',
  ])
  for (const row of rows) expect(row.getBoundingClientRect().height).toBeGreaterThanOrEqual(43.5)
  expect(rows[0]?.getAttribute('aria-current')).toBe('true')
  expect(rows[2]?.textContent).toContain(WORDS.comingSoon)
  // Feel: the menu closes, the card opens, and OK puts focus back on the menu's button.
  el('[data-item="editor-feel"]').click()
  await tick()
  expect(box.querySelector('[role="menu"]')).toBeNull()
  expect(el('[data-part="soon"]').textContent).toContain(WORDS.soonFeel)
  const ok = [...box.querySelectorAll('button')].find((b) => b.textContent?.trim() === WORDS.ok)
  ok?.click()
  await tick()
  expect(document.activeElement).toBe(trigger)
  // The game's page.
  trigger.click()
  await tick()
  el('[data-item="game"]').click()
  expect(told).toEqual(['home'])
})

test('Escape closes the menu and puts focus on its button; Escape closes the card too', async () => {
  await show('ipadUpright')
  const trigger = el<HTMLButtonElement>('[data-pill-menu]')
  trigger.click()
  await tick()
  el('[role="menu"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
  await tick()
  expect(box.querySelector('[role="menu"]')).toBeNull()
  expect(document.activeElement).toBe(trigger)
  trigger.click()
  await tick()
  el('[data-item="editor-sound"]').click()
  await tick()
  expect(box.querySelector('[data-part="soon"]')).not.toBeNull()
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
  await tick()
  expect(box.querySelector('[data-part="soon"]')).toBeNull()
})

test('a visitor sees Sign in and Export beside Save on a wider screen, and Save alone on a phone', async () => {
  await show('ipadUpright')
  const labels = [...el('[data-part="cluster"]').querySelectorAll('button')].map((b) => b.textContent?.trim())
  expect(labels).toEqual([WORDS.signInShort, WORDS.export, WORDS.save])
  if (mounted) void unmount(mounted)
  box.replaceChildren()
  await show('phone')
  const phone = [...el('[data-part="cluster"]').querySelectorAll('button')].map((b) => b.textContent?.trim())
  expect(phone).toEqual([WORDS.save])
})
