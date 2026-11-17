// "What changed": an Owner puts a change in, and "See what changed" on the sheet that says it went lists it first;
// "Show me" opens the level it touched; "Show more" brings the next ten.
import { afterEach, describe, expect, test } from 'vitest'
import { nextSha } from '../fixtures/fake-github/repos.ts'
import { LEVEL_PATH } from '../fixtures/game/read.ts'
import {
  type JourneyPage,
  openGame,
  openPage,
  putButton,
  putSheet,
  putWords,
  type SIZES,
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

/** Twelve older saved changes to the start level, so one page of ten is not all there is. */
function earlier(j: JourneyPage, count: number): void {
  const repo = j.fake.repos.get('grandma/crate-game')!
  const t0 = Date.UTC(2026, 10, 1, 9, 0, 0)
  for (let i = 0; i < count; i++) {
    const sha = nextSha(`journey-history:${i}`)
    repo.commits.push({
      sha,
      branch: 'main',
      message: `Earlier change ${i}`,
      path: LEVEL_PATH,
      text: '{}\n',
      author: i % 2 === 0 ? 'grandma' : 'grandpa',
      files: [{ path: LEVEL_PATH, text: '{}\n' }],
    })
    repo.commitDates.set(sha, t0 + i * 60_000)
  }
}

describe.each(['ipadUpright', 'phone'] as const satisfies readonly (keyof typeof SIZES)[])(
  'at %s',
  (size) => {
    test('an Owner puts a change in and sees it first in what changed, then looks at it and asks for more', async () => {
      journey = await openPage(size)
      const { page } = journey
      earlier(journey, 12)
      await signIn(page)
      await openGame(page)
      await thingNamed(page, 'crate-1').focus()
      for (let step = 0; step < 2; step += 1) await page.keyboard.press('ArrowRight')
      await putButton(page).click()
      const sheet = putSheet(page)
      await sheet.getByRole('button', { name: /^Put them in/ }).click()
      await sheet.getByRole('heading', { name: putWords.doneTitle }).waitFor()

      // "See what changed" is on the sheet that says it went, and it opens the list.
      await sheet.getByRole('button', { name: teamWords.seeWhatChanged }).click()
      await page.getByRole('heading', { name: teamWords.historyTitle }).waitFor()
      const rows = page
        .getByRole('listitem')
        .filter({ has: page.getByRole('button', { name: teamWords.historyShow }) })
      await rows.first().waitFor()
      // Ten to a page: the new change and nine of the earlier ones.
      expect(await rows.count()).toBe(10)
      expect(await rows.first().innerText()).toContain('grandma')

      // "Show more" brings the next ten (here, the last three).
      await page.getByRole('button', { name: teamWords.historyMore }).click()
      await page.waitForFunction((n) => document.querySelectorAll('li').length >= n, 13)
      expect(await rows.count()).toBe(13)

      // "Show me" opens the level the change touched, with the sheet shut.
      await rows.first().getByRole('button', { name: teamWords.historyShow }).click()
      await page.getByRole('heading', { name: teamWords.historyTitle }).waitFor({ state: 'detached' })
      await thingNamed(page, 'crate-1').waitFor()
    })
  },
)
