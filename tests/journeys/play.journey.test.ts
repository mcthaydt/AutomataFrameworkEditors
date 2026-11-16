// Play in place on the built page: the level plays where it is drawn, with the person's own change in it; the game's keys
// move the hero; Bigger and Smaller put the panels away and back; Stop leaves the level as it was.
import type { Page } from 'playwright'
import { afterEach, describe, expect, test } from 'vitest'
import { fixtureFiles } from '../fixtures/game/read.ts'
import {
  dragByTouch,
  type JourneyPage,
  openLevel,
  openPage,
  pictureOf,
  type SIZES,
  setupJourneys,
  signIn,
  slideGameHalf,
} from '../fixtures/journey.ts'

setupJourneys()

let journey: JourneyPage | undefined
afterEach(async () => {
  const found = (await journey?.problems()) ?? []
  await journey?.close()
  journey = undefined
  expect(found).toEqual([])
})

const SIZES_TO_TRY = ['ipadSideways', 'phone'] as const satisfies readonly (keyof typeof SIZES)[]
const CRATE = '#c9a227'
const HERO = '#e4572e'

/**
 * Where the pixels of `colour` are on the game's picture, as the middle of them in CSS pixels; undefined when none show.
 * The game's canvas is WebGL, which a script cannot read back, so the picture is a screenshot, read in a page of its own.
 */
async function whereIs(
  page: Page,
  colour: string,
): Promise<{ x: number; y: number; wide: number } | undefined> {
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
        let sumX = 0
        let sumY = 0
        let count = 0
        for (let i = 0; i < data.length; i += 4) {
          if (![0, 1, 2].every((c) => Math.abs((data[i + c] ?? 0) - (target[c] ?? 0)) < 12)) continue
          sumX += (i / 4) % copy.width
          sumY += Math.floor(i / 4 / copy.width)
          count += 1
        }
        return count === 0 ? undefined : { x: sumX / count, y: sumY / count }
      },
      { shot, want: colour },
    )
    return found === undefined ? undefined : { x: box.x + found.x, y: box.y + found.y, wide: box.width }
  } finally {
    await reader.close()
  }
}

const playButton = (page: Page, word: string) => page.getByRole('button', { name: word, exact: true })
const started = async (page: Page) => {
  await page.locator('[data-play="box"] canvas').waitFor()
  await page.waitForFunction(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('[data-play="box"] canvas')
    return canvas !== null && getComputedStyle(canvas).visibility !== 'hidden'
  })
}

describe.each(SIZES_TO_TRY)('at %s', (size) => {
  test("the person's change plays where it is drawn, the game's own controls move the hero, and Stop leaves everything as it was", async () => {
    journey = await openPage(size)
    const { page } = journey
    await signIn(page)
    await openLevel(page)

    await playButton(page, 'Play').click()
    await started(page)
    // The first Play says what it leaves out and the game waits until that is read.
    await playButton(page, 'Go on').waitFor()
    await playButton(page, 'Got it').click()
    await playButton(page, 'Pause').waitFor()
    await page.waitForTimeout(200)
    const crate0 = await whereIs(page, CRATE)
    const hero0 = await whereIs(page, HERO)
    if (crate0 === undefined || hero0 === undefined) throw new Error('the game shows no crate or no hero')

    // The hero walks right: by the game's own touch control on the phone, by its key on the iPad.
    if (size === 'phone') {
      await slideGameHalf(page, 'walk', { dx: 80, ms: 700 })
    } else {
      await page.keyboard.down('ArrowRight')
      await page.waitForTimeout(700)
      await page.keyboard.up('ArrowRight')
    }
    const hero1 = await whereIs(page, HERO)
    expect(hero1?.x ?? 0).toBeGreaterThan(hero0.x + crate0.wide / 16)

    await playButton(page, 'Stop').click()
    await page.locator('[data-play="box"]').waitFor({ state: 'detached' })
    await page.locator('[data-thing="crate-1"]').waitFor()

    // Move the crate two tiles, play again: it is where the person put it.
    await dragByTouch(page, 'crate-1', { dx: 2, dy: 0 })
    await playButton(page, 'Play').click()
    await started(page)
    await page.waitForTimeout(200)
    const crate1 = await whereIs(page, CRATE)
    expect((crate1?.x ?? 0) - crate0.x).toBeGreaterThan(crate0.wide / 16)
    await playButton(page, 'Stop').click()
    await page.locator('[data-play="box"]').waitFor({ state: 'detached' })

    // Playing changed no file: the change is still only on this device, and the level is still as it was moved.
    expect(journey.fake.repos.get('grandma/crate-game')?.commits).toEqual([])
    await page.locator('[data-thing="crate-1"]').waitFor()
    expect(await page.locator('[data-thing="crate-1"]').getAttribute('data-x')).toBe('8.5')
  })

  test('Bigger puts the panels away and Smaller brings them back; Escape stops the game', async () => {
    journey = await openPage(size)
    const { page } = journey
    await signIn(page)
    await openLevel(page)
    await playButton(page, 'Play').click()
    await started(page)
    const small = await page.locator('[data-play="box"]').boundingBox()

    await playButton(page, 'Bigger').click()
    await page.locator('[data-panels]').waitFor({ state: 'detached' })
    await expect
      .poll(async () => (await page.locator('[data-play="box"]').boundingBox())?.width ?? 0)
      .toBeGreaterThanOrEqual(small?.width ?? 0)

    await playButton(page, 'Smaller').click()
    await page.locator('[data-panels]').waitFor()

    await page.keyboard.press('Escape')
    await page.locator('[data-play="box"]').waitFor({ state: 'detached' })
    await playButton(page, 'Play').waitFor()
  })
})

test('the first Play says what Play leaves out, once', async () => {
  journey = await openPage('ipadSideways')
  const { page } = journey
  await signIn(page)
  await openLevel(page)
  const tip = page.getByText("Rules the game's makers wrote in code don't run here.", { exact: false })
  await playButton(page, 'Play').click()
  await started(page)
  await tip.waitFor()
  await page.getByRole('button', { name: 'Got it' }).click()
  await playButton(page, 'Stop').click()
  await playButton(page, 'Play').click()
  await started(page)
  expect(await tip.count()).toBe(0)
})

test('a game with Spanish words, with the editor in Portuguese, plays in the game’s own language and throws nothing', async () => {
  journey = await openPage('ipadSideways')
  const { page, fake } = journey
  const repo = fake.repos.get('grandma/crate-game')
  if (repo === undefined) throw new Error('the fake has no crate game')
  repo.put(
    'main',
    'automata.toml',
    `${(fixtureFiles['automata.toml'] ?? '').replace('format = 1\n', 'format = 1\nsource = "es"\n')}
[[content]]
type = "messages"
path = "content/messages/es.json"
`,
  )
  repo.put(
    'main',
    'content/messages/es.json',
    '{"format":1,"id":"es","messages":{"game.name":"Juego de cajas"}}',
  )
  await page.evaluate(() => localStorage.setItem('af.me.language', 'pt'))
  await page.reload()
  await signIn(page)
  await openLevel(page)
  await page.getByRole('button', { name: 'Jogar', exact: true }).click()
  await started(page)
  // The game's own touch controls speak the game's language (Spanish), not the editor's (Portuguese) or English.
  const names = await page
    .locator('[data-play="box"] [data-half]')
    .evaluateAll((halves) => halves.map((half) => half.getAttribute('aria-label')))
  expect(names).toHaveLength(2)
  for (const name of names) expect(['Walk', 'Jump']).not.toContain(name)
})
