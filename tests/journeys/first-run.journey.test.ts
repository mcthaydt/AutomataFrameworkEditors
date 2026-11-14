import { readFile } from 'node:fs/promises'
import { afterEach, describe, expect, test } from 'vitest'
import { writeAccess } from '#src/features/access/access.ts'
import { WORDS } from '#src/features/words/words.ts'
import {
  dragByTouch,
  type JourneyPage,
  openGame,
  openPage,
  pressSave,
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
const window_ = async (size: Size, person: Person, keep = false): Promise<JourneyPage> => {
  const j = await openPage(size, person, keep)
  windows.push(j)
  return j
}
const repoOf = (j: JourneyPage) => j.fake.repos.get('grandma/crate-game')!
const strip = (j: JourneyPage) => j.page.locator('.guide')
const says = (j: JourneyPage, words: string) =>
  expect.poll(async () => (await strip(j).textContent()) ?? '').toContain(words)
const text = (j: JourneyPage, words: string) => j.page.getByText(words, { exact: false }).first().waitFor()
const GAME = '#/game/grandma/crate-game'
/** Nobody has added the editor to any game yet. */
const noEditorYet = (j: JourneyPage): void => {
  for (const repo of j.fake.repos.values()) repo.installed = false
}
const share = (j: JourneyPage, over: Parameters<typeof writeAccess>[0]): void =>
  repoOf(j).put('main', 'automata.access.toml', writeAccess(over))

describe.each(['ipadUpright', 'phone'] as const)('at %s', (size) => {
  test('an Owner, from nothing to a saved change, following only what the screen says', async () => {
    const j = await window_(size, 'grandma')
    noEditorYet(j)
    await says(j, WORDS.guideStart)
    expect(await strip(j).textContent()).not.toContain('Step')
    await j.page.getByRole('button', { name: WORDS.signIn }).click()
    await says(j, 'Step 1 of 4')
    await says(j, 'You only do this once')
    await j.page.getByRole('button', { name: WORDS.pickAdd }).click()
    await says(j, 'Step 2 of 4')
    await j.page.getByRole('link', { name: 'crate-game' }).click()
    await j.page.getByRole('link', { name: 'level-1' }).click()
    await says(j, WORDS.guideMove)
    await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
    await says(j, WORDS.guideSave)
    await pressSave(j.page).click()
    await says(j, WORDS.guideDoneDirect)
    expect(repoOf(j).commits).toHaveLength(1)
    await j.page.getByRole('button', { name: WORDS.guideHide }).click()
    await j.page.getByRole('button', { name: WORDS.back, exact: true }).click()
    await text(j, WORDS.tipShare)
    await j.page.reload()
    expect(await strip(j).count()).toBe(0)
  })
})

test('a visitor, from nothing to a change and a copy, following only what the screen says', async () => {
  const j = await window_('ipadUpright', 'grandma')
  await says(j, WORDS.guideStart)
  await j.page.getByRole('button', { name: WORDS.tryIt }).click()
  await says(j, 'Step 1 of 3')
  await j.page.getByRole('link', { name: 'level-1' }).click()
  await says(j, WORDS.guideMove)
  await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
  await says(j, WORDS.guideSaveVisitor)
  const download = j.page.waitForEvent('download')
  await j.page.getByRole('button', { name: WORDS.copyKeep }).click()
  await readFile(await (await download).path(), 'utf8')
  await says(j, WORDS.guideDoneCopy)
  expect(await j.page.getByRole('heading', { level: 1, name: WORDS.appName }).count()).toBe(0)
})

test("a visitor who presses Save instead: asked to sign in, comes back, saves, and the strip ends like anyone's", async () => {
  const j = await window_('ipadUpright', 'grandma')
  await j.page.goto(`${j.site}/${GAME}/level/level-1`)
  await thingNamed(j.page, 'crate-1').waitFor()
  await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
  await pressSave(j.page).click()
  await text(j, WORDS.signInToSave)
  await j.page.getByRole('button', { name: WORDS.signIn }).first().click()
  await text(j, WORDS.draftBack)
  await pressSave(j.page).click()
  await says(j, WORDS.guideDoneDirect)
})

describe('someone sent a link, not signed in', () => {
  async function viaLink(person: Person, over: Parameters<typeof writeAccess>[0]): Promise<JourneyPage> {
    const j = await window_('ipadUpright', person)
    share(j, over)
    await j.page.goto(`${j.site}/${GAME}`)
    await says(j, 'Step 1 of 3')
    await j.page.getByRole('link', { name: 'level-1' }).click()
    await thingNamed(j.page, 'crate-1').waitFor()
    await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
    await pressSave(j.page).click()
    await text(j, WORDS.signInToSave)
    await j.page.getByRole('button', { name: WORDS.signIn }).first().click()
    await text(j, WORDS.draftBack)
    await pressSave(j.page).click()
    return j
  }
  test('(suggest) lands in the game, three steps, signs in at Save, ends "waiting for someone to approve it"', async () => {
    const j = await viaLink('kid', { format: 1, everyone: 'suggest', people: [] })
    await says(j, WORDS.guideDoneSuggestion)
  })
  test('(edit) the same, ending "the change is in your game"', async () => {
    const j = await viaLink('grandpa', {
      format: 1,
      everyone: 'look',
      people: [{ github: 'grandpa', level: 'edit' }],
    })
    await says(j, WORDS.guideDoneDirect)
  })
})

test('someone sent a link (look): told they can look around and who to ask; no step asks them to save', async () => {
  const j = await window_('ipadUpright', 'stranger')
  share(j, { format: 1, everyone: 'look', people: [] })
  await j.page.goto(`${j.site}/${GAME}`)
  await signIn(j.page)
  await j.page.getByRole('link', { name: 'level-1' }).click()
  await says(j, WORDS.guideLook)
  expect(await pressSave(j.page).isDisabled()).toBe(true)
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

test("an approver's first visit with a change waiting: the tip points at it, once", async () => {
  const kid = await window_('ipadUpright', 'kid')
  share(kid, { format: 1, everyone: 'suggest', people: [{ github: 'grandpa', level: 'approve' }] })
  await signIn(kid.page)
  await kid.page.goto(`${kid.site}/${GAME}/level/level-1`)
  await thingNamed(kid.page, 'crate-1').waitFor()
  await dragByTouch(kid.page, 'crate-1', { dx: 2, dy: 0 })
  await pressSave(kid.page).click()
  await text(kid, WORDS.savedSuggestion)
  const g = await window_('ipadUpright', 'grandpa', true)
  await signIn(g.page)
  await openGame(g.page)
  await text(g, WORDS.tipApprove)
  await g.page.getByRole('button', { name: WORDS.tipGotIt }).click()
  await g.page.reload()
  await g.page.getByRole('heading', { level: 1, name: 'Crate Game' }).waitFor()
  expect(await g.page.getByText(WORDS.tipApprove).count()).toBe(0)
})

test('at the first screens there is at most one primary button, at least 48 px tall, and the strip is on screen', async () => {
  const j = await window_('phone', 'grandma')
  noEditorYet(j)
  const check = async (): Promise<void> => {
    const primaries = j.page.locator('button.primary')
    expect(await primaries.count()).toBeLessThanOrEqual(1)
    for (const button of await primaries.all())
      expect((await button.boundingBox())?.height).toBeGreaterThanOrEqual(48)
    const box = await strip(j).boundingBox()
    expect(box?.y).toBeGreaterThanOrEqual(0)
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(844)
  }
  await check()
  await j.page.getByRole('button', { name: WORDS.signIn }).click()
  await says(j, 'Step 1 of 4')
  await check()
})

test('with only one game, coming back from GitHub opens it without asking', async () => {
  const j = await window_('ipadUpright', 'grandma')
  noEditorYet(j)
  for (const name of [...j.fake.repos.keys()]) if (name !== 'grandma/crate-game') j.fake.repos.delete(name)
  await j.page.getByRole('button', { name: WORDS.signIn }).click()
  await j.page.getByRole('button', { name: WORDS.pickAdd }).click()
  await j.page.getByRole('heading', { level: 1, name: 'Crate Game' }).waitFor()
})

test('"Hide these tips" on Welcome hides them for good; the screens still work', async () => {
  const j = await window_('ipadUpright', 'grandma')
  await j.page.getByRole('button', { name: WORDS.guideHide }).click()
  expect(await strip(j).count()).toBe(0)
  await j.page.reload()
  expect(await strip(j).count()).toBe(0)
  await signIn(j.page)
  await j.page.getByRole('heading', { level: 1, name: WORDS.pickTitle }).waitFor()
  expect(await strip(j).count()).toBe(0)
})

test('an Owner whose game already has the editor goes from signing in straight to "Step 2 of 4"', async () => {
  const j = await window_('ipadUpright', 'grandma')
  await j.page.getByRole('button', { name: WORDS.signIn }).click()
  await says(j, 'Step 2 of 4')
})

test('cancelling on GitHub comes back to Welcome with signInCancelled and the same sentence in the strip', async () => {
  const j = await window_('ipadUpright', 'grandma')
  j.fake.signIn = 'deny'
  await j.page.getByRole('button', { name: WORDS.signIn }).click()
  await text(j, WORDS.signInCancelled)
  await says(j, WORDS.guideStart)
})

test('coming back from GitHub without adding the editor stays on "Step 1 of 4"', async () => {
  const j = await window_('ipadUpright', 'grandma')
  noEditorYet(j)
  await signIn(j.page)
  await says(j, 'Step 1 of 4')
  await j.page.goto(`${j.site}/?setup_action=install`)
  await says(j, 'Step 1 of 4')
})

test('the welcome screen says what signing in is for, and has a way to make an account', async () => {
  const j = await window_('ipadUpright', 'grandma')
  await text(j, WORDS.signInWhy)
  expect(await j.page.getByRole('link', { name: WORDS.noAccount }).getAttribute('href')).toMatch(/\/signup$/)
})

test('a returning person, signed in and with the guide finished, lands on "Pick a game" with no strip', async () => {
  const j = await window_('ipadUpright', 'grandma')
  await j.page.evaluate(() => localStorage.setItem('af.guide.done', '1'))
  await j.page.reload()
  await signIn(j.page)
  await j.page.getByRole('heading', { level: 1, name: WORDS.pickTitle }).waitFor()
  expect(await strip(j).count()).toBe(0)
})
