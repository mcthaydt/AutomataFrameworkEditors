// A problem in the game, said in the top bar: a wall made on the map reads "1 problem"; "Show me" opens the map at it; mending
// it takes the count away; and a game set to stop refuses to put changes in while one is left, and says why.
import type { Page } from 'playwright'
import { afterEach, expect, test } from 'vitest'
import { EDITORS_FILE, writeEditors } from '#src/features/files/editors-file.ts'
import {
  type JourneyPage,
  openGame,
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

async function openMap(page: Page): Promise<void> {
  await signIn(page)
  await openGame(page, 'links-game')
  await page.locator('[data-thing="exit"]').waitFor()
  await page.getByRole('button', { name: 'Map', exact: true }).click()
  await page.locator('[data-level]').first().waitFor()
}

/** Pushes Room 1 against Room 2 so they meet at a wall, the way the map journey does. */
async function makeWall(page: Page): Promise<void> {
  const scale = Number(await page.locator('[data-scale]').first().getAttribute('data-scale'))
  const box = await page.locator('[data-level="room-1"]').boundingBox()
  if (box === null) throw new Error('no Room 1 on the map')
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + (3.4 * scale) / 2, y + (0.2 * scale) / 2, { steps: 4 })
  await page.mouse.move(x + 3.4 * scale, y + 0.2 * scale, { steps: 4 })
  await page.mouse.up()
  await page.locator('[data-way="clear"]').waitFor()
}

test('a wall made on the map is a problem: counted, shown on the map, and gone once mended', async () => {
  journey = await openPage('computer')
  const { page } = journey
  await openMap(page)
  await makeWall(page)
  const count = page.getByRole('button', { name: '1 problem' })
  await count.waitFor()

  await count.click()
  await page.getByRole('button', { name: putWords.showMe }).first().click()
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
  await openMap(page)
  await makeWall(page)
  await page.getByRole('button', { name: '1 problem' }).waitFor()

  await putButton(page).click()
  const sheet = putSheet(page)
  await sheet.getByText(/every problem to be fixed/).waitFor()
  expect(await sheet.getByRole('button', { name: /^Put them in/ }).isDisabled()).toBe(true)
  expect(fake.repos.get('grandma/links-game')!.commits).toEqual([])
})
