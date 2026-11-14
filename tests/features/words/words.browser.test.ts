// `WORDS` on a screen: reading a key in markup follows the language and a swapped table, and a screen can't write to it.
import { createRawSnippet, mount, tick, unmount } from 'svelte'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { Panel } from '#src/features/ui/ui.ts'
import { EN } from '#src/features/words/en.ts'
import { language, setLanguage, useTables, WORDS } from '#src/features/words/words.svelte.ts'

let box: HTMLDivElement
let mounted: ReturnType<typeof mount> | undefined

beforeEach(() => {
  box = document.createElement('div')
  document.body.append(box)
})
afterEach(() => {
  if (mounted) void unmount(mounted)
  mounted = undefined
  box.remove()
  useTables()
  setLanguage('en')
})

/** A panel whose one line reads `WORDS.back` the way a screen's markup does. */
function mountLine(): void {
  const children = createRawSnippet(() => ({ render: () => `<p>${WORDS.back}</p>` }))
  mounted = mount(Panel, { target: box, props: { part: 'test', children } })
}

test('a screen shows the words of the table', async () => {
  mountLine()
  await tick()
  expect(box.querySelector('p')?.textContent).toBe(EN.back)
})

test('swapping the table changes what is on screen, without mounting it again', async () => {
  mountLine()
  await tick()
  useTables({ en: { ...EN, back: 'Go back to where you were' } })
  await tick()
  expect(box.querySelector('p')?.textContent).toBe('Go back to where you were')
  useTables()
  await tick()
  expect(box.querySelector('p')?.textContent).toBe(EN.back)
})

test('the language on screen is English until another is chosen', () => {
  expect(language()).toBe('en')
  setLanguage('en')
  expect(language()).toBe('en')
})

test('WORDS lists the same keys as the table, and a screen cannot write to it', () => {
  expect(Object.keys(WORDS)).toEqual(Object.keys(EN))
  expect('back' in WORDS).toBe(true)
  expect('nope' in WORDS).toBe(false)
  expect(() => {
    ;(WORDS as unknown as Record<string, string>).back = 'x'
  }).toThrow()
  expect(WORDS.back).toBe(EN.back)
})
