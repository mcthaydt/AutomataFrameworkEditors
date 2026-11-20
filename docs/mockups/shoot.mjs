// Takes the mockups' pictures, in CI only: every page in this folder at the five sizes the editors are designed
// for, with Chromium, at twice the pixels so a person can read them. It serves the repository over a tiny local
// server (the icons and fonts are in assets/, and a mask image must share the page's origin), and writes
// `mockup-screens/<page>-<size>.png`, which the `mockups` job uploads for the `screens` job to put on `ci-screens`.
// Before each picture it also looks at the glass (the Owner, 2026-11-15, floating glass docks): a panel that blurs what
// is behind it must never sit inside another one (the spec's "never glass inside glass"), and the share of the window
// the wide blur covers is counted, because blur costs speed on an iPad. It fails the run for glass inside glass, after
// every picture is written so they still upload, and prints each page and size that is over 40% for the Owner's
// speed test to judge.
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

// Run in the page: every element that blurs what is behind it, the ones inside another such element, and how much of
// the window the wide blur (24 points, the docks' glass) covers.
const lookAtGlass = () => {
  const named = (el) => `${el.tagName.toLowerCase()}${typeof el.className === 'string' && el.className.trim() ? `.${el.className.trim().split(/\s+/).join('.')}` : ''}`
  const blur = (el) => {
    const style = getComputedStyle(el)
    return style.backdropFilter || style.webkitBackdropFilter || 'none'
  }
  const glass = [...document.querySelectorAll('body *')].filter((el) => {
    const style = getComputedStyle(el)
    const box = el.getBoundingClientRect()
    return style.display !== 'none' && style.visibility !== 'hidden' && box.width > 0 && box.height > 0 && blur(el) !== 'none'
  })
  const nested = glass.filter((el) => glass.some((other) => other !== el && other.contains(el))).map(named)
  let area = 0
  for (const el of glass) {
    if (!blur(el).includes('blur(24px)')) continue
    const box = el.getBoundingClientRect()
    const across = Math.min(box.right, innerWidth) - Math.max(box.left, 0)
    const down = Math.min(box.bottom, innerHeight) - Math.max(box.top, 0)
    if (across > 0 && down > 0) area += across * down
  }
  return { nested, share: area / (innerWidth * innerHeight) }
}

mkdirSync(OUT, { recursive: true })
const pages = readdirSync(import.meta.dirname).filter((name) => name.endsWith('.html') && name !== 'index.html')
const browser = await chromium.launch()
// The five sizes are shot side by side, one page each, which takes about a quarter of the time of one after another on
// CI's four cores. Each size keeps its own findings, so the lines below come out in the same order every run.
const shots = await Promise.all(
  Object.entries(SIZES).map(async ([size, { viewport, hasTouch }]) => {
    const nested = []
    const heavy = []
    const context = await browser.newContext({ viewport, hasTouch, deviceScaleFactor: 2 })
    const page = await context.newPage()
    for (const name of pages) {
      const title = name.replace('.html', '')
      await page.goto(base + name, { waitUntil: 'networkidle' })
      await page.waitForSelector('html[data-ready="yes"]')
      await page.evaluate(() => document.fonts.ready)
      const glass = await page.evaluate(lookAtGlass)
      for (const el of glass.nested) nested.push(`${title} ${size}: ${el}`)
      if (glass.share > 0.4) heavy.push(`${title} ${size} ${glass.share.toFixed(2)}`)
      await page.screenshot({ path: join(OUT, `${title}-${size}.png`) })
    }
    await context.close()
    return { nested, heavy }
  }),
)
const nestedGlass = shots.flatMap((shot) => shot.nested)
const heavy = shots.flatMap((shot) => shot.heavy)
await browser.close()
server.close()
console.log(`Took ${pages.length * Object.keys(SIZES).length} pictures of ${pages.length} mockups.`)
// One line per page and size where the wide blur covers more than 40% of the window: the Owner's speed test decides.
if (heavy.length) console.log(`Wide blur over 40% of the window (page, size, share):\n${heavy.join('\n')}`)
// Glass inside glass is a defect: the pictures are written, so they still upload, and then the run fails.
if (nestedGlass.length) {
  console.log(`Glass inside glass (page, size: the inner element):\n${nestedGlass.join('\n')}`)
  process.exitCode = 1
}
