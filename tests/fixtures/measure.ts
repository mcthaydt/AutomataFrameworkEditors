// What a drunk grandma's finger and eye need, measured in the page itself: the one check every screen's journey shares.
import type { Page } from 'playwright'
import { WORDS } from './words.ts'

/** What a drunk grandma's finger and eye need: measured in the page itself. Returns a sentence per broken rule. */
export async function broken(page: Page, stage: boolean): Promise<string[]> {
  return page.evaluate(
    ([withStage, backWord]) => {
      const found: string[] = []
      const seen = (el: Element): boolean => {
        const style = getComputedStyle(el)
        const box = el.getBoundingClientRect()
        return style.visibility !== 'hidden' && style.display !== 'none' && box.width > 0 && box.height > 0
      }
      const doc = document.documentElement
      if (doc.scrollWidth > doc.clientWidth)
        found.push(`scrolls sideways (${doc.scrollWidth} > ${doc.clientWidth})`)

      // The things in the level are drawn on the stage and have their own buttons for moving; a radio's box is its
      // label's to size, as a person presses the whole row. Everything else a finger lands on is measured.
      const touchable = [...document.querySelectorAll('button, a[href], input, select')].filter(
        (el) =>
          seen(el) &&
          !el.hasAttribute('data-thing') &&
          !(el instanceof HTMLInputElement && el.type === 'radio'),
      )
      const named = (el: Element): string =>
        `${el.tagName.toLowerCase()} "${(el.textContent ?? '').trim().slice(0, 30) || (el as HTMLInputElement).id}"`
      for (const el of touchable) {
        const box = el.getBoundingClientRect()
        if (box.width < 43.5 || box.height < 43.5)
          found.push(`${named(el)} is ${Math.round(box.width)}x${Math.round(box.height)}, under 44`)
      }
      const primary = [...document.querySelectorAll('.button.primary')].filter(seen)
      if (primary.length > 1) found.push(`${primary.length} primary Buttons`)
      for (const el of primary) {
        if (el.getBoundingClientRect().height < 47.5)
          found.push(`${named(el)} is a primary Button under 48 tall`)
      }
      // Two things cannot overlap if one has been scrolled out of the screen's own scrolling area: it is not on show.
      const area = document.querySelector('.content')?.getBoundingClientRect()
      const onShow = (el: Element): boolean => {
        const box = el.getBoundingClientRect()
        return (
          area === undefined ||
          !el.closest('.content') ||
          (box.top >= area.top - 1 && box.bottom <= area.bottom + 1)
        )
      }
      const shown = touchable.filter(onShow)
      for (let a = 0; a < shown.length; a += 1) {
        for (let b = a + 1; b < shown.length; b += 1) {
          const first = shown[a]!.getBoundingClientRect()
          const second = shown[b]!.getBoundingClientRect()
          const across = Math.min(first.right, second.right) - Math.max(first.left, second.left)
          const down = Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top)
          if (across > 1 && down > 1 && !shown[a]!.contains(shown[b]!) && !shown[b]!.contains(shown[a]!))
            found.push(`${named(shown[a]!)} overlaps ${named(shown[b]!)}`)
        }
      }
      // One way back, never two: a grandma asks which one.
      const backs = [...document.querySelectorAll('button')].filter(
        (el) => seen(el) && (el.textContent ?? '').trim() === backWord,
      )
      if (backs.length > 1) found.push(`${backs.length} buttons named ${backWord}`)
      const headings = [...document.querySelectorAll('h1')].filter(seen)
      if (headings.length !== 1) found.push(`${headings.length} headings (h1), not one`)

      // Text: every visible piece lies inside the window's width, and none is cut with an ellipsis.
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
        const words = (node.textContent ?? '').trim()
        const parent = node.parentElement
        if (words === '' || parent === null || !seen(parent) || parent.closest('script, style') !== null)
          continue
        const range = document.createRange()
        range.selectNodeContents(node)
        for (const box of range.getClientRects()) {
          if (box.right > window.innerWidth + 1 || box.left < -1)
            found.push(`text runs off the side: "${words.slice(0, 30)}"`)
        }
        const style = getComputedStyle(parent)
        if (style.textOverflow === 'ellipsis' && parent.scrollWidth > parent.clientWidth)
          found.push(`text is cut with an ellipsis: "${words.slice(0, 30)}"`)
      }

      if (withStage) {
        const stage = document.querySelector('[data-scale]')
        const box = stage?.getBoundingClientRect()
        const half = Math.min(window.innerWidth, window.innerHeight) / 2
        if (box === undefined || box.width < half)
          found.push(`the stage is ${Math.round(box?.width ?? 0)} wide, under ${half}`)
      }
      return [...new Set(found)]
    },
    [stage, WORDS.back] as const,
  )
}
