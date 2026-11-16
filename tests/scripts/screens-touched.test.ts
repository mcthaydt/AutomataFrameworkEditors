import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { EVERY_SCENE, SCREEN_FILES, scenesFor } from '../../scripts/screens-touched.ts'

const journey = readFileSync(new URL('../journeys/screens.journey.test.ts', import.meta.url), 'utf8')
const SCENES = [...journey.matchAll(/^ {4}name: '([^']+)'/gm)].map((match) => match[1] ?? '')

test('the journey has scenes to read', () => {
  expect(SCENES.length).toBeGreaterThan(20)
})

test('every scene is drawn by at least one screen file, so no picture can be left out of every list', () => {
  for (const scene of SCENES) {
    const owners = Object.values(SCREEN_FILES).filter((pattern) => new RegExp(pattern).test(scene))
    expect(owners.length, scene).toBeGreaterThan(0)
  }
})

test('every pattern names a scene that exists, and every screen file exists', () => {
  for (const [file, pattern] of Object.entries(SCREEN_FILES)) {
    expect(SCENES.some((scene) => new RegExp(pattern).test(scene)), file).toBe(true)
    expect(() => readFileSync(new URL(`../../${file}`, import.meta.url)), file).not.toThrow()
  }
})

test('a change to one screen takes only the pictures of the scenes it draws', () => {
  expect(scenesFor(['src/features/suite/Share.svelte'])).toBe('share-')
  expect(scenesFor(['src/features/suite/Share.svelte', 'src/features/suite/Waiting.svelte'])).toBe(
    'share-|waiting-list',
  )
})

test('a change to anything seen that no one screen owns takes every picture', () => {
  const shared = [
    'src/features/ui/Button.svelte',
    'src/features/words/words.ts',
    'src/features/suite/App.svelte',
    'src/styles.css',
    'index.html',
    'tests/journeys/screens.journey.test.ts',
  ]
  for (const file of shared) {
    expect(scenesFor(['src/features/suite/Share.svelte', file]), file).toBe(EVERY_SCENE)
  }
})

test('a change that nothing sees names every scene, which `plan` turns off by the pictures flag instead', () => {
  expect(scenesFor(['src/features/game/save.ts'])).toBe(EVERY_SCENE)
  expect(scenesFor(['src/features/suite/Share.svelte', 'src/features/game/save.ts'])).toBe('share-')
})
