// A problem in the game, said in the top bar: a wall made on the map reads "1 problem"; "Show me" opens the map at it; mending
// it takes the count away; and a game set to stop refuses to put changes in while one is left, and says why.
import { afterEach, expect, test } from 'vitest'
import { EDITORS_FILE, writeEditors } from '#src/features/files/editors-file.ts'
import {
  type JourneyPage,
  makeWall,
  openMapOf,
  openPage,
  putButton,
  putSheet,
  putWords,
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

test('a wall made on the map is a problem: counted, shown on the map, and gone once mended', async () => {
  journey = await openPage('computer')
  const { page } = journey
  await signIn(page)
  await openMapOf(page)
  await makeWall(page)
  const count = page.getByRole('button', { name: '1 problem' })
  await count.waitFor()

  await count.click()
  await page.getByRole('button', { name: putWords.showMe }).first().click()
  // The strip says which one, and the wall it points at is on the map.
  await page
    .getByRole('status')
    .filter({ hasText: /^Problem 1 of 1/ })
    .waitFor()
  await page.locator('[data-wall]').waitFor()

  await page.locator('[data-way="clear"]').click()
  await count.waitFor({ state: 'detached' })
})

test('a game set to stop: with a problem left, "Put them in" is switched off and says why', async () => {
  journey = await openPage('computer')
  const { page, fake } = journey
  fake.repos
    .get('grandma/links-game')!
    .put('main', EDITORS_FILE, writeEditors({ format: 1, problems: 'stop' }))
  await signIn(page)
  await openMapOf(page)
  await makeWall(page)
  await page.getByRole('button', { name: '1 problem' }).waitFor()

  await putButton(page).click()
  const sheet = putSheet(page)
  await sheet.getByText(/every problem to be fixed/).waitFor()
  expect(await sheet.getByRole('button', { name: /^Put them in/ }).isDisabled()).toBe(true)
  expect(fake.repos.get('grandma/links-game')!.commits).toEqual([])
})

test('on a phone the strip and its Back are on show beside the wall card, and Back puts the strip away', async () => {
  journey = await openPage('phone')
  const { page } = journey
  await signIn(page)
  await openMapOf(page)
  await makeWall(page)
  await page.getByRole('button', { name: '1 problem' }).click()
  await page.getByRole('button', { name: putWords.showMe }).first().click()
  const strip = page.getByRole('status').filter({ hasText: /^Problem 1 of 1/ })
  await strip.waitFor()
  // The wall card is still up and does not cover the strip: a press on Back reaches it.
  await page.locator('[data-way="clear"]').waitFor()
  await strip.getByRole('button', { name: 'Back' }).click()
  await strip.waitFor({ state: 'detached' })
})

test('on a phone held sideways the rooms and the wall stay in sight, and "Ways to fix it" opens the fix card from the foot (design round 2, A1)', async () => {
  journey = await openPage('phoneSideways')
  const { page } = journey
  await signIn(page)
  await openMapOf(page)
  await makeWall(page)
  const count = page.getByRole('button', { name: '1 problem' })
  await count.click()
  await page.getByRole('button', { name: putWords.showMe }).first().click()
  const strip = page.getByRole('status').filter({ hasText: /^Problem 1 of 1/ })
  await strip.waitFor()
  // The card waits folded: nothing lies on the rooms or on the red mark where they meet.
  expect(await page.locator('[data-way="clear"]').count()).toBe(0)
  await page.locator('[data-wall]').waitFor()
  await strip.getByRole('button', { name: 'Ways to fix it' }).click()
  await page.locator('[data-way="clear"]').click()
  await count.waitFor({ state: 'detached' })
})
