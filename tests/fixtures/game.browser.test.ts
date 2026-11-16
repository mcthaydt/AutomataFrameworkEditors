// The Crate Game, played in each real browser: the hero has controls, so `startGame` builds and steps, and the tileset's
// picture is a PNG the framework's own `loadArt` accepts. No test of the World editor's play can pass without both.
import {
  createLocale,
  type Frames,
  loadArt,
  loadGame,
  openSettings,
  startGame,
  testHost,
} from '@automataframework/framework'
import { afterEach, expect, test } from 'vitest'
import { fixtureBytes, fixtureFiles, readFrom } from './game/read.ts'

const FRAME = 1000 / 60

/** Frames the test delivers by hand, so no test waits on a real display. */
function handFrames(): Frames & { step(): void } {
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
    step() {
      now += FRAME
      const due = [...waiting.values()]
      waiting.clear()
      for (const callback of due) callback(now)
    },
  }
}

const readPicture = async (path: string): Promise<Blob> => {
  const bytes = fixtureBytes()[path]
  if (bytes === undefined) throw new Error(`${path}: the fixture has no such picture`)
  return new Blob([bytes.slice()], { type: 'image/png' })
}

async function content() {
  const loaded = await loadGame(readFrom(fixtureFiles))
  if (!loaded.ok) throw new Error('the fixture did not load')
  return loaded.value
}

let mount: HTMLDivElement | undefined
afterEach(() => {
  mount?.remove()
  mount = undefined
})

test('startGame builds the Crate Game and plays a second without throwing', async () => {
  const game = await content()
  const host = testHost()
  const settings = await openSettings({ game: 'crate-game-fixture', store: host.store })
  const locale = createLocale({ content: game, host, settings })
  await locale.set('en')
  mount = document.createElement('div')
  mount.style.cssText = 'position:fixed;left:0;top:0;width:480px;height:270px'
  document.body.append(mount)
  const frames = handFrames()
  const running = await startGame({ content: game, locale, mount, host, frames, readPicture })
  try {
    // The first frame only sets the clock; the next sixty are a second of play.
    for (let i = 0; i <= 60; i++) frames.step()
    expect(running.broken()).toBeUndefined()
    expect(running.sim.tick).toBeGreaterThan(50)
  } finally {
    running.stop()
  }
})

test("the tileset's picture is a PNG the framework's loadArt accepts", async () => {
  const game = await content()
  const art = await loadArt({ content: game, readPicture })
  art.destroy()
})
