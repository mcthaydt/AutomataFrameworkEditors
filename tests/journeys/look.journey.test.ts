// How the editors look, driven in a real browser at iPad upright, iPad sideways and phone size: the colours and the
// fonts as the page really serves them, the device's light setting ignored, and (as the tasks land) the level's layout
// and the stamps. The screens journey measures every screen against the touch rules; this one proves the look itself.
import { afterEach, describe, expect, test } from 'vitest'
import { WORDS } from '#src/features/words/words.ts'
import {
  type JourneyPage,
  type Look,
  openPage,
  SIZES,
  setupJourneys,
  thingNamed,
} from '../fixtures/journey.ts'

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
    await j.page.getByRole('button', { name: WORDS.tryIt }).click()
    await j.page.getByRole('heading', { level: 1, name: 'Crate Game' }).waitFor()
    await j.page.getByRole('link', { name: 'level-1' }).click()
    await j.page.getByRole('heading', { level: 1, name: 'level-1' }).waitFor()
    await thingNamed(j.page, 'crate-1').waitFor()
    expect(await j.page.locator('h1').innerText()).toBe('level-1')
  })
})
