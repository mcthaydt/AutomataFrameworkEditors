import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from 'vitest'

const manifest = JSON.parse(readFileSync(join(import.meta.dirname, '../../package.json'), 'utf8')) as {
  private?: boolean
  scripts: Record<string, string>
  publishConfig?: unknown
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  pnpm: { onlyBuiltDependencies: string[] }
}

const FRAMEWORK = '@automataframework/framework'

// CLAUDE.md: no flag that lets an empty suite pass in CI. A run that finds no tests must fail, so a typo in a path or
// a filter can never turn a check green by testing nothing.
test('no script lets a run that finds no tests pass', () => {
  for (const [name, command] of Object.entries(manifest.scripts)) {
    expect(command, name).not.toMatch(/pass-?with-?no-?tests/i)
  }
})

test('nothing is published: the package is private and has no publish settings', () => {
  expect(manifest.private).toBe(true)
  expect(manifest.publishConfig).toBeUndefined()
})

test('the framework is a git dependency pinned to one commit', () => {
  expect(manifest.dependencies[FRAMEWORK]).toMatch(/^github:mcthaydt\/AutomataFramework#[0-9a-f]{40}$/)
})

test('pnpm may build that same commit (a git dependency has a prepare script)', () => {
  const commit = /#([0-9a-f]{40})$/.exec(manifest.dependencies[FRAMEWORK] ?? '')?.[1]
  expect(manifest.pnpm.onlyBuiltDependencies).toContain(
    `${FRAMEWORK}@https://codeload.github.com/mcthaydt/AutomataFramework/tar.gz/${commit}`,
  )
})

test('every other dependency version is exact', () => {
  const rest = Object.entries({ ...manifest.dependencies, ...manifest.devDependencies }).filter(
    ([name]) => name !== FRAMEWORK,
  )
  for (const [name, version] of rest) expect(version, name).toMatch(/^\d+\.\d+\.\d+$/)
})

const LOOK_PACKAGES = [
  '@fontsource-variable/fraunces',
  '@fontsource-variable/onest',
  '@fontsource/jetbrains-mono',
  '@fontsource/noto-sans-jp',
  '@fontsource/noto-sans-kr',
  '@fontsource/noto-sans-sc',
  '@phosphor-icons/core',
] as const

test('the look needs seven packages, all development-only', () => {
  for (const name of LOOK_PACKAGES) {
    expect(manifest.devDependencies[name], name).toBeDefined()
    expect(manifest.dependencies[name], name).toBeUndefined()
  }
})

test('the licences of those seven are in public/licences.txt, at the version installed', () => {
  const notices = readFileSync(join(import.meta.dirname, '../../public/licences.txt'), 'utf8')
  for (const name of LOOK_PACKAGES) {
    expect(notices, name).toContain(name)
    expect(notices, name).toContain(manifest.devDependencies[name] ?? '')
  }
})
