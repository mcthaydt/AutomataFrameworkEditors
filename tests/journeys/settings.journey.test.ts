import { afterEach, describe, expect, test } from 'vitest'
import { writeAccess } from '#src/features/access/access.ts'
import { type Lang, type Row, wordsIn } from '#src/features/words/words.ts'
import {
  chooseFromMenu,
  type JourneyPage,
  menuWords,
  openLevel,
  openPage,
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
const window_ = async (size: Size, person: Person): Promise<JourneyPage> => {
  const j = await openPage(size, person)
  windows.push(j)
  return j
}
const repoOf = (j: JourneyPage) => j.fake.repos.get('grandma/crate-game')!
const EDITORS = 'automata.editors.toml'
const said = (row: Row, ...parts: (string | number)[]): string =>
  typeof row === 'function' ? row(...parts) : row
const w = (lang: Lang = 'en') => wordsIn(lang)
const stored = (j: JourneyPage, key: string) => j.page.evaluate((k) => localStorage.getItem(k), key)

/** Signed in as `person` and on the crate game's first level. */
async function inGame(size: Size, person: Person, ready?: (j: JourneyPage) => void): Promise<JourneyPage> {
  const j = await window_(size, person)
  ready?.(j)
  await signIn(j.page)
  await openLevel(j.page)
  return j
}
async function openSettings(j: JourneyPage, lang: Lang = 'en') {
  await chooseFromMenu(j.page, menuWords.settings)
  const sheet = j.page.getByRole('dialog', { name: said(w(lang).settings.settingsTitle) })
  await sheet.waitFor()
  return sheet
}
async function openHelp(j: JourneyPage) {
  await chooseFromMenu(j.page, menuWords.help)
  const sheet = j.page.getByRole('dialog', { name: said(w().help.helpTitle) })
  await sheet.waitFor()
  return sheet
}

describe.each(['ipadUpright', 'phone'] as const)('Settings at %s', (size) => {
  test('an Owner changes what is for everyone, twice, and the game says so', async () => {
    const j = await inGame(size, 'grandma')
    const sheet = await openSettings(j)
    await sheet.getByRole('radio', { name: said(w().settings.setStop) }).check()
    await sheet.getByText(said(w().settings.setChangedAll)).waitFor()
    expect(repoOf(j).branches.get('main')?.get(EDITORS)).toBe('format = 1\nproblems = "stop"\n')
    // A second change in the same visit goes in over the first.
    await sheet.getByRole('radio', { name: said(w().settings.setWarn) }).check()
    await expect
      .poll(() => repoOf(j).branches.get('main')?.get(EDITORS))
      .toBe('format = 1\nproblems = "warn"\n')
  })

  test('someone who is not an Owner can read what is for everyone, and is told who to ask', async () => {
    const j = await inGame(size, 'kid', (g) =>
      repoOf(g).put(
        'main',
        'automata.access.toml',
        writeAccess({ format: 1, everyone: 'look', people: [{ github: 'kid', level: 'edit' }] }),
      ),
    )
    const sheet = await openSettings(j)
    const stop = sheet.getByRole('radio', { name: said(w().settings.setStop) })
    expect(await stop.isDisabled()).toBe(true)
    await sheet.getByText('Only an Owner can change this.').waitFor()
    expect(repoOf(j).branches.get('main')?.has(EDITORS)).toBe(false)
  })

  test('"For me" is kept on this device, shows again after a reload, and never reaches the game', async () => {
    const j = await inGame(size, 'grandma')
    let sheet = await openSettings(j)
    await sheet.getByRole('radio', { name: said(w().settings.setSmall), exact: true }).click()
    await sheet.getByRole('radio', { name: said(w().settings.setOff), exact: true }).click()
    await sheet.getByRole('switch', { name: said(w().settings.setTips) }).click()
    expect(await stored(j, 'af.me.rows')).toBe('small')
    expect(await stored(j, 'af.me.glass')).toBe('off')
    expect(await stored(j, 'af.me.tips')).toBe('false')
    await j.page.reload()
    await thingNamed(j.page, 'crate-1').waitFor()
    sheet = await openSettings(j)
    expect(
      await sheet
        .getByRole('radio', { name: said(w().settings.setSmall), exact: true })
        .getAttribute('aria-checked'),
    ).toBe('true')
    expect(
      await sheet.getByRole('switch', { name: said(w().settings.setTips) }).getAttribute('aria-checked'),
    ).toBe('false')
    expect(repoOf(j).commits).toHaveLength(0)
  })

  test('a person changes the language and everything is said in it at once', async () => {
    const j = await inGame(size, 'grandma')
    const sheet = await openSettings(j)
    await sheet.getByLabel(said(w().settings.setLanguage)).selectOption('es')
    await j.page.getByRole('dialog', { name: said(w('es').settings.settingsTitle) }).waitFor()
    expect(await stored(j, 'af.me.language')).toBe('es')
    await j.page.reload()
    await j.page.locator('.look.world[lang="es"]').waitFor()
  })

  test('every control in Settings is a finger wide', async () => {
    const j = await inGame(size, 'grandma')
    const sheet = await openSettings(j)
    for (const control of await sheet.locator('button, select, label.opt').all()) {
      const box = await control.boundingBox()
      if (box === null) continue
      expect(box.height).toBeGreaterThanOrEqual(43.5)
    }
  })
})

describe('Help and the keys', () => {
  test('Help lists the basics, ticks one once it is done, and walks through one on request', async () => {
    const j = await inGame('ipadUpright', 'grandma')
    let help = await openHelp(j)
    await help.getByText(said(w().help.helpDone, 0, 4)).waitFor()
    await help
      .getByRole('button', { name: said(w().help.helpShow) })
      .first()
      .click()
    // "Show me" starts the tour at that step, over the level.
    const coach = j.page.locator('.coach')
    await coach.getByText(said(w().first.tourPickDo)).waitFor()
    await thingNamed(j.page, 'crate-1').tap()
    await coach.getByText(said(w().first.tourDid)).waitFor()
    await coach.getByRole('button', { name: said(w().first.tourSkip) }).click()
    help = await openHelp(j)
    await help.getByText(said(w().help.helpDone, 1, 4)).waitFor()
    expect(await stored(j, 'af.tip.tap-the-crate')).toBe('1')
  })

  test('the question mark opens Help, the keys sheet lists the keys, and Escape goes back a step', async () => {
    const j = await inGame('computer', 'grandma')
    await j.page.keyboard.press('?')
    const help = j.page.getByRole('dialog', { name: said(w().help.helpTitle) })
    await help.waitFor()
    await help.getByRole('button', { name: new RegExp(said(w().help.helpKeysRow)) }).click()
    const keys = j.page.getByRole('dialog', { name: said(w().help.keysTitle) })
    await keys.waitFor()
    await keys.getByText(said(w().help.keysUndo)).waitFor()
    await j.page.keyboard.press('Escape')
    await help.waitFor()
    await j.page.keyboard.press('Escape')
    expect(await help.count()).toBe(0)
  })

  test('arrow keys move the picked thing even when the focus is elsewhere', async () => {
    const j = await inGame('computer', 'grandma')
    const crate = thingNamed(j.page, 'crate-1')
    await crate.click()
    const before = await crate.getAttribute('data-x')
    await j.page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    await j.page.keyboard.press('ArrowRight')
    await expect.poll(() => crate.getAttribute('data-x')).not.toBe(before)
  })

  test('Settings can start the tour again, from the welcome', async () => {
    const j = await inGame('ipadUpright', 'grandma')
    const sheet = await openSettings(j)
    await sheet.getByRole('button', { name: said(w().settings.setTourAgain) }).click()
    await j.page.locator('.coach').waitFor()
  })
})
