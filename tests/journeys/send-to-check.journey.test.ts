// Someone who may only suggest: they send their changes to be checked, see that they are waiting, change more, send the one
// more, and take them back, with nothing ever written to the game itself.

import { afterEach, expect, test } from 'vitest'
import { writeAccess } from '#src/features/access/access.ts'
import {
  dragByTouch,
  type JourneyPage,
  openLevel,
  openPage,
  pressPut,
  putSheet,
  putWords,
  quietButton,
  setupJourneys,
  signIn,
  teamWords,
  thingNamed,
} from '../fixtures/journey.ts'

setupJourneys()

let journey: JourneyPage | undefined
afterEach(async () => {
  const found = (await journey?.problems()) ?? []
  await journey?.close()
  journey = undefined
  expect(found).toEqual([])
})

const asKid = async (): Promise<JourneyPage> => {
  journey = await openPage('ipadUpright', 'kid')
  journey.fake.repos
    .get('grandma/crate-game')!
    .put('main', 'automata.access.toml', writeAccess({ format: 1, everyone: 'suggest', people: [] }))
  await signIn(journey.page)
  await openLevel(journey.page)
  return journey
}

test('send, wait, change more, send the one more, take them back: the game itself is never written', async () => {
  const j = await asKid()
  const sheet = putSheet(j.page)
  await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
  await pressPut(j.page)
  await sheet.getByRole('heading', { name: /^Send 1 change to grandma/ }).waitFor()
  await sheet.getByText('After you send, the top bar says “Waiting for grandma”').waitFor()
  await sheet.getByRole('button', { name: /^Send/ }).click()
  await sheet.getByRole('heading', { name: /^Sent to grandma/ }).waitFor()
  await sheet.getByRole('button', { name: 'Close' }).first().click()
  const repo = j.fake.repos.get('grandma/crate-game')!
  expect(repo.commits.map((c) => c.branch)).toEqual(['automata/kid'])
  // What the sheet promised is what the top bar now says.
  await quietButton(j.page).filter({ hasText: 'Waiting for grandma' }).waitFor()

  // The main button now says they are waiting; more changes are theirs alone until sent.
  await dragByTouch(j.page, 'crate-1', { dx: 1, dy: 0 })
  await pressPut(j.page)
  await sheet.getByText(/only on this device so far/).waitFor()
  await sheet.getByRole('button', { name: /^Send (it|them) too/ }).click()
  await sheet
    .getByRole('heading', { name: /^Sent|Sent/ })
    .first()
    .waitFor()
  expect(repo.commits.map((c) => c.branch)).toEqual(['automata/kid', 'automata/kid'])
  await sheet.getByRole('button', { name: 'Close' }).first().click()

  // Taking them back brings the suggestion off the game's side; the person keeps their changes.
  await quietButton(j.page).click()
  await sheet.getByRole('button', { name: putWords.takeBack }).click()
  await sheet.getByText(/Taken back/).waitFor()
  expect(repo.pulls.every((p) => p.state !== 'open')).toBe(true)
  expect(repo.branches.get('main')?.get('content/levels/level-1.json')).toBeDefined()
  await thingNamed(j.page, 'crate-1').waitFor()
})

test('the waiting sheet says "Show me on the level" and goes to what was sent', async () => {
  const j = await asKid()
  const sheet = putSheet(j.page)
  await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
  await pressPut(j.page)
  await sheet.getByRole('button', { name: /^Send/ }).click()
  await sheet.getByRole('heading', { name: /^Sent to grandma/ }).waitFor()
  await sheet.getByRole('button', { name: 'Close' }).first().click()
  await quietButton(j.page).click()
  await sheet.getByRole('button', { name: teamWords.showOnLevel }).click()
  await sheet.waitFor({ state: 'detached' })
  await thingNamed(j.page, 'crate-1').waitFor()
})
