// The glass docks (the Owner, 2026-11-15): the tokens behind every see-through panel in the mockups, held to the
// contrast they were chosen for, and the four cases that give today's solid panel instead. The stylesheet is read as
// text; nothing here draws a pixel (the pictures come from the `mockups` job).
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from 'vitest'

const ROOT = join(import.meta.dirname, '../..')
const read = (path: string): string => readFileSync(join(ROOT, path), 'utf8')
const css = read('docs/mockups/shell.css')

// The new section is everything after its heading; it is empty until the heading is written.
const HEADING = '/* ---------- Floating glass docks (the Owner, 2026-11-15) ---------- */'
const start = css.indexOf(HEADING)
const section = start < 0 ? '' : css.slice(start)

type Rgb = [number, number, number]
type Color = [number, number, number, number]
type Filter = { blur: number; brightness: number; saturate: number }
type Strength = { tint: string; filter: string }

// The last value a custom property is given anywhere in the stylesheet: what the cascade ends on.
const token = (name: string): string => {
  const found = [...css.matchAll(new RegExp(`(?:^|[\\s{;])${name}:\\s*([^;}]+)`, 'g'))]
  const last = found.at(-1)?.[1]
  if (last === undefined) throw new Error(`token ${name} not found`)
  return last.trim()
}

// A colour written as `#a8a8a8` or `rgb(30 30 30 / 0.72)`.
const rgb = (value: string): Color => {
  const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value)
  if (hex) {
    const [, hr, hg, hb] = hex
    return [Number.parseInt(hr!, 16), Number.parseInt(hg!, 16), Number.parseInt(hb!, 16), 1]
  }
  const fn = /^rgb\((\d+) (\d+) (\d+)(?: \/ ([\d.]+))?\)$/.exec(value)
  if (!fn) throw new Error(`not a colour: ${value}`)
  const [, r, g, b, a] = fn
  return [Number(r), Number(g), Number(b), a === undefined ? 1 : Number(a)]
}

const solid = (color: Color): Rgb => [color[0], color[1], color[2]]

const filter = (value: string): Filter => {
  const part = (name: string): number => Number(new RegExp(`${name}\\(([\\d.]+)`).exec(value)?.[1])
  return { blur: part('blur'), brightness: part('brightness'), saturate: part('saturate') }
}

// What a flat backdrop looks like through the glass: darkened, then covered by the tint. The blur and the saturation
// change nothing in a flat grey or white.
const behind = (tint: Color, f: Filter, backdrop: Rgb): Rgb => {
  const [tr, tg, tb, ta] = tint
  const [r, g, b] = backdrop
  const through = (value: number): number => (1 - ta) * value * f.brightness
  return [ta * tr + through(r), ta * tg + through(g), ta * tb + through(b)]
}

// WCAG 2.2 relative luminance and contrast ratio.
const channel = (value: number): number => {
  const unit = value / 255
  return unit <= 0.03928 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4
}
const luminance = ([r, g, b]: Rgb): number => {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}
const contrast = (words: Rgb, ground: Rgb): number => {
  const [light, dark] = [luminance(words), luminance(ground)].sort((a, b) => b - a)
  return (light! + 0.05) / (dark! + 0.05)
}

const WHITE: Rgb = [255, 255, 255]
const CANVAS: Rgb = [30, 30, 30]
const GLASS: Strength = { tint: '--glass', filter: '--glass-filter' }
const SOFT: Strength = { tint: '--glass-soft', filter: '--glass-soft-filter' }

// How a colour reads on a strength of glass over a flat backdrop.
const score = (name: string, strength: Strength, backdrop: Rgb): number => {
  const ground = behind(rgb(token(strength.tint)), filter(token(strength.filter)), backdrop)
  return contrast(solid(rgb(token(name))), ground)
}

// Colours that carry words need 4.5 to 1; icons, edges and fills need 3 to 1. `--touch`, `--mark` and `--faint` are
// the greys the plain-words audit gave them (the spec's table still named their older colours); `--accent` is the peach.
const ON_GLASS: [string, number][] = [
  ['--words', 4.5],
  ['--glass-quiet', 4.5],
  ['--touch', 4.5],
  ['--accent', 4.5],
  ['--agent', 4.5],
  ['--faint', 3],
  ['--mark', 3],
]
const ON_SOFT: [string, number][] = [
  ['--words', 4.5],
  ['--quiet', 4.5],
  ['--touch', 4.5],
  ['--accent', 4.5],
  ['--agent', 4.5],
  ['--faint', 3],
  ['--mark', 3],
]

test.each(ON_GLASS)('%s on glass over pure white is at least %d to 1', (name, least) => {
  expect(score(name, GLASS, WHITE)).toBeGreaterThanOrEqual(least)
})

test.each(ON_SOFT)('%s on soft glass over pure white is at least %d to 1', (name, least) => {
  expect(score(name, SOFT, WHITE)).toBeGreaterThanOrEqual(least)
})

test('the same colours pass over the dark canvas, on both strengths', () => {
  for (const [name, least] of ON_GLASS) {
    expect(score(name, GLASS, CANVAS), name).toBeGreaterThanOrEqual(least)
  }
  for (const [name, least] of ON_SOFT) {
    expect(score(name, SOFT, CANVAS), name).toBeGreaterThanOrEqual(least)
  }
})

test("today's quiet grey fails on glass over white, which is why --glass-quiet exists", () => {
  expect(score('--quiet', GLASS, WHITE)).toBeLessThan(4.5)
})

test("the tokens are the spec's", () => {
  expect(token('--glass')).toBe('rgb(30 30 30 / 0.72)')
  expect(token('--glass-filter')).toBe('blur(24px) brightness(0.45) saturate(1.4)')
  expect(token('--glass-edge')).toBe('rgb(255 255 255 / 0.10)')
  expect(token('--glass-shine')).toBe('inset 0 1px 0 rgb(255 255 255 / 0.06)')
  expect(token('--glass-quiet')).toBe('#a8a8a8')
  expect(token('--glass-soft')).toBe('rgb(37 37 37 / 0.92)')
  expect(token('--glass-soft-filter')).toBe('blur(12px) brightness(0.5) saturate(1.2)')
})

test('every backdrop-filter is written both ways, from a token, and never animated', () => {
  // The `@supports` line names both spellings only to ask whether the browser knows them.
  const lines = section.split('\n').filter((line) => !line.includes('@supports'))
  const plain = lines.filter((line) => /^\s*backdrop-filter:/.test(line))
  const webkit = lines.filter((line) => /^\s*-webkit-backdrop-filter:/.test(line))
  expect(plain.length).toBeGreaterThan(0)
  expect(webkit.length).toBe(plain.length)
  for (const line of [...plain, ...webkit]) {
    expect(line).toMatch(/:\s*(?:var\(--g-filter\)|var\(--s-filter\)|none);\s*$/)
  }
  expect(section).not.toMatch(/\b(?:transition|animation)[\w-]*\s*:/)
})

// The text of the `{ ... }` that follows an opening line, braces matched.
const block = (opening: string): string => {
  const at = section.indexOf(opening)
  expect(at, `${opening} is in the new section`).toBeGreaterThanOrEqual(0)
  const open = section.indexOf('{', at + opening.length)
  let depth = 0
  for (let i = open; i < section.length; i += 1) {
    if (section[i] === '{') depth += 1
    if (section[i] === '}') depth -= 1
    if (depth === 0) return section.slice(open, i + 1)
  }
  throw new Error(`${opening} is never closed`)
}

const SUPPORTS = '@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))'
const SOLID = [
  '--g-bg: var(--panel)',
  '--s-bg: var(--panel)',
  '--g-filter: none',
  '--s-filter: none',
  '--g-quiet: var(--quiet)',
]

test('glass turns solid in the four cases', () => {
  const cases = [
    block(SUPPORTS),
    block('@media (prefers-reduced-transparency: reduce)'),
    block('html body.sh.glass-off'),
    block('@media (prefers-contrast: more)'),
  ]
  for (const text of cases) {
    for (const line of SOLID) expect(text).toContain(line)
  }
  expect(cases[1]).toContain('html body.sh:not(.glass-on)')
  expect(cases[3]).toContain('--g-edge: var(--quiet)')
})
