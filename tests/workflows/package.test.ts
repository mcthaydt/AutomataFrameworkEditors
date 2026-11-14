import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from 'vitest'

const manifest = JSON.parse(readFileSync(join(import.meta.dirname, '../../package.json'), 'utf8')) as {
  private?: boolean
  publishConfig?: unknown
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  pnpm: { onlyBuiltDependencies: string[] }
}

const FRAMEWORK = '@automataframework/framework'

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
