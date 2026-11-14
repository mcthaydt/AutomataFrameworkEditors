import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from 'vitest'

const DIR = join(import.meta.dirname, '../../.github/workflows')
const names = readdirSync(DIR)

test('the only workflow is ci.yml: there is no release workflow', () => {
  expect(names).toEqual(['ci.yml'])
})

test('nothing publishes to npm', () => {
  const text = readFileSync(join(DIR, 'ci.yml'), 'utf8')
  expect(text).not.toMatch(/npm publish|pnpm publish|NPM_TOKEN|changeset/)
})

test('every action is pinned to a 40-character commit', () => {
  const text = readFileSync(join(DIR, 'ci.yml'), 'utf8')
  const uses = [...text.matchAll(/^\s*-?\s*uses:\s*(\S+)/gm)].map((m) => m[1] ?? '')
  expect(uses.length).toBeGreaterThan(0)
  for (const use of uses) expect(use).toMatch(/@[0-9a-f]{40}$/)
})
