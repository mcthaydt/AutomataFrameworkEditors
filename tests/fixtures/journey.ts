// What every journey shares: the page and the pretend GitHub, started once per test file; a fresh browser window per
// journey; and the few things a journey does over and over. Nothing here touches the real GitHub: the page talks to
// this site's /api, which runs the real Function code against the pretend GitHub.
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { type Browser, type BrowserContext, chromium, firefox, type Page, webkit } from 'playwright'
import { afterAll, beforeAll } from 'vitest'
import { nameOf, type Row, WORDS, wordsIn } from '#src/features/words/words.ts'
import { DEMO } from './api.ts'
import { cutOffTracker } from './cut-off.ts'
import { type FakeGitHub, type PEOPLE, startFakeGitHub } from './fake-github/server.ts'
import { type Site, startSite } from './serve.ts'

/** The five windows the editor is drawn for: an iPad both ways, a phone both ways, and a computer. */
export const SIZES = {
  ipadUpright: { width: 834, height: 1210 },
  ipadSideways: { width: 1210, height: 834 },
  phone: { width: 390, height: 844 },
  phoneSideways: { width: 844, height: 390 },
  computer: { width: 1280, height: 800 },
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
  /** Keeps every answer to `path` waiting until the returned function is called. */
  hold(path: string): () => void
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
  /** `owner/name`: the demo (the Crate Game) or `LINKS` (three rooms whose doors and edges join). */
  game: string = DEMO,
  /**
   * `firstRun`: a person who has never been here (the language card, then the welcome and the tour); by default the
   * first run is done and English chosen, so a journey about something else is not in the way of it.
   * `locale`: the language the browser says it speaks.
   */
  options: { readonly firstRun?: boolean; readonly locale?: string } = {},
): Promise<JourneyPage> {
  if (running === undefined) throw new Error('Call setupJourneys() at the top of the journey file.')
  const { fake, site, browser } = running
  if (!keep) fake.reset()
  fake.person = person
  const context: BrowserContext = await browser.newContext({
    viewport: SIZES[size],
    hasTouch: true,
    ...(options.locale === undefined ? {} : { locale: options.locale }),
  })
  if (options.firstRun !== true) {
    // A person who has been here: the first run is finished and English chosen, but only until they choose otherwise.
    await context.addInitScript(() => {
      try {
        if (
          localStorage.getItem('af.me.language') === null &&
          localStorage.getItem('af.guide.done') === null
        ) {
          localStorage.setItem('af.me.language', 'en')
          localStorage.setItem('af.guide.done', '1')
        }
      } catch {
        // A browser that will not keep it shows the first run, which a journey of that kind expects.
      }
    })
  }
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
  // A call or font the page moved on from is not a fault, though WebKit and Firefox report it as an error (see cut-off.ts).
  const cutOff = cutOffTracker()
  page.on('request', (request) => {
    requests.push(`${request.method()} ${request.url()}`)
    cutOff.started(request.url())
  })
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) cutOff.navigated()
  })
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
  // The demo is what a visitor sees first; any other game is opened by its address, as a link someone was sent does.
  await page.goto(game === DEMO ? site.url : `${site.url}/#/game/${game}`)
  return {
    page,
    fake,
    site: site.url,
    hold: (path) => site.hold(path),
    requests,
    async problems() {
      const refused = await page
        .evaluate(() => (window as unknown as { __refused?: string[] }).__refused ?? [])
        .catch(() => [] as string[])
      return [...refused.map((r) => `refused: ${r}`), ...errors.filter((error) => !cutOff.explains(error))]
    },
    close: () => context.close(),
  }
}

const MENUS = wordsIn('en').menus
const sayRow = (row: Row, ...parts: (string | number)[]): string =>
  typeof row === 'function' ? row(...parts) : row

/** What the game's menu says for `key`, in English. */
export const menuWords = {
  whoCanChange: sayRow(MENUS.whoCanChange),
  waitingRow: (n: number) => sayRow(MENUS.waitingRow, n),
  keepCopy: (level: string) => sayRow(MENUS.keepCopyOf, nameOf(level)),
  yourGames: sayRow(MENUS.yourGames),
  signIn: sayRow(MENUS.signIn),
  signOut: sayRow(MENUS.signOut),
  // A row's name starts with its word: "Keep a copy of Level 1" says "helper" in its line under it.
  help: new RegExp(`^${sayRow(MENUS.helpRow)}`),
  settings: new RegExp(`^${sayRow(MENUS.settingsRow)}`),
} as const

/**
 * Opens the game's menu and presses a row of it. On a narrow phone the bar has no room for the game's button, so the
 * same rows are at the end of the part menu.
 */
export async function chooseFromMenu(page: Page, row: string | RegExp): Promise<void> {
  const game = page.locator('button.game')
  await page.locator('[data-bar]').waitFor()
  await ((await game.count()) > 0 ? game : page.locator('button.part')).click()
  await page.getByRole('menuitem', { name: row }).click()
}

/** The words of every row of the game's menu, as a person reads them; the menu is shut again afterwards. */
export async function gameMenuRows(page: Page): Promise<string[]> {
  const game = page.locator('button.game')
  await page.locator('[data-bar]').waitFor()
  await ((await game.count()) > 0 ? game : page.locator('button.part')).click()
  await page.getByRole('menuitem').first().waitFor()
  const rows = await page.getByRole('menuitem').allTextContents()
  await page.keyboard.press('Escape')
  return rows
}

/** The sign-in Button on the first screen, or the game's menu once a game is open. */
async function pressSignIn(page: Page): Promise<void> {
  const bar = page.locator('[data-bar]')
  const first = page.getByRole('button', { name: WORDS.signIn }).first()
  await bar.or(first).first().waitFor()
  if ((await bar.count()) > 0) await chooseFromMenu(page, menuWords.signIn)
  else await first.click()
}

/** Presses sign-in wherever it is, and waits until the page has finished signing in and cleaned its address. */
export async function signIn(page: Page): Promise<void> {
  await pressSignIn(page)
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
 * A picture of `clip` on the page, as the browser draws it. WebKit's screenshot adds an inline style element to the page
 * and the page's rules refuse it: that is the tool's doing, not the page's, so those refusals are taken off the list a
 * journey fails on. Nothing else is.
 */
export async function pictureOf(
  page: Page,
  clip: { x: number; y: number; width: number; height: number },
): Promise<Buffer> {
  const before = await page.evaluate(() => (window as unknown as { __refused: string[] }).__refused.length)
  const shot = await page.screenshot({ clip })
  await page.evaluate(
    (kept) =>
      new Promise<void>((done) => {
        // The browser reports a refusal a moment after it happens.
        setTimeout(() => {
          const refused = (window as unknown as { __refused: string[] }).__refused
          for (let at = refused.length - 1; at >= kept; at -= 1) {
            if (refused[at] === 'style-src-elem: inline') refused.splice(at, 1)
          }
          done()
        }, 150)
      }),
    before,
  )
  return shot
}

/**
 * Holds one finger on a half of the game's touch controls (`walk` or `jump`) and slides it `dx` pixels, the way a thumb
 * does, for `ms` milliseconds, then lifts it. Finger events are sent as the page's own, because a script cannot drive
 * a second kind of finger in every engine.
 */
export async function slideGameHalf(
  page: Page,
  half: 'walk' | 'jump',
  by: { dx: number; ms: number },
): Promise<void> {
  await page.evaluate(
    async ({ half, by }) => {
      const target = document.querySelector<HTMLElement>(`[data-play="box"] [data-half="${half}"]`)
      if (target === null) throw new Error(`No ${half} half on this page.`)
      const box = target.getBoundingClientRect()
      const at = (dx: number): PointerEventInit => ({
        pointerId: 7,
        pointerType: 'touch',
        isPrimary: true,
        bubbles: true,
        clientX: box.x + box.width / 2 + dx,
        clientY: box.y + box.height / 2,
      })
      target.dispatchEvent(new PointerEvent('pointerdown', at(0)))
      for (let step = 1; step <= 6; step += 1) {
        target.dispatchEvent(new PointerEvent('pointermove', at((by.dx * step) / 6)))
      }
      await new Promise((done) => setTimeout(done, by.ms))
      target.dispatchEvent(new PointerEvent('pointerup', at(by.dx)))
    },
    { half, by },
  )
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
 * Opens a game by its address, the way a link someone was sent does: it opens on its start level. Someone who does not
 * own the game (grandpa, kid) has no list to pick it from until they have opened it once, so a journey that is not about
 * the list goes straight to the game.
 */
export async function openGame(page: Page, game = 'crate-game'): Promise<void> {
  await page.evaluate((hash) => {
    location.hash = hash
  }, `#/game/grandma/${game}`)
  await page.locator('[data-bar]').waitFor()
}

/** Opens `game` on `level`: the start level opens by itself, any other is picked from the part menu. */
export async function openLevel(page: Page, game = 'crate-game', level = 'level-1'): Promise<void> {
  await openGame(page, game)
  if (level !== 'level-1') {
    await page.locator('button.part').click()
    await page.getByRole('menuitem', { name: nameOf(level), exact: true }).click()
  }
  await thingNamed(page, 'crate-1').waitFor()
}

/** The one button that puts what was changed in the game, sends it to be checked, or keeps a copy: when there is any. */
export const putButton = (page: Page) => page.locator('button.put:not(.quiet)')

/** The main button, when it says `words`: a change is there and this is what it offers. */
export const putButtonSaying = (page: Page, words: string) =>
  page.locator('button.put:not(.quiet)', { hasText: words })

/** The same place when nothing has changed here (or the person's change is waiting): the button is quiet. */
export const quietButton = (page: Page) => page.locator('button.put.quiet')

/** Presses the main button. */
export const pressPut = (page: Page) => putButton(page).click()

const CHANGES = wordsIn('en').changes
const KEPT = wordsIn('en').kept
const said = (row: Row, ...parts: (string | number)[]): string =>
  typeof row === 'function' ? row(...parts) : row

/** What the sheets for putting changes in say, in English. */
export const putWords = {
  doneTitle: said(CHANGES.doneTitle),
  putThem: said(CHANGES.putThem),
  notYet: said(CHANGES.notYet),
  again: said(CHANGES.again),
  notNow: said(CHANGES.notNow),
  takeBack: said(CHANGES.takeBack),
  failPut: said(CHANGES.failPut),
  keepTitle: said(KEPT.keepTitle),
  keepText: said(KEPT.keepText),
  showMe: said(CHANGES.showMe),
  nextProblem: said(KEPT.nextProblem),
} as const

const CHECK = wordsIn('en').check
const WHOSE = wordsIn('en').whose

/** What the sheet for checking someone's changes says, in English. */
export const checkWords = {
  putThem: said(CHECK.putThem),
  putDone: said(CHECK.putDoneTitle),
  checksFailed: said(CHECK.checksFailed),
  gone: said(CHECK.gone),
  keepMine: said(WHOSE.keepMine),
  nothingLeft: said(WHOSE.nothingLeft),
} as const

/** The sheet that opens over the level when the main button is pressed. */
export const putSheet = (page: Page) => page.getByRole('dialog')

/**
 * Puts everything in the game, or sends it to be checked: presses the main button, then the sheet's own button, and waits
 * for the sheet to say it went. Two presses, because the first only shows what would go.
 */
export async function putThemIn(
  page: Page,
  how: 'direct' | 'suggestion' = 'direct',
  closeAfter = true,
): Promise<void> {
  await pressPut(page)
  const sheet = putSheet(page)
  await sheet.getByRole('button', { name: how === 'direct' ? /^Put them in/ : /^Send/ }).click()
  await sheet
    .getByRole('heading', { name: how === 'direct' ? putWords.doneTitle : /^Sent/, exact: how === 'direct' })
    .waitFor()
  if (!closeAfter) return
  await sheet.getByRole('button', { name: 'Close' }).first().click()
  await sheet.waitFor({ state: 'detached' })
}

/** Opens the links game's map from the top bar (on an upright phone the bar has no room: the part menu has the row). */
export async function openMapOf(page: Page): Promise<void> {
  await openGame(page, 'links-game')
  await page.locator('[data-thing="exit"]').waitFor()
  await openMapFromBar(page)
}

/** Opens the map of the game that is open now. */
export async function openMapFromBar(page: Page): Promise<void> {
  const button = page.getByRole('button', { name: 'Map', exact: true })
  if ((await button.count()) > 0) await button.click()
  else {
    await page.locator('button.part').click()
    await page.getByRole('menuitem', { name: /^Map/ }).click()
  }
  await page.locator('[data-level]').first().waitFor()
}

/** Takes a level by its middle with the mouse and moves it this many tiles. */
export async function dragLevel(
  page: Page,
  id: string,
  tiles: { x: number; y: number },
  letGo = true,
): Promise<void> {
  const scale = Number(await page.locator('[data-scale]').first().getAttribute('data-scale'))
  const box = await page.locator(`[data-level="${id}"]`).boundingBox()
  if (box === null) throw new Error(`no level ${id} on the map`)
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + (tiles.x * scale) / 2, y + (tiles.y * scale) / 2, { steps: 4 })
  await page.mouse.move(x + tiles.x * scale, y + tiles.y * scale, { steps: 4 })
  if (letGo) await page.mouse.up()
}

/** Pushes Room 1 against Room 2 on the map so they meet at a wall: a problem in the game. */
export async function makeWall(page: Page): Promise<void> {
  await dragLevel(page, 'room-1', { x: 3.4, y: 0.2 })
  await page.locator('[data-way="clear"]').waitFor()
}

/** The text the newest commit put in a level's file (a put can change the project file too, so `text` is not enough). */
export function levelPut(
  repo:
    | {
        readonly commits: readonly {
          readonly files: readonly { readonly path: string; readonly text: string | undefined }[]
        }[]
      }
    | undefined,
  path: string,
): string | undefined {
  return repo?.commits[0]?.files.find((f) => f.path === path)?.text
}
