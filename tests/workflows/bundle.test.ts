// Cloudflare limits the size of a Function, and the framework's physics and renderer must not ride along with the
// content readers. This bundles the Function the way a deploy does (one module, minified, nothing left outside) and
// checks what comes out.
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { expect, test } from 'vitest'

const ENTRY = fileURLToPath(new URL('../../functions/api/[[path]].ts', import.meta.url))
const LIMIT = 1_000_000

test("the API's Function bundles to under a megabyte, with no physics and no renderer in it", async () => {
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    ssr: { noExternal: true, target: 'webworker' },
    build: {
      ssr: ENTRY,
      write: false,
      minify: true,
      target: 'es2022',
      rollupOptions: { output: { format: 'es', inlineDynamicImports: true } },
    },
  })
  const outputs = (Array.isArray(result) ? result : [result]).flatMap((r) => ('output' in r ? r.output : []))
  const code = outputs.map((o) => (o.type === 'chunk' ? o.code : '')).join('\n')
  const assets = outputs.filter((o) => o.type === 'asset')
  expect(assets).toEqual([])
  // The size goes in the log so a drift shows before it reaches the limit.
  console.info(`the API's Function bundles to ${Buffer.byteLength(code)} bytes`)
  expect(Buffer.byteLength(code)).toBeLessThan(LIMIT)
  expect(code.toLowerCase()).not.toContain('rapier')
  expect(code.toLowerCase()).not.toContain('pixi')
  expect(code).toContain('onRequest')
})
