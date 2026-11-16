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
  const body = css.slice(css.indexOf('{', at) + 1, css.indexOf('}', at))
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
    '--glass': 'rgb(30 30 30 / 0.72)',
    '--glass-soft': 'rgb(37 37 37 / 0.92)',
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
  // Glass is the ground's grey at 72% over a level darkened to 45% brightness: the worst case is the lightest level.
  expect(ratio(token('--glass-quiet'), '#1e1e1e')).toBeGreaterThanOrEqual(4.6)
  expect(ratio(token('--words'), '#1e1e1e')).toBeGreaterThanOrEqual(4.6)
})

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
