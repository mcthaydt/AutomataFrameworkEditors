// Settings, Help and the keys in each real browser: the sheets fit, every control is a finger wide, and a choice is told
// to the screen that holds it.
import { mount, tick, unmount } from 'svelte'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { ME_DEFAULT, type Me } from '#src/features/device/device.ts'
import { Help, Keys, Settings } from '#src/features/shell/shell.ts'

let box: HTMLDivElement
let mounted: ReturnType<typeof mount> | undefined

/** A press that does not need the control on the screen: the test's box can be larger than the browser's window. */
async function press(el: Element | null | undefined): Promise<void> {
  if (el instanceof HTMLElement) el.click()
  await tick()
}
const button = (name: string): HTMLElement | undefined =>
  [...box.querySelectorAll<HTMLElement>('button, [role=radio]')].find((el) =>
    el.textContent?.trim().startsWith(name),
  )

beforeEach(() => {
  box = document.createElement('div')
  box.className = 'look'
  box.style.cssText = 'position:fixed;left:0;top:0;width:834px;height:700px'
  document.body.append(box)
})
afterEach(() => {
  if (mounted) void unmount(mounted)
  mounted = undefined
  box.remove()
})

async function put(component: unknown, props: Record<string, unknown>) {
  mounted = mount(component as never, { target: box, props } as never)
  await tick()
}

const settings = (over: Record<string, unknown> = {}) => ({
  lang: 'en',
  me: ME_DEFAULT,
  game: 'Crate Game',
  problems: 'warn',
  owner: true,
  owners: ['grandma'],
  onme: () => {},
  onproblems: async () => true,
  ontour: () => {},
  onclose: () => {},
  ...over,
})

test('an Owner changes what is for everyone: it is asked for, and said once it went in', async () => {
  const asked: string[] = []
  await put(
    Settings,
    settings({
      onproblems: async (next: string) => {
        asked.push(next)
        return true
      },
    }),
  )
  const stop = [...box.querySelectorAll<HTMLInputElement>('input[type=radio]')].find(
    (el) => el.value === 'stop',
  )
  stop?.click()
  await tick()
  await Promise.resolve()
  await tick()
  expect(asked).toEqual(['stop'])
  expect(box.querySelector('[role=status]')?.textContent).toBe('Changed for everyone.')
})

test('a change that did not go in is put back and said', async () => {
  await put(Settings, settings({ onproblems: async () => false }))
  const radios = [...box.querySelectorAll<HTMLInputElement>('input[type=radio]')]
  radios.find((el) => el.value === 'stop')?.click()
  await tick()
  await Promise.resolve()
  await tick()
  expect(radios.find((el) => el.value === 'warn')?.checked).toBe(true)
  expect(box.querySelector('[role=status]')?.textContent).toBe("That didn't change. Try again.")
})

test('someone who is not an Owner cannot change it, and is told who to ask', async () => {
  const asked: string[] = []
  await put(
    Settings,
    settings({
      owner: false,
      owners: ['grandma', 'grandpa'],
      onproblems: async (next: string) => {
        asked.push(next)
        return true
      },
    }),
  )
  for (const radio of box.querySelectorAll<HTMLInputElement>('input[type=radio]'))
    expect(radio.disabled).toBe(true)
  expect(box.textContent).toContain('Ask grandma, grandpa.')
  expect(asked).toEqual([])
})

test('"For me" choices are told to the screen, one field at a time', async () => {
  const kept: Me[] = []
  await put(Settings, settings({ onme: (next: Me) => kept.push(next) }))
  await press(button('Small'))
  await press(button('Off'))
  await press(box.querySelector('[role=switch]'))
  expect(kept.map((me) => [me.rows, me.glass, me.tips])).toEqual([
    ['small', 'auto', true],
    ['auto', 'off', true],
    ['auto', 'auto', false],
  ])
})

test('every control in the three sheets is at least 44 by 44, and none is cut off the side', async () => {
  for (const [sheet, props] of [
    [Settings, settings()],
    [
      Help,
      {
        lang: 'en',
        steps: ['tap-the-crate', 'drag-a-value'],
        done: new Set(['tap-the-crate']),
        onshow: () => {},
        ontour: () => {},
        onkeys: () => {},
        oncopy: () => {},
        onclose: () => {},
      },
    ],
    [Keys, { lang: 'en', onclose: () => {} }],
  ] as const) {
    await put(sheet, props)
    for (const el of box.querySelectorAll('button, select, [role=radio]')) {
      const hit = el.getBoundingClientRect()
      expect(hit.height, el.textContent ?? '').toBeGreaterThanOrEqual(43.5)
      expect(hit.right).toBeLessThanOrEqual(834)
    }
    if (mounted) void unmount(mounted)
    mounted = undefined
  }
})

test('Help ticks the basics done, offers "Show me" for the rest, and counts them', async () => {
  const shown: string[] = []
  await put(Help, {
    lang: 'en',
    steps: ['tap-the-crate', 'drag-a-value'],
    done: new Set(['tap-the-crate']),
    onshow: (step: string) => shown.push(step),
    ontour: () => {},
    onkeys: () => {},
    oncopy: undefined,
    onclose: () => {},
  })
  expect(box.textContent).toContain('1 of 2 done')
  const shows = [...box.querySelectorAll('button')].filter((el) => el.textContent?.includes('Show me'))
  expect(shows).toHaveLength(1)
  await press(shows[0])
  expect(shown).toEqual(['drag-a-value'])
})

test('asking your helper says what it is and offers a copy only where there is a level to copy', async () => {
  await put(Help, {
    lang: 'en',
    steps: [],
    done: new Set(),
    onshow: () => {},
    ontour: () => {},
    onkeys: () => {},
    oncopy: undefined,
    onclose: () => {},
  })
  await press(button('Ask your helper'))
  expect(box.textContent).toContain('Your helper is an AI you chat with.')
  expect(button('Keep a copy of this level')).toBeUndefined()
})
