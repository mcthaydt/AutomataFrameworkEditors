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
): Promise<JourneyPage> {
  if (running === undefined) throw new Error('Call setupJourneys() at the top of the journey file.')
  const { fake, site, browser } = running
  if (!keep) fake.reset()
  fake.person = person
  const context: BrowserContext = await browser.newContext({ viewport: SIZES[size], hasTouch: true })
  // The browser reports every rule it refused to obey; a journey fails on any.
  await context.addInitScript(() => {
    const w = window as unknown as { __refused: string[] }
    w.__refused = []
    document.addEventListener('securitypolicyviolation', (event) => {
      w.__refused.push(`${event.violatedDirective}: ${event.blockedURI}`)
    })
  })
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
  await page.waitForFunction(() => location.search === '' && localStorage.getItem('af.tokens') !== null)
}

/** Saves a picture a person can look at: `tests/journeys/__screenshots__/<name>.png`. */
export async function picture(page: Page, name: string): Promise<void> {
  const dir = join(import.meta.dirname, '../journeys/__screenshots__')
  mkdirSync(dir, { recursive: true })
  await page.screenshot({ path: join(dir, `${name}.png`), fullPage: true })
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

/** From the list of games: opens `game`, then its level. */
export async function openLevel(page: Page, game = 'crate-game', level = 'level-1'): Promise<void> {
  await page.getByRole('link', { name: game }).click()
  await page.getByRole('link', { name: level }).click()
  await thingNamed(page, 'crate-1').waitFor()
}

/** Presses Save. */
export const pressSave = (page: Page) => page.getByRole('button', { name: WORDS.save, exact: true })
