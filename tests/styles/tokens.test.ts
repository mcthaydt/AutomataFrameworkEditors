// The editors' look is six colours named in one file. These tests read the stylesheet and every component's style
// block as text, so a colour written anywhere else, or written another way, fails here, in Node, with no browser.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { contrast, mix } from '../fixtures/contrast.ts'

const ROOT = join(import.meta.dirname, '../..')
const read = (path: string): string => readFileSync(join(ROOT, path), 'utf8')

function filesUnder(dir: string, ending: string): string[] {
  return readdirSync(join(ROOT, dir)).flatMap((name) => {
    const path = `${dir}/${name}`
    if (statSync(join(ROOT, path)).isDirectory()) return filesUnder(path, ending)
    return path.endsWith(ending) ? [path] : []
  })
}

const UI_CSS = read('src/features/ui/ui.css')
const SVELTE = filesUnder('src', '.svelte').map((path) => ({ path, text: read(path) }))
const BLOCKS = SVELTE.flatMap(({ path, text }) =>
  [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((match) => ({ path, css: match[1] ?? '' })),
)
const ALL_CSS = [UI_CSS, ...BLOCKS.map((block) => block.css)].join('\n')
const HEX = /#[0-9a-fA-F]{3,8}\b/g

const COLOURS = {
  ground: '#253122',
  words: '#f5ecc2',
  touch: '#eeb480',
  mark: '#837e31',
  raised: '#313c2c',
  quiet: '#b7b492',
}

describe("the editors' colours", () => {
  test('the six colours are named in ui.css and nowhere else', () => {
    // Comments may speak of a palette's number but hold no hex value of their own.
    const written = (UI_CSS.replace(/\/\*[\s\S]*?\*\//g, '').match(HEX) ?? []).map((hex) => hex.toLowerCase())
    expect([...new Set(written)].sort()).toEqual(Object.values(COLOURS).sort())
    expect(written).toHaveLength(6)
    for (const block of BLOCKS) expect(block.css.match(HEX) ?? [], block.path).toEqual([])
  })

  test("each is the spec's colour", () => {
    for (const [name, hex] of Object.entries(COLOURS)) {
      expect(UI_CSS.toUpperCase(), name).toContain(`--${name.toUpperCase()}: ${hex.toUpperCase()};`)
    }
  })

  test('the two mixed shades are the words let into the ground', () => {
    expect(mix(COLOURS.words, COLOURS.ground, 0.06)).toBe(COLOURS.raised)
    expect(mix(COLOURS.words, COLOURS.ground, 0.7)).toBe(COLOURS.quiet)
  })

  test('no colour is written any other way', () => {
    expect(ALL_CSS).not.toMatch(/\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/)
    expect(ALL_CSS).not.toContain('prefers-color-scheme')
    // A colour keyword in a colour property: only these three stand for no colour of their own.
    const keyword =
      /(?:^|[;{\s])(?:color|background|background-color|border|border-color|outline|fill|stroke)\s*:\s*([^;}]*)/gm
    for (const [, value = ''] of ALL_CSS.matchAll(keyword)) {
      const words = value.replace(/var\([^)]*\)/g, ' ').split(/[\s,]+/)
      for (const word of words) {
        if (!/^[a-z]+$/.test(word)) continue
        expect(['transparent', 'currentcolor', 'none', 'solid', 'dashed', 'dotted', 'inherit']).toContain(
          word.toLowerCase(),
        )
      }
    }
    for (const old of [
      '--bg',
      '--fg',
      '--muted',
      '--line',
      '--surface',
      '--primary',
      '--primary-fg',
      '--danger',
      '--danger-fg',
      '--info',
      '--good',
      '--problem',
      '--focus',
      '--radius',
    ]) {
      expect(ALL_CSS, old).not.toMatch(new RegExp(`${old}(?![-\\w])`))
    }
  })

  test('dark is the only theme', () => {
    expect(UI_CSS).toContain('color-scheme: dark;')
  })

  test('the pairs the screens put together can be read', () => {
    const c = COLOURS
    for (const [a, b] of [
      [c.words, c.ground],
      [c.words, c.raised],
      [c.quiet, c.ground],
      [c.quiet, c.raised],
      [c.touch, c.ground],
      [c.touch, c.raised],
      [c.ground, c.touch],
    ] as const) {
      expect(contrast(a, b), `${a} on ${b}`).toBeGreaterThanOrEqual(4.5)
    }
    // An edge or an icon needs 3 to 1: mark does on the ground, and never on raised, so it never goes there.
    expect(contrast(c.mark, c.ground)).toBeGreaterThanOrEqual(3)
    expect(contrast(c.mark, c.raised)).toBeLessThan(3)
  })

  test('corners are 2 px', () => {
    expect(UI_CSS).toContain('--corner: 2px;')
    for (const [, value = ''] of ALL_CSS.matchAll(/border-radius\s*:\s*([^;}]*)/g)) {
      expect(value.trim()).toBe('var(--corner)')
    }
  })

  test('one shadow, named once', () => {
    for (const [, value = ''] of ALL_CSS.matchAll(/box-shadow\s*:\s*([^;}]*)/g)) {
      expect(['var(--float-shadow)', 'none']).toContain(value.trim())
    }
  })

  test('no colour in a style attribute', () => {
    for (const { path, text } of SVELTE) {
      expect(text, path).not.toMatch(/style="/)
      expect(text, path).not.toMatch(/style:(color|background|border)/)
    }
  })

  test('index.html tells the browser the ground colour, and names no other', () => {
    const html = read('index.html')
    expect(html).toContain('<meta name="theme-color" content="#253122" />')
    expect(html).toContain('<meta name="color-scheme" content="dark" />')
    expect(html.match(HEX)).toEqual(['#253122'])
  })

  test('the header is as it was', () => {
    // The page may take no font, icon, style or script from anywhere but itself; the header is byte for byte.
    expect(read('public/_headers')).toContain(
      "  Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'\n",
    )
  })

  test('the built page inlines no font', () => {
    const assets = join(ROOT, 'dist/assets')
    if (!existsSync(assets)) {
      // CI builds before it tests; a missing build there is a fault, and on a laptop it is only a skipped check.
      expect(process.env.CI, 'CI builds the page before the Node tests').toBeUndefined()
      return
    }
    for (const name of readdirSync(assets).filter((file) => file.endsWith('.css'))) {
      expect(readFileSync(join(assets, name), 'utf8'), name).not.toContain('data:')
    }
  })
})
