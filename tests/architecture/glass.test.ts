// Glass everywhere, from one place (the Owner, 2026-11-17): every bar, panel, menu, sheet and dialog is see-through,
// and how much it blurs and dims what is behind it comes from its layer, set once in `ui.css`. So no component may
// paint its own panel, blur or dim: it wears one of the kit's layer classes (`glass-1`, `glass-2`, `glass-3`, and
// `dim-2`, `dim-3` behind what covers the screen). Read as text; nothing here draws.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { expect, test } from 'vitest'

const ROOT = join(import.meta.dirname, '../..')
const SRC = join(ROOT, 'src')
const KIT = 'src/features/ui/ui.css'

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : [path]
  })
}

/** Every style sheet and component but the kit's own, as [path from the repo root, text]. */
const sources = (): [string, string][] =>
  files(SRC)
    .filter((path) => /\.(css|svelte)$/.test(path))
    .map(
      (path) => [relative(ROOT, path).split('\\').join('/'), readFileSync(path, 'utf8')] as [string, string],
    )
    .filter(([path]) => path !== KIT && !path.endsWith('/fonts.css'))

/** The tokens only the kit's layer classes may read: a panel's fill, its blur and what dims the screen behind it. */
const SURFACE_TOKENS =
  /var\(\s*--(?:panel|surface|glass(?:-soft)?(?:-filter)?|glass-\d-(?:bg|filter)|[gs]-(?:bg|filter)|dim(?:-\d)?(?:-filter)?)\s*[,)]/

test('no component blurs what is behind it: only the kit layers do', () => {
  const found = sources()
    .filter(([, text]) => /(?:^|[\s;{])(?:-webkit-)?backdrop-filter\s*:/m.test(text))
    .map(([path]) => path)
  expect(found).toEqual([])
})

test('no component paints its own panel or dim: only the kit layers do', () => {
  const found: string[] = []
  for (const [path, text] of sources()) {
    text.split('\n').forEach((line, at) => {
      if (SURFACE_TOKENS.test(line)) found.push(`${path}:${at + 1}: ${line.trim()}`)
    })
  }
  expect(found).toEqual([])
})

const kit = readFileSync(join(ROOT, KIT), 'utf8')

test('the kit has the three layers and the two dims, each from its tokens', () => {
  for (const n of [1, 2, 3]) {
    const at = kit.indexOf(`.look .glass-${n} {`)
    expect(at, `.glass-${n}`).toBeGreaterThanOrEqual(0)
    const body = kit.slice(at, kit.indexOf('}', at))
    expect(body).toContain(`background: var(--glass-${n}-bg)`)
    expect(body).toContain(`backdrop-filter: var(--glass-${n}-filter)`)
    expect(body).toContain(`-webkit-backdrop-filter: var(--glass-${n}-filter)`)
  }
  for (const n of [2, 3]) {
    const at = kit.indexOf(`.look .dim-${n} {`)
    expect(at, `.dim-${n}`).toBeGreaterThanOrEqual(0)
    const body = kit.slice(at, kit.indexOf('}', at))
    expect(body).toContain(`background: var(--dim-${n})`)
    expect(body).toContain(`backdrop-filter: var(--dim-${n}-filter)`)
  }
})

/** A token's first value in the `.look` rule. */
const lookToken = (name: string): string => {
  const at = kit.indexOf('.look {')
  const body = kit.slice(at, kit.indexOf('}', at))
  const match = new RegExp(`${name}:\\s*([^;]+);`).exec(body)
  if (match === null) throw new Error(`no ${name} in .look`)
  return (match[1] ?? '').trim().replace(/\s+/g, ' ')
}
const blurOf = (value: string): number => Number(/blur\(([\d.]+)px\)/.exec(value)?.[1] ?? 0)
const brightnessOf = (value: string): number => Number(/brightness\(([\d.]+)\)/.exec(value)?.[1] ?? 1)
const alphaOf = (value: string): number => Number(/\/\s*([\d.]+)\)/.exec(value)?.[1] ?? 1)

test('the higher the layer, the more it blurs and darkens what is behind it', () => {
  const blur = [1, 2, 3].map((n) => blurOf(lookToken(`--glass-${n}-filter`)))
  const bright = [1, 2, 3].map((n) => brightnessOf(lookToken(`--glass-${n}-filter`)))
  expect(blur[0]).toBeLessThan(blur[1]!)
  expect(blur[1]).toBeLessThan(blur[2]!)
  expect(bright[0]).toBeGreaterThan(bright[1]!)
  expect(bright[1]).toBeGreaterThan(bright[2]!)
  // A bar dims nothing; a sheet's screen behind is dimmed, and a dialog's more and softly blurred.
  expect(alphaOf(lookToken('--dim-2'))).toBeLessThan(alphaOf(lookToken('--dim-3')))
  expect(blurOf(lookToken('--dim-2-filter'))).toBeLessThan(blurOf(lookToken('--dim-3-filter')))
})
