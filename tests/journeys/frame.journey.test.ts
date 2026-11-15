// The level screen's frame at the five sizes: a visitor on the demo level sees the level filling the window, with the
// pill, the cluster and the tools floating over it, and nothing above it. Every part is where its shape puts it, none
// overlaps another, every press is big enough, and each editor that is not built opens its card.
import { afterEach, describe, expect, test } from 'vitest'
import { type JourneyPage, openPage, SIZES, setupJourneys, thingNamed } from '../fixtures/journey.ts'
import { broken } from '../fixtures/measure.ts'
import { WORDS } from '../fixtures/words.ts'

setupJourneys()

let journey: JourneyPage | undefined
afterEach(async () => {
  const found = (await journey?.problems()) ?? []
  await journey?.close()
  journey = undefined
  expect(found).toEqual([])
})

const SHAPES = {
  ipadUpright: 'mid',
  ipadSideways: 'wide',
  phone: 'narrow',
  phoneSideways: 'mid',
  desktop: 'wide',
} as const

async function visitorLevel(size: keyof typeof SIZES): Promise<JourneyPage> {
  journey = await openPage(size, 'grandma')
  const { page } = journey
  await page.getByRole('button', { name: WORDS.tryIt }).click()
  await page.getByRole('link', { name: 'level-1' }).click()
  await thingNamed(page, 'crate-1').waitFor()
  return journey
}

describe.each(Object.keys(SIZES) as (keyof typeof SIZES)[])('at %s', (size) => {
  test('the level fills the window, with no banner and no bar above it', async () => {
    const { page } = await visitorLevel(size)
    expect(await page.locator('.guide, .bar').count()).toBe(0)
    const frame = page.locator('[data-frame]')
    expect(await frame.getAttribute('data-shape')).toBe(SHAPES[size])
    // The first thing in the frame is the level's stage, and it is the window.
    expect(await frame.evaluate((el) => el.firstElementChild?.querySelector('[data-scale]') !== null)).toBe(
      true,
    )
    const stage = await page.locator('[data-scale]').first().boundingBox()
    const { width, height } = SIZES[size]
    expect(Math.abs((stage?.width ?? 0) - width)).toBeLessThanOrEqual(1)
    expect(Math.abs((stage?.height ?? 0) - height)).toBeLessThanOrEqual(1)
    expect(await page.evaluate(() => document.scrollingElement?.scrollHeight)).toBe(height)
    expect(await broken(page, true)).toEqual([])
  })

  test('every part is there, none overlaps another, and every press is big enough', async () => {
    const { page } = await visitorLevel(size)
    const parts = await page.evaluate(() =>
      [...document.querySelectorAll('[data-part]')]
        .filter((el) => {
          const box = el.getBoundingClientRect()
          return box.width > 0 && box.height > 0
        })
        .map((el) => {
          const box = el.getBoundingClientRect()
          return {
            part: el.getAttribute('data-part') ?? '',
            left: box.left,
            top: box.top,
            right: box.right,
            bottom: box.bottom,
          }
        }),
    )
    expect(parts.map((p) => p.part).sort()).toEqual(['block', 'cluster', 'notice', 'pill', 'tools', 'undo'])
    for (let a = 0; a < parts.length; a += 1) {
      for (let b = a + 1; b < parts.length; b += 1) {
        const first = parts[a]
        const second = parts[b]
        if (first === undefined || second === undefined) continue
        const across = Math.min(first.right, second.right) - Math.max(first.left, second.left)
        const down = Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top)
        expect(across > 1 && down > 1, `${first.part} overlaps ${second.part}`).toBe(false)
      }
    }
    for (const tool of await page.locator('[data-tool]').all()) {
      const box = await tool.boundingBox()
      expect(box?.width).toBeGreaterThanOrEqual(55.5)
      expect(box?.height).toBeGreaterThanOrEqual(55.5)
    }
    expect(
      (await page.getByRole('button', { name: WORDS.save, exact: true }).boundingBox())?.height,
    ).toBeGreaterThanOrEqual(47.5)
    expect(await page.locator('h1').count()).toBe(1)
    expect(await page.locator('[data-tool="move"]').getAttribute('aria-pressed')).toBe('true')
  })

  test('each editor that is not built opens its card, and its one button closes it', async () => {
    const { page } = await visitorLevel(size)
    const wide = SHAPES[size] === 'wide'
    const cards = [
      ['characters', WORDS.soonCharacters],
      ['feel', WORDS.soonFeel],
      ['sound', WORDS.soonSound],
      ['story', WORDS.soonStory],
    ] as const
    for (const [id, sentence] of cards) {
      if (wide) await page.locator(`[data-editor="${id}"]`).click()
      else {
        await page.locator('[data-pill-menu]').click()
        await page.locator(`[data-item="editor-${id}"]`).click()
      }
      const card = page.locator('[data-part="soon"]')
      await card.waitFor()
      expect(await card.textContent()).toContain(sentence)
      await page.getByRole('button', { name: WORDS.ok, exact: true }).click()
      await card.waitFor({ state: 'detached' })
    }
  })
})
