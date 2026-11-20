// Play on the World screen, in each real browser: Play starts the game in the level's box, the panels go quiet, Bigger and
// Smaller put them away and back, Stop and Escape end it, and the tip about what Play leaves out is shown once.
import { mount, tick, unmount } from 'svelte'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import type { Api } from '#src/features/api/api.ts'
import { ME_DEFAULT } from '#src/features/device/device.ts'
import { inLevel, keepDrafts, type OpenGame, startEdits } from '#src/features/game/game.ts'
import World from '#src/features/world/World.svelte'
import { bytesToBase64 } from '#src/lib/base64.ts'
import { groundPicture } from '../../fixtures/game/ground-picture.ts'
import { fixtureFiles } from '../../fixtures/game/read.ts'
import { linksFiles } from '../../fixtures/links-game/links.ts'
import { openedGameWith } from '../../fixtures/open-game-with.ts'
import { memoryStore } from '../../fixtures/store.ts'

const FILL = 'position:fixed;left:0;top:0;width:100%;height:100%;display:flex;flex-direction:column'
const pictures = [{ path: 'art/ground.png', base64: bytesToBase64(groundPicture()) }]
const game = await openedGameWith((text) => `v${text.length}`, fixtureFiles, { pictures })
const links = await openedGameWith((text) => `v${text.length}`, linksFiles())

let box: HTMLDivElement
let mounted: ReturnType<typeof mount> | undefined
let remembered: Storage
let drafts: Storage

async function open(opened: OpenGame = game): Promise<void> {
  mounted = mount(World, {
    target: box,
    props: {
      game: opened,
      api: {} as unknown as Api,
      route: { screen: 'level', owner: opened.ref.owner, name: opened.ref.name },
      me: ME_DEFAULT,
      go: () => {},
      drafts,
      remembered,
      savedBefore: false,
      onsignin: () => {},
      onsignout: () => {},
      onsignedout: () => {},
      onreload: () => {},
      onsaved: () => {},
      onme: () => {},
    },
  })
  await tick()
  await vi.waitFor(() => expect(box.querySelector('[data-thing]')).not.toBeNull(), { timeout: 15_000 })
}
beforeEach(async () => {
  box = document.createElement('div')
  box.style.cssText = FILL
  document.body.append(box)
  remembered = memoryStore()
  // The first run is done, so no welcome stands over the level.
  remembered.setItem('af.guide.done', '1')
  // The tip about what Play leaves out is done too, except in the tests about it.
  remembered.setItem('af.tip.play-code', '1')
  drafts = memoryStore()
})
afterEach(() => {
  if (mounted) void unmount(mounted)
  mounted = undefined
  box.remove()
})

const bar = (word: string): HTMLButtonElement => {
  const found = [...box.querySelectorAll('button')].find((b) => b.textContent?.trim() === word)
  if (found === undefined) throw new Error(`no "${word}" button`)
  return found
}
const has = (word: string): boolean =>
  [...box.querySelectorAll('button')].some((b) => b.textContent?.trim() === word)
const playBox = (): HTMLElement | null => box.querySelector('[data-play="box"]')
const press = async (word: string): Promise<void> => {
  bar(word).click()
  await tick()
}
// The first game a browser starts compiles its graphics first, which in WebKit on a busy runner takes longer than the
// default second: wait for the game to be there, not for a fixed time.
const started = (): Promise<void> =>
  vi.waitFor(() => expect(playBox()?.querySelector('canvas')).not.toBeNull(), { timeout: 15_000 })
const marksHidden = (): boolean => {
  const mark = box.querySelector<HTMLElement>('[data-thing]')
  return mark !== null && getComputedStyle(mark).visibility === 'hidden'
}

test('Play puts the game in the level box, the marks hide, and Stop brings them back', async () => {
  await open()
  expect(marksHidden()).toBe(false)
  await press('Play')
  await started()
  expect(marksHidden()).toBe(true)
  expect(has('Stop')).toBe(true)
  expect(has('Pause')).toBe(true)
  expect(has('Start again')).toBe(true)

  await press('Stop')
  expect(playBox()).toBeNull()
  expect(marksHidden()).toBe(false)
  expect(has('Play')).toBe(true)
})

test('the panels stay and go quiet; Bigger puts them away and Smaller brings them back', async () => {
  await open()
  const dock = (): HTMLElement | null => box.querySelector('[data-panels]')
  expect(dock()?.inert).toBe(false)
  await press('Play')
  await started()
  expect(dock()?.inert).toBe(true)

  await press('Bigger')
  expect(dock()).toBeNull()
  expect(has('Smaller')).toBe(true)
  await press('Smaller')
  expect(dock()).not.toBeNull()
})

test('Space starts the game', async () => {
  await open()
  window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
  await started()
  expect(has('Stop')).toBe(true)
})

test('Escape stops the game, and a key while it plays is not a key of the editor', async () => {
  await open()
  await press('Play')
  await started()
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }))
  await tick()
  expect(playBox()).not.toBeNull()
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  await tick()
  expect(playBox()).toBeNull()
})

test('the tip about what Play leaves out is shown the first time and never again', async () => {
  remembered.removeItem('af.tip.play-code')
  await open()
  const tip = 'Rules the game'
  expect(box.textContent).not.toContain(tip)
  await press('Play')
  await started()
  await vi.waitFor(() => expect(box.textContent).toContain(tip))
  expect(remembered.getItem('af.tip.play-code')).not.toBeNull()
  await press('Got it')
  await press('Stop')
  await press('Play')
  await started()
  expect(box.textContent).not.toContain(tip)
})

test('the game waits while the tip shows and goes on at Got it', async () => {
  remembered.removeItem('af.tip.play-code')
  await open()
  await press('Play')
  await started()
  const tip = 'Rules the game'
  await vi.waitFor(() => expect(box.textContent).toContain(tip))
  await vi.waitFor(() => expect(has('Go on')).toBe(true))
  await press('Got it')
  await vi.waitFor(() => expect(has('Pause')).toBe(true))
})

test('a person who goes on and pauses while the tip shows keeps it paused after Got it', async () => {
  remembered.removeItem('af.tip.play-code')
  await open()
  await press('Play')
  await started()
  await vi.waitFor(() => expect(has('Go on')).toBe(true))
  await press('Go on')
  await press('Pause')
  expect(has('Go on')).toBe(true)
  await press('Got it')
  await vi.waitFor(() => expect(box.textContent).not.toContain('Rules the game'))
  await tick()
  expect(has('Go on')).toBe(true)
})

test('a Play that fails does not use the tip up and shows only the problem', async () => {
  remembered.removeItem('af.tip.play-code')
  const hurt = inLevel(startEdits(game), 'level-1', (level) => ({
    ...level,
    tileset: 'nowhere',
  }))
  keepDrafts(drafts, game, hurt)
  await open()
  await press('Play')
  await vi.waitFor(() => expect(box.textContent).toContain("This level can't be played yet"))
  expect(box.textContent).not.toContain('Rules the game')
  expect(remembered.getItem('af.tip.play-code')).toBeNull()
})

test('Play changes nothing: no change is kept on the device', async () => {
  await open()
  await press('Play')
  await started()
  await press('Stop')
  expect(drafts.length).toBe(0)
})

test('a level that cannot be built is not started: the first sentence says what is wrong, and the marks stay', async () => {
  const hurt = inLevel(startEdits(game), 'level-1', (level) => ({
    ...level,
    tileset: 'nowhere',
  }))
  keepDrafts(drafts, game, hurt)
  await open()
  await press('Play')
  await vi.waitFor(() => expect(box.textContent).toContain("This level can't be played yet"))
  // Only the framework's plain sentence: no file name, no place in the file.
  expect(box.textContent).toContain('nowhere')
  expect(box.textContent).not.toContain('.json')
  expect(box.textContent).not.toContain('[0]')
  expect(playBox()).toBeNull()
  expect(marksHidden()).toBe(false)
  expect(has('Play')).toBe(true)
})

test('a door into a level that is gone is not played: the sentence names the missing level', async () => {
  const start = startEdits(links)
  const { 'room-2': _gone, ...rest } = start.now.levels
  const world = start.now.world
  const gone = {
    ...start,
    now: {
      ...start.now,
      levels: rest,
      world: world && { ...world, levels: world.levels.filter((one) => one.level !== 'room-2') },
    },
  }
  keepDrafts(drafts, links, gone)
  await open(links)
  await press('Play')
  await vi.waitFor(() => expect(box.textContent).toContain("This level can't be played yet"))
  expect(box.textContent).toContain('There is no level called "room-2"')
  expect(box.textContent).not.toContain('.json')
  expect(playBox()).toBeNull()
  expect(has('Play')).toBe(true)
})

test('Space on a focused button presses that button and does not start the game', async () => {
  await open()
  const tool = [...box.querySelectorAll<HTMLButtonElement>('[data-panels] button[aria-pressed]')].find(
    (one) => one.getAttribute('aria-pressed') === 'false',
  )
  if (tool === undefined) throw new Error('no tool button to press')
  tool.focus()
  await userEvent.keyboard(' ')
  await tick()
  expect(tool.getAttribute('aria-pressed')).toBe('true')
  expect(playBox()).toBeNull()
})
