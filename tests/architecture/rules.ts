// Lifted from AutomataFramework@ec4fddd: tests/architecture/rules.ts
// The repo's architecture rules, as one pure function over made-up or real file maps.
// `tests/architecture.test.ts` runs it over `src/` and `functions/`; `rules.test.ts` proves each rule fires on a small
// made-up map. Nothing here reads the file system, so a rule can be tested without one.

/** Feature folders, lowest first. A feature may import only itself, `src/lib/` and features before it in this list. */
export const LAYERS = [
  'words',
  'access',
  'wire',
  'exchange',
  'github',
  'service',
  'ui',
  'api',
  'session',
  'game',
  'levels',
  'suite',
] as const

/** The features that run on Cloudflare as the API: nothing of a page. `access` and `wire` are shared with the page. */
export const API_SIDE = ['exchange', 'github', 'service'] as const
/** The features that run in the browser. They never import the API side; the two sides meet in `wire` and `access`. */
export const PAGE_SIDE = ['ui', 'api', 'session', 'game', 'levels', 'suite'] as const

/** Path from the repo root (with `/`) to the file's text. */
export type SourceFiles = Readonly<Record<string, string>>

export interface Violation {
  readonly file: string
  readonly rule: string
  readonly detail: string
}

const MAX_LINES = 600
const API_SET: ReadonlySet<string> = new Set(API_SIDE)
const PAGE_SET: ReadonlySet<string> = new Set(PAGE_SIDE)
/** Code the API runs must not need a page: these features and the two shared ones. */
const NO_PAGE: ReadonlySet<string> = new Set([...API_SIDE, 'access', 'wire'])
const NO_PAGE_PATTERN = /\b(?:window|document|localStorage|sessionStorage|navigator)\b/
/** The only file that may draw with Pixi. */
const PIXI_FILE = 'src/features/levels/level-canvas.ts'
/** The only file a Cloudflare Function may import. */
const SERVICE_ENTRY = 'src/features/service/service.ts'

interface Source {
  readonly file: string
  readonly text: string
  readonly lines: number
  /** Resolved paths of relative imports; need not exist in the map. */
  readonly local: readonly string[]
  /** The part of `local` that exists at run time: `import type` and `export type` are erased and cannot cycle. */
  readonly runtime: readonly string[]
  /** Bare specifiers (packages, `node:` modules). */
  readonly packages: readonly string[]
}

/** Comments say why and may name the very things a rule forbids, so rules read the code without them. */
function withoutComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(?<![:'"`\w])\/\/.*$/gm, '')
}

const IMPORT_PATTERNS: readonly RegExp[] = [
  /\b(?:import|export)\s[^'";]*?\bfrom\s*['"]([^'"]+)['"]/g,
  /\bimport\s*['"]([^'"]+)['"]/g,
  /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
]

interface Specifier {
  readonly spec: string
  /** `import type ... from` or `export type ... from`: gone after compiling. */
  readonly typeOnly: boolean
}

function specifiers(code: string): Specifier[] {
  const found: Specifier[] = []
  for (const pattern of IMPORT_PATTERNS) {
    for (const m of code.matchAll(pattern)) {
      found.push({ spec: m[1] ?? '', typeOnly: /^(?:import|export)\s+type\b/.test(m[0]) })
    }
  }
  return found
}

/** `from` is a file path; `to` a relative specifier. Gives a normalised path from the repo root. */
function resolve(from: string, to: string): string {
  const parts = from.split('/').slice(0, -1)
  for (const part of to.split('/')) {
    if (part === '.' || part === '') continue
    if (part === '..') parts.pop()
    else parts.push(part)
  }
  return parts.join('/')
}

function read(file: string, text: string): Source {
  const code = withoutComments(text)
  const local: string[] = []
  const runtime: string[] = []
  const packages: string[] = []
  for (const { spec, typeOnly } of specifiers(code)) {
    const path = spec.startsWith('.')
      ? resolve(file, spec)
      : spec.startsWith('#src/')
        ? `src/${spec.slice(5)}`
        : undefined
    if (path === undefined) packages.push(spec)
    else {
      local.push(path)
      if (!typeOnly) runtime.push(path)
    }
  }
  const lines = text.split('\n')
  if (lines[lines.length - 1] === '') lines.pop()
  return { file, text: code, lines: lines.length, local, runtime, packages }
}

/** The feature a path is in, or undefined (`src/features/<name>/...`). */
function featureOf(path: string): string | undefined {
  return /^src\/features\/([^/]+)\//.exec(path)?.[1]
}

/** Strongly connected groups of more than one file, or one file that imports itself. */
function cycles(sources: ReadonlyMap<string, Source>): string[][] {
  // Tarjan's algorithm, iterative enough for a source tree: depth is bounded by the import chain.
  let counter = 0
  const index = new Map<string, number>()
  const low = new Map<string, number>()
  const stack: string[] = []
  const onStack = new Set<string>()
  const groups: string[][] = []
  const visit = (file: string): void => {
    index.set(file, counter)
    low.set(file, counter)
    counter++
    stack.push(file)
    onStack.add(file)
    for (const next of sources.get(file)?.runtime ?? []) {
      if (!sources.has(next)) continue
      if (!index.has(next)) {
        visit(next)
        low.set(file, Math.min(low.get(file) ?? 0, low.get(next) ?? 0))
      } else if (onStack.has(next)) {
        low.set(file, Math.min(low.get(file) ?? 0, index.get(next) ?? 0))
      }
    }
    if (low.get(file) === index.get(file)) {
      const group: string[] = []
      for (let top = stack.pop(); top !== undefined; top = stack.pop()) {
        onStack.delete(top)
        group.push(top)
        if (top === file) break
      }
      if (group.length > 1 || sources.get(file)?.runtime.includes(file)) groups.push(group.sort())
    }
  }
  for (const file of [...sources.keys()].sort()) if (!index.has(file)) visit(file)
  return groups
}

/** Every broken rule, sorted by file then rule, so two runs read the same. An empty list is a clean tree. */
export function checkArchitecture(files: SourceFiles): Violation[] {
  const out: Violation[] = []
  const add = (file: string, rule: string, detail: string): number => out.push({ file, rule, detail })
  const sources = new Map<string, Source>()
  for (const [file, text] of Object.entries(files)) sources.set(file, read(file, text))
  const layerOf = (feature: string): number => (LAYERS as readonly string[]).indexOf(feature)

  for (const source of sources.values()) {
    const { file } = source
    const feature = featureOf(file)
    const onApiSide = file.startsWith('functions/') || (feature !== undefined && NO_PAGE.has(feature))
    const onPageSide = feature !== undefined && PAGE_SET.has(feature)

    if (source.lines > MAX_LINES)
      add(file, 'at-most-600-lines', `${source.lines} lines; split the file by job.`)
    if (file.startsWith('src/') && /\.test\.ts$/.test(file)) {
      add(file, 'no-tests-in-src', 'Tests live in tests/, mirroring src/.')
    }

    if (feature !== undefined && layerOf(feature) < 0) {
      add(file, 'unknown-feature', `"${feature}" is not one of: ${LAYERS.join(', ')}.`)
    }

    for (const target of source.local) {
      const into = featureOf(target)
      if (file.startsWith('src/lib/') && target.startsWith('src/features/')) {
        add(file, 'lib-is-below-features', `lib may not import ${target}.`)
        continue
      }
      if (file.startsWith('functions/') && target !== SERVICE_ENTRY) {
        add(file, 'functions-use-service', `A function imports only ${SERVICE_ENTRY}, not ${target}.`)
        continue
      }
      if (into === undefined || into === feature) continue
      if (feature !== undefined && layerOf(into) > layerOf(feature)) {
        add(file, 'imports-go-down', `${feature} may not import ${into}, which is above it.`)
      }
      if (target !== `src/features/${into}/${into}.ts`) {
        add(
          file,
          'through-the-entry',
          `Import ${into} through src/features/${into}/${into}.ts, not ${target}.`,
        )
      }
      if (onPageSide && API_SET.has(into)) {
        add(file, 'page-never-imports-api-side', `${feature} runs in the page and may not import ${into}.`)
      }
    }

    if (onApiSide && NO_PAGE_PATTERN.test(source.text)) {
      add(
        file,
        'api-side-has-no-page',
        'The API runs on Cloudflare: no window, document, storage or navigator.',
      )
    }
    if (onPageSide && source.text.includes('api.github.com')) {
      add(file, 'page-calls-only-its-api', "The page talks to this site's /api and never to GitHub's API.")
    }

    for (const spec of source.packages) {
      if (spec === 'effect' || spec.startsWith('effect/') || spec.startsWith('@effect/')) {
        add(file, 'package-confined', 'Effect is not used here: the API is plain TypeScript.')
      }
      if (/^pixi\.js(\/|$)/.test(spec) && file !== PIXI_FILE) {
        add(
          file,
          'package-confined',
          `${spec} is only for ${PIXI_FILE}: PixiJS draws the level and nothing else.`,
        )
      }
      if (spec === 'smol-toml' && feature !== 'access') {
        add(
          file,
          'package-confined',
          'smol-toml is only for src/features/access/: TOML is read by the sharing file.',
        )
      }
      if (spec === 'svelte' || spec.startsWith('svelte/')) {
        if (!onPageSide) add(file, 'package-confined', `${spec} is only for the page side.`)
      }
      if (spec === '@automataframework/framework' && onApiSide) {
        add(file, 'package-confined', 'The API side imports the framework only from its /headless entry.')
      }
    }
  }

  for (const group of cycles(sources))
    add(group[0] ?? '', 'no-cycles', `Import cycle: ${group.join(' -> ')}.`)

  // Features that have files must have their entry beside them.
  const seen = new Set<string>()
  for (const file of sources.keys()) {
    const feature = featureOf(file)
    if (feature === undefined || seen.has(feature)) continue
    seen.add(feature)
    if (!sources.has(`src/features/${feature}/${feature}.ts`)) {
      add(file, 'feature-has-entry', `src/features/${feature}/ needs ${feature}.ts, the feature's entry.`)
    }
  }

  return out.sort((a, b) => (a.file === b.file ? a.rule.localeCompare(b.rule) : a.file.localeCompare(b.file)))
}
