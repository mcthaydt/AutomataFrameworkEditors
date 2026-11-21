import { type Level, writeContent } from '@automataframework/framework/headless'
import { afterEach, describe, expect, test } from 'vitest'
import { writeAccess } from '#src/features/access/access.ts'
import { WORDS, wordsIn } from '#src/features/words/words.ts'
import { fixtureFiles, LEVEL_PATH } from '../fixtures/game/read.ts'
import {
  chooseFromMenu,
  dragByTouch,
  gamesWords,
  type JourneyPage,
  menuWords,
  openLevel,
  openPage,
  pressPut,
  putButton,
  putButtonSaying,
  putSheet,
  putThemIn,
  putWords,
  setupJourneys,
  signIn,
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
const open = async (...args: Parameters<typeof openPage>): Promise<JourneyPage> => {
  journey = await openPage(...args)
  return journey
}
const repoOf = (j: JourneyPage) => j.fake.repos.get('grandma/crate-game')!
const level1 = JSON.parse(fixtureFiles[LEVEL_PATH] ?? '') as Level
const crateAt = (x: number): Level => ({
  ...level1,
  things: level1.things.map((t) => (t.id === 'crate-1' ? { ...t, x } : t)),
})
const theirs = writeContent('level', crateAt(10.5) as never)
const _says = (j: JourneyPage, words: string) => j.page.getByText(words, { exact: false }).first().waitFor()
/** The main button offers a copy and not a save: what a person who may not save is shown once something changed. */
const offersCopy = (j: JourneyPage) => putButtonSaying(j.page, KEEP).waitFor()
const KEEP = String(wordsIn('en').bar.keepCopy)
const text = (j: JourneyPage, words: string) => j.page.getByText(words, { exact: false }).first().waitFor()
const crateX = (j: JourneyPage) => expect.poll(() => thingNamed(j.page, 'crate-1').getAttribute('data-x'))
const LEVEL = '#/game/grandma/crate-game/level/level-1'
const share = (j: JourneyPage, everyone: 'look' | 'suggest') =>
  repoOf(j).put('main', 'automata.access.toml', writeAccess({ format: 1, everyone, people: [] }))
const asGrandma = async (): Promise<JourneyPage> => {
  const j = await open('ipadUpright')
  await signIn(j.page)
  await openLevel(j.page)
  return j
}
/** Moves the crate, presses the main button, then the sheet's own "Put them in": it does not wait to hear how that went. */
const moveAndPut = async (j: JourneyPage): Promise<void> => {
  await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
  await pressPut(j.page)
  await putSheet(j.page)
    .getByRole('button', { name: /^(Put them in|Send)/ })
    .click()
}

describe('when someone else changed the level first', () => {
  const clash = async (): Promise<JourneyPage> => {
    const j = await asGrandma()
    repoOf(j).put('main', LEVEL_PATH, theirs)
    await moveAndPut(j)
    await putSheet(j.page)
      .getByText(/^You (moved|changed) Crate 1/)
      .waitFor()
    return j
  }

  test('nothing of mine is written over theirs, and the sheet asks whose to keep', async () => {
    const j = await clash()
    expect(repoOf(j).commits).toEqual([])
    expect(repoOf(j).branches.get('main')?.get(LEVEL_PATH)).toBe(theirs)
    // Nothing goes in until the clash has an answer.
    const sheet = putSheet(j.page)
    expect(await sheet.getByRole('button', { name: /^Put them in/ }).isDisabled()).toBe(true)
    await sheet.getByRole('button', { name: 'Keep mine' }).waitFor()
    expect(await sheet.getByText(/came in from the game/).count()).toBe(0)
  })

  test("keeping the other's leaves nothing of mine to put in, and Close ends it", async () => {
    const j = await clash()
    const sheet = putSheet(j.page)
    await sheet.getByRole('button', { name: /^Keep .*’s$/ }).click()
    await sheet.getByText(/Nothing of yours is left/).waitFor()
    expect(await sheet.getByRole('button', { name: /^Put them in/ }).count()).toBe(0)
    await sheet.getByRole('button', { name: 'Close' }).first().click()
    await crateX(j).toBe('10.5')
    expect(repoOf(j).commits).toEqual([])
  })

  test('keeping mine puts my crate in, over theirs', async () => {
    const j = await clash()
    const sheet = putSheet(j.page)
    await sheet.getByRole('button', { name: 'Keep mine' }).click()
    await sheet.getByRole('button', { name: /^Put them in/ }).click()
    await sheet.getByRole('heading', { name: putWords.doneTitle, exact: true }).waitFor()
    await crateX(j).toBe('8.5')
    expect(repoOf(j).commits).toHaveLength(1)
  })
})

test('offline: the sheet says so and keeps the change; back online, Try again makes one commit', async () => {
  const j = await asGrandma()
  await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
  await pressPut(j.page)
  await j.page.context().setOffline(true)
  await putSheet(j.page)
    .getByRole('button', { name: /^(Put them in|Send)/ })
    .click()
  await putSheet(j.page)
    .getByText(/no internet/)
    .waitFor()
  await crateX(j).toBe('8.5')
  await j.page.context().setOffline(false)
  await putSheet(j.page).getByRole('button', { name: putWords.again }).click()
  await putSheet(j.page).getByRole('heading', { name: putWords.doneTitle, exact: true }).waitFor()
  expect(repoOf(j).commits).toHaveLength(1)
})

test('the token ran out mid-edit: putting them in still works, and the person never sees a sign-in screen', async () => {
  const j = await asGrandma()
  j.fake.tokensRunOut()
  await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
  await putThemIn(j.page)
  expect(await j.page.getByRole('button', { name: WORDS.signIn }).count()).toBe(0)
  expect(repoOf(j).commits).toHaveLength(1)
})

test('signed out everywhere: sign in again and my unsaved crate is where I left it', async () => {
  const j = await asGrandma()
  j.fake.signedOutEverywhere()
  await moveAndPut(j)
  await text(j, WORDS.signedOutAgain)
  await signIn(j.page)
  await thingNamed(j.page, 'crate-1').waitFor()
  await text(j, WORDS.draftBack)
  await crateX(j).toBe('8.5')
  await putThemIn(j.page)
})

test('a reload with an unsaved change brings it back, and says so', async () => {
  const j = await asGrandma()
  await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
  await j.page.reload()
  await text(j, WORDS.draftBack)
  await crateX(j).toBe('8.5')
  await putButton(j.page).waitFor()
})

test('a reload after someone else changed the level drops my change, and says so', async () => {
  const j = await asGrandma()
  await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
  repoOf(j).put('main', LEVEL_PATH, theirs)
  await j.page.reload()
  await text(j, WORDS.draftDropped)
  await crateX(j).toBe('10.5')
})

test('Leaving with an unsaved change asks first; Stay stays; Leave without saving leaves', async () => {
  const j = await asGrandma()
  await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
  await chooseFromMenu(j.page, menuWords.yourGames)
  await text(j, WORDS.leaveAsk)
  await j.page.getByRole('button', { name: WORDS.leaveNo }).click()
  await thingNamed(j.page, 'crate-1').waitFor()
  await chooseFromMenu(j.page, menuWords.yourGames)
  await j.page.getByRole('button', { name: WORDS.leaveYes }).click()
  await j.page.getByRole('heading', { level: 1, name: gamesWords.title }).waitFor()
  expect(repoOf(j).commits).toEqual([])
  // The change that was left is gone for good.
  await j.page.getByRole('link', { name: 'crate-game' }).click()
  await thingNamed(j.page, 'crate-1').waitFor()
  await crateX(j).toBe('6.5')
})

test('someone who may only look can try a move, is offered a copy and not a save, and nothing is written', async () => {
  const j = await open('ipadUpright', 'kid')
  share(j, 'look')
  await signIn(j.page)
  await openLevel(j.page)
  await text(j, WORDS.lookOnly)
  await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
  await crateX(j).toBe('8.5')
  await offersCopy(j)
  expect(repoOf(j).commits).toEqual([])
})

describe('someone who has not signed in', () => {
  const visit = async (): Promise<JourneyPage> => {
    const j = await open('ipadUpright')
    await j.page.goto(`${j.site}/${LEVEL}`)
    await thingNamed(j.page, 'crate-1').waitFor()
    await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
    await offersCopy(j)
    return j
  }

  test('moves the crate: offered a copy to keep, and the API was never asked to save', async () => {
    const j = await visit()
    await pressPut(j.page)
    await putSheet(j.page).getByRole('heading', { name: putWords.keepTitle }).waitFor()
    expect(j.requests.filter((r) => r.includes('/api/put'))).toEqual([])
    await crateX(j).toBe('8.5')
  })

  test('signs in as grandma: back on the level, the crate is where they put it, and the main button puts it in the game', async () => {
    const j = await visit()
    await signIn(j.page)
    await text(j, WORDS.draftBack)
    await crateX(j).toBe('8.5')
    await putThemIn(j.page)
    expect(repoOf(j).commits.map((c) => [c.branch, c.author])).toEqual([['main', 'grandma']])
  })

  test('signs in as kid (everyone = "suggest"): the same, and it waits for approval', async () => {
    const j = await visit()
    share(j, 'suggest')
    j.fake.person = 'kid'
    await signIn(j.page)
    await text(j, WORDS.draftBack)
    await putThemIn(j.page, 'suggestion')
    expect(repoOf(j).commits.map((c) => c.branch)).toEqual(['automata/kid'])
  })

  test('signs in as stranger (everyone = "look"): the crate is still where they put it, and only a copy is offered', async () => {
    const j = await visit()
    share(j, 'look')
    j.fake.person = 'stranger'
    await signIn(j.page)
    await text(j, WORDS.lookOnly)
    await crateX(j).toBe('8.5')
    await offersCopy(j)
  })

  test('cancels on GitHub: back on the level, the crate still where they put it, signInCancelled', async () => {
    const j = await visit()
    j.fake.signIn = 'deny'
    await chooseFromMenu(j.page, menuWords.signIn)
    await text(j, WORDS.signInCancelled)
    await crateX(j).toBe('8.5')
  })
})

test('my level was lowered while I worked: the sheet says so, keeps my crate, and offers a copy', async () => {
  const j = await open('ipadUpright', 'kid')
  share(j, 'suggest')
  await signIn(j.page)
  await openLevel(j.page)
  share(j, 'look')
  await moveAndPut(j)
  await putSheet(j.page)
    .getByText(/you can look at this game/i)
    .waitFor()
  await crateX(j).toBe('8.5')
  expect(repoOf(j).commits).toEqual([])
  // The words say "keep a copy instead": the sheet offers it, and it opens (design round 1, R17).
  await putSheet(j.page).getByRole('button', { name: KEEP, exact: true }).click()
  await j.page.getByRole('heading', { name: String(wordsIn('en').kept.keepTitle), exact: true }).waitFor()
})

test('a rule on GitHub blocks the editor: the sheet says so, and my crate stays on screen', async () => {
  const j = await asGrandma()
  repoOf(j).rule = 'blocks-app'
  await moveAndPut(j)
  await putSheet(j.page)
    .getByText(/GitHub is set to stop the editor/)
    .waitFor()
  await crateX(j).toBe('8.5')
  // Trying again cannot work until the owner changes the rule: Close is the main button, and the words say who to ask
  // (design round 1, R17).
  const sheet = putSheet(j.page)
  expect(await sheet.getByRole('button', { name: String(wordsIn('en').changes.again) }).count()).toBe(0)
  await sheet.locator('.action.main', { hasText: String(wordsIn('en').shell.close) }).waitFor()
  await sheet
    .getByText(/grandma/)
    .first()
    .waitFor()
})
