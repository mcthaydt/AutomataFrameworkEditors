import { readFile } from 'node:fs/promises'
import { afterEach, describe, expect, test } from 'vitest'
import { writeAccess } from '#src/features/access/access.ts'
import { type Lang, type Row, WORDS, wordsIn } from '#src/features/words/words.ts'
import { LEVEL_PATH } from '../fixtures/game/read.ts'
import {
  dragByTouch,
  type JourneyPage,
  menuWords,
  openGame,
  openPage,
  pressPut,
  putButton,
  putButtonSaying,
  type SIZES,
  setupJourneys,
  signIn,
  thingNamed,
} from '../fixtures/journey.ts'

setupJourneys()

const windows: JourneyPage[] = []
afterEach(async () => {
  // Close every window first: a window left open by a failing test would carry its problems into the next one.
  const found: string[][] = []
  for (const j of windows) {
    found.push(await j.problems())
    await j.close()
  }
  windows.length = 0
  expect(found.flat()).toEqual([])
})
type Size = keyof typeof SIZES
type Person = Parameters<typeof openPage>[1]
const window_ = async (
  size: Size,
  person: Person,
  keep = false,
  options: Parameters<typeof openPage>[4] = {},
): Promise<JourneyPage> => {
  const j = await openPage(size, person, keep, undefined, options)
  windows.push(j)
  return j
}
const repoOf = (j: JourneyPage) => j.fake.repos.get('grandma/crate-game')!
const text = (j: JourneyPage, words: string) => j.page.getByText(words, { exact: false }).first().waitFor()
const GAME = '#/game/grandma/crate-game'
/** Nobody has added the editor to any game yet. */
const noEditorYet = (j: JourneyPage): void => {
  for (const repo of j.fake.repos.values()) repo.installed = false
}
const share = (j: JourneyPage, over: Parameters<typeof writeAccess>[0]): void =>
  repoOf(j).put('main', 'automata.access.toml', writeAccess(over))

const said = (row: Row, ...parts: (string | number)[]): string =>
  typeof row === 'function' ? row(...parts) : row
const first = (lang: Lang) => wordsIn(lang).first
/** The tour's card, which says "1 of 2" and what to try. */
const coach = (j: JourneyPage) => j.page.locator('.coach')
const stored = (j: JourneyPage, key: string) => j.page.evaluate((k) => localStorage.getItem(k), key)

/** A new person: the language card, then "Try it now", then the welcome over the level. */
async function newPerson(size: Size, locale: string, lang: Lang): Promise<JourneyPage> {
  const j = await window_(size, 'grandma', false, { firstRun: true, locale })
  await j.page.getByRole('heading', { level: 1, name: said(first(lang).languageTitle) }).waitFor()
  return j
}
const goOn = (j: JourneyPage, lang: Lang) =>
  j.page.getByRole('button', { name: said(first(lang).languageGo) }).click()

describe.each(['ipadUpright', 'phone'] as const)('at %s', (size) => {
  test('a new person is asked their language first, then shown around: each step waits for them', async () => {
    const j = await newPerson(size, 'en-US', 'en')
    // Nothing is kept until "Go on".
    expect(await stored(j, 'af.me.language')).toBeNull()
    await goOn(j, 'en')
    expect(await stored(j, 'af.me.language')).toBe('en')
    await j.page.getByRole('button', { name: WORDS.tryIt }).click()
    const welcome = j.page.getByRole('dialog', { name: said(first('en').welcomeTitle) })
    await welcome.waitFor()
    await welcome.getByRole('button', { name: said(first('en').welcomeShow) }).click()

    // Step 1 asks for a pick, and says nothing more until the person has done it.
    await coach(j)
      .getByText(said(first('en').tourPickDo))
      .waitFor()
    expect(
      await coach(j)
        .getByRole('button', { name: said(first('en').tourNext) })
        .count(),
    ).toBe(0)
    await thingNamed(j.page, 'crate-1').tap()
    await coach(j)
      .getByText(said(first('en').tourDid))
      .waitFor()
    await coach(j)
      .getByRole('button', { name: said(first('en').tourNext) })
      .click()

    // Step 2 asks for a change to a number of what is picked ("How heavy"), and a plain pick does not count.
    await coach(j)
      .getByText(said(first('en').tourValueDo, 'How heavy'))
      .waitFor()
    // On a small screen the settings are folded to a line until it is pressed.
    const folded = j.page.locator('button[data-tour="settings"]')
    if ((await folded.count()) > 0) await folded.click()
    await j.page.locator('input[type="range"][aria-label="How heavy"]').focus()
    await j.page.keyboard.press('ArrowRight')
    await coach(j)
      .getByText(said(first('en').tourDid))
      .waitFor()
    await coach(j)
      .getByRole('button', { name: said(first('en').tourNext) })
      .click()

    // The end of the tour is said, and then it is done for good.
    await coach(j)
      .getByRole('heading', { name: said(first('en').tourEndTitle) })
      .waitFor()
    await coach(j)
      .getByRole('button', { name: said(first('en').tourEnd) })
      .click()
    expect(await coach(j).count()).toBe(0)
    expect(await stored(j, 'af.guide.done')).toBe('1')
    expect(await stored(j, 'af.tip.tap-the-crate')).toBe('1')
    await j.page.reload()
    await thingNamed(j.page, 'crate-1').waitFor()
    expect(await j.page.getByRole('dialog', { name: said(first('en').welcomeTitle) }).count()).toBe(0)
    expect(await coach(j).count()).toBe(0)
  })
})

test("a new person's device language is already chosen, and everything after it is in it", async () => {
  const j = await newPerson('ipadUpright', 'es-ES', 'es')
  expect(
    await j.page
      .getByRole('button', { name: said(first('es').languageUse, 'Español') })
      .getAttribute('aria-pressed'),
  ).toBe('true')
  await goOn(j, 'es')
  expect(await stored(j, 'af.me.language')).toBe('es')
  await j.page.getByRole('button', { name: WORDS.tryIt }).click()
  await j.page.getByRole('dialog', { name: said(first('es').welcomeTitle) }).waitFor()
})

test('a language the editors do not have starts on English, and another can be tapped before going on', async () => {
  const j = await newPerson('ipadUpright', 'sw-KE', 'en')
  await j.page.getByRole('button', { name: said(first('ja').languageUse, '日本語') }).click()
  await j.page.getByRole('heading', { level: 1, name: said(first('ja').languageTitle) }).waitFor()
  await goOn(j, 'ja')
  expect(await stored(j, 'af.me.language')).toBe('ja')
})

test('"I\'ll look around myself" ends the first run for good, with no tour', async () => {
  const j = await newPerson('ipadUpright', 'en-US', 'en')
  await goOn(j, 'en')
  await j.page.getByRole('button', { name: WORDS.tryIt }).click()
  const welcome = j.page.getByRole('dialog', { name: said(first('en').welcomeTitle) })
  await welcome.getByRole('button', { name: said(first('en').welcomeSelf) }).click()
  expect(await welcome.count()).toBe(0)
  expect(await coach(j).count()).toBe(0)
  expect(await stored(j, 'af.guide.done')).toBe('1')
  await thingNamed(j.page, 'crate-1').tap()
  expect(await coach(j).count()).toBe(0)
})

test('Skip is there at every step and ends the tour', async () => {
  const j = await newPerson('phone', 'en-US', 'en')
  await goOn(j, 'en')
  await j.page.getByRole('button', { name: WORDS.tryIt }).click()
  await j.page
    .getByRole('dialog', { name: said(first('en').welcomeTitle) })
    .getByRole('button', { name: said(first('en').welcomeShow) })
    .click()
  const skip = coach(j).getByRole('button', { name: said(first('en').tourSkip) })
  await skip.waitFor()
  expect((await skip.boundingBox())?.height).toBeGreaterThanOrEqual(43.5)
  await skip.click()
  expect(await coach(j).count()).toBe(0)
  expect(await stored(j, 'af.guide.done')).toBe('1')
})

test('an Owner who has already had the tour goes from nothing to a saved change, following only what the screen says', async () => {
  const j = await window_('ipadUpright', 'grandma')
  noEditorYet(j)
  await j.page.getByRole('button', { name: WORDS.signIn }).click()
  await j.page.getByRole('button', { name: WORDS.pickAdd }).click()
  await j.page.getByRole('link', { name: 'crate-game' }).click()
  await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
  await pressPut(j.page)
  await text(j, WORDS.savedDirect)
  expect(repoOf(j).commits).toHaveLength(1)
  await j.page.reload()
  await text(j, WORDS.tipShare)
})

test('a visitor, from nothing to a change and a copy', async () => {
  const j = await window_('ipadUpright', 'grandma')
  await j.page.getByRole('button', { name: WORDS.tryIt }).click()
  await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
  await putButton(j.page).click()
  const download = j.page.waitForEvent('download')
  await j.page.getByRole('button', { name: WORDS.copyKeep }).click()
  await readFile(await (await download).path(), 'utf8')
  await text(j, WORDS.copyKept)
  expect(await j.page.getByRole('heading', { level: 1, name: WORDS.appName }).count()).toBe(0)
})

test("a visitor who signs in from the game's menu: the change comes back and saves", async () => {
  const j = await window_('ipadUpright', 'grandma')
  await j.page.goto(`${j.site}/${GAME}/level/level-1`)
  await thingNamed(j.page, 'crate-1').waitFor()
  await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
  await signIn(j.page)
  await text(j, WORDS.draftBack)
  await pressPut(j.page)
  await text(j, WORDS.savedDirect)
})

describe('someone sent a link, not signed in', () => {
  async function viaLink(person: Person, over: Parameters<typeof writeAccess>[0]): Promise<JourneyPage> {
    const j = await window_('ipadUpright', person)
    share(j, over)
    await j.page.goto(`${j.site}/${GAME}`)
    await thingNamed(j.page, 'crate-1').waitFor()
    await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
    await signIn(j.page)
    await text(j, WORDS.draftBack)
    await pressPut(j.page)
    return j
  }
  test('(suggest) lands in the game, signs in from its menu, ends "waiting for someone to approve it"', async () => {
    const j = await viaLink('kid', { format: 1, everyone: 'suggest', people: [] })
    await text(j, WORDS.savedSuggestion)
  })
  test('(edit) the same, ending "the change is in your game"', async () => {
    const j = await viaLink('grandpa', {
      format: 1,
      everyone: 'look',
      people: [{ github: 'grandpa', level: 'edit' }],
    })
    await text(j, WORDS.savedDirect)
  })
})

test('someone sent a link (look): told they can look around and who to ask', async () => {
  const j = await window_('ipadUpright', 'stranger')
  share(j, { format: 1, everyone: 'look', people: [] })
  await j.page.goto(`${j.site}/${GAME}`)
  await signIn(j.page)
  await text(j, WORDS.lookOnly)
  // Nothing to put in: the one button waits for a change, and then offers a copy, never a save.
  expect(await putButton(j.page).count()).toBe(0)
  await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
  await putButtonSaying(j.page, String(wordsIn('en').bar.keepCopy)).waitFor()
})

test('someone sent a link they may not open: told to ask the owner, with a way back to "Pick a game"', async () => {
  const j = await window_('ipadUpright', 'stranger')
  share(j, { format: 1, everyone: 'nothing', people: [] })
  await j.page.goto(`${j.site}/${GAME}`)
  await signIn(j.page)
  await text(j, WORDS.cantFindGame)
  await j.page.getByRole('button', { name: WORDS.back, exact: true }).click()
  await j.page.getByRole('heading', { level: 1, name: WORDS.pickTitle }).waitFor()
})

test('a game that is missing, broken or not a game says so, and no tour is offered over it', async () => {
  const j = await window_('ipadUpright', 'grandma', false, { firstRun: true })
  await goOn(j, 'en')
  await signIn(j.page)
  await j.page.goto(`${j.site}/#/game/grandma/nope`)
  await text(j, WORDS.cantFindGame)
  await j.page.goto(`${j.site}/#/game/grandma/not-a-game`)
  await text(j, WORDS.notAGame)
  repoOf(j).put('main', LEVEL_PATH, '{')
  await j.page.goto(`${j.site}/${GAME}`)
  await text(j, WORDS.brokenGame)
  expect(await j.page.getByRole('dialog', { name: said(first('en').welcomeTitle) }).count()).toBe(0)
})

test("an approver's first visit with a change waiting: the tip points at it, once", async () => {
  const kid = await window_('ipadUpright', 'kid')
  share(kid, { format: 1, everyone: 'suggest', people: [{ github: 'grandpa', level: 'approve' }] })
  await signIn(kid.page)
  await kid.page.goto(`${kid.site}/${GAME}/level/level-1`)
  await thingNamed(kid.page, 'crate-1').waitFor()
  await dragByTouch(kid.page, 'crate-1', { dx: 2, dy: 0 })
  await pressPut(kid.page)
  await text(kid, WORDS.savedSuggestion)
  const g = await window_('ipadUpright', 'grandpa', true)
  await signIn(g.page)
  await openGame(g.page)
  await text(g, WORDS.tipApprove)
  await g.page.getByRole('button', { name: WORDS.tipGotIt }).click()
  await g.page.reload()
  await g.page.locator('[data-bar]').waitFor()
  expect(await g.page.getByText(WORDS.tipApprove).count()).toBe(0)
})

test('no screen a visitor can reach is a dead end: each has a way on and a way back', async () => {
  const j = await window_('ipadUpright', 'grandma')
  const back = j.page.getByRole('button', { name: WORDS.back, exact: true })

  // Welcome: Try it now, Sign in. Nothing to go back to.
  expect(await j.page.getByRole('button', { name: WORDS.tryIt }).isEnabled()).toBe(true)
  expect(await j.page.getByRole('button', { name: WORDS.signIn }).isEnabled()).toBe(true)

  // The example game: a level to move, and in the game's menu a way on (sign in) and a way to the list of games.
  await j.page.getByRole('button', { name: WORDS.tryIt }).click()
  await thingNamed(j.page, 'crate-1').waitFor()
  await j.page.locator('button.game').click()
  await j.page.getByRole('menuitem', { name: menuWords.signIn }).waitFor()
  await j.page.getByRole('menuitem', { name: menuWords.yourGames }).waitFor()
  await j.page.keyboard.press('Escape')

  // A game they may not open: a way on (Sign in), a way back, and the way back works.
  repoOf(j).isPublic = false
  // The address is the same one, so only a reload asks again.
  await j.page.reload()
  await text(j, WORDS.cantFindVisitor)
  expect(await j.page.getByRole('button', { name: WORDS.signIn }).isEnabled()).toBe(true)
  expect(await back.count()).toBe(1)
  await back.click()
  await j.page.getByRole('heading', { level: 1, name: WORDS.appName }).waitFor()

  // A screen about a person: Welcome, with Sign in, so the person can go on.
  await j.page.goto(`${j.site}/${GAME}/share`)
  await j.page.getByRole('heading', { level: 1, name: WORDS.appName }).waitFor()
  expect(await j.page.getByRole('button', { name: WORDS.signIn }).isEnabled()).toBe(true)
})

test('with only one game, coming back from GitHub opens it without asking', async () => {
  const j = await window_('ipadUpright', 'grandma')
  noEditorYet(j)
  for (const name of [...j.fake.repos.keys()]) if (name !== 'grandma/crate-game') j.fake.repos.delete(name)
  await j.page.getByRole('button', { name: WORDS.signIn }).click()
  await j.page.getByRole('button', { name: WORDS.pickAdd }).click()
  await j.page.locator('[data-bar]').waitFor()
})

test('cancelling on GitHub comes back to Welcome with what went wrong', async () => {
  const j = await window_('ipadUpright', 'grandma')
  j.fake.signIn = 'deny'
  await j.page.getByRole('button', { name: WORDS.signIn }).click()
  await text(j, WORDS.signInCancelled)
})

test('the welcome screen says what signing in is for, and has a way to make an account', async () => {
  const j = await window_('ipadUpright', 'grandma')
  await text(j, WORDS.signInWhy)
  expect(await j.page.getByRole('link', { name: WORDS.noAccount }).getAttribute('href')).toMatch(/\/signup$/)
})

test('a returning person, signed in, lands on "Pick a game"', async () => {
  const j = await window_('ipadUpright', 'grandma')
  await signIn(j.page)
  await j.page.getByRole('heading', { level: 1, name: WORDS.pickTitle }).waitFor()
})
