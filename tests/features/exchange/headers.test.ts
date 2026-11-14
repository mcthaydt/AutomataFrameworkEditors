import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from 'vitest'

// Cloudflare Pages reads `public/_headers` for the page's own files: a path, then indented `Name: value` lines.
const text = readFileSync(join(import.meta.dirname, '../../../public/_headers'), 'utf8')

/** The headers under one path pattern. */
function headersFor(path: string): Map<string, string> {
  const found = new Map<string, string>()
  let inside = false
  for (const line of text.split('\n')) {
    if (line.trim() === '' || line.startsWith('#')) continue
    if (!/^\s/.test(line)) {
      inside = line.trim() === path
      continue
    }
    if (!inside) continue
    const at = line.indexOf(':')
    found.set(line.slice(0, at).trim().toLowerCase(), line.slice(at + 1).trim())
  }
  return found
}

const all = headersFor('/*')

test("nothing is guessed from a file's contents", () =>
  expect(all.get('x-content-type-options')).toBe('nosniff'))

test('the sign-in code never leaves in a Referer', () =>
  expect(all.get('referrer-policy')).toBe('no-referrer'))

test('the page may load only from itself, and only talks to its own address', () => {
  const policy = all.get('content-security-policy') ?? ''
  const directives = new Map(
    policy
      .split(';')
      .map((d) => d.trim().split(/\s+/))
      .map(([name, ...rest]) => [name, rest]),
  )
  expect(directives.get('default-src')).toEqual(["'self'"])
  expect(directives.get('script-src')).toEqual(["'self'", "'wasm-unsafe-eval'"])
  expect(directives.get('connect-src')).toEqual(["'self'"])
  expect(directives.get('img-src')).toEqual(["'self'", 'data:'])
  expect(directives.get('frame-ancestors')).toEqual(["'none'"])
})
