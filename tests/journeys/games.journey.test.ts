// The list of games opens a game for its picture only when its row comes into view, and never more than two at once.
import { afterEach, expect, test } from 'vitest'
import { fixtureBytes, fixtureMap } from '../fixtures/game/read.ts'
import { gamesWords, type JourneyPage, openPage, setupJourneys, signIn } from '../fixtures/journey.ts'

setupJourneys()

let journey: JourneyPage | undefined
afterEach(async () => {
  const found = (await journey?.problems()) ?? []
  await journey?.close()
  journey = undefined
  expect(found).toEqual([])
})

const TWENTY = Array.from({ length: 20 }, (_, i) => `game-${String(i + 1).padStart(2, '0')}`)

test('twenty games: a game is opened for its picture only when its row is on screen, two at a time at most', async () => {
  journey = await openPage('phone')
  const { page, fake } = journey
  for (const name of TWENTY) fake.addGame('grandma', name, fixtureMap(), { ...fixtureBytes() })

  // How many opens are going on at once, and which games were opened.
  let going = 0
  let most = 0
  const opened = new Set<string>()
  const isOpen = (url: string): boolean => new URL(url).pathname === '/api/game'
  page.on('request', (request) => {
    if (!isOpen(request.url())) return
    going += 1
    most = Math.max(most, going)
    const name = new URL(request.url()).searchParams.get('name')
    if (name !== null) opened.add(name)
  })
  const done = (request: { url(): string }): void => {
    if (isOpen(request.url())) going -= 1
  }
  page.on('requestfinished', done)
  page.on('requestfailed', done)

  await signIn(page)
  await page.getByRole('heading', { level: 1, name: gamesWords.title }).waitFor()
  // The first rows get their pictures.
  await page.locator('.thumb img').first().waitFor()
  const first = opened.size
  expect(first).toBeGreaterThan(0)
  // Not all of them: the rows below the screen have not been looked at.
  expect(first).toBeLessThan(TWENTY.length)
  expect(opened.has('game-20')).toBe(false)

  // Scrolling to the last row opens that game too.
  await page.getByRole('link', { name: 'game-20' }).scrollIntoViewIfNeeded()
  await page.locator('a.row', { hasText: 'game-20' }).locator('img').waitFor()
  expect(opened.has('game-20')).toBe(true)
  expect(most).toBeLessThanOrEqual(2)
  expect(most).toBeGreaterThan(0)
})
