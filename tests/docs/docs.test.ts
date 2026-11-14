// The set-up guide names every setting the code reads, and the team guide's example is a file the editor accepts.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { parseAccess } from '#src/features/access/access.ts'

const ROOT = join(import.meta.dirname, '../..')
const read = (path: string): string => readFileSync(join(ROOT, path), 'utf8')
const deploy = read('docs/deploy.md')
const teams = read('docs/teams.md')

const SETTINGS = [
  'VITE_GITHUB_CLIENT_ID',
  'VITE_GITHUB_APP_SLUG',
  'VITE_DEMO_GAME',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'GITHUB_APP_ID',
  'GITHUB_APP_PRIVATE_KEY',
  'DEMO_GAME',
]

test.each(SETTINGS)('docs/deploy.md names %s', (setting) => {
  expect(deploy).toContain(setting)
})

test('docs/deploy.md has the build command, the output folder, the callback and setup addresses and the permissions', () => {
  for (const words of ['pnpm build', '`dist`', 'Callback address', 'Setup address', 'Redirect on update']) {
    expect(deploy).toContain(words)
  }
  for (const permission of ['Contents', 'Pull requests', 'Checks', 'Metadata'])
    expect(deploy).toContain(permission)
})

test('docs/deploy.md says which Node and pnpm the site runs on', () => {
  expect(deploy).toContain('Node 24')
  expect(deploy).toContain('pnpm 10.34.6')
})

test('no file but .env.journeys and the tests sets a value for any of these settings', () => {
  const envFiles = readdirSync(ROOT).filter((name) => name.startsWith('.env'))
  expect(envFiles).toEqual(['.env.journeys'])
  expect(existsSync(join(ROOT, 'wrangler.toml'))).toBe(false)
})

test("docs/teams.md names the sharing file and its example passes the editor's own reading of it", () => {
  expect(teams).toContain('automata.access.toml')
  const example = /```toml\n([\s\S]*?)```/.exec(teams)?.[1]
  expect(example).toBeDefined()
  expect(parseAccess(example ?? '')).toMatchObject({ ok: true })
})

test('docs/teams.md has the optional branch rule, with the editor on its bypass list', () => {
  expect(teams).toContain('Require a pull request before merging')
  expect(teams).toContain('bypass list')
})
