// Takes the mockups' pictures, in CI only: every page in this folder at the five sizes the editors are designed
// for, with Chromium, at twice the pixels so a person can read them. It serves the repository over a tiny local
// server (the icons and fonts come from node_modules, and a mask image must share the page's origin), and writes
// `mockup-screens/<page>-<size>.png`, which the `mockups` job uploads for the `screens` job to put on `ci-screens`.
import { mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'
import { chromium } from 'playwright'

const ROOT = join(import.meta.dirname, '../..')
const OUT = join(ROOT, 'mockup-screens')
const TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
}
// The first size is an iPad Pro 11-inch held sideways (the Owner, 2026-11-15). Phones and iPads are touched, so they
// say so (rows stay 44 points); the computer has a mouse (small rows).
const SIZES = {
  ipadSideways: { viewport: { width: 1210, height: 834 }, hasTouch: true },
  desktop: { viewport: { width: 1280, height: 800 }, hasTouch: false },
  ipadUpright: { viewport: { width: 834, height: 1210 }, hasTouch: true },
  phone: { viewport: { width: 390, height: 844 }, hasTouch: true },
  phoneSideways: { viewport: { width: 844, height: 390 }, hasTouch: true },
}

const server = createServer((request, response) => {
  const path = normalize(decodeURIComponent(new URL(request.url ?? '/', 'http://x').pathname))
  try {
    const body = readFileSync(join(ROOT, path))
    response.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' })
    response.end(body)
  } catch {
    response.writeHead(404)
    response.end()
  }
})
await new Promise((resolve) => server.listen(0, resolve))
const base = `http://127.0.0.1:${server.address().port}/docs/mockups/`

mkdirSync(OUT, { recursive: true })
const pages = readdirSync(import.meta.dirname).filter((name) => name.endsWith('.html') && name !== 'index.html')
const browser = await chromium.launch()
for (const [size, { viewport, hasTouch }] of Object.entries(SIZES)) {
  const context = await browser.newContext({ viewport, hasTouch, deviceScaleFactor: 2 })
  const page = await context.newPage()
  for (const name of pages) {
    await page.goto(base + name, { waitUntil: 'networkidle' })
    await page.waitForSelector('html[data-ready="yes"]')
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({ path: join(OUT, `${name.replace('.html', '')}-${size}.png`) })
  }
  await context.close()
}
await browser.close()
server.close()
console.log(`Took ${pages.length * Object.keys(SIZES).length} pictures of ${pages.length} mockups.`)
