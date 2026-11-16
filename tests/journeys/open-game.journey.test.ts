import { afterEach, expect, test } from 'vitest'
import { WORDS } from '#src/features/words/words.ts'
import { LEVEL_PATH } from '../fixtures/game/read.ts'
import {
  chooseFromMenu,
  gameMenuRows,
  type JourneyPage,
  menuWords,
  openPage,
  picture,
  setupJourneys,
  signIn,
} from '../fixtures/journey.ts'

setupJourneys()

let journey: JourneyPage | undefined
afterEach(async () => {
  const found = (await journey?.problems()) ?? []
  await journey?.close()
  journey = undefined
  expect(found).toEqual([])
})
const open = async (...args: Parameters<typeof openPage>): Promise<JourneyPage> => {
  journey = await openPage(...args)
  return journey
}
const title = (j: JourneyPage, text: string) =>
  j.page.getByRole('heading', { level: 1, name: text }).waitFor()
/** The game is open: its bar is there, and where the bar has room it says the game's name. */
const inGame = async (j: JourneyPage): Promise<void> => {
  await j.page.locator('[data-bar]').waitFor()
  if ((await j.page.locator('button.game').count()) > 0) {
    expect(await j.page.locator('button.game').textContent()).toContain('Crate Game')
  }
}
const text = (j: JourneyPage, words: string) => j.page.getByText(words, { exact: false }).first().waitFor()
const crate = (j: JourneyPage) => j.fake.repos.get('grandma/crate-game')!
const GAME = '#/game/grandma/crate-game'

for (const size of ['ipadUpright', 'phone'] as const) {
  test(`grandma picks a game and opens it, at ${size}`, async () => {
    const j = await open(size)
    await signIn(j.page)
    await title(j, WORDS.pickTitle)
    const rows = j.page.getByRole('link')
    await j.page.getByRole('link', { name: 'crate-game' }).waitFor()
    await j.page.getByRole('link', { name: 'not-a-game' }).waitFor()
    // 56, less the hundredth of a pixel a browser may lose placing a row between fractions.
    for (const row of await rows.all())
      expect((await row.boundingBox())?.height).toBeGreaterThanOrEqual(55.99)
    await picture(j.page, `pick-game-${size}`)

    await j.page.getByLabel(WORDS.pickFind).fill('crate')
    expect(await j.page.getByRole('link').count()).toBe(1)
    await j.page.getByLabel(WORDS.pickFind).fill('zzz')
    await text(j, WORDS.pickNoMatch)
    await j.page.getByLabel(WORDS.pickFind).fill('')

    await j.page.getByRole('link', { name: 'crate-game' }).click()
    await inGame(j)
    await picture(j.page, `world-${size}`)
  })
}

test('a repo that is not a game says so, with a way back', async () => {
  const j = await open('ipadUpright')
  await signIn(j.page)
  await j.page.getByRole('link', { name: 'not-a-game' }).click()
  await text(j, WORDS.notAGame)
  await j.page.getByRole('button', { name: WORDS.back }).click()
  await title(j, WORDS.pickTitle)
})

test('a level that will not load shows what is wrong and which file', async () => {
  const j = await open('ipadUpright')
  crate(j).put('main', LEVEL_PATH, '{')
  await signIn(j.page)
  await j.page.goto(`${j.site}/${GAME}`)
  await text(j, WORDS.brokenGame)
  await text(j, LEVEL_PATH)
})

test('when the sign-in is gone for good the person is on Welcome, told so', async () => {
  const j = await open('ipadUpright')
  await signIn(j.page)
  await title(j, WORDS.pickTitle)
  j.fake.signedOutEverywhere()
  await j.page.goto(`${j.site}/${GAME}`)
  await j.page.reload()
  await title(j, WORDS.appName)
  await text(j, WORDS.signedOutAgain)
})

test('a sign-in renewal whose answer comes as the page reloads is not a fault, in any browser', async () => {
  // WebKit reports a call whose answer arrives while the page is being replaced as a page error. Whether the answer or
  // the reload wins is a race (and which page then shows the sign-out is the race's outcome), so the journey runs it
  // several times, each time from a sign-in that is gone, and asks only that the page shows its first heading (or the bar of an open game) and
  // that nothing was a fault.
  for (let round = 0; round < 4; round += 1) {
    const j = await open('ipadUpright')
    await signIn(j.page)
    await title(j, WORDS.pickTitle)
    j.fake.signedOutEverywhere()
    const release = j.hold('/api/token')
    const asked = j.page.waitForRequest('**/api/token')
    await j.page.goto(`${j.site}/${GAME}`)
    await asked
    release()
    await j.page.reload()
    await j.page.locator('h1, [data-bar]').first().waitFor()
    const found = await j.problems()
    await j.close()
    journey = undefined
    expect(found, `round ${round}`).toEqual([])
  }
})

test('a game that is not there says so', async () => {
  const j = await open('ipadUpright')
  await signIn(j.page)
  await j.page.goto(`${j.site}/#/game/grandma/nope`)
  await text(j, WORDS.cantFindGame)
})

test('when GitHub is down the game says it cannot be reached, and Try again works once it is back', async () => {
  const j = await open('ipadUpright')
  await signIn(j.page)
  j.fake.down = true
  await j.page.goto(`${j.site}/${GAME}`)
  await text(j, WORDS.cantReach)
  j.fake.down = false
  await j.page.getByRole('button', { name: WORDS.tryAgain }).click()
  await inGame(j)
})

test('kid opens a link to the game, finds it on the list afterwards, and still does after a reload', async () => {
  const j = await open('ipadUpright', 'kid')
  await j.page.goto(`${j.site}/${GAME}`)
  await signIn(j.page)
  await inGame(j)
  await text(j, WORDS.lookOnly)
  await chooseFromMenu(j.page, menuWords.yourGames)
  await j.page.getByRole('link', { name: 'crate-game' }).waitFor()
  await j.page.reload()
  await j.page.getByRole('link', { name: 'crate-game' }).waitFor()
})

test('a stranger cannot open a private game, and it is not remembered', async () => {
  const j = await open('ipadUpright', 'stranger')
  crate(j).isPublic = false
  await j.page.goto(`${j.site}/${GAME}`)
  await signIn(j.page)
  await text(j, WORDS.cantFindGame)
  await j.page.getByRole('button', { name: WORDS.back }).click()
  await text(j, WORDS.pickEmpty)
})

test('someone not signed in opens the demo game by its link, and nothing asks them to sign in', async () => {
  const j = await open('ipadUpright')
  await j.page.goto(`${j.site}/${GAME}`)
  await inGame(j)
  await text(j, WORDS.visitorCan)
  expect(await gameMenuRows(j.page)).toContainEqual(expect.stringContaining(menuWords.signIn))
  expect(j.requests.filter((r) => /\/api\/(games|token)/.test(r))).toEqual([])
})

test('not signed in, a private game says it cannot be found, and signing in as its owner opens it', async () => {
  const j = await open('ipadUpright')
  crate(j).isPublic = false
  await j.page.goto(`${j.site}/${GAME}`)
  await text(j, WORDS.cantFindVisitor)
  // One Sign in, the screen's own: the bar does not offer a second one a hand away.
  expect(await j.page.getByRole('button', { name: WORDS.signIn }).count()).toBe(1)
  await j.page.getByRole('button', { name: WORDS.signIn }).click()
  await inGame(j)
})

test('a person with no game the editor was added to is shown what to do', async () => {
  const j = await open('ipadUpright')
  for (const repo of j.fake.repos.values()) repo.installed = false
  await signIn(j.page)
  await text(j, WORDS.pickEmpty)
  await text(j, WORDS.pickEmptyLink)
  await j.page.getByRole('button', { name: WORDS.pickAdd }).waitFor()
})

test('a list of games that cannot be fetched says so and offers Try again, not "add the editor"', async () => {
  const j = await open('ipadUpright')
  await signIn(j.page)
  await title(j, WORDS.pickTitle)
  j.fake.down = true
  await j.page.reload()
  await text(j, WORDS.cantReach)
  expect(await j.page.getByText(WORDS.pickEmpty).count()).toBe(0)
  expect(await j.page.getByRole('button', { name: WORDS.pickAdd }).count()).toBe(0)
  const again = j.page.getByRole('button', { name: WORDS.tryAgain })
  expect((await again.boundingBox())?.height).toBeGreaterThanOrEqual(48)
  j.fake.down = false
  await again.click()
  await j.page.getByRole('link', { name: 'crate-game' }).waitFor()
})

test('a game that is open shows its own name in the bar, and the way into Share is in its menu', async () => {
  const j = await open('ipadUpright')
  await signIn(j.page)
  await j.page.getByRole('link', { name: 'crate-game' }).click()
  await inGame(j)
  await chooseFromMenu(j.page, menuWords.whoCanChange)
  await j.page.getByRole('heading', { level: 1, name: WORDS.shareTitle('Crate Game') }).waitFor()
})
