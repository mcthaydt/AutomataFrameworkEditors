// Every screen a person can reach, at iPad upright, iPad sideways and phone size: measured against the touch and
// layout rules, then pictured for a person to look at (the drunk-grandma check). The rules, on every screen:
// no sideways scroll; every button, link, field and picker at least 44 px each way, the primary Button at least
// 48 tall; none overlapping; one heading; one primary Button; no text off the side or cut with an ellipsis; and on
// the level screens a stage that is at least half the shorter side of the window wide.
// The pictures land in `tests/journeys/__screenshots__/` and, from CI, on the `ci-screens` branch.

import { type Level, writeContent } from '@automataframework/framework/headless'
import type { Page } from 'playwright'
import { afterEach, describe, expect, test } from 'vitest'
import { type AccessFile, writeAccess } from '#src/features/access/access.ts'
import { WORDS } from '#src/features/words/words.ts'
import { fixtureFiles, LEVEL_PATH } from '../fixtures/game/read.ts'
import {
  dragByTouch,
  type JourneyPage,
  openGame,
  openLevel,
  openPage,
  picture,
  pressSave,
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
  for (const j of windows) {
    expect(await j.problems()).toEqual([])
    await j.close()
  }
  windows.length = 0
  for (const cleanup of cleanups) await cleanup()
  cleanups.length = 0
})

/** One more window of the same pretend GitHub (everything the first one set up is kept). */
const window_ = async (size: Size, person: Person, keep = windows.length > 0): Promise<JourneyPage> => {
  const j = await openPage(size, person, keep)
  windows.push(j)
  return j
}
const repoOf = (j: JourneyPage) => j.fake.repos.get('grandma/crate-game')!
const text = (j: JourneyPage, words: string) => j.page.getByText(words, { exact: false }).first().waitFor()
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
/** Signed in, on the crate game's own page. */
async function gameAs(size: Size, person: Person, ready?: (j: JourneyPage) => void): Promise<JourneyPage> {
  const j = await listAs(size, person, ready)
  await openGame(j.page)
  return j
}
/** Signed in, on level-1. */
async function levelAs(size: Size, person: Person, ready?: (j: JourneyPage) => void): Promise<JourneyPage> {
  const j = await listAs(size, person, ready)
  await openLevel(j.page)
  return j
}
/** A visitor on the demo game's page, after pressing "Try it now". */
async function visitorGame(size: Size): Promise<JourneyPage> {
  const j = await window_(size, 'grandma')
  await j.page.getByRole('button', { name: WORDS.tryIt }).click()
  await text(j, WORDS.visitorCan)
  return j
}
async function visitorLevel(size: Size): Promise<JourneyPage> {
  const j = await visitorGame(size)
  await j.page.getByRole('link', { name: 'level-1' }).click()
  await thingNamed(j.page, 'crate-1').waitFor()
  return j
}
const move = (j: JourneyPage) => dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })

/** Kid saves a suggestion that grandpa (Approve) may approve; leaves kid's window open on the game's page. */
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
  await pressSave(kid.page).click()
  await text(kid, WORDS.savedSuggestion)
  await kid.close()
  windows.splice(windows.indexOf(kid), 1)
  const j = await window_(size, as, true)
  await signIn(j.page)
  await openGame(j.page)
  return j
}
async function openFirstChange(j: JourneyPage): Promise<void> {
  await j.page.getByRole('link', { name: /waiting/ }).click()
  await heading(j, WORDS.waitingTitle)
  await j.page.locator('a.row').first().click()
  await thingNamed(j.page, 'crate-1').waitFor()
}
async function shareScreen(size: Size, ready?: (j: JourneyPage) => void): Promise<JourneyPage> {
  const j = await gameAs(size, 'grandma', ready)
  await j.page.getByRole('link', { name: WORDS.share }).click()
  await heading(j, WORDS.shareTitle('grandma/crate-game'))
  return j
}

interface Scene {
  readonly name: string
  readonly reach: (size: Size) => Promise<JourneyPage>
  /** True for a screen that shows the level's stage. */
  readonly stage?: true
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
  {
    name: 'welcome-guide-hidden',
    reach: async (size) => {
      const j = await window_(size, 'grandma')
      await j.page.getByRole('button', { name: WORDS.guideHide }).click()
      await heading(j, WORDS.appName)
      return j
    },
  },
  { name: 'visitor-game', reach: visitorGame },
  { name: 'visitor-level', reach: visitorLevel, stage: true },
  {
    name: 'visitor-level-moved',
    reach: async (size) => {
      const j = await visitorLevel(size)
      await move(j)
      return j
    },
    stage: true,
  },
  {
    name: 'visitor-sign-in-to-save',
    reach: async (size) => {
      const j = await visitorLevel(size)
      await move(j)
      await pressSave(j.page).click()
      await text(j, WORDS.signInToSave)
      return j
    },
    stage: true,
  },
  {
    name: 'visitor-copy-kept',
    reach: async (size) => {
      const j = await visitorLevel(size)
      await move(j)
      const download = j.page.waitForEvent('download')
      await j.page.getByRole('button', { name: WORDS.copyKeep }).click()
      await download
      await text(j, WORDS.copyKept)
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
    name: 'pick-a-game',
    reach: async (size) => {
      const j = await listAs(size, 'grandma')
      await heading(j, WORDS.pickTitle)
      return j
    },
  },
  { name: 'game-owner', reach: (size) => gameAs(size, 'grandma') },
  { name: 'game-edit', reach: (size) => gameAs(size, 'kid', kidIs('edit')) },
  { name: 'game-approve', reach: (size) => gameAs(size, 'kid', kidIs('approve')) },
  { name: 'game-suggest', reach: (size) => gameAs(size, 'kid', kidIs('suggest')) },
  { name: 'game-look', reach: (size) => gameAs(size, 'kid', (j) => share(j, 'look')) },
  {
    name: 'game-with-changes-waiting',
    reach: async (size) => {
      const j = await suggestionWaiting(size, 'grandpa')
      await text(j, WORDS.waitingRow(1))
      return j
    },
  },
  {
    name: 'game-cant-be-reached',
    reach: async (size) => {
      const j = await listAs(size, 'grandma')
      j.fake.down = true
      await j.page.getByRole('link', { name: 'crate-game' }).click()
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
  { name: 'level-open', reach: (size) => levelAs(size, 'grandma'), stage: true },
  {
    name: 'level-crate-selected',
    reach: async (size) => {
      const j = await levelAs(size, 'grandma')
      await thingNamed(j.page, 'crate-1').click()
      await text(j, WORDS.hintSelected('crate-1'))
      return j
    },
    stage: true,
  },
  {
    name: 'level-unsaved',
    reach: async (size) => {
      const j = await levelAs(size, 'grandma')
      await move(j)
      await text(j, WORDS.statusDirty)
      return j
    },
    stage: true,
  },
  {
    name: 'level-saved-straight-in',
    reach: async (size) => {
      const j = await levelAs(size, 'grandma')
      await move(j)
      await pressSave(j.page).click()
      await text(j, WORDS.savedDirect)
      return j
    },
    stage: true,
  },
  {
    name: 'level-saved-as-suggestion',
    reach: async (size) => {
      const j = await levelAs(size, 'kid', kidIs('suggest'))
      await move(j)
      await pressSave(j.page).click()
      await text(j, WORDS.savedSuggestion)
      return j
    },
    stage: true,
  },
  {
    name: 'level-changed-by-someone-else',
    reach: async (size) => {
      const j = await levelAs(size, 'grandma')
      await move(j)
      repoOf(j).put('main', LEVEL_PATH, theirs)
      await pressSave(j.page).click()
      await text(j, WORDS.changedElsewhere)
      return j
    },
    stage: true,
  },
  {
    name: 'level-leave-anyway',
    reach: async (size) => {
      const j = await levelAs(size, 'grandma')
      await move(j)
      await j.page.getByRole('button', { name: WORDS.back, exact: true }).click()
      await text(j, WORDS.leaveAsk)
      return j
    },
    stage: true,
  },
  {
    name: 'level-look-only',
    reach: async (size) => {
      const j = await levelAs(size, 'kid', (g) => share(g, 'look'))
      await text(j, WORDS.lookOnly)
      return j
    },
    stage: true,
  },
  // Waiting changes.
  {
    name: 'waiting-list',
    reach: async (size) => {
      const j = await suggestionWaiting(size, 'grandpa')
      await j.page.getByRole('link', { name: /waiting/ }).click()
      await heading(j, WORDS.waitingTitle)
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
      await text(j, WORDS.checksFailed)
      return j
    },
    stage: true,
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
async function broken(page: Page, stage: boolean): Promise<string[]> {
  return page.evaluate((withStage) => {
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
    for (const el of touchable) {
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
    for (let a = 0; a < touchable.length; a += 1) {
      for (let b = a + 1; b < touchable.length; b += 1) {
        const first = touchable[a]!.getBoundingClientRect()
        const second = touchable[b]!.getBoundingClientRect()
        const across = Math.min(first.right, second.right) - Math.max(first.left, second.left)
        const down = Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top)
        if (
          across > 1 &&
          down > 1 &&
          !touchable[a]!.contains(touchable[b]!) &&
          !touchable[b]!.contains(touchable[a]!)
        )
          found.push(`${named(touchable[a]!)} overlaps ${named(touchable[b]!)}`)
      }
    }
    const headings = [...document.querySelectorAll('h1')].filter(seen)
    if (headings.length !== 1) found.push(`${headings.length} headings (h1), not one`)

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
      if (style.textOverflow === 'ellipsis' && parent.scrollWidth > parent.clientWidth)
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
  }, stage)
}

describe.each(Object.keys(SIZES) as Size[])('at %s', (size) => {
  for (const scene of SCENES) {
    test(`${scene.name}: measured, then pictured`, async () => {
      const j = await scene.reach(size)
      expect(await broken(j.page, scene.stage === true)).toEqual([])
      await picture(j.page, `${size}-${scene.name}`)
    })
  }
})
