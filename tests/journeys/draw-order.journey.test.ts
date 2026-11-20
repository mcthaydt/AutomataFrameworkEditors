// What a thing is drawn behind or in front of, on the built page: pick the crate, put it over the hero's start, choose
// "In front" and see it there, play and see it still in front, undo; the menu's two rows say where they cannot act; and
// what is put in the game lists the things in the order they were opened.
import { type Level, writeContent } from '@automataframework/framework/headless'
import type { Page } from 'playwright'
import { afterEach, describe, expect, test } from 'vitest'
import { wordsIn } from '#src/features/words/words.ts'
import { fixtureFiles, LEVEL_PATH } from '../fixtures/game/read.ts'
import {
  dragByTouch,
  type JourneyPage,
  levelPut,
  openLevel,
  openPage,
  pictureColourUnder,
  pictureOf,
  putThemIn,
  SIZES,
  setupJourneys,
  signIn,
  thingNamed,
} from '../fixtures/journey.ts'

setupJourneys()

let journey: JourneyPage | undefined
afterEach(async () => {
  const found = (await journey?.problems()) ?? []
  await journey?.close()
  journey = undefined
  expect(found).toEqual([])
})

const CRATE = '#c9a227'
const said = (row: unknown): string => (typeof row === 'function' ? (row as () => string)() : String(row))
const more = said(wordsIn('en').levels.actMore)
const FRONT = said(wordsIn('en').thing.menuFront)
const BACK = said(wordsIn('en').thing.menuBack)

/** On a phone and an upright iPad the settings wait folded in a line; a wide window shows them beside the level. */
async function showSettings(page: Page): Promise<void> {
  const folded = page.locator('button[data-tour="settings"]')
  if ((await folded.count()) > 0) await folded.first().click()
  await page.locator('aside.panel').waitFor()
}
const drawn = (page: Page, word: string) => page.getByRole('radio', { name: word, exact: true })

/** Whether any pixel of `colour` shows on the game's picture. */
async function shows(page: Page, colour: string): Promise<boolean> {
  const box = await page.locator('[data-play="box"] canvas').boundingBox()
  if (box === null) throw new Error('No game on this page.')
  const shot = (await pictureOf(page, box)).toString('base64')
  const reader = await page.context().newPage()
  try {
    const found = await reader.evaluate(
      async ({ shot, want }) => {
        const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${shot}`)).blob())
        const copy = new OffscreenCanvas(bitmap.width, bitmap.height)
        const context = copy.getContext('2d')
        if (context === null) throw new Error('No 2D canvas to read the picture with.')
        context.drawImage(bitmap, 0, 0)
        const { data } = context.getImageData(0, 0, copy.width, copy.height)
        const target = [1, 3, 5].map((at) => Number.parseInt(want.slice(at, at + 2), 16))
        let count = 0
        for (let i = 0; i < data.length; i += 4) {
          if ([0, 1, 2].every((c) => Math.abs((data[i + c] ?? 0) - (target[c] ?? 0)) < 12)) count += 1
        }
        return count
      },
      { shot, want: colour },
    )
    return found > 0
  } finally {
    await reader.close()
  }
}

const SIZES_TO_TRY = ['ipadSideways', 'phone'] as const satisfies readonly (keyof typeof SIZES)[]

describe.each(SIZES_TO_TRY)('at %s', (size) => {
  test('the crate is put over the hero start, drawn in front, shown over it in the level and in Play, and undone', async () => {
    journey = await openPage(size)
    const { page } = journey
    await signIn(page)
    await openLevel(page)

    // Four tiles left puts the crate on the hero's start. Drawn with the hero, the hero's start is over it.
    await dragByTouch(page, 'crate-1', { dx: -4, dy: 0 })
    await expect.poll(() => pictureColourUnder(page, 'crate-1')).not.toBe(CRATE)

    // The drag left it picked.
    await showSettings(page)
    await drawn(page, 'In front').click()
    await expect.poll(() => pictureColourUnder(page, 'crate-1')).toBe(CRATE)
    expect(await drawn(page, 'In front').getAttribute('aria-checked')).toBe('true')

    // Play shows it still there, over everything: the crate's colour is on the game's picture.
    await page.getByRole('button', { name: 'Play', exact: true }).click()
    await page.locator('[data-play="box"] canvas').waitFor()
    await page.getByRole('button', { name: 'Got it', exact: true }).click()
    await page.getByRole('button', { name: 'Pause', exact: true }).waitFor()
    expect(await shows(page, CRATE)).toBe(true)
    await page.getByRole('button', { name: 'Stop', exact: true }).click()
    await page.locator('[data-play="box"]').waitFor({ state: 'detached' })

    // One undo takes the draw back; the move is its own step.
    await page.keyboard.press('Control+z')
    await expect.poll(() => pictureColourUnder(page, 'crate-1')).not.toBe(CRATE)
  })

  test('the menu has Bring to the front and Send to the back, and a row that cannot act says why', async () => {
    journey = await openPage(size)
    const { page } = journey
    await signIn(page)
    await openLevel(page)
    await thingNamed(page, 'crate-1').click()
    const openMenu = async (): Promise<void> => {
      await page.getByRole('button', { name: more, exact: true }).click()
      await page.getByRole('menuitem', { name: new RegExp(FRONT) }).waitFor()
    }
    await openMenu()
    expect(
      await page.getByRole('menuitem', { name: new RegExp(BACK) }).getAttribute('aria-disabled'),
    ).toBeNull()
    await page.getByRole('menuitem', { name: new RegExp(FRONT) }).click()
    // Now it is in front: the same row is switched off and says so.
    await openMenu()
    const front = page.getByRole('menuitem', { name: new RegExp(FRONT) })
    expect(await front.getAttribute('aria-disabled')).toBe('true')
    await front.getByText('Already in front').waitFor()
    await page.getByRole('menuitem', { name: new RegExp(BACK) }).click()
    await openMenu()
    expect(await page.getByRole('menuitem', { name: new RegExp(BACK) }).getAttribute('aria-disabled')).toBe(
      'true',
    )
    await page.keyboard.press('Escape')
  })

  test('what is put in the game keeps the things in the order they were opened, with the draw on the crate only', async () => {
    journey = await openPage(size)
    const { page } = journey
    await signIn(page)
    await openLevel(page)
    await dragByTouch(page, 'crate-1', { dx: 1, dy: 0 })
    await showSettings(page)
    await drawn(page, 'Behind').click()
    await putThemIn(page)
    const level1 = JSON.parse(fixtureFiles[LEVEL_PATH] ?? '') as Level
    const written = {
      ...level1,
      things: level1.things.map((t) => (t.id === 'crate-1' ? { ...t, x: 7.5, draw: 'behind' as const } : t)),
    }
    const repo = journey.fake.repos.get('grandma/crate-game')!
    expect(levelPut(repo, LEVEL_PATH)).toBe(writeContent('level', written as never))
  })
})

describe.each(Object.keys(SIZES) as (keyof typeof SIZES)[])("the thing's menu at %s", (size) => {
  test('every row is whole, inside the level, and what a finger would touch (no scrolling it into view)', async () => {
    journey = await openPage(size)
    const { page } = journey
    await signIn(page)
    await openLevel(page)
    await thingNamed(page, 'crate-1').click()
    await page.getByRole('button', { name: more, exact: true }).click()
    await page.getByRole('menuitem', { name: new RegExp(BACK) }).waitFor()
    const rows = await page.getByRole('menuitem').count()
    // A level box shorter than the menu (a phone on its side) makes the menu scroll inside it; a finger swipes it. Where
    // the menu fits, nothing may need scrolling at all.
    const scrolls = await page.locator('.menu-float').evaluate((el) => el.scrollHeight > el.clientHeight + 1)
    expect(scrolls, 'the menu scrolls only where the level box is shorter than it').toBe(
      size === 'phoneSideways',
    )
    for (let at = 0; at < rows; at += 1) {
      const found = await page
        .getByRole('menuitem')
        .nth(at)
        .evaluate((row, swipe) => {
          const float = row.closest<HTMLElement>('.menu-float')
          if (swipe && float !== null) {
            const own = row.getBoundingClientRect()
            const frame = float.getBoundingClientRect()
            if (own.bottom > frame.bottom) float.scrollTop += own.bottom - frame.bottom
            if (own.top < frame.top) float.scrollTop -= frame.top - own.top
          }
          const box = row.getBoundingClientRect()
          const stage = document.querySelector('.stage')?.getBoundingClientRect()
          const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
          return {
            touched: hit !== null && (hit === row || row.contains(hit)),
            inside:
              stage !== undefined &&
              box.top >= stage.top - 1 &&
              box.bottom <= stage.bottom + 1 &&
              box.left >= stage.left - 1 &&
              box.right <= stage.right + 1,
            name: row.textContent?.trim().slice(0, 30),
          }
        }, scrolls)
      expect(found, `row ${at + 1} of the menu`).toMatchObject({ touched: true, inside: true })
    }
    await page.keyboard.press('Escape')
  })
})
