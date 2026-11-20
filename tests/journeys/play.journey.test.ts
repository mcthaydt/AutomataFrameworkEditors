// Play in place on the built page: the level plays where it is drawn, with the person's own change in it; the game's keys
// move the hero; Bigger and Smaller put the panels away and back; Stop leaves the level as it was.
import type { Page } from 'playwright'
import { afterEach, describe, expect, test } from 'vitest'
import { LINKS } from '../fixtures/api.ts'
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
  /** The play bar is put out of sight for the picture, so what is read is the game alone. */
  withoutBar = false,
): Promise<{ x: number; y: number; wide: number; count: number } | undefined> {
  const box = await page.locator('[data-play="box"] canvas').boundingBox()
  if (box === null) throw new Error('No game on this page.')
  const bar = page.locator('[data-play="box"] [role="toolbar"]')
  if (withoutBar) await bar.evaluate((el) => el.style.setProperty('visibility', 'hidden'))
  const shot = (await pictureOf(page, box)).toString('base64')
  if (withoutBar) await bar.evaluate((el) => el.style.removeProperty('visibility'))
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
        return count === 0 ? undefined : { x: sumX / count, y: sumY / count, count }
      },
      { shot, want: colour },
    )
    return found === undefined ? undefined : { x: box.x + found.x, y: box.y + found.y, wide: box.width, count: found.count }
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

/** Both phone windows, with a thing picked (its settings sheet then stays up, so the game box is short) and with none. */
describe.each(['phone', 'phoneSideways'] as const)('at %s', (size) => {
  test.each([true, false])('at the start of Play the bar does not hide the hero (a thing picked: %s)', async (picked) => {
    journey = await openPage(size)
    const { page } = journey
    await signIn(page)
    await openLevel(page)
    if (picked) await thingNamed(page, 'crate-1').click()
    await playButton(page, 'Play').click()
    await started(page)
    await playButton(page, 'Got it').click()
    await playButton(page, 'Pause').waitFor()
    await page.waitForTimeout(300)
    const whole = await whereIs(page, HERO, true)
    const seen = await whereIs(page, HERO)
    if (whole === undefined) throw new Error('the game shows no hero at its start')
    expect(seen?.count ?? 0, 'the bar covers part of the hero').toBe(whole.count)
  })
})

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

test('Play from here puts the hero beside the door; walking into it opens the next room and plays on there', async () => {
  journey = await openPage('ipadSideways', 'grandma', false, LINKS)
  const { page } = journey
  await signIn(page)
  await openLevel(page, 'links-game', 'room-1')
  await playButton(page, 'Play').click()
  await started(page)
  await playButton(page, 'Got it').click()
  await playButton(page, 'Pause').waitFor()

  // Slow is the person's choice: it goes with them through the door.
  await page.getByRole('button', { name: 'How fast the game plays: Normal' }).click()
  await page.getByRole('button', { name: 'How fast the game plays: Slow' }).waitFor()
  // While it waits for the tap the game is held still; Cancel lets it go on as it was.
  await playButton(page, 'Play from here').click()
  await page.getByText('Tap the level where the hero should start').waitFor()
  await playButton(page, 'Go on').waitFor()
  await page.locator('[data-play="pick-cancel"]').click()
  await playButton(page, 'Pause').waitFor()
  await playButton(page, 'Play from here').click()
  await page.getByText('Tap the level where the hero should start').waitFor()
  const canvas = await page.locator('[data-play="box"] canvas').boundingBox()
  if (canvas === null) throw new Error('No game on this page.')
  // 16 by 9 tiles, as large as fits: the door of room 1 is at tile 13.5, so a tap a tile short of it.
  const scale = Math.min(canvas.width / 16, canvas.height / 9)
  const left = canvas.x + (canvas.width - 16 * scale) / 2
  const top = canvas.y + (canvas.height - 9 * scale) / 2
  await page.mouse.click(left + 12 * scale, top + 7.5 * scale)
  await page.getByText('Tap the level where the hero should start').waitFor({ state: 'detached' })
  // The game starts again from there; a key held before it is up is not the game's.
  await started(page)
  await page.waitForTimeout(500)

  await page.keyboard.down('ArrowRight')
  await page.waitForFunction(() => location.hash.includes('room-2'), undefined, { timeout: 15_000 })
  await page.keyboard.up('ArrowRight')
  // The play goes on in the room the door leads to.
  await started(page)
  await playButton(page, 'Stop').waitFor()
  expect(page.url()).toContain('room-2')
  // The top bar names the room the door led to.
  await page.locator('[data-bar]').getByText('Levels · Room 2').waitFor()
  await page.getByRole('button', { name: 'How fast the game plays: Slow' }).waitFor()
})

test('one step and slow are in the play bar, and the strip goes back', async () => {
  journey = await openPage('ipadSideways')
  const { page } = journey
  await signIn(page)
  await openLevel(page)
  await playButton(page, 'Play').click()
  await started(page)
  await playButton(page, 'Got it').click()
  await playButton(page, 'Pause').waitFor()
  await page.getByRole('button', { name: 'How fast the game plays: Normal' }).click()
  await page.getByRole('button', { name: 'How fast the game plays: Slow' }).waitFor()
  await playButton(page, 'Pause').click()
  await playButton(page, 'One step').click()
  await page.locator('[data-play="strip"] input[type="range"]').waitFor()
  await playButton(page, 'Stop').click()
  await page.locator('[data-play="box"]').waitFor({ state: 'detached' })
})

test('a heavier crate is pushed less far by the same walk', async () => {
  journey = await openPage('ipadSideways')
  const { page } = journey
  await signIn(page)
  await openLevel(page)
  const pushedBy = async (heavy: 'Home' | 'End'): Promise<number> => {
    await thingNamed(page, 'crate-1').click()
    const folded = page.locator('button[data-tour="settings"]')
    if ((await folded.count()) > 0) await folded.first().click()
    const slider = page.locator('input[type="range"][aria-label="How heavy"]')
    await slider.focus()
    await page.keyboard.press(heavy)
    await playButton(page, 'Play').click()
    await started(page)
    const got = page.getByRole('button', { name: 'Got it', exact: true })
    if ((await got.count()) > 0) await got.click()
    await playButton(page, 'Pause').waitFor()
    const before = await whereIs(page, CRATE)
    if (before === undefined) throw new Error('the game shows no crate')
    await page.keyboard.down('ArrowRight')
    await page.waitForTimeout(2200)
    await page.keyboard.up('ArrowRight')
    const after = await whereIs(page, CRATE)
    await playButton(page, 'Stop').click()
    await page.locator('[data-play="box"]').waitFor({ state: 'detached' })
    return (after?.x ?? before.x) - before.x
  }
  const light = await pushedBy('Home')
  const heavy = await pushedBy('End')
  expect(light, 'the light crate moved').toBeGreaterThan(5)
  expect(heavy, 'the heavy crate went less far').toBeLessThan(light)
  // Stopping leaves the weights as they were set: the person's change, not the play's.
})

test('the strip goes back part of the way, and again: the range stays, and the hero is where it was', async () => {
  journey = await openPage('ipadSideways')
  const { page } = journey
  await signIn(page)
  await openLevel(page)
  await playButton(page, 'Play').click()
  await started(page)
  await playButton(page, 'Got it').click()
  await playButton(page, 'Pause').waitFor()
  const first = await whereIs(page, HERO)
  if (first === undefined) throw new Error('the game shows no hero')
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(2500)
  await page.keyboard.up('ArrowRight')
  await playButton(page, 'Pause').click()
  const strip = page.locator('[data-play="strip"] input[type="range"]')
  await strip.waitFor()
  const now = await whereIs(page, HERO)
  const most = await strip.getAttribute('max')
  if (now === undefined) throw new Error('the game shows no hero after the walk')
  expect(now.x, 'the hero walked').toBeGreaterThan(first.x + 20)

  await strip.click({ position: { x: (await strip.boundingBox())!.width * 0.6, y: 6 } })
  const half = await whereIs(page, HERO)
  expect(half?.x ?? 0, 'back part of the way').toBeLessThan(now.x - 5)
  expect(half?.x ?? 0, 'not all the way back').toBeGreaterThan(first.x + 5)
  expect(await strip.getAttribute('max'), 'the strip keeps its range').toBe(most)

  await strip.click({ position: { x: (await strip.boundingBox())!.width * 0.3, y: 6 } })
  const further = await whereIs(page, HERO)
  expect(further?.x ?? 0, 'again, further back').toBeLessThan((half?.x ?? 0) - 5)
  expect(await strip.count(), 'the strip is still there').toBe(1)
  // Going on from there is the opposite: the game runs again, and the strip is the live one.
  await playButton(page, 'Go on').click()
  await playButton(page, 'Pause').waitFor()
})

describe.each(['ipadSideways', 'phoneSideways'] as const)('Play from here at %s', (size) => {
  test('the hero starts under the finger', async () => {
    journey = await openPage(size, 'grandma', false, LINKS)
    const { page } = journey
    await signIn(page)
    await openLevel(page, 'links-game', 'room-1')
    await playButton(page, 'Play').click()
    await started(page)
    await playButton(page, 'Got it').click()
    await playButton(page, 'Pause').waitFor()
    const hero0 = await whereIs(page, HERO, true)
    if (hero0 === undefined) throw new Error('the game shows no hero')
    await playButton(page, 'Play from here').click()
    await page.getByText('Tap the level where the hero should start').waitFor()
    const canvas = await page.locator('[data-play="box"] canvas').boundingBox()
    if (canvas === null) throw new Error('No game on this page.')
    // On the floor, where the hero stands, a fifth of the picture to the right of it.
    const tapAt = { x: hero0.x + canvas.width * 0.2, y: hero0.y }
    await page.mouse.click(tapAt.x, tapAt.y)
    await page.getByText('Tap the level where the hero should start').waitFor({ state: 'detached' })
    await started(page)
    await page.waitForTimeout(800)
    const hero = await whereIs(page, HERO, true)
    if (hero === undefined) throw new Error('the game shows no hero')
    expect(Math.abs(hero.x - tapAt.x), `the hero is ${Math.round(hero.x - tapAt.x)} px from the tap`).toBeLessThan(12)
  })
})
