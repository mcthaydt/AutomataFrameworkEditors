import { type Level, writeContent } from '@automataframework/framework/headless'
import { afterEach, describe, expect, test } from 'vitest'
import { writeAccess } from '#src/features/access/access.ts'
import { WORDS } from '#src/features/words/words.ts'
import { fixtureFiles, LEVEL_PATH } from '../fixtures/game/read.ts'
import {
  dragByTouch,
  type JourneyPage,
  openLevel,
  openPage,
  pressSave,
  setupJourneys,
  signIn,
  statusLine,
  thingNamed,
} from '../fixtures/journey.ts'

setupJourneys()

let journey: JourneyPage | undefined
afterEach(async () => {
  if (journey !== undefined) expect(await journey.problems()).toEqual([])
  await journey?.close()
  journey = undefined
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
const says = (j: JourneyPage, words: string) =>
  expect.poll(async () => (await statusLine(j.page).textContent())?.trim()).toBe(words)
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
const moveAndSave = async (j: JourneyPage): Promise<void> => {
  await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
  await pressSave(j.page).click()
}

describe('when someone else changed the level first', () => {
  const clash = async (): Promise<JourneyPage> => {
    const j = await asGrandma()
    repoOf(j).put('main', LEVEL_PATH, theirs)
    await moveAndSave(j)
    await text(j, WORDS.changedElsewhere)
    return j
  }

  test('nothing of mine is written over theirs, and the screen says so', async () => {
    const j = await clash()
    expect(repoOf(j).commits).toEqual([])
    expect(repoOf(j).branches.get('main')?.get(LEVEL_PATH)).toBe(theirs)
  })

  test('"Show their version" shows their crate and clears the unsaved change', async () => {
    const j = await clash()
    await j.page.getByRole('button', { name: WORDS.takeTheirs }).click()
    await crateX(j).toBe('10.5')
    await says(j, WORDS.statusClean)
  })

  test('"Keep my change for now" keeps my crate where I put it, and Save says the same again', async () => {
    const j = await clash()
    await j.page.getByRole('button', { name: WORDS.keepMine }).click()
    await crateX(j).toBe('8.5')
    await pressSave(j.page).click()
    await text(j, WORDS.changedElsewhere)
    expect(repoOf(j).commits).toEqual([])
  })
})

test('offline: the offline words; back online, Save works and makes one commit', async () => {
  const j = await asGrandma()
  await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
  await j.page.context().setOffline(true)
  await pressSave(j.page).click()
  await text(j, WORDS.offline)
  await crateX(j).toBe('8.5')
  await j.page.context().setOffline(false)
  await pressSave(j.page).click()
  await says(j, WORDS.savedDirect)
  expect(repoOf(j).commits).toHaveLength(1)
})

test('the token ran out mid-edit: Save still works, and the person never sees a sign-in screen', async () => {
  const j = await asGrandma()
  j.fake.tokensRunOut()
  await moveAndSave(j)
  await says(j, WORDS.savedDirect)
  expect(await j.page.getByRole('button', { name: WORDS.signIn }).count()).toBe(0)
  expect(repoOf(j).commits).toHaveLength(1)
})

test('signed out everywhere: sign in again and my unsaved crate is where I left it', async () => {
  const j = await asGrandma()
  j.fake.signedOutEverywhere()
  await moveAndSave(j)
  await text(j, WORDS.signedOutAgain)
  await signIn(j.page)
  await thingNamed(j.page, 'crate-1').waitFor()
  await text(j, WORDS.draftBack)
  await crateX(j).toBe('8.5')
  await pressSave(j.page).click()
  await says(j, WORDS.savedDirect)
})

test('a reload with an unsaved change brings it back, and says so', async () => {
  const j = await asGrandma()
  await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
  await j.page.reload()
  await text(j, WORDS.draftBack)
  await crateX(j).toBe('8.5')
  await says(j, WORDS.statusDirty)
})

test('a reload after someone else changed the level drops my change, and says so', async () => {
  const j = await asGrandma()
  await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
  repoOf(j).put('main', LEVEL_PATH, theirs)
  await j.page.reload()
  await text(j, WORDS.draftDropped)
  await crateX(j).toBe('10.5')
})

test('Back with an unsaved change asks first; Stay stays; Leave without saving leaves', async () => {
  const j = await asGrandma()
  await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
  await j.page.getByRole('button', { name: WORDS.back }).click()
  await text(j, WORDS.leaveAsk)
  await j.page.getByRole('button', { name: WORDS.leaveNo }).click()
  await thingNamed(j.page, 'crate-1').waitFor()
  await j.page.getByRole('button', { name: WORDS.back }).click()
  await j.page.getByRole('button', { name: WORDS.leaveYes }).click()
  await j.page.getByRole('heading', { level: 1, name: 'Crate Game' }).waitFor()
  expect(repoOf(j).commits).toEqual([])
  // The change that was left is gone for good.
  await j.page.getByRole('link', { name: 'level-1' }).click()
  await crateX(j).toBe('6.5')
})

test('someone who may only look can try a move, never sees Save light up, and nothing is written', async () => {
  const j = await open('ipadUpright', 'kid')
  share(j, 'look')
  await signIn(j.page)
  await openLevel(j.page)
  await text(j, WORDS.lookOnly)
  await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
  await crateX(j).toBe('8.5')
  expect(await pressSave(j.page).isDisabled()).toBe(true)
  expect(repoOf(j).commits).toEqual([])
})

describe('someone who has not signed in', () => {
  const visit = async (): Promise<JourneyPage> => {
    const j = await open('ipadUpright')
    await j.page.goto(`${j.site}/${LEVEL}`)
    await thingNamed(j.page, 'crate-1').waitFor()
    await dragByTouch(j.page, 'crate-1', { dx: 2, dy: 0 })
    await pressSave(j.page).click()
    await text(j, WORDS.signInToSave)
    return j
  }

  test('moves the crate and presses Save: asked to sign in, and the API was never asked to save', async () => {
    const j = await visit()
    expect(j.requests.filter((r) => r.includes('/api/save'))).toEqual([])
    await crateX(j).toBe('8.5')
  })

  test('signs in as grandma: back on the level, the crate is where they put it, and Save puts it in the game', async () => {
    const j = await visit()
    await j.page.getByRole('button', { name: WORDS.signIn }).first().click()
    await text(j, WORDS.draftBack)
    await crateX(j).toBe('8.5')
    await pressSave(j.page).click()
    await says(j, WORDS.savedDirect)
    expect(repoOf(j).commits.map((c) => [c.branch, c.author])).toEqual([['main', 'grandma']])
  })

  test('signs in as kid (everyone = "suggest"): the same, and it waits for approval', async () => {
    const j = await visit()
    share(j, 'suggest')
    j.fake.person = 'kid'
    await j.page.getByRole('button', { name: WORDS.signIn }).first().click()
    await text(j, WORDS.draftBack)
    await pressSave(j.page).click()
    await says(j, WORDS.savedSuggestion)
    expect(repoOf(j).commits.map((c) => c.branch)).toEqual(['automata/kid'])
  })

  test('signs in as stranger (everyone = "look"): the crate is still where they put it, and Save says lookOnly', async () => {
    const j = await visit()
    share(j, 'look')
    j.fake.person = 'stranger'
    await j.page.getByRole('button', { name: WORDS.signIn }).first().click()
    await text(j, WORDS.lookOnly)
    await crateX(j).toBe('8.5')
    expect(await pressSave(j.page).isDisabled()).toBe(true)
  })

  test('cancels on GitHub: back on the level, the crate still where they put it, signInCancelled', async () => {
    const j = await visit()
    j.fake.signIn = 'deny'
    await j.page.getByRole('button', { name: WORDS.signIn }).first().click()
    await text(j, WORDS.signInCancelled)
    await crateX(j).toBe('8.5')
  })
})

test('my level was lowered while I worked: Save says lookOnly and my crate stays on screen', async () => {
  const j = await open('ipadUpright', 'kid')
  share(j, 'suggest')
  await signIn(j.page)
  await openLevel(j.page)
  share(j, 'look')
  await moveAndSave(j)
  await text(j, WORDS.lookOnly)
  await crateX(j).toBe('8.5')
  expect(repoOf(j).commits).toEqual([])
})

test('a rule on GitHub blocks the editor: blockedOwner, and my crate stays on screen', async () => {
  const j = await asGrandma()
  repoOf(j).rule = 'blocks-app'
  await moveAndSave(j)
  await text(j, WORDS.blockedOwner)
  await crateX(j).toBe('8.5')
})
