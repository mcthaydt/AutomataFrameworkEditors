import { afterEach, expect, test } from 'vitest'
import { WORDS } from '#src/features/words/words.ts'
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

test('Welcome shows its pieces, and signing in ends on the list of games with a clean address', async () => {
  const j = await open('ipadUpright')
  await title(j, WORDS.appName)
  await j.page.getByText(WORDS.welcomeLine).waitFor()
  await j.page.getByText(WORDS.signInWhy).waitFor()
  // The site has an example game, so trying it is the one big button and signing in is the plain one under it.
  expect(
    (await j.page.getByRole('button', { name: WORDS.tryIt }).boundingBox())?.height,
  ).toBeGreaterThanOrEqual(48)
  expect(
    (await j.page.getByRole('button', { name: WORDS.signIn }).boundingBox())?.height,
  ).toBeGreaterThanOrEqual(44)
  await picture(j.page, 'welcome')

  await signIn(j.page)
  await title(j, WORDS.pickTitle)
  expect(new URL(j.page.url()).search).toBe('')

  // A reload stays signed in.
  await j.page.reload()
  await title(j, WORDS.pickTitle)

  // Signing out returns to Welcome, and a reload stays there.
  await j.page.getByRole('button', { name: WORDS.signOut }).click()
  await title(j, WORDS.appName)
  await j.page.reload()
  await title(j, WORDS.appName)

  // The page asked for nothing but its own files and GitHub's sign-in page.
  const own = new URL(j.site).origin
  const github = new URL(j.fake.url).origin
  for (const request of j.requests) {
    const url = new URL(request.split(' ')[1] ?? '')
    const fine =
      url.origin === own || (url.origin === github && url.pathname.startsWith('/login/oauth/authorize'))
    expect([request, fine]).toEqual([request, true])
  }
})

test('a sign-in that is turned down lands on Welcome saying so', async () => {
  const j = await open('ipadUpright')
  j.fake.signIn = 'deny'
  await j.page.getByRole('button', { name: WORDS.signIn }).click()
  await title(j, WORDS.appName)
  await j.page.getByText(WORDS.signInCancelled).waitFor()
  expect(new URL(j.page.url()).search).toBe('')
})

test('a game opens signed out with no word about signing in, and the top bar signIn comes back to that game', async () => {
  const j = await open('ipadUpright')
  await j.page.goto(`${j.site}/#/game/grandma/crate-game`)
  await title(j, 'Crate Game')
  expect(await j.page.getByText(WORDS.welcomeLine).count()).toBe(0)
  expect(j.requests.filter((r) => /\/api\/(games|token)/.test(r))).toEqual([])
  await signIn(j.page)
  await title(j, 'Crate Game')
  expect(new URL(j.page.url()).hash).toBe('#/game/grandma/crate-game')
})

test('a screen about a person shows Welcome, and signing in lands on that screen', async () => {
  const j = await open('ipadUpright')
  await j.page.goto(`${j.site}/#/game/grandma/crate-game/share`)
  await title(j, WORDS.appName)
  await signIn(j.page)
  await title(j, 'grandma/crate-game')
  expect(new URL(j.page.url()).hash).toBe('#/game/grandma/crate-game/share')
})

test('when the sign-in has run out, a reload still shows the list of games (renewed, and nobody noticed)', async () => {
  const j = await open('ipadUpright')
  await signIn(j.page)
  await title(j, WORDS.pickTitle)
  const before = await j.page.evaluate(() => localStorage.getItem('af.tokens'))
  j.fake.tokensRunOut()
  await j.page.reload()
  await title(j, WORDS.pickTitle)
  await j.page.waitForFunction((was) => localStorage.getItem('af.tokens') !== was, before)
  await j.page.waitForTimeout(100)
  expect(await j.page.getByText(WORDS.signedOutAgain).count()).toBe(0)
})
