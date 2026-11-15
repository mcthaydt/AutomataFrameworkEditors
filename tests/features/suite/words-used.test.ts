// The words, kept honest: none is dead, and no screen carries a sentence of its own.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { WORDS } from '#src/features/words/words.ts'

const SRC = join(import.meta.dirname, '../../../src')
function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)],
  )
}
const all = files(SRC)
const read = (path: string): string => readFileSync(path, 'utf8')
const WORDS_FILE = join(SRC, 'features/words/words.ts')

test('every word in WORDS is used by a screen or by the code behind one', () => {
  const code = all
    .filter((path) => path !== WORDS_FILE && /\.(ts|svelte)$/.test(path))
    .map(read)
    .join('\n')
  const dead = Object.keys(WORDS).filter((key) => !new RegExp(`WORDS\\.${key}\\b`).test(code))
  expect(dead).toEqual([])
})

/** The markup of a `.svelte` file with its script, style, comments and `{...}` expressions taken out. */
function markupOf(source: string): string {
  return source
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\{[^{}]*\}/g, '')
    .replace(/\{[^{}]*\}/g, '')
}

test('no screen has a sentence written into its markup: every word comes from WORDS', () => {
  const found: string[] = []
  for (const path of all.filter((p) => p.endsWith('.svelte'))) {
    const markup = markupOf(read(path))
    // Text between tags.
    for (const match of markup.matchAll(/>([^<>]*)</g)) {
      const text = (match[1] ?? '').trim()
      if (/[A-Za-z]{2,}/.test(text)) found.push(`${path}: "${text}"`)
    }
    // Words in attributes that a person reads or hears.
    for (const match of markup.matchAll(/\b(aria-label|title|placeholder|alt)="([^"]*[A-Za-z]{2,}[^"]*)"/g)) {
      found.push(`${path}: ${match[1]}="${match[2]}"`)
    }
  }
  expect(found).toEqual([])
})
