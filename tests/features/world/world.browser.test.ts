// The World screen in each real browser: a level of a thousand things still draws only the rows in view.
import type { Level } from '@automataframework/framework/headless'
import { mount, tick, unmount } from 'svelte'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { page } from 'vitest/browser'
import type { Api } from '#src/features/api/api.ts'
import { ME_DEFAULT } from '#src/features/device/device.ts'
import type { Route } from '#src/features/team/route.ts'
import World from '#src/features/world/World.svelte'
import { fixtureFiles, LEVEL_PATH } from '../../fixtures/game/read.ts'
import { linksFiles } from '../../fixtures/links-game/links.ts'
import { openedGameWith } from '../../fixtures/open-game-with.ts'
import { memoryStore } from '../../fixtures/store.ts'

const FILL = 'position:fixed;left:0;top:0;width:100%;height:100%;display:flex;flex-direction:column'

let box: HTMLDivElement
let mounted: ReturnType<typeof mount> | undefined

beforeEach(() => {
  box = document.createElement('div')
  box.style.cssText = FILL
  document.body.append(box)
})
afterEach(() => {
  if (mounted) void unmount(mounted)
  mounted = undefined
  box.remove()
})

const level1 = JSON.parse(fixtureFiles[LEVEL_PATH] ?? '{}') as Level

test('a level of 1,024 things draws fewer than 100 rows in the list', async () => {
  const crate = level1.things.find((thing) => thing.character === 'crate')
  if (crate === undefined) throw new Error('the fixture level has no crate')
  const things = Array.from({ length: 1024 }, (_, n) => ({
    ...crate,
    id: `box-${n}`,
    x: 0.5 + (n % 32) / 2,
    y: 0.5 + Math.floor(n / 32) / 4,
  }))
  const game = await openedGameWith((text) => `v${text.length}`, {
    ...fixtureFiles,
    [LEVEL_PATH]: JSON.stringify({ ...level1, things }),
  })
  const remembered = memoryStore()
  // The first run is done, so no welcome stands over the list.
  remembered.setItem('af.guide.done', '1')
  mounted = mount(World, {
    target: box,
    props: {
      game,
      api: {} as unknown as Api,
      route: { screen: 'level', owner: game.ref.owner, name: game.ref.name },
      me: ME_DEFAULT,
      go: () => {},
      drafts: memoryStore(),
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
  // Every thing, and the place the player starts, is a button a finger can reach; only the rows in view are in the list.
  await vi.waitFor(() => expect(box.querySelectorAll('[data-thing]')).toHaveLength(1025))
  const open = [...box.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'List')
  if (open === undefined) throw new Error('no button opens the list')
  open.click()
  await tick()
  await vi.waitFor(() => expect(box.querySelectorAll('[data-row]').length).toBeGreaterThan(0))
  expect(box.querySelectorAll('[data-row]').length).toBeLessThan(100)
})

test('the map route shows every level on one sheet, with the Map button pressed and the levels in the list', async () => {
  const game = await openedGameWith((text) => `v${text.length}`, linksFiles())
  const remembered = memoryStore()
  remembered.setItem('af.guide.done', '1')
  const went: Route[] = []
  // A wide window, where the Map button sits in the top bar.
  await page.viewport(1100, 800)
  mounted = mount(World, {
    target: box,
    props: {
      game,
      api: {} as unknown as Api,
      route: { screen: 'map', owner: game.ref.owner, name: game.ref.name, level: 'room-2' },
      me: ME_DEFAULT,
      go: (route: Route) => went.push(route),
      drafts: memoryStore(),
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
  await vi.waitFor(() => expect(box.querySelectorAll('[data-level]')).toHaveLength(3))
  // The level the address names is the one picked when the map opens.
  expect(box.querySelector('[data-level="room-2"]')?.getAttribute('aria-pressed')).toBe('true')
  const map = [...box.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Map')
  expect(map?.getAttribute('aria-pressed')).toBe('true')
  map?.click()
  await tick()
  expect(went.at(-1)).toMatchObject({ screen: 'level', level: 'room-2' })
})
