// What every journey shares: the page and the pretend GitHub, started once per test file; a fresh browser window per
// journey; and the few things a journey does over and over. Nothing here touches the real GitHub: the page talks to
// this site's /api, which runs the real Function code against the pretend GitHub.
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { type Browser, type BrowserContext, chromium, firefox, type Page, webkit } from 'playwright'
import { afterAll, beforeAll } from 'vitest'
import { WORDS } from '#src/features/words/words.ts'
import { DEMO } from './api.ts'
import { type FakeGitHub, type PEOPLE, startFakeGitHub } from './fake-github/server.ts'
import { type Site, startSite } from './serve.ts'

export const SIZES = {
  ipadUpright: { width: 820, height: 1180 },
  ipadSideways: { width: 1180, height: 820 },
  phone: { width: 390, height: 844 },
} as const

const SITE_PORT = 4800
const FAKE_PORT = 4801
const ENGINES = { chromium, firefox, webkit } as const

interface Running {
  readonly fake: FakeGitHub
  readonly site: Site
  readonly browser: Browser
}
let running: Running | undefined

/** Call once at the top of a journey file: starts both servers and the browser, and stops them after the last test. */
export function setupJourneys(): void {
  beforeAll(async () => {
    const engine = (process.env.ENGINE ?? 'chromium') as keyof typeof ENGINES
    const site = `http://127.0.0.1:${SITE_PORT}`
    const fake = await startFakeGitHub(FAKE_PORT, site)
    const started = await startSite(SITE_PORT, { ...fake.env, DEMO_GAME: DEMO })
    const browser = await ENGINES[engine].launch()
    running = { fake, site: started, browser }
  })
  afterAll(async () => {
    await running?.browser.close()
    await running?.site.close()
    await running?.fake.close()
    running = undefined
  })
}

/** How the device looks at the page: its light or dark setting, a wish for less motion, and fonts that never arrive. */
export interface Look {
  readonly colorScheme?: 'light' | 'dark'
  readonly reducedMotion?: 'reduce'
  /** Every font file is refused, as a blocker or a dead line would: the screens must still read in the device's own font. */
  readonly blockFonts?: boolean
}

export interface JourneyPage {
  readonly page: Page
  readonly fake: FakeGitHub
  /** The page's own address. */
  readonly site: string
  /** Every address the page asked for, as `METHOD url`, oldest first. */
  readonly requests: readonly string[]
  /** What the browser's security rules refused, and what the page logged as an error. */
  problems(): Promise<string[]>
  close(): Promise<void>
}

/** A fresh browser, nothing remembered, the pretend GitHub reset, `person` at the keyboard. */
export async function openPage(
  size: keyof typeof SIZES,
  person: (typeof PEOPLE)[number] = 'grandma',
  /** True: another person at another window of the same pretend GitHub, with everything it holds kept. */
  keep = false,
  look: Look = {},
): Promise<JourneyPage> {
  if (running === undefined) throw new Error('Call setupJourneys() at the top of the journey file.')
  const { fake, site, browser } = running
  if (!keep) fake.reset()
  fake.person = person
  const context: BrowserContext = await browser.newContext({
    viewport: SIZES[size],
    hasTouch: true,
    ...(look.colorScheme === undefined ? {} : { colorScheme: look.colorScheme }),
    ...(look.reducedMotion === undefined ? {} : { reducedMotion: look.reducedMotion }),
  })
  // A refused font is an answer the page must live with, not a fault of the page: the browser's report of it (a
  // "Failed to load resource" line) is already left off the list of problems below.
  if (look.blockFonts === true) await context.route('**/*.woff*', (route) => route.abort())
  // The browser reports every rule it refused to obey; a journey fails on any.
  await context.addInitScript(() => {
    const w = window as unknown as { __refused: string[] }
    w.__refused = []
    document.addEventListener('securitypolicyviolation', (event) => {
      w.__refused.push(`${event.violatedDirective}: ${event.blockedURI}`)
    })
  })
  // A click that cannot happen says so in seconds, not half a minute.
  context.setDefaultTimeout(10_000)
  const page = await context.newPage()
  const requests: string[] = []
  const errors: string[] = []
  page.on('request', (request) => requests.push(`${request.method()} ${request.url()}`))
  page.on('pageerror', (error) => errors.push(`page error: ${error.message}`))
  page.on('console', (message) => {
    // The API answers refusals with a status (401, 404), and a browser logs each of those; they are answers, not faults.
    // WebKit also says so, in the console, when Playwright's own screenshot style is turned away by the page's policy;
    // a real refusal is caught by the `securitypolicyviolation` listener above, in every engine.
    const own =
      message.text().startsWith('Failed to load resource') ||
      message.text().startsWith('Refused to apply a stylesheet')
    if (message.type() === 'error' && !own) {
      errors.push(`console: ${message.text()}`)
    }
  })
  await page.goto(site.url)
  return {
    page,
    fake,
    site: site.url,
    requests,
    async problems() {
      const refused = await page
        .evaluate(() => (window as unknown as { __refused?: string[] }).__refused ?? [])
        .catch(() => [] as string[])
      return [...refused.map((r) => `refused: ${r}`), ...errors]
    },
    close: () => context.close(),
  }
}

/** Presses the sign-in Button wherever it is, and waits until the page has finished signing in and cleaned its address. */
export async function signIn(page: Page): Promise<void> {
  await page.getByRole('button', { name: WORDS.signIn }).first().click()
  await page.waitForFunction(
    () => location.search === '' && localStorage.getItem('af.tokens') !== null,
    undefined,
    {
      timeout: 30_000,
    },
  )
}

/**
 * Saves a picture a person can look at: `tests/journeys/__screenshots__/<name>.png`. WebKit takes a full-page picture by
 * adding a style element of its own, which the page's policy refuses and reports; that report is the camera's, not the
 * page's, so it is taken off the list of what the page refused (a real refusal before the picture stays on it).
 */
export async function picture(page: Page, name: string): Promise<void> {
  const dir = join(import.meta.dirname, '../journeys/__screenshots__')
  mkdirSync(dir, { recursive: true })
  const refusedBefore = await page.evaluate(
    () => (window as unknown as { __refused?: string[] }).__refused?.length ?? 0,
  )
  await page.screenshot({ path: join(dir, `${name}.png`), fullPage: true })
  // Reports of a refusal arrive a moment after it; two frames later they have all arrived.
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))))
  await page.evaluate((keep) => {
    const w = window as unknown as { __refused?: string[] }
    if (w.__refused !== undefined) w.__refused.length = keep
  }, refusedBefore)
}

/** The line under the editor's title that says whether there is something to save. */
export const statusLine = (page: Page) => page.locator('.status')

/** A thing in the level, by its id: a button laid over the picture, with its place in tiles. */
export const thingNamed = (page: Page, id: string) => page.locator(`[data-thing="${id}"]`)

/** Drags a thing by `dx` and `dy` tiles with one finger, the way a person does: down, a path across, up. */
export async function dragByTouch(page: Page, id: string, by: { dx: number; dy: number }): Promise<void> {
  const box = await thingNamed(page, id).boundingBox()
  const scale = Number(await page.locator('[data-scale]').first().getAttribute('data-scale'))
  if (box === null || !(scale > 0)) throw new Error(`No ${id} to drag on this page.`)
  const from = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  const steps = 8
  for (let step = 1; step <= steps; step += 1) {
    await page.mouse.move(from.x + (by.dx * scale * step) / steps, from.y + (by.dy * scale * step) / steps)
  }
  await page.mouse.up()
}

/**
 * The colour of the level's picture at a point of the page (CSS pixels), as `#rrggbb`: what a person sees there. The
 * buttons over the picture prove where a thing is for a finger and a screen reader; this proves the picture agrees.
 */
export async function pictureColourAt(page: Page, at: { x: number; y: number }): Promise<string> {
  return page.evaluate(({ x, y }) => {
    const canvas = document.querySelector<HTMLCanvasElement>('.stage canvas')
    if (canvas === null) throw new Error('No picture of a level on this page.')
    const rect = canvas.getBoundingClientRect()
    const ratio = canvas.width / rect.width
    const copy = document.createElement('canvas')
    copy.width = canvas.width
    copy.height = canvas.height
    const context = copy.getContext('2d')
    if (context === null) throw new Error('No 2D canvas to read the picture with.')
    context.drawImage(canvas, 0, 0)
    const [r = 0, g = 0, b = 0] = context.getImageData(
      Math.round((x - rect.left) * ratio),
      Math.round((y - rect.top) * ratio),
      1,
      1,
    ).data
    return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
  }, at)
}

/** The colour of the picture at the middle of a thing's button: the thing itself, if the picture agrees with it. */
export async function pictureColourUnder(page: Page, id: string): Promise<string> {
  const box = await thingNamed(page, id).boundingBox()
  if (box === null) throw new Error(`No ${id} on this page.`)
  return pictureColourAt(page, { x: box.x + box.width / 2, y: box.y + box.height / 2 })
}

/**
 * The colour of the picture `tiles` to the right of the middle of a thing's button (left if negative), on the same
 * row. Looked at after the layout may have changed (a line of text wrapping moves the stage), so it is measured from
 * where the thing is now, not from where it was.
 */
export async function pictureColourBeside(page: Page, id: string, tiles: number): Promise<string> {
  const box = await thingNamed(page, id).boundingBox()
  const scale = Number(await page.locator('[data-scale]').first().getAttribute('data-scale'))
  if (box === null || !(scale > 0)) throw new Error(`No ${id} on this page.`)
  return pictureColourAt(page, { x: box.x + box.width / 2 + tiles * scale, y: box.y + box.height / 2 })
}

/**
 * Opens a game's own page by its address, the way a link someone was sent does. Someone who does not own the game
 * (grandpa, kid) has no list to pick it from until they have opened it once, so a journey that is not about the list
 * goes straight to the game.
 */
export async function openGame(page: Page, game = 'crate-game'): Promise<void> {
  await page.evaluate((hash) => {
    location.hash = hash
  }, `#/game/grandma/${game}`)
  await page.getByRole('link', { name: 'level-1' }).waitFor()
}

/** Opens `game`, then its level. */
export async function openLevel(page: Page, game = 'crate-game', level = 'level-1'): Promise<void> {
  await openGame(page, game)
  await page.getByRole('link', { name: level }).click()
  await thingNamed(page, 'crate-1').waitFor()
}

/** Presses Save. */
export const pressSave = (page: Page) => page.getByRole('button', { name: WORDS.save, exact: true })
