// Pinching two fingers in past the whole level asks for the map; a small pinch, or one the other way, does not.
import { type GameContent, type Level, loadGame } from '@automataframework/framework/headless'
import { mount, tick, unmount } from 'svelte'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { fixtureFiles, LEVEL_PATH, readFrom } from '../../fixtures/game/read.ts'
import Holder from './Holder.svelte'

const loaded = await loadGame(readFrom({ ...fixtureFiles }))
if (!loaded.ok) throw new Error('the fixture game did not load')
const content: GameContent = loaded.value
const level1 = JSON.parse(fixtureFiles[LEVEL_PATH] ?? '{}') as Level

let box: HTMLDivElement
let mounted: ReturnType<typeof mount> | undefined
let asked: number

beforeEach(() => {
  box = document.createElement('div')
  box.style.cssText =
    'position:fixed;left:0;top:0;width:400px;height:520px;display:flex;flex-direction:column'
  document.body.append(box)
  asked = 0
})
afterEach(() => {
  if (mounted) void unmount(mounted)
  mounted = undefined
  box.remove()
})

async function show(): Promise<HTMLElement> {
  mounted = mount(Holder, {
    target: box,
    props: { content, pictures: [], start: level1, onmap: () => (asked += 1) },
  })
  await tick()
  await vi.waitFor(() => expect(box.querySelector('[data-thing]')).not.toBeNull())
  return box.querySelector<HTMLElement>('[data-scale]') as HTMLElement
}

/** Two fingers down `apart` pixels from each other, then moved to `to` pixels apart, about the middle. */
function pinch(stage: HTMLElement, apart: number, to: number): void {
  const at = stage.getBoundingClientRect()
  const y = at.top + at.height / 2
  const middle = at.left + at.width / 2
  const send = (type: string, id: number, x: number): void => {
    stage.dispatchEvent(
      new PointerEvent(type, {
        pointerId: id,
        pointerType: 'touch',
        isPrimary: id === 1,
        clientX: x,
        clientY: y,
        buttons: type === 'pointerup' ? 0 : 1,
        bubbles: true,
      }),
    )
  }
  send('pointerdown', 1, middle - apart / 2)
  send('pointerdown', 2, middle + apart / 2)
  for (let step = 1; step <= 6; step += 1) {
    const gap = apart + ((to - apart) * step) / 6
    send('pointermove', 1, middle - gap / 2)
    send('pointermove', 2, middle + gap / 2)
  }
  send('pointerup', 2, middle + to / 2)
  send('pointerup', 1, middle - to / 2)
}

test('pinching in far past the whole level opens the map once', async () => {
  const stage = await show()
  pinch(stage, 240, 60)
  expect(asked).toBeGreaterThan(0)
})

test('a small pinch in, and a pinch out, leave the level where it is', async () => {
  const stage = await show()
  pinch(stage, 240, 230)
  pinch(stage, 100, 300)
  expect(asked).toBe(0)
})
