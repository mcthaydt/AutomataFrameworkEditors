import { type Level, writeContent } from '@automataframework/framework/headless'
import { afterEach, describe, expect, test } from 'vitest'
import { type AccessFile, writeAccess } from '#src/features/access/access.ts'
import { WORDS, wordsIn } from '#src/features/words/words.ts'
import { fixtureFiles, LEVEL_PATH } from '../fixtures/game/read.ts'
import {
  checkWords,
  chooseFromMenu,
  dragByTouch,
  type JourneyPage,
  menuWords,
  openGame,
  openPage,
  putButtonSaying,
  putThemIn,
  type SIZES,
  setupJourneys,
  signIn,
  thingNamed,
} from '../fixtures/journey.ts'

setupJourneys()

const T = wordsIn('en').team
const say = (row: unknown, ...parts: string[]): string =>
  typeof row === 'function' ? (row as (...p: string[]) => string)(...parts) : String(row)

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
const ACCESS = 'automata.access.toml'
const level1 = JSON.parse(fixtureFiles[LEVEL_PATH] ?? '') as Level
const moved = writeContent('level', {
  ...level1,
  things: level1.things.map((t) => ({ ...t, x: 8.5 })),
} as never)
const text = (j: JourneyPage, words: string) => j.page.getByText(words, { exact: false }).first().waitFor()
const accessOf = (j: JourneyPage) => repoOf(j).branches.get('main')?.get(ACCESS)
const file = (over: Partial<AccessFile>): string =>
  writeAccess({ format: 1, everyone: 'look', people: [], ...over })

/** Grandma signs in and opens "Who can change it". */
async function shareScreen(size: Size = 'ipadUpright', keep = false): Promise<JourneyPage> {
  const g = await window_(size, 'grandma', keep)
  await signIn(g.page)
  await openGame(g.page)
  await chooseFromMenu(g.page, menuWords.whoCanChange)
  await g.page.getByRole('heading', { name: say(T.peopleTitle, 'Crate Game') }).waitFor()
  // The sheet shows before it has finished asking; a reload in the middle of that makes WebKit report the cancelled
  // request as an error of the new page.
  await g.page.waitForLoadState('networkidle')
  await g.page.locator('#people-link').waitFor()
  return g
}
const level = (j: JourneyPage, words: string) => j.page.getByRole('radio', { name: words })
async function addPerson(j: JourneyPage, name: string, as?: string): Promise<void> {
  await j.page.locator('#people-name').fill(name)
  if (as !== undefined) await j.page.getByRole('combobox', { name: say(T.addName) }).selectOption(as)
  await j.page.getByRole('button', { name: say(T.addPerson), exact: true }).click()
}
const saveSharing = (j: JourneyPage) => j.page.getByRole('button', { name: say(T.saveList), exact: true })

describe.each(['ipadUpright', 'phone'] as const)('at %s', (size) => {
  test('the whole point: grandma shares, grandpa approves, kid suggests, and none of them opens GitHub', async () => {
    const grandma = await shareScreen(size)
    await level(grandma, say(T.suggestName)).check()
    await addPerson(grandma, 'grandpa', 'approve')
    await saveSharing(grandma).click()
    await text(grandma, say(T.savedList))
    const link = await grandma.page.locator('#people-link').inputValue()

    const kid = await window_(size, 'kid', true)
    await kid.page.goto(link)
    await signIn(kid.page)
    await thingNamed(kid.page, 'crate-1').waitFor()
    await dragByTouch(kid.page, 'crate-1', { dx: 2, dy: 0 })
    await putThemIn(kid.page, 'suggestion')

    const grandpa = await window_(size, 'grandpa', true)
    await grandpa.page.goto(link)
    await signIn(grandpa.page)
    await chooseFromMenu(grandpa.page, menuWords.waitingRow(1))
    await grandpa.page.locator('a.row').first().click()
    await grandpa.page.getByRole('button', { name: checkWords.putThem, exact: true }).click()
    await grandpa.page.getByRole('heading', { name: checkWords.putDone, exact: true }).waitFor()

    await grandma.page.goto(`${grandma.site}/#/game/grandma/crate-game`)
    await grandma.page.reload()
    await thingNamed(grandma.page, 'crate-1').waitFor()
    expect(await thingNamed(grandma.page, 'crate-1').getAttribute('data-x')).toBe('8.5')

    const repo = repoOf(grandma)
    expect(accessOf(grandma)).toBe(
      file({ everyone: 'suggest', people: [{ github: 'grandpa', level: 'approve' }] }),
    )
    expect(repo.branches.get('main')?.get(LEVEL_PATH)).toBe(moved)
    // Every request went to the page's own address or to GitHub's sign-in page (the pretend one is on port 4801).
    for (const j of windows) {
      for (const request of j.requests) {
        expect(
          request.includes(j.site) || request.includes('127.0.0.1:4801') || request.includes('data:'),
        ).toBe(true)
      }
    }
  })
})

test('anyone signed in reads who can change the game; only an owner gets the list to change', async () => {
  const g = await window_('ipadUpright', 'grandpa')
  repoOf(g).put('main', ACCESS, file({ people: [{ github: 'grandpa', level: 'approve' }] }))
  await signIn(g.page)
  await openGame(g.page)
  await chooseFromMenu(g.page, menuWords.whoCanChange)
  await text(g, say(T.peopleOnlyOwner))
  await text(g, say(T.approveName))
  // The owner is in the list, said in words, and nothing here can be changed or saved.
  await text(g, say(T.peopleStarted))
  expect(await g.page.locator('#people-name').count()).toBe(0)
  expect(await g.page.getByRole('button', { name: say(T.saveList), exact: true }).count()).toBe(0)
  expect(await g.page.getByRole('combobox').count()).toBe(0)
  await text(g, say(T.askOwner, 'grandma'))
})

test('the old Share address opens who can change it', async () => {
  const g = await window_('ipadUpright', 'grandma')
  await signIn(g.page)
  await g.page.goto(`${g.site}/#/game/grandma/crate-game/share`)
  await g.page.getByRole('heading', { name: say(T.peopleTitle, 'Crate Game') }).waitFor()
})

test('changing grandpa from Approve to Look, and saving: his next visit says he can look', async () => {
  const g = await shareScreen()
  repoOf(g).put(
    'main',
    ACCESS,
    file({ everyone: 'nothing', people: [{ github: 'grandpa', level: 'approve' }] }),
  )
  await g.page.reload()
  await g.page.getByRole('combobox', { name: 'grandpa' }).selectOption('look')
  await saveSharing(g).click()
  await text(g, say(T.savedList))
  const grandpa = await window_('ipadUpright', 'grandpa', true)
  await signIn(grandpa.page)
  await openGame(grandpa.page)
  await text(grandpa, WORDS.lookOnly)
})

test('removing grandpa, and saving: he gets what "anyone" gets', async () => {
  const g = await shareScreen()
  repoOf(g).put(
    'main',
    ACCESS,
    file({ everyone: 'suggest', people: [{ github: 'grandpa', level: 'approve' }] }),
  )
  await g.page.reload()
  await g.page.getByRole('button', { name: say(T.removeName, 'grandpa') }).click()
  await saveSharing(g).click()
  await text(g, say(T.savedList))
  const grandpa = await window_('ipadUpright', 'grandpa', true)
  await signIn(grandpa.page)
  await openGame(grandpa.page)
  await thingNamed(grandpa.page, 'crate-1').waitFor()
  await dragByTouch(grandpa.page, 'crate-1', { dx: 1, dy: 0 })
  await putButtonSaying(grandpa.page, String(wordsIn('en').bar.sendToCheck)).waitFor()
})

test('setting "anyone" to "Can\'t get in": a stranger with the link is told to ask the owner', async () => {
  const g = await shareScreen()
  await level(g, say(T.everyoneNothing)).check()
  await saveSharing(g).click()
  await text(g, say(T.savedList))
  const link = await g.page.locator('#people-link').inputValue()
  const stranger = await window_('ipadUpright', 'stranger', true)
  await stranger.page.goto(link)
  await signIn(stranger.page)
  await text(stranger, WORDS.cantFindGame)
})

test('a name with a typo: the screen names it, nothing is saved, and the rest of the list is still there', async () => {
  const g = await shareScreen()
  await addPerson(g, 'kid')
  await addPerson(g, 'grandpaa')
  await saveSharing(g).click()
  await text(g, say(T.nameUnknown, 'grandpaa'))
  expect(accessOf(g)).toBeUndefined()
  await g.page.getByText('kid', { exact: true }).waitFor()
})

test('a name already on the list, and a name that cannot be a GitHub name, are caught before saving', async () => {
  const g = await shareScreen()
  await addPerson(g, 'kid')
  await addPerson(g, 'KID')
  await text(g, say(T.nameTwice, 'KID'))
  await addPerson(g, '-no- good')
  await text(g, say(T.nameBad))
  expect(g.requests.filter((r) => r.includes('POST') && r.includes('/api/sharing'))).toEqual([])
})

test('two Owners at once: the second is shown the newest list and nothing is lost silently', async () => {
  const first = await shareScreen('ipadUpright')
  const second = await shareScreen('ipadUpright', true)
  await addPerson(first, 'kid')
  await saveSharing(first).click()
  await text(first, say(T.savedList))
  await addPerson(second, 'stranger')
  await saveSharing(second).click()
  await text(second, say(T.listChanged))
  expect(accessOf(first)).toBe(file({ people: [{ github: 'kid', level: 'suggest' }] }))
  await second.page.getByText('kid', { exact: true }).waitFor()
})

test('a damaged sharing file: the screen says so, and saving mends it', async () => {
  const g = await window_('ipadUpright', 'grandma')
  repoOf(g).put('main', ACCESS, 'format = [')
  await signIn(g.page)
  await openGame(g.page)
  await chooseFromMenu(g.page, menuWords.whoCanChange)
  await text(g, say(T.listBroken))
  await saveSharing(g).click()
  await text(g, say(T.savedList))
  expect(accessOf(g)?.startsWith('format = 1')).toBe(true)
})

test('leaving with unsaved sharing asks first', async () => {
  const g = await shareScreen()
  await addPerson(g, 'kid')
  await text(g, say(T.listUnsaved))
  await g.page.getByRole('button', { name: say(wordsIn('en').shell.close), exact: true }).click()
  await text(g, say(T.leaveAsk))
  await g.page.getByRole('button', { name: say(T.leaveNo) }).click()
  await g.page.getByText('kid', { exact: true }).waitFor()
  await g.page.getByRole('button', { name: say(wordsIn('en').shell.close), exact: true }).click()
  await g.page.getByRole('button', { name: say(T.leaveYes) }).click()
  await g.page.locator('[data-bar]').waitFor()
  await g.page.getByRole('dialog').waitFor({ state: 'detached' })
  expect(accessOf(g)).toBeUndefined()
})

test("Copy the link puts the game's address on the clipboard", async () => {
  // Only Chromium lets a test read the clipboard.
  if ((process.env.ENGINE ?? 'chromium') !== 'chromium') return
  const g = await shareScreen()
  await g.page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: g.site })
  await g.page.getByRole('button', { name: say(T.copyLink) }).click()
  await text(g, say(T.linkCopied))
  const link = await g.page.locator('#people-link').inputValue()
  expect(await g.page.evaluate(() => navigator.clipboard.readText())).toBe(link)
})

test('every level picker and every Remove is at least 44 px, on a phone too', async () => {
  const g = await shareScreen('phone')
  await addPerson(g, 'kid')
  const controls = g.page.locator('select, .person button, form button')
  for (const control of await controls.all()) {
    expect((await control.boundingBox())?.height).toBeGreaterThanOrEqual(44)
  }
})

test("the faces in the top bar are the game's people, and a tap on them opens who can change it", async () => {
  const g = await window_('ipadUpright', 'grandma')
  repoOf(g).put(
    'main',
    ACCESS,
    file({
      people: [
        { github: 'grandpa', level: 'approve' },
        { github: 'kid', level: 'suggest' },
      ],
    }),
  )
  await signIn(g.page)
  await openGame(g.page)
  const faces = g.page.getByRole('button', { name: menuWords.whoCanChange, exact: true })
  await faces.waitFor()
  expect(await faces.getByText('G').count()).toBeGreaterThan(0)
  await faces.click()
  await g.page.getByRole('heading', { name: say(T.peopleTitle, 'Crate Game') }).waitFor()
})
