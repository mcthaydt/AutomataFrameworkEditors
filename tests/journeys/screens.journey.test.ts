// Every screen a person can reach, at the five sizes of window (an iPad both ways, a phone both ways, a computer): measured against the touch and
// layout rules, then pictured for a person to look at (the drunk-grandma check). The rules, on every screen:
// no sideways scroll; every button, link, field and picker at least 44 px each way, the primary Button at least
// 48 tall; none overlapping; one heading (the World screen has none: its bar names where it is); at most one Back; one
// primary Button; no text off the side or cut with an ellipsis; and on the World screen a stage that is at least half
// the shorter side of the window wide.
// The pictures land in `tests/journeys/__screenshots__/` and, from CI, on the `ci-screens` branch.

import { type Level, writeContent } from '@automataframework/framework/headless'
import type { Page } from 'playwright'
import { afterEach, describe, expect, test } from 'vitest'
import { type AccessFile, writeAccess } from '#src/features/access/access.ts'
import { EDITORS_FILE, writeEditors } from '#src/features/files/editors-file.ts'
import { type Lang, WORDS, type Row as WordRow, wordsIn } from '#src/features/words/words.ts'
import { fixtureFiles, LEVEL_PATH } from '../fixtures/game/read.ts'
import {
  checkWords,
  chooseFromMenu,
  dragByTouch,
  type JourneyPage,
  makeWall,
  menuWords,
  openGame,
  openLevel,
  openMapOf,
  openPage,
  picture,
  pressPut,
  putButton,
  putSheet,
  putThemIn,
  putWords,
  quietButton,
  SIZES,
  setupJourneys,
  signIn,
  thingNamed,
} from '../fixtures/journey.ts'
import { type Site, startSite } from '../fixtures/serve.ts'

setupJourneys()

type Size = keyof typeof SIZES
type Person = Parameters<typeof openPage>[1]

const windows: JourneyPage[] = []
const cleanups: Array<() => Promise<void>> = []
afterEach(async () => {
  // Everything is closed even when a window found a problem, so one red screen never leaves its state to the next.
  const found: string[] = []
  for (const j of windows) {
    found.push(...(await j.problems()))
    await j.close()
  }
  windows.length = 0
  for (const cleanup of cleanups) await cleanup()
  cleanups.length = 0
  expect(found).toEqual([])
})

/** One more window of the same pretend GitHub (everything the first one set up is kept). */
const window_ = async (
  size: Size,
  person: Person,
  keep = windows.length > 0,
  options: Parameters<typeof openPage>[4] = {},
): Promise<JourneyPage> => {
  const j = await openPage(size, person, keep, undefined, options)
  windows.push(j)
  return j
}
const repoOf = (j: JourneyPage) => j.fake.repos.get('grandma/crate-game')!
const text = (j: JourneyPage, words: string) => j.page.getByText(words, { exact: false }).first().waitFor()
const said = (row: WordRow, ...parts: (string | number)[]): string =>
  typeof row === 'function' ? row(...parts) : row
const w = (lang: Lang = 'en') => wordsIn(lang)
/** A new person at the demo: the language card, then (after "Go on" and "Try it now") the welcome over the level. */
async function newPerson(size: Size): Promise<JourneyPage> {
  const j = await window_(size, 'grandma', false, { firstRun: true, locale: 'en-US' })
  await heading(j, said(w().first.languageTitle))
  return j
}
async function welcomed(size: Size): Promise<JourneyPage> {
  const j = await newPerson(size)
  await j.page.getByRole('button', { name: said(w().first.languageGo) }).click()
  await j.page.getByRole('button', { name: WORDS.tryIt }).click()
  await j.page.getByRole('dialog', { name: said(w().first.welcomeTitle) }).waitFor()
  return j
}
const heading = (j: JourneyPage, name: string) => j.page.getByRole('heading', { level: 1, name }).waitFor()
const level1 = JSON.parse(fixtureFiles[LEVEL_PATH] ?? '') as Level
/** The level with the crate somewhere else: what a teammate saved while someone had it open. */
const theirs = writeContent('level', {
  ...level1,
  things: level1.things.map((t) => (t.id === 'crate-1' ? { ...t, x: 10.5 } : t)),
} as never)
const GAME = '/#/game/grandma/crate-game'
const ACCESS = 'automata.access.toml'
type Everyone = AccessFile['everyone']
type Row = AccessFile['people'][number]
const share = (j: JourneyPage, everyone: Everyone, people: Row[] = []) =>
  repoOf(j).put('main', ACCESS, writeAccess({ format: 1, everyone, people }))
/** Kid gets exactly `level`; everyone else may look. */
const kidIs = (level: Row['level']) => (j: JourneyPage) => share(j, 'look', [{ github: 'kid', level }])
const noEditorYet = (j: JourneyPage): void => {
  for (const repo of j.fake.repos.values()) repo.installed = false
}

/** Signed in as `person`, on the list of games. */
async function listAs(size: Size, person: Person, ready?: (j: JourneyPage) => void): Promise<JourneyPage> {
  const j = await window_(size, person)
  ready?.(j)
  await signIn(j.page)
  return j
}
/** Signed in, on the crate game: its start level is open. */
async function gameAs(size: Size, person: Person, ready?: (j: JourneyPage) => void): Promise<JourneyPage> {
  const j = await listAs(size, person, ready)
  await openLevel(j.page)
  return j
}
/** A visitor on the demo game, after pressing "Try it now". */
async function visitorGame(size: Size): Promise<JourneyPage> {
  const j = await window_(size, 'grandma')
  await j.page.getByRole('button', { name: WORDS.tryIt }).click()
  await text(j, WORDS.visitorCan)
  await thingNamed(j.page, 'crate-1').waitFor()
  return j
}
const NEW_ON_MAP = '.strip, .pop, [role=dialog]'
/** The links game's map with a wall made on it: one problem in the game. */
async function wallMade(size: Size, stops = false): Promise<JourneyPage> {
  const j = await window_(size, 'grandma')
  if (stops)
    j.fake.repos
      .get('grandma/links-game')
      ?.put('main', EDITORS_FILE, writeEditors({ format: 1, problems: 'stop' }))
  await signIn(j.page)
  await openMapOf(j.page)
  await makeWall(j.page)
  await j.page.getByRole('button', { name: '1 problem' }).waitFor()
  return j
}
const move = (j: JourneyPage) => dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
/** Opens the game's menu (on a narrow phone, the part menu that holds its rows too) and leaves it open. */
async function openGameMenu(j: JourneyPage): Promise<void> {
  const game = j.page.locator('button.game')
  await ((await game.count()) > 0 ? game : j.page.locator('button.part')).click()
  await j.page.getByRole('menuitem').first().waitFor()
}

/** Kid saves a suggestion that grandpa (Approve) may approve; leaves `as`'s window open on the game. */
async function suggestionWaiting(size: Size, as: Person): Promise<JourneyPage> {
  const kid = await window_(size, 'kid')
  repoOf(kid).checks = 'passing'
  repoOf(kid).put(
    'main',
    ACCESS,
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
  await move(kid)
  await putThemIn(kid.page, 'suggestion')
  await kid.close()
  windows.splice(windows.indexOf(kid), 1)
  const j = await window_(size, as, true)
  await signIn(j.page)
  await openGame(j.page)
  return j
}
async function openWaiting(j: JourneyPage): Promise<void> {
  await chooseFromMenu(j.page, menuWords.waitingRow(1))
  await heading(j, WORDS.waitingTitle)
}
async function openFirstChange(j: JourneyPage): Promise<void> {
  await openWaiting(j)
  await j.page.locator('a.row').first().click()
  await thingNamed(j.page, 'crate-1').waitFor()
}
async function shareScreen(size: Size, ready?: (j: JourneyPage) => void): Promise<JourneyPage> {
  const j = await gameAs(size, 'grandma', ready)
  await chooseFromMenu(j.page, menuWords.whoCanChange)
  await heading(j, WORDS.shareTitle('Crate Game'))
  return j
}

interface Scene {
  readonly name: string
  readonly reach: (size: Size) => Promise<JourneyPage>
  /** True for a screen that shows the level's stage. */
  readonly stage?: true
  /** True for a screen that rings what changed: the ring must be on screen and not under a sheet. */
  readonly ringed?: true
  /** A selector for the part of the screen this scene is about; the rest is measured elsewhere. */
  readonly only?: string
}

const SCENES: readonly Scene[] = [
  // Someone who has not signed in.
  {
    name: 'welcome-try',
    reach: async (size) => {
      const j = await window_(size, 'grandma')
      await heading(j, WORDS.appName)
      return j
    },
  },
  {
    name: 'welcome-no-example',
    reach: async (size) => {
      const j = await window_(size, 'grandma')
      const plain: Site = await startSite(4802, { ...j.fake.env }, 'dist-plain')
      cleanups.push(() => plain.close())
      await j.page.goto(plain.url)
      await heading(j, WORDS.appName)
      return j
    },
  },
  {
    name: 'welcome-needs-a-person',
    reach: async (size) => {
      const j = await window_(size, 'grandma')
      await j.page.goto(`${j.site}${GAME}/share`)
      await heading(j, WORDS.appName)
      return j
    },
  },
  {
    name: 'welcome-after-cancel',
    reach: async (size) => {
      const j = await window_(size, 'grandma')
      j.fake.signIn = 'deny'
      await j.page.getByRole('button', { name: WORDS.signIn }).click()
      await text(j, WORDS.signInCancelled)
      return j
    },
  },
  // The first run.
  {
    name: 'first-run-language',
    reach: newPerson,
  },
  {
    name: 'first-run-welcome',
    reach: welcomed,
    stage: true,
  },
  {
    name: 'first-run-tour',
    reach: async (size) => {
      const j = await welcomed(size)
      await j.page.getByRole('button', { name: said(w().first.welcomeShow) }).click()
      await j.page.locator('.coach').waitFor()
      return j
    },
    stage: true,
  },
  { name: 'visitor-world', reach: visitorGame, stage: true },
  {
    name: 'visitor-world-moved',
    reach: async (size) => {
      const j = await visitorGame(size)
      await move(j)
      await putButton(j.page).waitFor()
      return j
    },
    stage: true,
  },
  {
    name: 'visitor-copy-asked',
    reach: async (size) => {
      const j = await visitorGame(size)
      await move(j)
      await pressPut(j.page)
      await j.page.getByRole('button', { name: menuWords.keepCopy('level-1') }).waitFor()
      return j
    },
    stage: true,
  },
  {
    name: 'visitor-copy-kept',
    reach: async (size) => {
      const j = await visitorGame(size)
      await move(j)
      await pressPut(j.page)
      const download = j.page.waitForEvent('download')
      await j.page.getByRole('button', { name: menuWords.keepCopy('level-1') }).click()
      await download
      await text(j, 'level-1.json')
      return j
    },
    stage: true,
  },
  {
    name: 'visitor-game-menu',
    reach: async (size) => {
      const j = await visitorGame(size)
      await openGameMenu(j)
      return j
    },
    stage: true,
  },
  {
    name: 'visitor-cant-open',
    reach: async (size) => {
      const j = await window_(size, 'grandma')
      repoOf(j).isPublic = false
      await j.page.goto(`${j.site}${GAME}`)
      await text(j, WORDS.cantFindVisitor)
      return j
    },
  },
  // Signed in.
  {
    name: 'add-the-editor',
    reach: async (size) => {
      const j = await listAs(size, 'grandma', noEditorYet)
      await text(j, WORDS.pickEmpty)
      return j
    },
  },
  {
    name: 'pick-a-game-cant-reach',
    reach: async (size) => {
      const j = await window_(size, 'grandma')
      await j.page.getByRole('button', { name: WORDS.signIn }).click()
      await heading(j, WORDS.pickTitle)
      // The list was fine; GitHub goes away before a second look.
      j.fake.down = true
      await j.page.reload()
      await text(j, WORDS.cantReach)
      return j
    },
  },
  {
    name: 'pick-a-game',
    reach: async (size) => {
      const j = await listAs(size, 'grandma')
      await heading(j, WORDS.pickTitle)
      return j
    },
  },
  { name: 'world-owner', reach: (size) => gameAs(size, 'grandma'), stage: true },
  { name: 'world-edit', reach: (size) => gameAs(size, 'kid', kidIs('edit')), stage: true },
  { name: 'world-approve', reach: (size) => gameAs(size, 'kid', kidIs('approve')), stage: true },
  { name: 'world-suggest', reach: (size) => gameAs(size, 'kid', kidIs('suggest')), stage: true },
  {
    name: 'world-look-only',
    reach: async (size) => {
      const j = await gameAs(size, 'kid', (g) => share(g, 'look'))
      await text(j, WORDS.lookOnly)
      return j
    },
    stage: true,
  },
  {
    name: 'world-with-changes-waiting',
    reach: async (size) => {
      const j = await suggestionWaiting(size, 'grandpa')
      await thingNamed(j.page, 'crate-1').waitFor()
      return j
    },
    stage: true,
  },
  {
    name: 'world-game-menu',
    reach: async (size) => {
      const j = await suggestionWaiting(size, 'grandma')
      await openGameMenu(j)
      return j
    },
    stage: true,
  },
  {
    name: 'game-cant-be-reached',
    reach: async (size) => {
      const j = await listAs(size, 'grandma')
      // The list is on the screen before GitHub goes away, so what fails is opening the game.
      const link = j.page.getByRole('link', { name: 'crate-game' })
      await link.waitFor()
      j.fake.down = true
      await link.click()
      await text(j, WORDS.cantReach)
      return j
    },
  },
  {
    name: 'game-is-broken',
    reach: async (size) => {
      const j = await window_(size, 'grandma')
      repoOf(j).put('main', LEVEL_PATH, '{')
      await signIn(j.page)
      await j.page.goto(`${j.site}${GAME}`)
      await text(j, WORDS.brokenGame)
      return j
    },
  },
  {
    name: 'not-a-game',
    reach: async (size) => {
      const j = await listAs(size, 'grandma')
      await j.page.getByRole('link', { name: 'not-a-game' }).click()
      await text(j, WORDS.notAGame)
      return j
    },
  },
  // The level.
  {
    name: 'level-thing-picked',
    reach: async (size) => {
      const j = await gameAs(size, 'grandma')
      await thingNamed(j.page, 'crate-1').click()
      await j.page.locator('[data-thing="crate-1"][aria-pressed="true"]').waitFor()
      return j
    },
    stage: true,
  },
  {
    name: 'level-unsaved',
    reach: async (size) => {
      const j = await gameAs(size, 'grandma')
      await move(j)
      await putButton(j.page).waitFor()
      return j
    },
    stage: true,
  },
  {
    name: 'level-saved-straight-in',
    reach: async (size) => {
      const j = await gameAs(size, 'grandma')
      await move(j)
      await putThemIn(j.page)
      return j
    },
    stage: true,
  },
  {
    name: 'level-saved-as-suggestion',
    reach: async (size) => {
      const j = await gameAs(size, 'kid', kidIs('suggest'))
      await move(j)
      await putThemIn(j.page, 'suggestion')
      return j
    },
    stage: true,
  },
  {
    name: 'level-changed-by-someone-else',
    reach: async (size) => {
      const j = await gameAs(size, 'grandma')
      await move(j)
      repoOf(j).put('main', LEVEL_PATH, theirs)
      await pressPut(j.page)
      await putSheet(j.page)
        .getByRole('button', { name: /^Put them in/ })
        .click()
      await putSheet(j.page).getByRole('button', { name: checkWords.keepMine }).waitFor()
      return j
    },
    stage: true,
  },
  // The sheets for putting changes in, and the problems.
  {
    name: 'put-sheet-asks',
    reach: async (size) => {
      const j = await gameAs(size, 'grandma')
      await move(j)
      await pressPut(j.page)
      await putSheet(j.page)
        .getByRole('heading', { name: /^Put 1 change/ })
        .waitFor()
      return j
    },
    stage: true,
  },
  {
    name: 'put-sheet-done',
    reach: async (size) => {
      const j = await gameAs(size, 'grandma')
      await move(j)
      await putThemIn(j.page, 'direct', false)
      return j
    },
    stage: true,
  },
  {
    name: 'send-sheet-asks',
    reach: async (size) => {
      const j = await gameAs(size, 'kid', kidIs('suggest'))
      await move(j)
      await pressPut(j.page)
      await putSheet(j.page)
        .getByRole('heading', { name: /^Send 1 change/ })
        .waitFor()
      return j
    },
    stage: true,
  },
  {
    name: 'send-sheet-sent',
    reach: async (size) => {
      const j = await gameAs(size, 'kid', kidIs('suggest'))
      await move(j)
      await putThemIn(j.page, 'suggestion', false)
      return j
    },
    stage: true,
  },
  {
    name: 'waiting-sheet-yours',
    reach: async (size) => {
      const j = await gameAs(size, 'kid', kidIs('suggest'))
      await move(j)
      await putThemIn(j.page, 'suggestion')
      await quietButton(j.page).click()
      await putSheet(j.page)
        .getByRole('button', { name: /^Take them back/ })
        .waitFor()
      return j
    },
    stage: true,
  },
  {
    name: 'put-failed-offline',
    reach: async (size) => {
      const j = await gameAs(size, 'grandma')
      await move(j)
      await pressPut(j.page)
      await j.page.context().setOffline(true)
      await putSheet(j.page)
        .getByRole('button', { name: /^Put them in/ })
        .click()
      await putSheet(j.page)
        .getByText(/no internet/)
        .waitFor()
      return j
    },
    stage: true,
  },
  {
    name: 'put-failed-blocked',
    reach: async (size) => {
      const j = await gameAs(size, 'grandma')
      repoOf(j).rule = 'blocks-app'
      await move(j)
      await pressPut(j.page)
      await putSheet(j.page)
        .getByRole('button', { name: /^Put them in/ })
        .click()
      await putSheet(j.page)
        .getByText(/GitHub is set to stop the editor/)
        .waitFor()
      return j
    },
    stage: true,
  },
  {
    name: 'put-failed-look-only',
    reach: async (size) => {
      const j = await gameAs(size, 'kid', kidIs('suggest'))
      await move(j)
      share(j, 'look')
      await pressPut(j.page)
      await putSheet(j.page).getByRole('button', { name: /^Send/ }).click()
      await putSheet(j.page)
        .getByText(/you can look at this game/i)
        .waitFor()
      return j
    },
    stage: true,
  },
  {
    name: 'put-sheet-clash-only',
    reach: async (size) => {
      const j = await gameAs(size, 'grandma')
      await move(j)
      repoOf(j).put('main', LEVEL_PATH, theirs)
      await pressPut(j.page)
      await putSheet(j.page)
        .getByRole('button', { name: /^Put them in/ })
        .click()
      await putSheet(j.page)
        .getByRole('button', { name: /^Keep .*’s$/ })
        .click()
      await putSheet(j.page).getByText(checkWords.nothingLeft).waitFor()
      return j
    },
    stage: true,
  },
  {
    name: 'problems-list',
    reach: async (size) => {
      const j = await wallMade(size)
      await j.page.getByRole('button', { name: '1 problem' }).click()
      await j.page.getByRole('button', { name: putWords.showMe }).first().waitFor()
      return j
    },
    stage: true,
    only: NEW_ON_MAP,
  },
  {
    name: 'put-sheet-with-a-problem',
    reach: async (size) => {
      const j = await wallMade(size)
      await pressPut(j.page)
      await putSheet(j.page).getByRole('button', { name: putWords.showMe }).waitFor()
      return j
    },
    stage: true,
    only: NEW_ON_MAP,
  },
  {
    name: 'put-sheet-stopped-by-a-problem',
    reach: async (size) => {
      const j = await wallMade(size, true)
      await pressPut(j.page)
      await putSheet(j.page)
        .getByText(/every problem to be fixed/)
        .waitFor()
      return j
    },
    stage: true,
    only: NEW_ON_MAP,
  },
  {
    name: 'problem-strip',
    reach: async (size) => {
      const j = await wallMade(size)
      await j.page.getByRole('button', { name: '1 problem' }).click()
      await j.page.getByRole('button', { name: putWords.showMe }).first().click()
      await j.page
        .getByRole('status')
        .filter({ hasText: /^Problem 1 of 1/ })
        .waitFor()
      return j
    },
    stage: true,
    only: NEW_ON_MAP,
  },
  {
    name: 'level-leave-anyway',
    reach: async (size) => {
      const j = await gameAs(size, 'grandma')
      await move(j)
      await chooseFromMenu(j.page, menuWords.yourGames)
      await text(j, WORDS.leaveAsk)
      return j
    },
    stage: true,
  },
  // Settings, Help and the keys.
  {
    name: 'world-settings',
    reach: async (size) => {
      const j = await gameAs(size, 'grandma')
      await chooseFromMenu(j.page, menuWords.settings)
      await j.page.getByRole('dialog', { name: said(w().settings.settingsTitle) }).waitFor()
      return j
    },
    stage: true,
  },
  {
    name: 'world-help',
    reach: async (size) => {
      const j = await gameAs(size, 'grandma')
      await chooseFromMenu(j.page, menuWords.help)
      await j.page.getByRole('dialog', { name: said(w().help.helpTitle) }).waitFor()
      return j
    },
    stage: true,
  },
  {
    name: 'world-keys',
    reach: async (size) => {
      const j = await gameAs(size, 'grandma')
      await chooseFromMenu(j.page, menuWords.help)
      await j.page.getByRole('button', { name: new RegExp(said(w().help.helpKeysRow)) }).click()
      await j.page.getByRole('dialog', { name: said(w().help.keysTitle) }).waitFor()
      return j
    },
    stage: true,
  },
  // Waiting changes.
  {
    name: 'waiting-list',
    reach: async (size) => {
      const j = await suggestionWaiting(size, 'grandpa')
      await openWaiting(j)
      await j.page.locator('a.row').first().waitFor()
      return j
    },
  },
  {
    name: 'waiting-change-as-approver',
    reach: async (size) => {
      const j = await suggestionWaiting(size, 'grandpa')
      await openFirstChange(j)
      return j
    },
    stage: true,
    ringed: true,
  },
  {
    name: 'waiting-change-as-its-author',
    reach: async (size) => {
      const j = await suggestionWaiting(size, 'kid')
      await openFirstChange(j)
      return j
    },
    stage: true,
  },
  {
    name: 'waiting-change-failed-checks',
    reach: async (size) => {
      const j = await suggestionWaiting(size, 'grandpa')
      repoOf(j).checks = 'failing'
      await openFirstChange(j)
      await text(j, checkWords.checksFailed)
      return j
    },
    stage: true,
    ringed: true,
  },
  {
    name: 'waiting-change-gone',
    reach: async (size) => {
      const j = await suggestionWaiting(size, 'grandpa')
      await openFirstChange(j)
      // Someone else was quicker: the change is not waiting any more.
      repoOf(j).pulls[0]!.state = 'closed'
      await j.page.getByRole('button', { name: checkWords.putThem, exact: true }).click()
      await text(j, checkWords.gone)
      return j
    },
  },
  // Share.
  { name: 'share-empty', reach: (size) => shareScreen(size) },
  {
    name: 'share-three-people',
    reach: (size) =>
      shareScreen(size, (j) =>
        repoOf(j).put(
          'main',
          ACCESS,
          writeAccess({
            format: 1,
            everyone: 'look',
            people: [
              { github: 'grandpa', level: 'approve' },
              { github: 'kid', level: 'suggest' },
              { github: 'stranger', level: 'edit' },
            ],
          }),
        ),
      ),
  },
  {
    name: 'share-mistyped-name',
    reach: async (size) => {
      const j = await shareScreen(size)
      await j.page.locator('#share-name').fill('-no- good')
      await j.page.getByRole('button', { name: WORDS.addPerson, exact: true }).click()
      await text(j, WORDS.nameBad)
      return j
    },
  },
]

/** What a drunk grandma's finger and eye need: measured in the page itself. Returns a sentence per broken rule. */
/**
 * `only` is a selector: when it is given, only what lies in it (or overlaps something that does) is answered for. The
 * map draws its own marks and cards (a wall's marker is 32 px and sits on the level buttons), which no screen here
 * measures yet; the strip and the list of problems that are drawn over it are measured against all of it.
 */
async function broken(page: Page, stage: boolean, only = ''): Promise<string[]> {
  return page.evaluate(
    ([withStage, backWord, within]) => {
      const found: string[] = []
      const seen = (el: Element): boolean => {
        const style = getComputedStyle(el)
        const box = el.getBoundingClientRect()
        return style.visibility !== 'hidden' && style.display !== 'none' && box.width > 0 && box.height > 0
      }
      const doc = document.documentElement
      if (doc.scrollWidth > doc.clientWidth)
        found.push(`scrolls sideways (${doc.scrollWidth} > ${doc.clientWidth})`)

      // The things in the level are drawn on the stage and have their own buttons for moving; a radio's box is its
      // label's to size, as a person presses the whole row. Everything else a finger lands on is measured.
      const touchable = [...document.querySelectorAll('button, a[href], input, select')].filter(
        (el) =>
          seen(el) &&
          !el.hasAttribute('data-thing') &&
          !(el instanceof HTMLInputElement && el.type === 'radio'),
      )
      const named = (el: Element): string =>
        `${el.tagName.toLowerCase()} "${(el.textContent ?? '').trim().slice(0, 30) || (el as HTMLInputElement).id}"`
      const mine = (el: Element): boolean => within === '' || el.closest(within) !== null
      for (const el of touchable) {
        if (!mine(el)) continue
        const box = el.getBoundingClientRect()
        if (box.width < 43.5 || box.height < 43.5)
          found.push(`${named(el)} is ${Math.round(box.width)}x${Math.round(box.height)}, under 44`)
      }
      const primary = [...document.querySelectorAll('.button.primary')].filter(seen)
      if (primary.length > 1) found.push(`${primary.length} primary Buttons`)
      for (const el of primary) {
        if (el.getBoundingClientRect().height < 47.5)
          found.push(`${named(el)} is a primary Button under 48 tall`)
      }
      // Two things cannot overlap if one has been scrolled out of the screen's own scrolling area: it is not on show.
      const area = document.querySelector('.content')?.getBoundingClientRect()
      const onShow = (el: Element): boolean => {
        const box = el.getBoundingClientRect()
        return (
          area === undefined ||
          !el.closest('.content') ||
          (box.top >= area.top - 1 && box.bottom <= area.bottom + 1)
        )
      }
      const shown = touchable.filter(onShow)
      for (let a = 0; a < shown.length; a += 1) {
        for (let b = a + 1; b < shown.length; b += 1) {
          const first = shown[a]!.getBoundingClientRect()
          const second = shown[b]!.getBoundingClientRect()
          const across = Math.min(first.right, second.right) - Math.max(first.left, second.left)
          const down = Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top)
          // A menu or a sheet opens over the screen: what it covers is under it, not beside it.
          const menuA = shown[a]!.closest('[role=menu], [aria-modal=true]') !== null
          const menuB = shown[b]!.closest('[role=menu], [aria-modal=true]') !== null
          if (menuA !== menuB) continue
          if (!mine(shown[a]!) && !mine(shown[b]!)) continue
          // A menu's backdrop (the button that closes it when the page behind is pressed) lies over everything by design.
          if (shown[a]!.classList.contains('dim') || shown[b]!.classList.contains('dim')) continue
          if (across > 1 && down > 1 && !shown[a]!.contains(shown[b]!) && !shown[b]!.contains(shown[a]!))
            found.push(`${named(shown[a]!)} overlaps ${named(shown[b]!)}`)
        }
      }
      // One way back, never two: a grandma asks which one.
      const backs = [...document.querySelectorAll('button')].filter(
        (el) => seen(el) && (el.textContent ?? '').trim() === backWord,
      )
      if (backs.length > 1) found.push(`${backs.length} buttons named ${backWord}`)
      const headings = [...document.querySelectorAll('h1')].filter(seen)
      // The World screen has no heading of its own: its bar says where the person is.
      const wanted = document.querySelector('[data-bar]') === null ? 1 : 0
      if (headings.length !== wanted) found.push(`${headings.length} headings (h1), not ${wanted}`)

      // Text: every visible piece lies inside the window's width, and none is cut with an ellipsis.
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
        const words = (node.textContent ?? '').trim()
        const parent = node.parentElement
        if (words === '' || parent === null || !seen(parent) || parent.closest('script, style') !== null)
          continue
        const range = document.createRange()
        range.selectNodeContents(node)
        for (const box of range.getClientRects()) {
          if (box.right > window.innerWidth + 1 || box.left < -1)
            found.push(`text runs off the side: "${words.slice(0, 30)}"`)
        }
        const style = getComputedStyle(parent)
        // The bar's names may be shortened: the whole name is in the menu they open.
        if (
          style.textOverflow === 'ellipsis' &&
          parent.scrollWidth > parent.clientWidth &&
          parent.closest('[data-bar]') === null
        )
          found.push(`text is cut with an ellipsis: "${words.slice(0, 30)}"`)
      }

      if (withStage) {
        const stage = document.querySelector('[data-scale]')
        const box = stage?.getBoundingClientRect()
        const half = Math.min(window.innerWidth, window.innerHeight) / 2
        if (box === undefined || box.width < half)
          found.push(`the stage is ${Math.round(box?.width ?? 0)} wide, under ${half}`)
      }
      return [...new Set(found)]
    },
    [stage, WORDS.back, only] as const,
  )
}

/** Says what is wrong when a ringed thing is out of sight or under a sheet; empty when it is plainly visible. */
async function ringHidden(page: Page): Promise<string> {
  return page.evaluate(() => {
    const ring = document.querySelector('[data-marked] .ring')
    if (ring === null) return 'nothing is ringed'
    const box = ring.getBoundingClientRect()
    if (box.width === 0 || box.height === 0) return 'the ring has no size'
    if (box.left < 0 || box.top < 0 || box.right > innerWidth || box.bottom > innerHeight)
      return 'the ring is off the screen'
    for (const sheet of document.querySelectorAll('[role="dialog"]')) {
      const s = sheet.getBoundingClientRect()
      const apart = box.right <= s.left || box.left >= s.right || box.bottom <= s.top || box.top >= s.bottom
      if (!apart)
        return `the ring (${Math.round(box.left)},${Math.round(box.top)},${Math.round(box.width)}x${Math.round(box.height)}) is under the sheet`
    }
    return ''
  })
}

describe.each(Object.keys(SIZES) as Size[])('at %s', (size) => {
  for (const scene of SCENES) {
    test(`${scene.name}: pictured, then measured`, async () => {
      const j = await scene.reach(size)
      // The picture first, so a screen that breaks a rule can still be looked at.
      await picture(j.page, `${size}-${scene.name}`)
      expect((await broken(j.page, scene.stage === true, scene.only ?? '')).join('; ')).toBe('')
      if (scene.ringed === true) expect(await ringHidden(j.page)).toBe('')
    })
  }
})
