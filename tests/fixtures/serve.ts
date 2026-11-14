// The built page, served the way Cloudflare serves it: the files of `dist/` with the headers of `public/_headers`, and
// every /api request handed to the real Function code. Journeys run against this, so the page's security rules (the
// content-security policy above all) are in force in CI, not only on a real iPad.
import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { extname, join, normalize } from 'node:path'
import type { AppEnv } from '#src/features/github/github.ts'
import { handleApi } from '#src/features/service/service.ts'

const ROOT = join(import.meta.dirname, '../..')
const TYPES: Readonly<Record<string, string>> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.wasm': 'application/wasm',
  '.woff2': 'font/woff2',
}

/** The headers `public/_headers` gives every file (the `/*` block): a path, then indented `Name: value` lines. */
export function pageHeaders(): Record<string, string> {
  const found: Record<string, string> = {}
  let inside = false
  for (const line of readFileSync(join(ROOT, 'public/_headers'), 'utf8').split('\n')) {
    if (line.trim() === '' || line.startsWith('#')) continue
    if (!/^\s/.test(line)) {
      inside = line.trim() === '/*'
      continue
    }
    if (!inside) continue
    const at = line.indexOf(':')
    found[line.slice(0, at).trim()] = line.slice(at + 1).trim()
  }
  return found
}

export interface Site {
  readonly url: string
  close(): Promise<void>
}

async function readBody(request: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of request) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks)
}

export async function startSite(
  port: number,
  env: AppEnv & { DEMO_GAME?: string },
  dir = 'dist',
): Promise<Site> {
  const headers = pageHeaders()
  const origin = `http://127.0.0.1:${port}`

  async function api(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const method = request.method ?? 'GET'
    const body = method === 'GET' || method === 'HEAD' ? undefined : await readBody(request)
    const answer = await handleApi(
      new Request(`${origin}${request.url ?? '/'}`, {
        method,
        headers: Object.fromEntries(
          Object.entries(request.headers).flatMap(([key, value]) =>
            typeof value === 'string' ? [[key, value]] : [],
          ),
        ),
        ...(body === undefined ? {} : { body: new Uint8Array(body) }),
      }),
      env,
    )
    response.writeHead(answer.status, Object.fromEntries(answer.headers))
    response.end(Buffer.from(await answer.arrayBuffer()))
  }

  async function file(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const path = new URL(request.url ?? '/', origin).pathname
    const wanted = normalize(path === '/' ? '/index.html' : path)
    if (wanted.includes('..')) {
      response.writeHead(404).end()
      return
    }
    try {
      const bytes = await readFile(join(ROOT, dir, wanted))
      response.writeHead(200, {
        ...headers,
        'content-type': TYPES[extname(wanted)] ?? 'application/octet-stream',
      })
      response.end(bytes)
    } catch {
      response.writeHead(404, headers).end()
    }
  }

  const server = createServer((request, response) => {
    const run = (request.url ?? '').startsWith('/api/') ? api(request, response) : file(request, response)
    run.catch(() => {
      response.writeHead(500).end()
    })
  })
  await new Promise<void>((done) => server.listen(port, '127.0.0.1', done))
  return {
    url: origin,
    close: () =>
      new Promise<void>((done) => {
        server.closeAllConnections()
        server.close(() => done())
      }),
  }
}
