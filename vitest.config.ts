// Five Vitest projects. Test file suffixes decide where a test runs:
//   *.test.ts          Node
//   *.browser.test.ts  Chromium, WebKit and Firefox (real layout, real pointer events)
//   *.journey.test.ts  Node, driving the built page in one real browser, once per engine (`ENGINE`)
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig, type ViteUserConfig } from 'vitest/config'

const ENGINES = ['chromium', 'webkit', 'firefox'] as const

const node = {
  extends: true,
  test: {
    name: 'node',
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['**/*.browser.test.ts', '**/*.journey.test.ts', '**/node_modules/**'],
  },
}

// One project per engine, so CI can run them as parallel jobs and a failing engine is named by the job.
const inBrowser = (engine: (typeof ENGINES)[number]) => ({
  extends: true,
  test: {
    name: engine,
    include: ['tests/**/*.browser.test.ts'],
    // A shared runner can be slow to start a page; a hang is still caught.
    testTimeout: 60_000,
    hookTimeout: 90_000,
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: engine }],
    },
  },
})

// The journeys start their own servers (Task 11), one test file at a time, on fixed ports.
const journeys = {
  extends: true,
  test: {
    name: 'journeys',
    environment: 'node',
    include: ['tests/journeys/**/*.journey.test.ts'],
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 90_000,
  },
}

// Annotated so the type of the export is explicit.
const config: ViteUserConfig = defineConfig({
  plugins: [svelte()],
  test: { projects: [node, ...ENGINES.map(inBrowser), journeys] },
})

export default config
