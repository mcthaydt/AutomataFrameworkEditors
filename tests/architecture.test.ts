import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { expect, test } from 'vitest'
import { checkArchitecture, type SourceFiles } from './architecture/rules.ts'

const ROOT = join(import.meta.dirname, '..')

/** Every `.ts` and `.svelte` file under `dir`, keyed by its path from the repo root with `/`. A missing folder is empty. */
function readTree(dir: string, into: Record<string, string> = {}): SourceFiles {
  let entries: import('node:fs').Dirent[]
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return into
  }
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) readTree(path, into)
    else if (entry.name.endsWith('.ts') || entry.name.endsWith('.svelte'))
      into[relative(ROOT, path).split('\\').join('/')] = readFileSync(path, 'utf8')
  }
  return into
}

test('imports go down, nothing cycles, the page and the API stay apart, and every package stays in its place', () => {
  const files = { ...readTree(join(ROOT, 'src')), ...readTree(join(ROOT, 'functions')) }
  const violations = checkArchitecture(files)
  expect(violations.map((v) => `${v.file}: ${v.rule}: ${v.detail}`)).toEqual([])
})
