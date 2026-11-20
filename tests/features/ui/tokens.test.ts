// The design language's colours (docs/design-language.md, section 2 and 4): the values, the contrast words need, and
// that no colour is written anywhere but ui.css.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from 'vitest'

const SRC = join(import.meta.dirname, '../../../src')
const css = readFileSync(join(SRC, 'features/ui/ui.css'), 'utf8')

/** The declarations inside the first rule whose selector is exactly `selector`. */
function rule(selector: string): Map<string, string> {
  const wanted = selector.replaceAll("'", '"')
  const at = css.indexOf(`${wanted} {`)
  if (at < 0) throw new Error(`no rule for ${selector}`)
  // A comment among the declarations is not one of them.
  const body = css.slice(css.indexOf('{', at) + 1, css.indexOf('}', at)).replace(/\/\*[\s\S]*?\*\//g, '')
  const found = new Map<string, string>()
  for (const line of body.split(';')) {
    const colon = line.indexOf(':')
    if (colon > 0)
      found.set(
        line.slice(0, colon).trim(),
        line
          .slice(colon + 1)
          .trim()
          .replace(/\s+/g, ' '),
      )
  }
  return found
}

const tokens = rule('.look')

test('the tokens are the design language table, by those names', () => {
  expect(Object.fromEntries(tokens)).toMatchObject({
    '--ground': '#1e1e1e',
    '--panel': '#252525',
    '--raised': '#2a2a2a',
    '--hover': '#333333',
    '--line': '#383838',
    '--words': '#ededed',
    '--quiet': '#9c9c9c',
    '--faint': '#8c8c8c',
    '--accent': '#eeb480',
    '--agent': '#b5b1d8',
    '--problem': '#e5484d',
    '--problem-words': '#ff8a80',
    '--glass-1-bg': 'rgb(30 30 30 / 0.72)',
    '--glass-1-filter': 'blur(16px) brightness(0.45) saturate(1.4)',
    '--glass-2-bg': 'rgb(30 30 30 / 0.76)',
    '--glass-2-filter': 'blur(24px) brightness(0.4) saturate(1.3)',
    '--glass-3-bg': 'rgb(30 30 30 / 0.8)',
    '--glass-3-filter': 'blur(32px) brightness(0.35) saturate(1.2)',
    '--dim-2': 'rgb(0 0 0 / 0.2)',
    '--dim-3': 'rgb(0 0 0 / 0.4)',
    '--glass-quiet': '#a8a8a8',
    '--row': '44px',
    '--bar': '56px',
  })
})

test('a mouse gets 30-point rows and a 48-point bar, a phone on its side a 44-point bar', () => {
  expect(rule(".look[data-rows='small']").get('--row')).toBe('30px')
  expect(rule(".look[data-rows='small']").get('--bar')).toBe('48px')
  expect(rule(".look[data-size='phone-sideways']").get('--bar')).toBe('44px')
})

const channel = (v: number): number => {
  const s = v / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}
function luminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16)
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
}
const ratio = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}
const token = (name: string): string => tokens.get(name) ?? ''

test('words are at least 4.6 to 1 on every surface they sit on', () => {
  expect(ratio(token('--words'), token('--panel'))).toBeGreaterThanOrEqual(4.6)
  expect(ratio(token('--quiet'), token('--panel'))).toBeGreaterThanOrEqual(4.6)
  expect(ratio(token('--quiet'), token('--raised'))).toBeGreaterThanOrEqual(4.6)
})

// What a person sees through a layer of glass over a flat level: the level darkened by the layer's brightness, then
// covered by its tint. A blur changes nothing in a flat colour, so a flat level is the worst case of a busy one: the
// whitest level gives the lightest glass, and the words are light.
function through(layer: 1 | 2 | 3, level: string): string {
  const tint = /rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)/.exec(token(`--glass-${layer}-bg`))
  const bright = Number(/brightness\(([\d.]+)\)/.exec(token(`--glass-${layer}-filter`))?.[1])
  if (tint === null || Number.isNaN(bright)) throw new Error(`layer ${layer} has no tint or brightness`)
  const alpha = Number(tint[4])
  const n = Number.parseInt(level.slice(1), 16)
  const mix = (channel: number, shift: number): number =>
    Math.round(alpha * channel + (1 - alpha) * ((n >> shift) & 255) * bright)
  const hex = (v: number): string => v.toString(16).padStart(2, '0')
  return `#${hex(mix(Number(tint[1]), 16))}${hex(mix(Number(tint[2]), 8))}${hex(mix(Number(tint[3]), 0))}`
}

test.each([1, 2, 3] as const)(
  'words are at least 4.6 to 1 on layer %i glass over a white level and a dark one',
  (layer) => {
    for (const level of ['#ffffff', '#9fd3f0', '#1e1e1e']) {
      expect(ratio(token('--words'), through(layer, level)), `words over ${level}`).toBeGreaterThanOrEqual(
        4.6,
      )
      expect(
        ratio(token('--glass-quiet'), through(layer, level)),
        `quiet over ${level}`,
      ).toBeGreaterThanOrEqual(4.6)
      // The other words drawn on glass: a pressed or chosen word, a word about an agent, and a problem (the audit of
      // 2026-11-20, N4).
      for (const kind of ['--accent', '--agent', '--problem-words'])
        expect(ratio(token(kind), through(layer, level)), `${kind} over ${level}`).toBeGreaterThanOrEqual(4.6)
    }
  },
)

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : [path]
  })
}

test('no colour is written in a stylesheet or a component, only in ui.css', () => {
  const found: string[] = []
  for (const path of files(SRC)) {
    if (!/\.(css|svelte)$/.test(path) || path.endsWith('features/ui/ui.css')) continue
    const text = readFileSync(path, 'utf8')
    if (/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/.test(text)) found.push(path.slice(SRC.length))
  }
  expect(found).toEqual([])
})
