// What a drunk grandma's finger and eye need, measured in the page itself. `broken()` returns a sentence per broken
// rule, so a failing screen says what is wrong with it. The screens journey runs it on every screen at three sizes.
//
// On every screen: nothing scrolls sideways; every button, link, field and picker is at least 44 px each way and a
// primary Button at least 48 tall; none overlap; one heading, one primary Button, at most one Back; no text runs off
// the side or is cut with an ellipsis; every sentence is at least 18 px (a label 13, a number 15) and 4.5 to 1 against
// what is behind it; and no words lie straight on the game's art.
// On a level (the floating layout): the stage is as wide as the window; the clear cell the panels leave is at least
// half the window's shorter side wide and 160 px tall; every thing is in that cell or within 24 px of it; no two
// panels overlap; the buttons in what was just said are all in view; and with nothing just said, no words lie over the
// clear cell but a note's (or the stamp's).
import type { Page } from 'playwright'
import { WORDS } from '#src/features/words/words.ts'

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

      // The WCAG contrast of two opaque `rgb()` colours.
      const rgb = (css: string): [number, number, number, number] => {
        const parts = css.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 0]
        return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0, parts[3] ?? 1]
      }
      const luminance = ([r, g, b]: number[]): number => {
        const lin = (v: number): number => {
          const c = v / 255
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
        }
        return 0.2126 * lin(r ?? 0) + 0.7152 * lin(g ?? 0) + 0.0722 * lin(b ?? 0)
      }
      const ratio = (a: number[], b: number[]): number => {
        const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
        return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05)
      }
      /** What is behind an element's words: the nearest ancestor with an opaque background, or the art. */
      const behind = (el: Element): { colour: number[]; onArt: boolean } => {
        for (let up: Element | null = el; up !== null; up = up.parentElement) {
          const colour = rgb(getComputedStyle(up).backgroundColor)
          if (colour[3] >= 0.99) return { colour, onArt: false }
          // The stage is the game's picture: words with no ground of their own that reach it lie on the art.
          if (up.hasAttribute('data-scale') || up.matches('.stage'))
            return { colour: [0, 0, 0, 1], onArt: true }
        }
        return { colour: [0, 0, 0, 1], onArt: false }
      }

      // Text: every visible piece lies inside the window's width, none is cut with an ellipsis, is at least 18 px (a
      // label 13, a number 15) and can be read against what is behind it.
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      const texts: Array<{ node: Node; parent: HTMLElement; words: string }> = []
      for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
        const words = (node.textContent ?? '').trim()
        const parent = node.parentElement
        if (words === '' || parent === null || !seen(parent) || parent.closest('script, style') !== null)
          continue
        texts.push({ node, parent, words })
        const range = document.createRange()
        range.selectNodeContents(node)
        for (const box of range.getClientRects()) {
          if (box.right > window.innerWidth + 1 || box.left < -1)
            found.push(`text runs off the side: "${words.slice(0, 30)}"`)
        }
        const style = getComputedStyle(parent)
        if (style.textOverflow === 'ellipsis' && parent.scrollWidth > parent.clientWidth)
          found.push(`text is cut with an ellipsis: "${words.slice(0, 30)}"`)
        const size = Number.parseFloat(style.fontSize)
        const least = parent.closest('.label') !== null ? 13 : parent.closest('.measure') !== null ? 15 : 18
        if (size < least - 0.01) found.push(`"${words.slice(0, 30)}" is ${size} px, under ${least}`)
        const back = behind(parent)
        if (back.onArt) found.push(`words lie on the art: "${words.slice(0, 30)}"`)
        else {
          const got = ratio(rgb(style.color), back.colour)
          if (got < 4.5) found.push(`"${words.slice(0, 30)}" is ${got.toFixed(2)} to 1, under 4.5`)
        }
      }

      const floats = document.querySelector('.floats')
      if (withStage) {
        const stageBox = document.querySelector('[data-scale]')?.getBoundingClientRect()
        const half = Math.min(window.innerWidth, window.innerHeight) / 2
        const clear = document.querySelector('[data-clear]')?.getBoundingClientRect()
        if (floats === null || clear === undefined) {
          // A level only to look at: its stage is at least half the shorter side wide.
          if (stageBox === undefined || stageBox.width < half)
            found.push(`the stage is ${Math.round(stageBox?.width ?? 0)} wide, under ${half}`)
        } else {
          if (stageBox === undefined || Math.abs(stageBox.width - window.innerWidth) > 1)
            found.push(
              `the stage is ${Math.round(stageBox?.width ?? 0)} wide, not the window's ${window.innerWidth}`,
            )
          if (clear.width < half)
            found.push(`the clear cell is ${Math.round(clear.width)} wide, under ${half}`)
          if (clear.height < 160) found.push(`the clear cell is ${Math.round(clear.height)} tall, under 160`)
          for (const thing of document.querySelectorAll('[data-thing]')) {
            const box = thing.getBoundingClientRect()
            const out = Math.max(
              clear.left - box.left,
              box.right - clear.right,
              clear.top - box.top,
              box.bottom - clear.bottom,
            )
            if (out > 24)
              found.push(
                `${thing.getAttribute('data-thing')} is ${Math.round(out)} px outside the clear cell`,
              )
          }
          const panels = [...floats.querySelectorAll(':scope > [data-panel]')].filter(seen)
          for (let a = 0; a < panels.length; a += 1) {
            for (let b = a + 1; b < panels.length; b += 1) {
              const first = panels[a]!.getBoundingClientRect()
              const second = panels[b]!.getBoundingClientRect()
              const across = Math.min(first.right, second.right) - Math.max(first.left, second.left)
              const down = Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top)
              if (across > 1 && down > 1) found.push('two floating panels overlap')
            }
          }
          const said = document.querySelector('[data-said]')
          if (said !== null) {
            // What was just said asks for a press: every button in it is in view without scrolling.
            const box = said.getBoundingClientRect()
            for (const button of said.querySelectorAll('button')) {
              const at = button.getBoundingClientRect()
              const inWindow =
                at.top >= 0 &&
                at.bottom <= window.innerHeight &&
                at.left >= 0 &&
                at.right <= window.innerWidth
              const inBox = at.top >= box.top - 1 && at.bottom <= box.bottom + 1
              if (!inWindow || !inBox) found.push(`${named(button)} is not in view in what was just said`)
            }
          } else {
            // Nothing was just said: no words lie over the level but a note's (or the stamp's, which has its own ground).
            for (const { node, parent, words } of texts) {
              if (parent.closest('.floats > [data-panel], .note, [data-stamp]') !== null) continue
              const range = document.createRange()
              range.selectNodeContents(node)
              for (const at of range.getClientRects()) {
                const over =
                  at.left < clear.right &&
                  at.right > clear.left &&
                  at.top < clear.bottom &&
                  at.bottom > clear.top
                if (over) found.push(`words lie over the level: "${words.slice(0, 30)}"`)
              }
            }
          }
        }
      }
      return [...new Set(found)]
    },
    [stage, WORDS.back] as const,
  )
}
