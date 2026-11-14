// How the editors look, driven in a real browser at iPad upright, iPad sideways and phone size: the colours and the
// fonts as the page really serves them, the device's light setting ignored, and (as the tasks land) the level's layout
// and the stamps. The screens journey measures every screen against the touch rules; this one proves the look itself.
import { type Level, writeContent } from '@automataframework/framework/headless'
import { afterEach, describe, expect, test } from 'vitest'
import { writeAccess } from '#src/features/access/access.ts'
import { WORDS } from '#src/features/words/words.ts'
import { fixtureFiles, LEVEL_PATH } from '../fixtures/game/read.ts'
import {
  dragByTouch,
  type JourneyPage,
  type Look,
  openGame,
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
async function signedInLevel(size: Size, look: Look = {}): Promise<JourneyPage> {
  const j = await open(size, look)
  await signIn(j.page)
  await openLevel(j.page)
  return j
}
/** Kid (who may only suggest) saves a change that grandpa (who may approve) can look at. Kid's window stays open. */
async function kidHasSaved(size: Size): Promise<JourneyPage> {
  const kid = await openPage(size, 'kid')
  windows.push(kid)
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
  return kid
}
/** Grandpa's window on kid's waiting change. */
async function openKidsChange(size: Size, look: Look = {}): Promise<JourneyPage> {
  const g = await openPage(size, 'grandpa', true, look)
  windows.push(g)
  await signIn(g.page)
  await openGame(g.page)
  await g.page.getByRole('link', { name: /waiting/ }).click()
  await g.page.locator('a.row').first().click()
  await thingNamed(g.page, 'crate-1').waitFor()
  return g
}
/** A stamp has landed: its animation is over, and it is whole in the window. */
async function landed(j: JourneyPage): Promise<DOMRect> {
  await j.page.locator('[data-stamp]').waitFor()
  await j.page.waitForFunction(() =>
    document
      .querySelector('[data-stamp]')
      ?.getAnimations()
      .every((a) => a.playState === 'finished'),
  )
  return j.page.locator('[data-stamp]').evaluate((el) => el.getBoundingClientRect().toJSON())
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
    // Save is at the right edge: 8 px of margin, 16 of padding and the panel's 1 px line.
    expect(SIZES[size].width - ((save?.x ?? 0) + (save?.width ?? 0))).toBeLessThanOrEqual(25)
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
    // The picture is made a moment after the screen: wait for it.
    await j.page.locator('.stage canvas').waitFor()
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
  test("saving lands as a stamp with the person's name", async () => {
    const j = await signedInLevel(size)
    await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
    await pressSave(j.page).click()
    const at = await landed(j)
    const stamp = j.page.locator('[data-stamp]')
    expect(await stamp.textContent()).toContain(WORDS.stampSaved('grandma'))
    expect(at.left).toBeGreaterThanOrEqual(0)
    expect(at.top).toBeGreaterThanOrEqual(0)
    expect(at.right).toBeLessThanOrEqual(SIZES[size].width)
    expect(at.bottom).toBeLessThanOrEqual(SIZES[size].height)
    expect(await stamp.evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
    expect(await j.page.locator('.status').textContent()).toContain(WORDS.savedDirect)
    // Another move, and the stamp is gone.
    await dragByTouch(j.page, 'crate-1', { dx: 1, dy: 0 })
    await stamp.waitFor({ state: 'detached' })
  })

  test('a change that waits is stamped too, and the sentence says it waits', async () => {
    const kid = await kidHasSaved(size)
    await landed(kid)
    expect(await kid.page.locator('[data-stamp]').textContent()).toContain(WORDS.stampSaved('kid'))
    expect(await kid.page.locator('.status').textContent()).toContain(WORDS.savedSuggestion)
  })

  test('approving stamps Approved, and turning one down does not', async () => {
    const kid = await kidHasSaved(size)
    await kid.page.getByText(WORDS.savedSuggestion, { exact: false }).first().waitFor()
    const g = await openKidsChange(size)
    await g.page.getByRole('button', { name: WORDS.approve, exact: true }).click()
    await landed(g)
    expect(await g.page.locator('[data-stamp]').textContent()).toContain(WORDS.stampApproved)
    await g.page.getByText(WORDS.approved, { exact: false }).first().waitFor()
  })

  test('turning a change down shows no stamp', async () => {
    const kid = await kidHasSaved(size)
    await kid.page.getByText(WORDS.savedSuggestion, { exact: false }).first().waitFor()
    const g = await openKidsChange(size)
    await g.page.getByRole('button', { name: WORDS.turnDown, exact: true }).click()
    await g.page.getByText(WORDS.turnedDown, { exact: false }).first().waitFor()
    expect(await g.page.locator('[data-stamp]').count()).toBe(0)
  })

  test('with reduced motion the stamp fades in and does not move', async () => {
    const still = await signedInLevel(size, { reducedMotion: 'reduce' })
    await dragByTouch(still.page, 'crate-1', { dx: 2, dy: 0 })
    await pressSave(still.page).click()
    await landed(still)
    expect(
      await still.page.locator('[data-stamp]').evaluate((el) => getComputedStyle(el).animationName),
    ).toMatch(/fade$/)
    const moving = await signedInLevel(size)
    await dragByTouch(moving.page, 'crate-1', { dx: 2, dy: 0 })
    await pressSave(moving.page).click()
    await landed(moving)
    expect(
      await moving.page.locator('[data-stamp]').evaluate((el) => getComputedStyle(el).animationName),
    ).toMatch(/land$/)
  })

  test('a visitor never sees a stamp', async () => {
    const j = await open(size)
    await visitorLevel(j)
    await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
    await pressSave(j.page).click()
    await j.page.getByText(WORDS.signInToSave, { exact: false }).first().waitFor()
    expect(await j.page.locator('[data-stamp]').count()).toBe(0)
  })
  test('the wordmark, the icons and the touch colour are on every screen', async () => {
    // A first-time visitor's Welcome has the word over its title and no bar.
    const first = await open(size)
    await first.page.locator('h1').waitFor()
    expect(await first.page.locator('main .wordmark').textContent()).toBe(WORDS.wordmark)
    expect(await first.page.locator('.bar').count()).toBe(0)

    const kid = await kidHasSaved(size)
    await kid.page.getByText(WORDS.savedSuggestion, { exact: false }).first().waitFor()
    const j = await openPage(size, 'grandma', true)
    windows.push(j)
    await signIn(j.page)
    const heading = (name: string) => j.page.getByRole('heading', { level: 1, name }).waitFor()
    const checks = async (screen: string): Promise<void> => {
      expect(await j.page.locator('.bar .wordmark').textContent(), screen).toBe(WORDS.wordmark)
      const bare = await j.page.evaluate(() =>
        [...document.querySelectorAll('.icon')]
          .filter((el) => ((el.closest('label') ?? el.parentElement)?.textContent ?? '').trim() === '')
          .map((el) => el.parentElement?.className ?? ''),
      )
      expect(bare, `${screen}: icons with no words beside them`).toEqual([])
      const plain = await j.page.evaluate(
        (touch) =>
          [...document.querySelectorAll('button:not([data-thing]), a[href]')]
            .filter((el) => {
              const style = getComputedStyle(el)
              return style.color !== touch && style.backgroundColor !== touch
            })
            .map((el) => (el.textContent ?? '').trim()),
        TOUCH,
      )
      expect(plain, `${screen}: things to press that are not touch-coloured`).toEqual([])
    }
    await heading(WORDS.pickTitle)
    await checks('the list of games')
    await openGame(j.page)
    await checks("a game's page")
    await j.page.getByRole('link', { name: /waiting/ }).click()
    await heading(WORDS.waitingTitle)
    await checks('waiting changes')
    await j.page.locator('a.row').first().click()
    await thingNamed(j.page, 'crate-1').waitFor()
    await checks('one change')
    await openGame(j.page)
    await j.page.getByRole('link', { name: WORDS.share, exact: true }).click()
    await heading(WORDS.shareTitle('Crate Game'))
    await checks('share')
    await openLevel(j.page)
    await checks('a level')
  })
})
