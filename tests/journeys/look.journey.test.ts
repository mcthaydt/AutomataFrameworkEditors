// How the editors look, driven in a real browser at iPad upright, iPad sideways and phone size: the colours and the
// fonts as the page really serves them, the device's light setting ignored, and (as the tasks land) the level's layout
// and the stamps. The screens journey measures every screen against the touch rules; this one proves the look itself.
import { type Level, writeContent } from '@automataframework/framework/headless'
import { afterEach, describe, expect, test } from 'vitest'
import { WORDS } from '#src/features/words/words.ts'
import { fixtureFiles, LEVEL_PATH } from '../fixtures/game/read.ts'
import {
  dragByTouch,
  type JourneyPage,
  type Look,
  openLevel,
  openPage,
  pressSave,
  SIZES,
  setupJourneys,
  signIn,
  thingNamed,
} from '../fixtures/journey.ts'
import { broken } from '../fixtures/measure.ts'

setupJourneys()

type Size = keyof typeof SIZES
const windows: JourneyPage[] = []
afterEach(async () => {
  const found: string[] = []
  for (const j of windows) {
    found.push(...(await j.problems()))
    await j.close()
  }
  windows.length = 0
  expect(found).toEqual([])
})

const open = async (size: Size, look: Look = {}): Promise<JourneyPage> => {
  const j = await openPage(size, 'grandma', false, look)
  windows.push(j)
  return j
}
const computed = (j: JourneyPage, selector: string, property: 'color' | 'backgroundColor') =>
  j.page.evaluate(
    ([where, what]) => {
      const element = document.querySelector(where as string)
      if (element === null) throw new Error(`Nothing on this page matches ${where}.`)
      return getComputedStyle(element)[what as 'color' | 'backgroundColor']
    },
    [selector, property],
  )
/** The demo game's first level, as a visitor opens it. */
async function visitorLevel(j: JourneyPage): Promise<void> {
  await j.page.getByRole('button', { name: WORDS.tryIt }).click()
  await j.page.getByRole('link', { name: 'level-1' }).click()
  await thingNamed(j.page, 'crate-1').waitFor()
}
/** Signed in as grandma, on level-1 of the crate game. */
async function signedInLevel(size: Size): Promise<JourneyPage> {
  const j = await open(size)
  await signIn(j.page)
  await openLevel(j.page)
  return j
}
const level1 = JSON.parse(fixtureFiles[LEVEL_PATH] ?? '') as Level
/** The level with the crate somewhere else: what a teammate saved while someone had it open. */
const theirs = writeContent('level', {
  ...level1,
  things: level1.things.map((t) => (t.id === 'crate-1' ? { ...t, x: 10.5 } : t)),
} as never)
const box = async (j: JourneyPage, selector: string) => {
  const found = await j.page.locator(selector).first().boundingBox()
  if (found === null) throw new Error(`No box for ${selector}.`)
  return found
}

const GROUND = 'rgb(37, 49, 34)'
const WORDS_COLOUR = 'rgb(245, 236, 194)'
const TOUCH = 'rgb(238, 180, 128)'

describe.each(Object.keys(SIZES) as Size[])('at %s', (size) => {
  test("the page is the editors' colours", async () => {
    const j = await open(size)
    await j.page.locator('h1').waitFor()
    expect(await computed(j, 'body', 'backgroundColor')).toBe(GROUND)
    expect(await computed(j, 'body', 'color')).toBe(WORDS_COLOUR)
    expect(await computed(j, '.button.primary', 'backgroundColor')).toBe(TOUCH)
    expect(await computed(j, '.button.primary', 'color')).toBe(GROUND)
  })

  test('a device set to light sees the same page', async () => {
    const j = await open(size, { colorScheme: 'light' })
    await j.page.locator('h1').waitFor()
    expect(await computed(j, 'body', 'backgroundColor')).toBe(GROUND)
    expect(await computed(j, 'body', 'color')).toBe(WORDS_COLOUR)
    expect(await computed(j, '.button.primary', 'backgroundColor')).toBe(TOUCH)
    expect(await computed(j, '.button.primary', 'color')).toBe(GROUND)
  })

  test("the fonts are the site's own files", async () => {
    const j = await open(size)
    await j.page.locator('h1').waitFor()
    // `document.fonts.check` is true in some engines for a family the page does not have, so it is not used: the
    // page's own font faces are asked for, by family and by whether their file arrived.
    await j.page.waitForFunction(() => {
      const loaded = (family: string): boolean =>
        [...document.fonts].some(
          (face) => face.family.replaceAll('"', '') === family && face.status === 'loaded',
        )
      return loaded('Onest Variable') && loaded('Fraunces Variable')
    })
    expect(j.requests.some((request) => request.endsWith('.woff2'))).toBe(true)
    // The `h1` names Fraunces first; the computed value may or may not keep the quotes.
    const family = await j.page.evaluate(
      () => getComputedStyle(document.querySelector('h1') as Element).fontFamily,
    )
    expect(family.replaceAll('"', '').startsWith('Fraunces Variable')).toBe(true)
    // Every address the page asked for is the page's own (the empty icon, `data:,`, is the one thing that is not).
    for (const request of j.requests) {
      const address = request.slice(request.indexOf(' ') + 1)
      expect(address === 'data:,' || address.startsWith(j.site), address).toBe(true)
    }
  })

  test('with the fonts blocked, the screens still read', async () => {
    const j = await open(size, { blockFonts: true })
    await j.page.locator('h1').waitFor()
    expect(await broken(j.page, false)).toEqual([])
    await j.page.getByRole('button', { name: WORDS.tryIt }).click()
    await j.page.getByRole('heading', { level: 1, name: 'Crate Game' }).waitFor()
    expect(await broken(j.page, false)).toEqual([])
    await j.page.getByRole('link', { name: 'level-1' }).click()
    await j.page.getByRole('heading', { level: 1, name: 'level-1' }).waitFor()
    await thingNamed(j.page, 'crate-1').waitFor()
    expect(await broken(j.page, true)).toEqual([])
  })

  test('a level fills the screen', async () => {
    const j = await signedInLevel(size)
    const stage = await box(j, '.stage')
    const canvas = await box(j, '.stage canvas')
    for (const key of ['x', 'y', 'width', 'height'] as const)
      expect(Math.abs(canvas[key] - stage[key])).toBeLessThanOrEqual(1)
    expect(Math.abs(stage.width - SIZES[size].width)).toBeLessThanOrEqual(1)
    const save = await pressSave(j.page).boundingBox()
    expect(save).not.toBeNull()
    expect(SIZES[size].width - ((save?.x ?? 0) + (save?.width ?? 0))).toBeLessThanOrEqual(24)
    const undo = await j.page.getByRole('button', { name: WORDS.undo, exact: true }).boundingBox()
    const redo = await j.page.getByRole('button', { name: WORDS.redo, exact: true }).boundingBox()
    expect(undo).not.toBeNull()
    expect(redo).not.toBeNull()
    if (size === 'ipadSideways') {
      // Wide: Undo and Redo are in the bottom right quarter of the stage.
      for (const turn of [undo, redo]) {
        expect((turn?.x ?? 0) + (turn?.width ?? 0) / 2).toBeGreaterThanOrEqual(stage.x + stage.width / 2)
        expect((turn?.y ?? 0) + (turn?.height ?? 0) / 2).toBeGreaterThanOrEqual(stage.y + stage.height / 2)
      }
    } else {
      // Upright and on a phone: above the card.
      const card = await box(j, '.card')
      for (const turn of [undo, redo])
        expect((turn?.y ?? 0) + (turn?.height ?? 0)).toBeLessThanOrEqual(card.y + 1)
    }
  })

  test('nothing is put on the picture', async () => {
    const j = await signedInLevel(size)
    const found = await j.page.evaluate(() => {
      const out: string[] = []
      const canvas = document.querySelector('.stage canvas') as HTMLElement
      const stage = document.querySelector('.stage') as HTMLElement
      for (
        let el: HTMLElement | null = canvas;
        el !== null && el !== document.documentElement;
        el = el.parentElement
      ) {
        const style = getComputedStyle(el)
        if (style.opacity !== '1') out.push(`${el.className || el.tagName} opacity ${style.opacity}`)
        if (style.filter !== 'none') out.push(`${el.className || el.tagName} filter ${style.filter}`)
        if (style.mixBlendMode !== 'normal')
          out.push(`${el.className || el.tagName} blend ${style.mixBlendMode}`)
      }
      for (const el of [canvas, stage]) {
        if (getComputedStyle(el).borderTopLeftRadius !== '0px')
          out.push(`${el.className || el.tagName} has a rounded corner`)
      }
      return out
    })
    expect(found).toEqual([])
  })

  test("a visitor's first level is clear", async () => {
    const j = await open(size)
    await visitorLevel(j)
    await j.page.getByText(WORDS.visitorCan, { exact: false }).first().waitFor()
    const clear = await box(j, '[data-clear]')
    const standing = await j.page.getByText(WORDS.visitorCan, { exact: false }).first().boundingBox()
    // The standing sentence is above the level, in the top panel.
    expect((standing?.y ?? 0) + (standing?.height ?? 0)).toBeLessThanOrEqual(clear.y + 1)
    const over = await j.page.evaluate((cell) => {
      const found: string[] = []
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
        const parent = node.parentElement
        if ((node.textContent ?? '').trim() === '' || parent === null || parent.closest('script, style'))
          continue
        const range = document.createRange()
        range.selectNodeContents(node)
        for (const at of range.getClientRects()) {
          if (
            at.width > 0 &&
            at.left < cell.x + cell.width &&
            at.right > cell.x &&
            at.top < cell.y + cell.height &&
            at.bottom > cell.y
          )
            found.push((node.textContent ?? '').trim())
        }
      }
      return found
    }, clear)
    expect(over).toEqual([])
  })

  test("an ask's buttons can be pressed without scrolling", async () => {
    const inView = async (j: JourneyPage, names: string[]): Promise<void> => {
      for (const name of names) {
        // Both the page's bar and the ask have a Sign in: the ask's is the one in what was just said.
        const at = await j.page
          .locator('[data-said]')
          .getByRole('button', { name, exact: true })
          .boundingBox()
        expect(at, name).not.toBeNull()
        expect(at?.y ?? -1, name).toBeGreaterThanOrEqual(0)
        expect((at?.y ?? 0) + (at?.height ?? 0), name).toBeLessThanOrEqual(SIZES[size].height)
        expect(at?.x ?? -1, name).toBeGreaterThanOrEqual(0)
        expect((at?.x ?? 0) + (at?.width ?? 0), name).toBeLessThanOrEqual(SIZES[size].width)
      }
    }
    // The sign-in ask.
    const visitor = await open(size)
    await visitorLevel(visitor)
    await dragByTouch(visitor.page, 'crate-1', { dx: 2, dy: 0 })
    await pressSave(visitor.page).click()
    await visitor.page.getByText(WORDS.signInToSave, { exact: false }).first().waitFor()
    await inView(visitor, [WORDS.signIn])
    // The leave ask, and the changed-elsewhere ask.
    const j = await signedInLevel(size)
    await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
    await j.page.getByRole('button', { name: WORDS.back, exact: true }).click()
    await j.page.getByText(WORDS.leaveAsk, { exact: false }).first().waitFor()
    await inView(j, [WORDS.leaveNo, WORDS.leaveYes])
    await j.page.getByRole('button', { name: WORDS.leaveNo, exact: true }).click()
    j.fake.repos.get('grandma/crate-game')?.put('main', LEVEL_PATH, theirs)
    await pressSave(j.page).click()
    await j.page.getByText(WORDS.changedElsewhere, { exact: false }).first().waitFor()
    await inView(j, [WORDS.takeTheirs, WORDS.keepMine])
  })

  test('a notice with no ask goes away at Got it, and one with an ask has no Got it', async () => {
    const j = await open(size)
    await visitorLevel(j)
    await j.page.getByRole('button', { name: WORDS.copyLevel, exact: true }).click()
    // The clipboard may be refused, and then the text is shown to copy by hand: either way nothing is asked.
    const gotIt = j.page.getByRole('button', { name: WORDS.tipGotIt, exact: true })
    await gotIt.waitFor()
    await gotIt.click()
    await gotIt.waitFor({ state: 'detached' })
    // An ask: Save as a visitor asks for a sign-in, and has no Got it.
    await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
    await pressSave(j.page).click()
    await j.page.getByText(WORDS.signInToSave, { exact: false }).first().waitFor()
    expect(await j.page.getByRole('button', { name: WORDS.tipGotIt, exact: true }).count()).toBe(0)
  })

  test('the next move takes away what was said and asked nothing', async () => {
    const j = await open(size)
    await visitorLevel(j)
    await j.page.getByRole('button', { name: WORDS.copyLevel, exact: true }).click()
    const gotIt = j.page.getByRole('button', { name: WORDS.tipGotIt, exact: true })
    await gotIt.waitFor()
    await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
    await gotIt.waitFor({ state: 'detached' })
  })
})
