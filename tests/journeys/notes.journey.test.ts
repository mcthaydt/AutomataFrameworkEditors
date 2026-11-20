// Notes: a Look person pins a note on the crate; the Owner, whose page is already open, sees it on the next read, answers
// and marks it done; the first sees the answer, then the note is gone from the level until "Show done notes" brings it
// back. Nothing goes into the game's own branch.
import { afterEach, describe, expect, test } from 'vitest'
import { writeAccess } from '#src/features/access/access.ts'
import {
  chooseFromMenu,
  type JourneyPage,
  menuWords,
  noteWords,
  openLevel,
  openPage,
  type SIZES,
  setupJourneys,
  signIn,
  teamWords,
  thingNamed,
} from '../fixtures/journey.ts'

setupJourneys()

const windows: JourneyPage[] = []
afterEach(async () => {
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

/** Someone's window on the level, signed in; `keep` keeps the pretend GitHub as the others left it. */
async function window_(size: Size, person: Person, keep: boolean): Promise<JourneyPage> {
  const j = await openPage(size, person, keep)
  windows.push(j)
  await signIn(j.page)
  await openLevel(j.page)
  return j
}
const repoOf = (j: JourneyPage) => j.fake.repos.get('grandma/crate-game')!
const NOTE_WORDS = 'This crate is too heavy'
const ANSWER = 'I made it lighter'
const pin = (j: JourneyPage) => j.page.locator('[data-note]')
/** The page coming back into view: the notes are read again. */
const reread = (j: JourneyPage) =>
  j.page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
const mainCommits = (j: JourneyPage) => repoOf(j).commits.filter((c) => c.branch === 'main').length

describe.each(['ipadUpright', 'phone'] as const)('at %s', (size) => {
  test('a Look person pins a note on the crate; the Owner sees it, answers and marks it done; it comes back with Show done notes', async () => {
    const owner = await window_(size, 'grandma', false)
    repoOf(owner).put(
      'main',
      'automata.access.toml',
      writeAccess({ format: 1, everyone: 'look', people: [{ github: 'grandma', level: 'owner' }] }),
    )
    const before = mainCommits(owner)

    // Kid, who may only look, pins a note on the crate: pick it, "More", "Add a note", write it, pin it.
    const kid = await window_(size, 'kid', true)
    await thingNamed(kid.page, 'crate-1').click()
    await kid.page.getByRole('button', { name: 'More', exact: true }).click()
    await kid.page.getByRole('menuitem', { name: noteWords.menuRow }).click()
    const sheet = kid.page.getByRole('dialog')
    await sheet.getByRole('heading', { name: noteWords.add }).waitFor()
    await sheet.getByLabel(noteWords.write).fill(NOTE_WORDS)
    await sheet.getByRole('button', { name: noteWords.pin }).click()
    await pin(kid).waitFor()
    expect(await pin(kid).getAttribute('aria-label')).toBe(noteWords.pinName('kid', NOTE_WORDS))

    // The Owner's page is already open: no reload, the next read brings the pin.
    expect(await pin(owner).count()).toBe(0)
    await reread(owner)
    await pin(owner).waitFor()
    await pin(owner).click()
    const card = owner.page.getByRole('dialog')
    await card.getByText(NOTE_WORDS).waitFor()
    await card.getByLabel(noteWords.answerBox).fill(ANSWER)
    await card.getByRole('button', { name: noteWords.send }).click()
    await card.getByText(ANSWER).waitFor()

    // Kid reads again and sees the answer on the note.
    await reread(kid)
    await pin(kid).click()
    await kid.page.getByRole('dialog').getByText(ANSWER).waitFor()
    await kid.page.getByRole('button', { name: 'Close' }).click()

    // The Owner marks it done: it leaves the level for both, and nothing went into the game itself.
    await card.getByRole('button', { name: noteWords.done }).click()
    await pin(owner).waitFor({ state: 'detached' })
    await reread(kid)
    await pin(kid).waitFor({ state: 'detached' })
    expect(mainCommits(owner)).toBe(before)

    // "Show done notes" brings it back, faint, and the card offers to show it again.
    await owner.page.getByRole('button', { name: /^Show/ }).first().click()
    await owner.page.getByRole('switch', { name: noteWords.showDone }).click()
    await pin(owner).waitFor()
    await owner.page.getByRole('button', { name: /^Show/ }).first().click()
    await owner.page.getByRole('dialog', { name: 'Show' }).waitFor({ state: 'detached' })
    await pin(owner).click()
    await owner.page.getByRole('dialog').getByRole('button', { name: noteWords.notDone }).waitFor()
  })

  test('"Ask the owner" in who can change it opens a note that starts with a greeting', async () => {
    const owner = await window_(size, 'grandma', false)
    repoOf(owner).put(
      'main',
      'automata.access.toml',
      writeAccess({ format: 1, everyone: 'look', people: [{ github: 'grandma', level: 'owner' }] }),
    )
    const kid = await window_(size, 'kid', true)
    await chooseFromMenu(kid.page, menuWords.whoCanChange)
    await kid.page.getByRole('heading', { name: teamWords.peopleTitle }).waitFor()
    await kid.page.getByRole('button', { name: /^Ask / }).click()
    const sheet = kid.page.getByRole('dialog')
    await sheet.getByRole('heading', { name: noteWords.add }).waitFor()
    expect(await sheet.getByLabel(noteWords.write).inputValue()).toBe(noteWords.askStart('grandma'))
  })
})
