import { type Level, writeContent } from '@automataframework/framework/headless'
import { afterEach, describe, expect, test } from 'vitest'
import { writeAccess } from '#src/features/access/access.ts'
import { WORDS } from '#src/features/words/words.ts'
import { fixtureFiles, LEVEL_PATH } from '../fixtures/game/read.ts'
import {
  dragByTouch,
  type JourneyPage,
  openGame,
  openLevel,
  openPage,
  pressSave,
  type SIZES,
  setupJourneys,
  signIn,
  statusLine,
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
const level1 = JSON.parse(fixtureFiles[LEVEL_PATH] ?? '') as Level
const crateAt = (x: number): Level => ({
  ...level1,
  things: level1.things.map((t) => (t.id === 'crate-1' ? { ...t, x } : t)),
})
const moved = writeContent('level', crateAt(8.5) as never)
const text = (j: JourneyPage, words: string) => j.page.getByText(words, { exact: false }).first().waitFor()

/** Kid saves a suggestion that moves the crate; grandpa may approve; checks pass. Leaves the first window closed. */
async function kidHasSaved(size: Size): Promise<JourneyPage> {
  const kid = await window_(size, 'kid')
  const repo = repoOf(kid)
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
  await text(kid, WORDS.savedSuggestion)
  await kid.close()
  return kid
}

/** Someone's window on the game's page, signed in. */
async function gameAs(size: Size, person: Person): Promise<JourneyPage> {
  const j = await window_(size, person, true)
  await signIn(j.page)
  await openGame(j.page)
  return j
}
async function openFirstChange(j: JourneyPage): Promise<void> {
  await j.page.getByRole('link', { name: /waiting/ }).click()
  await j.page.getByRole('heading', { level: 1, name: WORDS.waitingTitle }).waitFor()
  await j.page.locator('a.row').first().click()
  await thingNamed(j.page, 'crate-1').waitFor()
}
const button = (j: JourneyPage, name: string) => j.page.getByRole('button', { name, exact: true })

describe.each(['ipadUpright', 'phone'] as const)('at %s', (size) => {
  test('grandpa opens the game, sees "1 change is waiting", opens it, and sees the crate ringed where kid put it', async () => {
    await kidHasSaved(size)
    const g = await gameAs(size, 'grandpa')
    await text(g, WORDS.waitingRow(1))
    await openFirstChange(g)
    expect(await thingNamed(g.page, 'crate-1').getAttribute('data-x')).toBe('8.5')
    expect(await thingNamed(g.page, 'crate-1').getAttribute('data-marked')).toBe('')
    await text(g, WORDS.changeMoved('crate-1'))
  })

  test("grandpa approves: Approved; the game now has kid's crate; nothing is waiting", async () => {
    await kidHasSaved(size)
    const g = await gameAs(size, 'grandpa')
    await openFirstChange(g)
    await button(g, WORDS.approve).click()
    await text(g, WORDS.approved)
    const repo = repoOf(g)
    expect(repo.branches.get('main')?.get(LEVEL_PATH)).toBe(moved)
    expect(repo.pulls[0]?.state).toBe('merged')
    expect(repo.branches.has('automata/kid')).toBe(false)

    // Then kid opens the game and sees the crate there, with nothing waiting.
    const kid = await gameAs(size, 'kid')
    expect(await kid.page.getByText(WORDS.waitingRow(1)).count()).toBe(0)
    await kid.page.getByRole('link', { name: 'level-1' }).click()
    await thingNamed(kid.page, 'crate-1').waitFor()
    expect(await thingNamed(kid.page, 'crate-1').getAttribute('data-x')).toBe('8.5')
    expect(await statusLine(kid.page).textContent()).toBe(WORDS.statusClean)
  })
})

test("grandpa turns it down instead: Turned down; the game is as it was; kid's next change starts fresh", async () => {
  await kidHasSaved('ipadUpright')
  const g = await gameAs('ipadUpright', 'grandpa')
  await openFirstChange(g)
  await button(g, WORDS.turnDown).click()
  await text(g, WORDS.turnedDown)
  const repo = repoOf(g)
  expect(repo.branches.get('main')?.get(LEVEL_PATH)).toBe(fixtureFiles[LEVEL_PATH])
  expect(repo.pulls[0]?.state).toBe('closed')

  const kid = await gameAs('ipadUpright', 'kid')
  await kid.page.getByRole('link', { name: 'level-1' }).click()
  await thingNamed(kid.page, 'crate-1').waitFor()
  expect(await thingNamed(kid.page, 'crate-1').getAttribute('data-x')).toBe('6.5')
  await dragByTouch(kid.page, 'crate-1', { dx: 1, dy: 0 })
  await pressSave(kid.page).click()
  await text(kid, WORDS.savedSuggestion)
  expect(repo.pulls.filter((p) => p.state === 'open')).toHaveLength(1)
})

test('while the checks run, Approve is off and the screen says why; when they pass, a reload lights it', async () => {
  await kidHasSaved('ipadUpright')
  const g = await gameAs('ipadUpright', 'grandpa')
  repoOf(g).checks = 'running'
  await openFirstChange(g)
  await text(g, WORDS.checksRunning)
  expect(await button(g, WORDS.approve).isDisabled()).toBe(true)
  repoOf(g).checks = 'passing'
  await g.page.reload()
  await thingNamed(g.page, 'crate-1').waitFor()
  expect(await button(g, WORDS.approve).isDisabled()).toBe(false)
})

test('failed checks: the words, Approve off, Turn it down still works', async () => {
  await kidHasSaved('ipadUpright')
  const g = await gameAs('ipadUpright', 'grandpa')
  repoOf(g).checks = 'failing'
  await openFirstChange(g)
  await text(g, WORDS.checksFailed)
  expect(await button(g, WORDS.approve).isDisabled()).toBe(true)
  await button(g, WORDS.turnDown).click()
  await text(g, WORDS.turnedDown)
})

test('kid looks at their own change: no Approve, "Take my change back" works', async () => {
  await kidHasSaved('ipadUpright')
  const kid = await gameAs('ipadUpright', 'kid')
  await openFirstChange(kid)
  expect(await button(kid, WORDS.approve).count()).toBe(0)
  await button(kid, WORDS.takeBack).click()
  await text(kid, WORDS.turnedDown)
  expect(repoOf(kid).pulls[0]?.state).toBe('closed')
})

test('grandpa cannot approve his own: the words say someone else must', async () => {
  const me = await window_('ipadUpright', 'grandpa')
  repoOf(me).put(
    'main',
    'automata.access.toml',
    writeAccess({ format: 1, everyone: 'look', people: [{ github: 'grandpa', level: 'approve' }] }),
  )
  await signIn(me.page)
  await openLevel(me.page)
  await dragByTouch(me.page, 'crate-1', { dx: 2, dy: 0 })
  await pressSave(me.page).click()
  await text(me, WORDS.savedSuggestion)
  await me.page.getByRole('button', { name: WORDS.back }).click()
  // The only change waiting is his own: the page does not tell him someone made a change for him to look at.
  await text(me, WORDS.waitingRow(1))
  expect(await me.page.getByText(WORDS.tipApprove).count()).toBe(0)
  await openFirstChange(me)
  await text(me, WORDS.ownChange)
  expect(await button(me, WORDS.approve).count()).toBe(0)
})

test("grandma approves kid's change on a phone held upright: the Approve button is at least 48 px tall", async () => {
  await kidHasSaved('phone')
  const g = await gameAs('phone', 'grandma')
  await openFirstChange(g)
  const box = await button(g, WORDS.approve).boundingBox()
  expect(box?.height).toBeGreaterThanOrEqual(48)
  await button(g, WORDS.approve).click()
  await text(g, WORDS.approved)
})

test("a change that also edits the sharing file says it can't be approved here, and Approve is not there", async () => {
  await kidHasSaved('ipadUpright')
  const g = await gameAs('ipadUpright', 'grandpa')
  repoOf(g).put(
    'automata/kid',
    'automata.access.toml',
    writeAccess({ format: 1, everyone: 'suggest', people: [] }),
  )
  await openFirstChange(g)
  await text(g, WORDS.notHere)
  expect(await button(g, WORDS.approve).count()).toBe(0)
  expect(await button(g, WORDS.turnDown).count()).toBe(1)
})

test("the game changed underneath: Approve says it doesn't fit any more, and nothing changes", async () => {
  await kidHasSaved('ipadUpright')
  const g = await gameAs('ipadUpright', 'grandpa')
  await openFirstChange(g)
  const theirs = writeContent('level', crateAt(10.5) as never)
  repoOf(g).put('main', LEVEL_PATH, theirs)
  await button(g, WORDS.approve).click()
  await text(g, WORDS.clashes)
  expect(repoOf(g).branches.get('main')?.get(LEVEL_PATH)).toBe(theirs)
  expect(repoOf(g).pulls[0]?.state).toBe('open')
})

test('a person who may only look sees the list and the change, and no buttons that change anything', async () => {
  await kidHasSaved('ipadUpright')
  repoOf(await window_('ipadUpright', 'stranger', true)).put(
    'main',
    'automata.access.toml',
    writeAccess({ format: 1, everyone: 'look', people: [{ github: 'grandpa', level: 'approve' }] }),
  )
  const s = await gameAs('ipadUpright', 'stranger')
  await openFirstChange(s)
  await text(s, WORDS.cantApprove)
  for (const name of [WORDS.approve, WORDS.turnDown, WORDS.takeBack])
    expect(await button(s, name).count()).toBe(0)
})

test('someone else was quicker: Approve says the change is not waiting any more, with a way back to the game', async () => {
  await kidHasSaved('ipadUpright')
  const slow = await gameAs('ipadUpright', 'grandpa')
  await openFirstChange(slow)
  const quick = await gameAs('ipadUpright', 'grandma')
  await openFirstChange(quick)
  await button(quick, WORDS.approve).click()
  await text(quick, WORDS.approved)

  await button(slow, WORDS.approve).click()
  await text(slow, WORDS.changeGone)
  // The game is fine and is not blamed; the one button goes back to it.
  expect(await slow.page.getByText(WORDS.cantFindGame).count()).toBe(0)
  expect(await button(slow, WORDS.tryAgain).count()).toBe(0)
  await button(slow, WORDS.back).click()
  await slow.page.getByRole('heading', { level: 1, name: 'Crate Game' }).waitFor()
})

test('an old link to a change that is gone says so, and not that the game is missing', async () => {
  const g = await gameAs('ipadUpright', 'grandma')
  await g.page.goto(`${g.site}/#/game/grandma/crate-game/waiting/99`)
  await text(g, WORDS.changeGone)
  expect(await g.page.getByText(WORDS.cantFindGame).count()).toBe(0)
})

test('a change that moves nothing in a level says it does more than move things', async () => {
  await kidHasSaved('ipadUpright')
  const g = await gameAs('ipadUpright', 'grandpa')
  // The level goes back to how it was, and a character changes instead: nothing in a level moved.
  repoOf(g).put('automata/kid', LEVEL_PATH, fixtureFiles[LEVEL_PATH] ?? '')
  const crate = fixtureFiles['content/characters/crate.json'] ?? ''
  repoOf(g).put('automata/kid', 'content/characters/crate.json', crate.replace('#c9a227', '#c9a228'))
  await g.page.getByRole('link', { name: /waiting/ }).click()
  await g.page.locator('a.row').first().click()
  await text(g, WORDS.changeOther)
  expect(await g.page.locator('[data-thing]').count()).toBe(0)
})
