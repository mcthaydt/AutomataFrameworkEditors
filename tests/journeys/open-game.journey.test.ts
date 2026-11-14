import { afterEach, expect, test } from 'vitest'
import { WORDS } from '#src/features/words/words.ts'
import { LEVEL_PATH } from '../fixtures/game/read.ts'
import { type JourneyPage, openPage, picture, setupJourneys, signIn } from '../fixtures/journey.ts'

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
    for (const row of await rows.all()) expect((await row.boundingBox())?.height).toBeGreaterThanOrEqual(56)
    await picture(j.page, `pick-game-${size}`)

    await j.page.getByLabel(WORDS.pickFind).fill('crate')
    expect(await j.page.getByRole('link').count()).toBe(1)
    await j.page.getByLabel(WORDS.pickFind).fill('zzz')
    await text(j, WORDS.pickNoMatch)
    await j.page.getByLabel(WORDS.pickFind).fill('')

    await j.page.getByRole('link', { name: 'crate-game' }).click()
    await title(j, 'Crate Game')
    await text(j, WORDS.youAre('owner'))
    await j.page.getByRole('link', { name: 'level-1' }).waitFor()
    await picture(j.page, `game-home-${size}`)
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
  await title(j, 'Crate Game')
})

test('kid opens a link to the game, finds it on the list afterwards, and still does after a reload', async () => {
  const j = await open('ipadUpright', 'kid')
  await j.page.goto(`${j.site}/${GAME}`)
  await signIn(j.page)
  await title(j, 'Crate Game')
  await text(j, WORDS.youAre('look'))
  await j.page.getByRole('button', { name: WORDS.back }).click()
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
  await title(j, 'Crate Game')
  await text(j, WORDS.visitorCan)
  await j.page.getByRole('link', { name: 'level-1' }).waitFor()
  await j.page.getByRole('button', { name: WORDS.signIn }).waitFor()
  expect(j.requests.filter((r) => /\/api\/(games|token)/.test(r))).toEqual([])
})

test('not signed in, a private game says it cannot be found, and signing in as its owner opens it', async () => {
  const j = await open('ipadUpright')
  crate(j).isPublic = false
  await j.page.goto(`${j.site}/${GAME}`)
  await text(j, WORDS.cantFindVisitor)
  // One Sign in, the screen's own: the bar does not offer a second one a hand away.
  expect(await j.page.getByRole('button', { name: WORDS.signIn }).count()).toBe(1)
  expect(await j.page.locator('.guide').count()).toBe(0)
  await j.page.getByRole('button', { name: WORDS.signIn }).click()
  await title(j, 'Crate Game')
  await text(j, WORDS.youAre('owner'))
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

test('a game that is open shows its own name everywhere, and the way into Share does too', async () => {
  const j = await open('ipadUpright')
  await signIn(j.page)
  await j.page.getByRole('link', { name: 'crate-game' }).click()
  await title(j, 'Crate Game')
  await j.page.getByRole('link', { name: WORDS.share }).click()
  await j.page.getByRole('heading', { level: 1, name: WORDS.shareTitle('Crate Game') }).waitFor()
})
