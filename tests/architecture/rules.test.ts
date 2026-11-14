import { expect, test } from 'vitest'
import { checkArchitecture, type SourceFiles } from './rules.ts'

// Each case is a made-up file map with exactly one fault, so the answer is one rule's name. Files in a feature
// folder are named after the feature's entry, so `feature-has-entry` stays quiet unless it is the one under test.
const one = (files: SourceFiles) => checkArchitecture(files).map((v) => v.rule)

test('a feature may not import a feature above it', () =>
  expect(one({ 'src/features/access/access.ts': "import '../wire/wire.ts'" })).toEqual(['imports-go-down']))

test('another feature is imported through its entry file', () =>
  expect(one({ 'src/features/game/game.ts': "import '../api/client.ts'" })).toEqual(['through-the-entry']))

test('lib imports no feature', () =>
  expect(one({ 'src/lib/a.ts': "import '../features/words/words.ts'" })).toEqual(['lib-is-below-features']))

test('no cycles', () =>
  expect(one({ 'src/lib/a.ts': "import './b.ts'", 'src/lib/b.ts': "import './a.ts'" })).toEqual([
    'no-cycles',
  ]))

test('a cycle that only types take part in is not a cycle', () =>
  expect(
    one({
      'src/lib/a.ts': "import type { B } from './b.ts'\nexport type A = B",
      'src/lib/b.ts': "import type { A } from './a.ts'\nexport type B = A",
    }),
  ).toEqual([]))

test('no tests in src', () => expect(one({ 'src/lib/a.test.ts': '' })).toEqual(['no-tests-in-src']))

test('a Svelte file is read like any other', () =>
  expect(
    one({
      'src/features/ui/ui.ts': '',
      'src/features/ui/A.svelte': '<script lang="ts">import \'../suite/suite.ts\'</script>',
    }),
  ).toEqual(['imports-go-down']))

test('Pixi stays in the level canvas', () =>
  expect(one({ 'src/features/levels/levels.ts': "import { Graphics } from 'pixi.js'" })).toEqual([
    'package-confined',
  ]))

test('Pixi is welcome in the level canvas', () =>
  expect(
    one({
      'src/features/levels/levels.ts': '',
      'src/features/levels/level-canvas.ts': "import { Graphics } from 'pixi.js'",
    }),
  ).toEqual([]))

test('TOML is read only by the sharing file', () =>
  expect(one({ 'src/features/game/game.ts': "import { parse } from 'smol-toml'" })).toEqual([
    'package-confined',
  ]))

test('Svelte stays on the page side', () =>
  expect(one({ 'src/features/service/service.ts': "import { mount } from 'svelte'" })).toEqual([
    'package-confined',
  ]))

test('the API side takes the framework from its headless entry only', () =>
  expect(
    one({ 'src/features/service/service.ts': "import { loadGame } from '@automataframework/framework'" }),
  ).toEqual(['package-confined']))

test('the API side uses nothing a page has', () =>
  expect(one({ 'src/features/service/service.ts': 'localStorage.getItem("x")' })).toEqual([
    'api-side-has-no-page',
  ]))

test('the page side never imports the API side', () =>
  expect(one({ 'src/features/api/api.ts': "import '../github/github.ts'" })).toEqual([
    'page-never-imports-api-side',
  ]))

test("the page never calls GitHub's API itself", () =>
  expect(one({ 'src/features/game/game.ts': "fetch('https://api.github.com/user')" })).toEqual([
    'page-calls-only-its-api',
  ]))

test('a function is a thin wrapper over the service feature', () =>
  expect(one({ 'functions/api/a.ts': "import '../../src/features/github/github.ts'" })).toEqual([
    'functions-use-service',
  ]))

test('a function may import the service entry', () =>
  expect(one({ 'functions/api/a.ts': "import '../../src/features/service/service.ts'" })).toEqual([]))

test('a file has at most 600 lines', () =>
  expect(one({ 'src/lib/a.ts': 'x\n'.repeat(601) })).toEqual(['at-most-600-lines']))

test('a feature folder has its entry file', () =>
  expect(one({ 'src/features/game/open.ts': '' })).toEqual(['feature-has-entry']))

test('a feature that is not in the list is named', () =>
  expect(one({ 'src/features/zzz/zzz.ts': '' })).toEqual(['unknown-feature']))

// The rules also have to stay quiet on honest code.
test('a clean map has no violations', () =>
  expect(
    checkArchitecture({
      'src/lib/a.ts': 'export const a = 1',
      'src/features/words/words.ts': "import { a } from '../../lib/a.ts'\nexport const b = a",
      'src/features/access/access.ts': "import { b } from '../words/words.ts'\nexport const c = b",
      'src/features/ui/ui.ts': "import { c } from '../access/access.ts'\nexport const d = c",
      'src/features/ui/Button.svelte': '<script lang="ts">import { d } from "./ui.ts"</script>',
      'functions/api/a.ts': '',
    }),
  ).toEqual([]))

test('comments may name what a rule forbids', () =>
  expect(
    one({
      'src/features/service/service.ts':
        '// no window here, and never api.github.com in a page\n/* nor localStorage */\nexport const a = 1',
    }),
  ).toEqual([]))
