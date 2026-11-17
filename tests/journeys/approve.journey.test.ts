import { type Level, writeContent } from '@automataframework/framework/headless'
import { afterEach, describe, expect, test } from 'vitest'
import { writeAccess } from '#src/features/access/access.ts'
import { WORDS, wordsIn } from '#src/features/words/words.ts'
import { fixtureFiles, LEVEL_PATH } from '../fixtures/game/read.ts'
import {
  chooseFromMenu,
  dragByTouch,
  gameMenuRows,
  type JourneyPage,
  menuWords,
  openGame,
  openLevel,
  openPage,
  putThemIn,
  quietButton,
  type SIZES,
  setupJourneys,
  signIn,
  thingNamed,
} from '../fixtures/journey.ts'

setupJourneys()

const W = wordsIn('en')
const said = (row: unknown, ...parts: (string | number)[]): string =>
  typeof row === 'function' ? (row as (...p: (string | number)[]) => string)(...parts) : String(row)
const C = {
  putThem: said(W.check.putThem),
  askFor: said(W.check.askFor),
  dontPut: said(W.check.dontPut),
  playThem: said(W.check.playThem),
  stopPlaying: said(W.check.stopPlaying),
  putDone: said(W.check.putDoneTitle),
  gone: said(W.check.gone),
  cantFind: said(W.check.cantFind),
  checksRunning: said(W.check.checksRunning),
  checksFailed: said(W.check.checksFailed),
  ownChange: said(W.check.ownChange),
  notHere: said(W.check.notHere),
  cantApprove: said(W.check.cantApprove),
  noFit: said(W.check.noFit),
  otherChange: said(W.check.otherChange),
  undo: said(W.check.undo),
  gotIt: said(W.check.gotIt),
  close: said(W.shell.close),
  takeBack: said(W.changes.takeBack),
  takenBack: said(W.changes.takenBack),
  down: (by: string) => said(W.check.downTitle, by, 1),
  moved: said(W.kept.lineMoved, 'Crate 1'),
}

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
  await putThemIn(kid.page, 'suggestion')
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
  await chooseFromMenu(j.page, menuWords.waitingRow(1))
  await j.page.getByRole('heading', { level: 1, name: WORDS.waitingTitle }).waitFor()
  await j.page.locator('a.row').first().click()
  await thingNamed(j.page, 'crate-1').waitFor()
}
/** The sheet that says the changes are in the game (its words also sit in a button, so the heading is waited for). */
const done = (j: JourneyPage) => j.page.getByRole('heading', { name: C.putDone, exact: true }).waitFor()
const button = (j: JourneyPage, name: string) => j.page.getByRole('button', { name, exact: true })

describe.each(['ipadUpright', 'phone'] as const)('at %s', (size) => {
  test('grandpa opens the game, sees "1 change is waiting", opens it, and sees the crate ringed where kid put it', async () => {
    await kidHasSaved(size)
    const g = await gameAs(size, 'grandpa')
    expect(await gameMenuRows(g.page)).toContainEqual(expect.stringContaining(menuWords.waitingRow(1)))
    await openFirstChange(g)
    expect(await thingNamed(g.page, 'crate-1').getAttribute('data-x')).toBe('8.5')
    expect(await thingNamed(g.page, 'crate-1').getAttribute('data-marked')).toBe('')
    await text(g, C.moved)
  })

  test("grandpa approves: Approved; the game now has kid's crate; nothing is waiting", async () => {
    await kidHasSaved(size)
    const g = await gameAs(size, 'grandpa')
    await openFirstChange(g)
    await button(g, C.putThem).click()
    await done(g)
    const repo = repoOf(g)
    expect(repo.branches.get('main')?.get(LEVEL_PATH)).toBe(moved)
    expect(repo.pulls[0]?.state).toBe('merged')
    expect(repo.branches.has('automata/kid')).toBe(false)

    // Then kid opens the game and sees the crate there, with nothing waiting.
    const kid = await gameAs(size, 'kid')
    expect((await gameMenuRows(kid.page)).filter((row) => row.includes(menuWords.waitingRow(1)))).toEqual([])
    await thingNamed(kid.page, 'crate-1').waitFor()
    expect(await thingNamed(kid.page, 'crate-1').getAttribute('data-x')).toBe('8.5')
    await quietButton(kid.page).waitFor()
  })
})

test("grandpa turns it down instead: Turned down; the game is as it was; kid's next change starts fresh", async () => {
  await kidHasSaved('ipadUpright')
  const g = await gameAs('ipadUpright', 'grandpa')
  await openFirstChange(g)
  await button(g, C.dontPut).click()
  await text(g, C.down('kid'))
  const repo = repoOf(g)
  expect(repo.branches.get('main')?.get(LEVEL_PATH)).toBe(fixtureFiles[LEVEL_PATH])
  expect(repo.pulls[0]?.state).toBe('closed')

  const kid = await gameAs('ipadUpright', 'kid')
  await thingNamed(kid.page, 'crate-1').waitFor()
  expect(await thingNamed(kid.page, 'crate-1').getAttribute('data-x')).toBe('6.5')
  await dragByTouch(kid.page, 'crate-1', { dx: 1, dy: 0 })
  await putThemIn(kid.page, 'suggestion')
  expect(repo.pulls.filter((p) => p.state === 'open')).toHaveLength(1)
})

test('while the checks run, Approve is off and the screen says why; when they pass, a reload lights it', async () => {
  await kidHasSaved('ipadUpright')
  const g = await gameAs('ipadUpright', 'grandpa')
  repoOf(g).checks = 'running'
  await openFirstChange(g)
  await text(g, C.checksRunning)
  expect(await button(g, C.putThem).isDisabled()).toBe(true)
  repoOf(g).checks = 'passing'
  await g.page.reload()
  await thingNamed(g.page, 'crate-1').waitFor()
  expect(await button(g, C.putThem).isDisabled()).toBe(false)
})

test('failed checks: the words, Approve off, Turn it down still works', async () => {
  await kidHasSaved('ipadUpright')
  const g = await gameAs('ipadUpright', 'grandpa')
  repoOf(g).checks = 'failing'
  await openFirstChange(g)
  await text(g, C.checksFailed)
  expect(await button(g, C.putThem).isDisabled()).toBe(true)
  await button(g, C.dontPut).click()
  await text(g, C.down('kid'))
})

test('kid looks at their own change: no Approve, "Take my change back" works', async () => {
  await kidHasSaved('ipadUpright')
  const kid = await gameAs('ipadUpright', 'kid')
  await openFirstChange(kid)
  expect(await button(kid, C.putThem).count()).toBe(0)
  await button(kid, C.takeBack).click()
  await text(kid, C.takenBack)
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
  await putThemIn(me.page, 'suggestion')
  // The only change waiting is his own: the page does not tell him someone made a change for him to look at.
  await me.page.reload()
  expect(await gameMenuRows(me.page)).toContainEqual(expect.stringContaining(menuWords.waitingRow(1)))
  expect(await me.page.getByText(WORDS.tipApprove).count()).toBe(0)
  await openFirstChange(me)
  await text(me, C.ownChange)
  expect(await button(me, C.putThem).count()).toBe(0)
})

test("grandma approves kid's change on a phone held upright: the Approve button is at least 48 px tall", async () => {
  await kidHasSaved('phone')
  const g = await gameAs('phone', 'grandma')
  await openFirstChange(g)
  const box = await button(g, C.putThem).boundingBox()
  expect(box?.height).toBeGreaterThanOrEqual(48)
  await button(g, C.putThem).click()
  await done(g)
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
  await text(g, C.notHere)
  expect(await button(g, C.putThem).count()).toBe(0)
  expect(await button(g, C.dontPut).count()).toBe(1)
})

test("the game changed underneath: Approve says it doesn't fit any more, and nothing changes", async () => {
  await kidHasSaved('ipadUpright')
  const g = await gameAs('ipadUpright', 'grandpa')
  await openFirstChange(g)
  const theirs = writeContent('level', crateAt(10.5) as never)
  repoOf(g).put('main', LEVEL_PATH, theirs)
  await button(g, C.putThem).click()
  await text(g, C.noFit)
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
  await text(s, C.cantApprove)
  for (const name of [C.putThem, C.dontPut, C.takeBack]) expect(await button(s, name).count()).toBe(0)
})

test('someone else was quicker: Approve says the change is not waiting any more, with a way back to the game', async () => {
  await kidHasSaved('ipadUpright')
  const slow = await gameAs('ipadUpright', 'grandpa')
  await openFirstChange(slow)
  const quick = await gameAs('ipadUpright', 'grandma')
  await openFirstChange(quick)
  await button(quick, C.putThem).click()
  await done(quick)

  await button(slow, C.putThem).click()
  await text(slow, C.gone)
  // The game is fine and is not blamed; the one button goes back to it.
  expect(await slow.page.getByText(C.cantFind).count()).toBe(0)
  await button(slow, C.close).first().click()
  await slow.page.locator('[data-bar]').waitFor()
})

test('an old link to a change that is gone says so, and not that the game is missing', async () => {
  const g = await gameAs('ipadUpright', 'grandma')
  await g.page.goto(`${g.site}/#/game/grandma/crate-game/waiting/99`)
  await text(g, C.gone)
  expect(await g.page.getByText(C.cantFind).count()).toBe(0)
})

test('a change that moves nothing in a level says it does more than move things', async () => {
  await kidHasSaved('ipadUpright')
  const g = await gameAs('ipadUpright', 'grandpa')
  // The level goes back to how it was, and a character changes instead: nothing in a level moved.
  repoOf(g).put('automata/kid', LEVEL_PATH, fixtureFiles[LEVEL_PATH] ?? '')
  const crate = fixtureFiles['content/characters/crate.json'] ?? ''
  repoOf(g).put('automata/kid', 'content/characters/crate.json', crate.replace('#c9a227', '#c9a228'))
  await chooseFromMenu(g.page, menuWords.waitingRow(1))
  await g.page.locator('a.row').first().click()
  await text(g, C.otherChange)
  expect(await g.page.locator('[data-marked]').count()).toBe(0)
})

const askedBy = (by: string) => said(W.check.askedTitle, by)
const downBy = (by: string) => said(W.check.downByTitle, by)
const wordsFor = 'Can the button sit nearer the gate?'

test('grandpa plays the changes, asks kid for a change in words; kid sees the words, changes it, sends again; grandpa puts it in', async () => {
  await kidHasSaved('ipadUpright')
  const g = await gameAs('ipadUpright', 'grandpa')
  await openFirstChange(g)
  await button(g, C.playThem).click()
  await g.page.locator('[data-play="box"]').waitFor()
  await button(g, C.stopPlaying).click()
  await thingNamed(g.page, 'crate-1').waitFor()

  await button(g, C.askFor).click()
  const send = button(g, said(W.check.askSend, 'kid'))
  expect(await send.isDisabled()).toBe(true)
  await g.page.getByRole('textbox').fill(wordsFor)
  await send.click()
  await text(g, said(W.check.askedDoneTitle, 'kid'))
  // Nothing went in the game, and the change is still waiting.
  expect(repoOf(g).branches.get('main')?.get(LEVEL_PATH)).toBe(fixtureFiles[LEVEL_PATH])
  expect(repoOf(g).pulls[0]?.state).toBe('open')

  const kid = await gameAs('ipadUpright', 'kid')
  await text(kid, askedBy('grandpa'))
  await text(kid, wordsFor)
  await dragByTouch(kid.page, 'crate-1', { dx: 1, dy: 0 })
  await putThemIn(kid.page, 'suggestion')

  const again = await gameAs('ipadUpright', 'grandpa')
  await openFirstChange(again)
  await button(again, C.putThem).click()
  await done(again)
  expect(repoOf(again).branches.get('main')?.get(LEVEL_PATH)).toBe(
    writeContent('level', crateAt(9.5) as never),
  )
})

test('grandpa says no at once, undoes it, says no again; kid is told who, and "Got it" clears it for good', async () => {
  await kidHasSaved('ipadUpright')
  const g = await gameAs('ipadUpright', 'grandpa')
  await openFirstChange(g)
  await button(g, C.dontPut).click()
  await text(g, C.down('kid'))
  expect(repoOf(g).pulls[0]?.state).toBe('closed')
  // The branch is kept, so Undo can bring the change back to wait again.
  expect(repoOf(g).branches.has('automata/kid')).toBe(true)
  await button(g, C.undo).click()
  await button(g, C.putThem).waitFor()
  expect(repoOf(g).pulls[0]?.state).toBe('open')
  await button(g, C.dontPut).click()
  await text(g, C.down('kid'))

  const kid = await gameAs('ipadUpright', 'kid')
  await text(kid, downBy('grandpa'))
  expect(repoOf(kid).branches.get('main')?.get(LEVEL_PATH)).toBe(fixtureFiles[LEVEL_PATH])
  await button(kid, C.gotIt).click()
  await expect.poll(() => repoOf(kid).branches.has('automata/kid')).toBe(false)
  await kid.page.reload()
  await thingNamed(kid.page, 'crate-1').waitFor()
  expect(await kid.page.getByText(downBy('grandpa')).count()).toBe(0)
})

test('a change with a problem can still be played, asked about and put in', async () => {
  await kidHasSaved('ipadUpright')
  const g = await gameAs('ipadUpright', 'grandpa')
  // The change puts a crate half into the ground: the game's own check says so, and still lets it in.
  const level = JSON.parse(repoOf(g).branches.get('automata/kid')?.get(LEVEL_PATH) ?? '') as Level
  const broken = {
    ...level,
    things: level.things.map((t) => (t.id === 'crate-1' ? { ...t, character: 'no-such-character' } : t)),
  }
  repoOf(g).put('automata/kid', LEVEL_PATH, writeContent('level', broken as never))
  await openFirstChange(g)
  await g.page.getByRole('alert').first().waitFor()
  expect(await button(g, C.putThem).isDisabled()).toBe(false)
  await button(g, C.askFor).click()
  await g.page.getByRole('textbox').fill(wordsFor)
  await button(g, said(W.check.askSend, 'kid')).click()
  await text(g, said(W.check.askedDoneTitle, 'kid'))
})
