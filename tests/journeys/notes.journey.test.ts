// The drawing notes, driven in real browsers at iPad upright, iPad sideways and phone size: a person picks the crate
// and reads where it is, presses a note to reach its arrows, switches the notes, and the picture never changes.
import { afterEach, describe, expect, test } from 'vitest'
import { writeAccess } from '#src/features/access/access.ts'
import { WORDS } from '#src/features/words/words.ts'
import {
  dragByTouch,
  type JourneyPage,
  openGame,
  openLevel,
  openPage,
  pressSave,
  SIZES,
  setupJourneys,
  signIn,
  thingNamed,
} from '../fixtures/journey.ts'

setupJourneys()

type Size = keyof typeof SIZES
type Person = Parameters<typeof openPage>[1]
const windows: JourneyPage[] = []
afterEach(async () => {
  const found: string[][] = []
  for (const j of windows) {
    found.push(await j.problems())
    await j.close()
  }
  windows.length = 0
  expect(found.flat()).toEqual([])
})
const window_ = async (size: Size, person: Person, keep = false): Promise<JourneyPage> => {
  const j = await openPage(size, person, keep)
  windows.push(j)
  return j
}
/** The demo game's first level, as a visitor opens it. */
async function visitorLevel(size: Size): Promise<JourneyPage> {
  const j = await window_(size, 'grandma')
  await j.page.getByRole('button', { name: WORDS.tryIt }).click()
  await j.page.getByRole('link', { name: 'level-1' }).click()
  await thingNamed(j.page, 'crate-1').waitFor()
  return j
}
const note = (j: JourneyPage, axis: 'x' | 'y') => j.page.locator(`[data-note="${axis}"]`)
const crate = (j: JourneyPage) => thingNamed(j.page, 'crate-1')
/** Taps the crate where it is, with a finger. */
const pick = async (j: JourneyPage): Promise<void> => {
  await crate(j).tap()
  await note(j, 'x').waitFor()
}
const box = async (j: JourneyPage, selector: string) => {
  const found = await j.page.locator(selector).first().boundingBox()
  if (found === null) throw new Error(`No box for ${selector}.`)
  return found
}
/** The level's picture as one data address; equal before and after only if not one pixel changed. */
const wholePicture = (j: JourneyPage): Promise<string> =>
  j.page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('.stage canvas')
    if (canvas === null) throw new Error('No picture of a level on this page.')
    const copy = document.createElement('canvas')
    copy.width = canvas.width
    copy.height = canvas.height
    copy.getContext('2d')?.drawImage(canvas, 0, 0)
    return copy.toDataURL()
  })
const switchTool = (j: JourneyPage) => j.page.getByRole('button', { name: /^Notes (on|faded|hidden)$/ })
const tiles = (n: number): string => (Number.isInteger(n) ? `${n}` : n.toFixed(1))

describe.each(Object.keys(SIZES) as Size[])('at %s', (size) => {
  test('a visitor picks the crate and reads where it is', async () => {
    const j = await visitorLevel(size)
    await pick(j)
    const x = Number(await crate(j).getAttribute('data-x'))
    const y = Number(await crate(j).getAttribute('data-y'))
    const all = (await j.page.locator('.block').textContent()) ?? ''
    expect(all).toContain(WORDS.noteAcross)
    expect(all).toContain(WORDS.noteDown)
    expect(all).toContain(WORDS.noteTiles(x))
    expect(all).toContain(WORDS.noteTiles(y))
    expect(tiles(x)).toBe('6.5')
    expect(tiles(y)).toBe('7.5')
    await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
    await j.page.waitForFunction(() => document.querySelector('.block')?.textContent?.includes('8.5 tiles'))
  })

  test('the notes never touch the picture', async () => {
    const j = await visitorLevel(size)
    await j.page.waitForTimeout(500)
    const nothing = await wholePicture(j)
    await pick(j)
    expect(await wholePicture(j)).toBe(nothing)
    await switchTool(j).click()
    await j.page.locator('[data-notes="faded"]').waitFor()
    expect(await wholePicture(j)).toBe(nothing)
    await switchTool(j).click()
    await j.page.locator('[data-notes]').waitFor({ state: 'detached' })
    expect(await wholePicture(j)).toBe(nothing)
  })

  test('the switch is remembered by the device, and by nothing else', async () => {
    const j = await visitorLevel(size)
    await pick(j)
    const before = j.requests.length
    await switchTool(j).click()
    await switchTool(j).click()
    await j.page.getByRole('button', { name: WORDS.notesHidden, exact: true }).waitFor()
    expect(await j.page.evaluate(() => localStorage.getItem('af.notes'))).toBe('hidden')
    const sent = j.requests.slice(before).filter((r) => /^(PUT|POST|PATCH|DELETE) /.test(r))
    expect(sent).toEqual([])
    await j.page.reload()
    // A reloaded visitor is back at the start: open the level again.
    if (await j.page.getByRole('button', { name: WORDS.tryIt }).isVisible()) {
      await j.page.getByRole('button', { name: WORDS.tryIt }).click()
    }
    const link = j.page.getByRole('link', { name: 'level-1' })
    if (await link.isVisible()) await link.click()
    await thingNamed(j.page, 'crate-1').waitFor()
    await j.page.getByRole('button', { name: WORDS.notesHidden, exact: true }).waitFor()
    expect(await j.page.locator('[data-notes]').count()).toBe(0)
  })

  test('pressing a note takes a keyboard to its arrows', async () => {
    const j = await visitorLevel(size)
    await pick(j)
    await crate(j).focus()
    // The notes come before the things in the page, so Shift+Tab walks back to them.
    for (let step = 0; step < 4; step += 1) {
      await j.page.keyboard.press('Shift+Tab')
      if ((await j.page.evaluate(() => document.activeElement?.getAttribute('data-note'))) === 'x') break
    }
    expect(await j.page.evaluate(() => document.activeElement?.getAttribute('data-note'))).toBe('x')
    await j.page.keyboard.press('Enter')
    expect(await j.page.evaluate(() => document.activeElement?.getAttribute('data-move'))).toBe('left')
    await crate(j).focus()
    await j.page.keyboard.press('ArrowRight')
    expect(await crate(j).getAttribute('data-x')).toBe('7')
  })

  test('tapping a note shows a finger the arrows', async () => {
    const j = await visitorLevel(size)
    await pick(j)
    // On a phone the clear cell is narrow and one note holds both numbers, and it leads to the Across arrows.
    const axis = size === 'phone' ? 'x' : 'y'
    await note(j, axis).tap()
    const card = j.page.locator('.card')
    await card.and(j.page.locator(`[data-asked="${axis}"]`)).waitFor()
    const pair = axis === 'x' ? [WORDS.moveLeft, WORDS.moveRight] : [WORDS.moveUp, WORDS.moveDown]
    for (const name of pair) {
      const found = await j.page.getByRole('button', { name, exact: true }).boundingBox()
      expect(found).not.toBeNull()
      expect((found?.y ?? 0) + (found?.height ?? 0)).toBeLessThanOrEqual(1 + SIZES[size].height)
      expect(found?.y ?? -1).toBeGreaterThanOrEqual(0)
    }
    await j.page.getByRole('button', { name: pair[0] as string, exact: true }).tap()
    expect(await crate(j).getAttribute(axis === 'x' ? 'data-x' : 'data-y')).toBe(axis === 'x' ? '6' : '7')
    expect(await card.getAttribute('data-asked')).toBeNull()
  })

  test('the grid is drawn over the level', async () => {
    const j = await visitorLevel(size)
    await j.page.locator('.notes .grid').waitFor()
    const scale = Number(await j.page.locator('[data-scale]').first().getAttribute('data-scale'))
    const drawn = await j.page.evaluate(() => {
      const grid = document.querySelector('.notes .grid') as SVGGElement
      const found = grid.getBoundingClientRect()
      const colour = (selector: string): string =>
        getComputedStyle(grid.querySelector(selector) as Element).stroke
      return {
        w: found.width,
        h: found.height,
        words: colour('.gw'),
        ground: colour('.gg'),
        pairs: [grid.querySelectorAll('.gw').length, grid.querySelectorAll('.gg').length],
      }
    })
    // The level is 16 tiles by 9; the grid covers it, give or take the strokes' own width.
    expect(Math.abs(drawn.w - 16 * scale)).toBeLessThanOrEqual(3)
    expect(Math.abs(drawn.h - 9 * scale)).toBeLessThanOrEqual(3)
    expect(drawn.words).toBe('rgb(245, 236, 194)')
    expect(drawn.ground).toBe('rgb(37, 49, 34)')
    expect(drawn.pairs).toEqual([27, 27])
  })

  test('the notes stay clear of the crate at the far right', async () => {
    const j = await visitorLevel(size)
    await pick(j)
    await dragByTouch(j.page, 'crate-1', { dx: 20, dy: 0 })
    await j.page.locator('.block').waitFor()
    await j.page.waitForTimeout(400)
    const block = await box(j, '.block')
    const clear = await box(j, '[data-clear]')
    const thing = await box(j, '[data-thing="crate-1"]')
    expect(block.x).toBeGreaterThanOrEqual(clear.x - 1)
    expect(block.y).toBeGreaterThanOrEqual(clear.y - 1)
    expect(block.x + block.width).toBeLessThanOrEqual(clear.x + clear.width + 1)
    expect(block.y + block.height).toBeLessThanOrEqual(clear.y + clear.height + 1)
    const apart =
      block.x + block.width <= thing.x ||
      thing.x + thing.width <= block.x ||
      block.y + block.height <= thing.y ||
      thing.y + thing.height <= block.y
    expect(apart).toBe(true)
  })

  test('a waiting change shows its ring and no notes', async () => {
    const kid = await window_(size, 'kid')
    const repo = kid.fake.repos.get('grandma/crate-game')
    if (repo === undefined) throw new Error('No crate game in the pretend GitHub.')
    repo.checks = 'passing'
    repo.put(
      'main',
      'automata.access.toml',
      writeAccess({
        format: 1,
        everyone: 'suggest',
        people: [
          { github: 'grandpa', level: 'approve' },
          { github: 'grandma', level: 'owner' },
        ],
      }),
    )
    await signIn(kid.page)
    await openLevel(kid.page)
    await dragByTouch(kid.page, 'crate-1', { dx: 2, dy: 0 })
    await pressSave(kid.page).click()
    await kid.page.getByText(WORDS.savedSuggestion, { exact: false }).first().waitFor()
    await kid.close()
    windows.splice(windows.indexOf(kid), 1)

    const g = await window_(size, 'grandpa', true)
    await signIn(g.page)
    await openGame(g.page)
    await g.page.getByRole('link', { name: /waiting/ }).click()
    await g.page.locator('a.row').first().click()
    await thingNamed(g.page, 'crate-1').waitFor()
    const marked = thingNamed(g.page, 'crate-1')
    expect(await marked.getAttribute('data-marked')).toBe('')
    const ring = await marked.evaluate((el) => {
      const style = getComputedStyle(el)
      return { style: style.outlineStyle, colour: style.outlineColor }
    })
    expect(ring).toEqual({ style: 'dashed', colour: 'rgb(238, 180, 128)' })
    expect(await g.page.locator('.note').count()).toBe(0)
  })
})
