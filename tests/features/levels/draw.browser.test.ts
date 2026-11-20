// What a thing is drawn behind or in front of, in each real browser: a front crate is over the hero's start, a back one is
// under the ground, and the same level in Play shows the same colours at the same places.
import type { Frames } from '@automataframework/framework'
import { type GameContent, type Level, loadGame } from '@automataframework/framework/headless'
import { mount, tick, unmount } from 'svelte'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { inLevel, startEdits } from '#src/features/game/game.ts'
import { setDraw } from '#src/features/levels/draw.ts'
import { createStage, type Look, type Stage } from '#src/features/levels/level-canvas.ts'
import ThingMenu from '#src/features/levels/ThingMenu.svelte'
import { type Camera, toScreen } from '#src/features/levels/view.ts'
import { type Playing, play } from '#src/features/play/play.ts'
import { bytesToBase64 } from '#src/lib/base64.ts'
import { groundPicture } from '../../fixtures/game/ground-picture.ts'
import { fixtureFiles, readFrom } from '../../fixtures/game/read.ts'
import { linksMap } from '../../fixtures/links-game/read.ts'
import { openedGameWith } from '../../fixtures/open-game-with.ts'
import SettingsHolder from './SettingsHolder.svelte'

const pictures = [{ path: 'art/ground.png', base64: bytesToBase64(groundPicture()) }]
const game = await openedGameWith((text) => `v${text.length}`, fixtureFiles, { pictures })
const content: GameContent = game.content

// The same game with a figure for the crate: one solid square of its own colour, so a thing drawn from a picture is told
// from a coloured box.
const FIGURE_COLOUR = '#112233'
const figureFiles: Record<string, string> = {
  ...fixtureFiles,
  'automata.toml': `${fixtureFiles['automata.toml']}\n[[content]]\ntype = "figure"\npath = "content/figures/box.json"\n`,
  'content/figures/box.json': JSON.stringify({
    format: 1,
    id: 'box',
    tile: 16,
    frame: { w: 16, h: 16 },
    paints: [{ id: 'body', color: FIGURE_COLOUR }],
    parts: [{ id: 'all', shape: 'block', x: 8, y: 8, w: 16, h: 16, paint: 'body' }],
    poses: [{ id: 'idle', moves: [] }],
  }),
  'content/characters/crate.json': JSON.stringify({
    ...JSON.parse(fixtureFiles['content/characters/crate.json'] ?? '{}'),
    figure: 'box',
  }),
}
const figureGame = await openedGameWith((text) => `v${text.length}`, figureFiles, { pictures })
const plain: Look = { faint: new Set(), hidden: new Set(), whatItIs: false, grid: 'off' }

const SCREEN = { w: 480, h: 270 }
// The level is 16 by 9 tiles in a 480 by 270 box: 30 pixels to a tile, no bars, in the level view and in Play.
const WHOLE: Camera = { x: 8, y: 4.5, scale: 30 }
const START = { x: 2.5, y: 7.5 }
const FLOOR = { x: 1.5, y: 8.5 }
const SKY = '#9fd3f0'
const CRATE = '#c9a227'
// The tileset's picture is cut on its own time, and a loaded CI machine took over a second to do it (the default bound of a
// wait): wait for it as long as the other readiness waits in this suite do, not a moment less.
const READY = { timeout: 15_000 }

/** The fixture level with its crate put at `where` and drawn `how`. */
function crateAt(where: { x: number; y: number }, how: 'behind' | 'with-hero' | 'in-front'): Level {
  const start = (startEdits(game).now.levels['level-1'] as Level).things.map((t) => ({ ...t, ...where }))
  const done = setDraw(
    { ...(startEdits(game).now.levels['level-1'] as Level), things: start },
    ['crate-1'],
    how,
  )
  if (!done.ok && done.why !== 'same') throw new Error('draw not set')
  return done.ok ? done.value : { ...(startEdits(game).now.levels['level-1'] as Level), things: start }
}

let made: Stage | undefined
let box: HTMLDivElement | undefined
let playing: Playing | undefined
afterEach(() => {
  playing?.stop()
  playing = undefined
  made?.destroy()
  box?.remove()
  made = undefined
  box = undefined
})

/** Takes the level view away, so the next one starts clean. */
function dropStage(): void {
  made?.destroy()
  made = undefined
}

function mountBox(): HTMLDivElement {
  box?.remove()
  box = document.createElement('div')
  box.style.cssText = `position:fixed;left:0;top:0;width:${SCREEN.w}px;height:${SCREEN.h}px`
  document.body.append(box)
  return box
}

/** The colour at a tile place of a canvas, read as a person would see it: `#rrggbb`. */
function colourAt(canvas: HTMLCanvasElement, tile: { x: number; y: number }): string {
  const copy = document.createElement('canvas')
  copy.width = canvas.width
  copy.height = canvas.height
  const context = copy.getContext('2d')
  if (context === null) throw new Error('no 2D canvas')
  context.drawImage(canvas, 0, 0)
  const ratio = canvas.width / SCREEN.w
  const p = toScreen(WHOLE, SCREEN, tile)
  const [r = 0, g = 0, b = 0] = context.getImageData(
    Math.round(p.x * ratio),
    Math.round(p.y * ratio),
    1,
    1,
  ).data
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

async function levelView(
  level: Level,
  tile: { x: number; y: number },
  on: GameContent = content,
): Promise<string> {
  made = await createStage()
  mountBox().append(made.canvas)
  made.levels.resize(SCREEN.w, SCREEN.h)
  // The tileset's picture loads on its own time; the ground is the picture's brown once it has.
  let last = ''
  await vi.waitFor(() => {
    made?.levels.show(on, pictures, level, WHOLE, plain)
    last = colourAt((made as Stage).canvas, tile)
    expect(colourAt((made as Stage).canvas, { x: 8.5, y: 8.6 })).toBe('#6b4f2a')
  }, READY)
  return last
}

function handFrames(): Frames & { step(count?: number): void } {
  const waiting = new Map<number, (ms: number) => void>()
  let next = 1
  let now = 0
  return {
    request(callback) {
      const id = next++
      waiting.set(id, callback)
      return id
    },
    cancel(id) {
      waiting.delete(id)
    },
    step(count = 1) {
      for (let i = 0; i < count; i++) {
        now += 1000 / 60
        const due = [...waiting.values()]
        waiting.clear()
        for (const callback of due) callback(now)
      }
    },
  }
}

/** The same level in Play, held at its first picture, read at `tile`. */
async function inPlay(level: Level, tile: { x: number; y: number }, of: typeof game = game): Promise<string> {
  const edits = inLevel(startEdits(of), 'level-1', () => level)
  const frames = handFrames()
  const holder = mountBox()
  playing = await play({ mount: holder, game: of, edits, level: 'level-1', lang: 'en', frames })
  frames.step(3)
  await vi.waitFor(() => {
    const canvas = holder.querySelector('canvas') as HTMLCanvasElement
    expect(colourAt(canvas, { x: 8.5, y: 8.6 })).toBe('#6b4f2a')
  }, READY)
  const cv = holder.querySelector('canvas') as HTMLCanvasElement
  return colourAt(cv, tile)
}

test('a crate drawn in front is over the hero start, and one drawn with the hero is under it', async () => {
  const front = await levelView(crateAt(START, 'in-front'), START)
  expect(front).toBe(CRATE)
  made?.destroy()
  const withHero = await levelView(crateAt(START, 'with-hero'), START)
  expect(withHero).not.toBe(CRATE)
  expect(withHero).not.toBe(SKY)
})

test('a crate drawn behind is under the ground', async () => {
  const back = await levelView(crateAt(FLOOR, 'behind'), FLOOR)
  expect(back).not.toBe(CRATE)
  expect(back).toBe('#6b4f2a')
})

test('with the hero, a coloured box is under the ground in the level view and in Play, and a picture is over it', async () => {
  const level = crateAt(FLOOR, 'with-hero')
  const box = await levelView(level, FLOOR)
  dropStage()
  expect(box).toBe('#6b4f2a')
  expect(await inPlay(level, FLOOR)).toBe(box)
  playing?.stop()
  playing = undefined
  const picture = await levelView(level, FLOOR, figureGame.content)
  dropStage()
  expect(picture).toBe(FIGURE_COLOUR)
  expect(await inPlay(level, FLOOR, figureGame)).toBe(picture)
})

test('the level view and Play paint the same colour where a crate is in front and where it is behind', async () => {
  for (const [where, how, tile] of [
    [START, 'in-front', START],
    [FLOOR, 'behind', FLOOR],
  ] as const) {
    const level = crateAt(where, how)
    const view = await levelView(level, tile)
    made?.destroy()
    made = undefined
    expect(await inPlay(level, tile)).toBe(view)
    playing?.stop()
    playing = undefined
  }
})

// The settings sheet's "Drawn" and the thing's menu.
const links = await loadGame(readFrom(linksMap()))
if (!links.ok) throw new Error('the links game did not load')
const linksContent: GameContent = links.value
const room1 = linksContent.levels['room-1'] as Level

let sheet: HTMLDivElement | undefined
let mounted: ReturnType<typeof mount> | undefined
afterEach(() => {
  if (mounted) void unmount(mounted)
  mounted = undefined
  sheet?.remove()
  sheet = undefined
})

async function settings(ids: readonly string[], start: Level = room1) {
  sheet = document.createElement('div')
  sheet.className = 'look'
  sheet.style.cssText = 'position:fixed;left:0;top:0;width:340px;height:700px;overflow:auto'
  document.body.append(sheet)
  const made = mount(SettingsHolder, { target: sheet, props: { content: linksContent, start, ids } })
  mounted = made
  await tick()
  return made as unknown as { now(): Level; steps(): number; undo(): void }
}
const choice = (name: string): HTMLButtonElement => {
  const found = [...(sheet as HTMLElement).querySelectorAll<HTMLButtonElement>('[role=radio]')].find(
    (b) => b.textContent?.trim() === name,
  )
  if (found === undefined) throw new Error(`no choice ${name}`)
  return found
}

test('Drawn is three choices in the Look group, with a line saying what the picked one does', async () => {
  const held = await settings(['crate-1'])
  const look = (sheet as HTMLElement).querySelector('[data-group="look"]') as HTMLElement
  expect([...look.querySelectorAll('[role=radio]')].map((b) => b.textContent?.trim())).toEqual([
    'Behind',
    'With the hero',
    'In front',
  ])
  expect(choice('With the hero').getAttribute('aria-checked')).toBe('true')
  expect(look.querySelector('[data-draw-about]')?.textContent?.trim()).toBe('Drawn like the hero is.')
  await userEvent.click(choice('In front'))
  await tick()
  expect(held.now().things.find((t) => t.id === 'crate-1')?.draw).toBe('in-front')
  expect(held.steps()).toBe(1)
  expect(look.querySelector('[data-draw-about]')?.textContent?.trim()).toBe(
    'Over the hero and everything else.',
  )
  held.undo()
  await tick()
  expect(held.now().things.find((t) => t.id === 'crate-1')).not.toHaveProperty('draw')
})

test('several picked things change together, and where they differ no choice is ticked', async () => {
  const mixed: Level = {
    ...room1,
    things: room1.things.map((t, n) => (n === 0 ? { ...t, draw: 'behind' as const } : t)),
  }
  const ids = mixed.things.slice(0, 2).map((t) => t.id)
  const held = await settings(ids, mixed)
  for (const name of ['Behind', 'With the hero', 'In front'])
    expect(choice(name).getAttribute('aria-checked')).toBe('false')
  expect((sheet as HTMLElement).querySelector('[data-draw-about]')?.textContent?.trim()).toBe('Not the same')
  await userEvent.click(choice('In front'))
  await tick()
  for (const id of ids) expect(held.now().things.find((t) => t.id === id)?.draw).toBe('in-front')
  expect(held.steps()).toBe(1)
  expect(held.now().things.map((t) => t.id)).toEqual(mixed.things.map((t) => t.id))
})

test('the menu has both rows, and a row that cannot act says why', async () => {
  const holder = document.createElement('div')
  document.body.append(holder)
  const open = async (draws: readonly ('behind' | 'with-hero' | 'in-front')[]) => {
    const picked: string[] = []
    const made = mount(ThingMenu, {
      target: holder,
      props: {
        lang: 'en',
        on: 'crate-1',
        locked: false,
        hidden: false,
        draws,
        canPaste: false,
        canNote: false,
        onpick: (id: string) => picked.push(id),
        onclose: () => {},
      },
    })
    await tick()
    return { picked, done: () => void unmount(made) }
  }
  const row = (name: string): HTMLButtonElement | undefined =>
    [...holder.querySelectorAll<HTMLButtonElement>('button, [role=menuitem]')].find((b) =>
      b.textContent?.includes(name),
    ) as HTMLButtonElement | undefined
  let menu = await open(['with-hero'])
  expect(row('Bring to the front')).toBeDefined()
  expect(row('Send to the back')).toBeDefined()
  expect(holder.textContent).not.toContain('Already')
  menu.done()
  menu = await open(['in-front', 'in-front'])
  expect(holder.textContent).toContain('Already in front')
  expect(holder.textContent).not.toContain('Already at the back')
  menu.done()
  menu = await open(['behind'])
  expect(holder.textContent).toContain('Already at the back')
  menu.done()
  holder.remove()
})
