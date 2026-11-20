import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from 'vitest'

const DIR = join(import.meta.dirname, '../../.github/workflows')
const names = readdirSync(DIR)

test('the workflows are ci.yml, the commit-authors check and the closed-branch cleanup: there is no release workflow', () => {
  expect(names).toEqual(['ci.yml', 'commit-authors.yml', 'delete-closed-pr-branch.yml'])
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

// The screens job writes every run's pictures to the one `ci-screens` branch. GitHub keeps only the newest waiting job
// per concurrency group, so a group every run shares let a waiting job on main be dropped (main 5021c69 went red that
// way). Each push gets its own group and each pull request one per branch; the push then starts again from a fresh
// fetch when another writer got there first.
test('the screens job never shares one queue across runs, and its push starts again when refused', () => {
  const text = readFileSync(join(DIR, 'ci.yml'), 'utf8')
  const job = text.slice(text.indexOf('\n  screens:\n'), text.indexOf('\n  gate:\n'))
  const group = job.match(/concurrency:\n\s+group:\s*(.+)\n\s+cancel-in-progress:\s*(\S+)/)
  expect(group?.[1]).toContain('github.ref')
  expect(group?.[1]).toContain('github.sha')
  expect(group?.[2]).toBe('false')
  expect(job).toMatch(/for try in 1 2 3; do/)
  expect(job).toMatch(/rm -rf "\$RUNNER_TEMP\/branch"/)
  expect(job).toMatch(/after 3 tries[^\n]*\n\s+exit 1/)
  // main's head is read on its own line, so a failed read fails the try instead of skipping the pictures.
  expect(job).toMatch(/^\s+head="\$\(gh api "repos\/\$GITHUB_REPOSITORY\/commits\/main" --jq \.sha\)"$/m)
})

// The browser shards and the mockups run in Playwright's own image, so no job installs a browser or its system
// libraries (that install took 40 s to 12 minutes of a shard's setup). The image is pinned by digest and names the
// same Playwright as the lockfile, so the browsers are the ones the tests were written against.
test('the browser jobs run in the pinned Playwright image of the locked Playwright, and nothing installs a browser', () => {
  const text = readFileSync(join(DIR, 'ci.yml'), 'utf8')
  const lock = readFileSync(join(import.meta.dirname, '../../pnpm-lock.yaml'), 'utf8')
  const locked = lock.match(/^ {2}playwright@(\d+\.\d+\.\d+):/m)?.[1]
  expect(locked).toBeDefined()
  const images = [...text.matchAll(/mcr\.microsoft\.com\/playwright:v([\d.]+)-noble@sha256:[0-9a-f]{64}/g)]
  // One for the browser shards, one for the mockups.
  expect(images.map((m) => m[1])).toEqual([locked, locked])
  for (const job of ['browsers', 'mockups']) {
    const start = text.indexOf(`\n  ${job}:\n`)
    const body = text.slice(start, text.indexOf('\n\n  #', start))
    expect(body).toMatch(/container:\n\s+image:.*mcr\.microsoft\.com\/playwright/)
    expect(body).toMatch(/options: --user 1001 --ipc=host/)
  }
  expect(text).not.toMatch(/playwright install/)
})
