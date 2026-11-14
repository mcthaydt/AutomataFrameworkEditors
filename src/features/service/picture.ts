// A picture of a game (a `.png` the framework painted), read as the App and handed to the page as base64. The page
// needs the bytes to draw the game's own art, and it cannot ask GitHub itself. A picture is the one answer that may be
// kept: for a minute or two by the browser, and, for a visitor looking at the demo game, in Cloudflare's cache, so a
// crowd of first visits costs GitHub one read a picture and not one a visitor.
import { answer } from '../exchange/exchange.ts'
import type { Answer, GameRef, WirePicture } from '../wire/wire.ts'
import { type ApiDeps, enter, isDemo } from './enter.ts'

/** What a picture's answer may be kept for: five minutes, and only by the person's own browser. */
const KEEP = 'private, max-age=300'
/** Only a game's painted pictures, which live under `content/`. */
const PICTURE_PATH = /^content\/[A-Za-z0-9._/-]+\.png$/

/** The slice of Cloudflare's cache that this file uses; a runtime without one has no such thing, and nothing is kept. */
interface Cache {
  match(request: Request): Promise<Response | undefined>
  put(request: Request, response: Response): Promise<void>
}
const cacheOf = (): Cache | undefined => (globalThis as { caches?: { default?: Cache } }).caches?.default

/** The picture at `path` on `branch`: the default branch, or (signed in) the head of one of this game's waiting changes. */
async function readPicture(
  deps: ApiDeps,
  request: Request,
  game: GameRef,
  branch: string,
  path: string,
): Promise<Answer<WirePicture>> {
  if (branch === '' || !PICTURE_PATH.test(path) || path.includes('..'))
    return { ok: false, problem: 'bad-request' }
  const entered = await enter(deps, request, game, 'look', { visitors: true })
  if (!entered.ok) return entered
  const { who, repo } = entered.value
  if (branch !== repo.facts.branch) {
    // Another branch is a waiting change, and a visitor sees none of those.
    if (who === undefined) return { ok: false, problem: 'not-found' }
    const pulls = await repo.openPulls()
    if (!pulls.ok) return pulls
    if (!pulls.value.some((pull) => pull.head === branch && pull.headIsHere))
      return { ok: false, problem: 'not-found' }
  }
  const read = await repo.readBytes(branch, path)
  return read.ok ? { ok: true, value: { path, base64: read.value.base64 } } : read
}

const JSON_TYPE = 'application/json; charset=utf-8'

/** GET /api/picture?owner=&name=&branch=&path= */
export async function servePicture(deps: ApiDeps, request: Request, url: URL): Promise<Response> {
  const game: GameRef = {
    owner: url.searchParams.get('owner') ?? '',
    name: url.searchParams.get('name') ?? '',
  }
  const branch = url.searchParams.get('branch') ?? ''
  const path = url.searchParams.get('path') ?? ''
  // Only a visitor's look at the demo game is the same for everyone, so only that is shared between people.
  const visitorAtDemo = request.headers.get('authorization') === null && isDemo(deps.env, game)
  const shared = visitorAtDemo ? cacheOf() : undefined
  const key = new Request(url.toString(), { method: 'GET' })
  if (shared !== undefined) {
    const hit = await shared.match(key)
    if (hit !== undefined) return answer((await hit.json()) as Answer<WirePicture>, KEEP)
  }
  const result = await readPicture(deps, request, game, branch, path)
  const res = answer(result, result.ok ? KEEP : 'no-store')
  if (shared !== undefined && result.ok) {
    // Cloudflare keeps only what says it is public; this answer is the demo game's, which is.
    await shared.put(
      key,
      new Response(JSON.stringify(result), {
        headers: { 'content-type': JSON_TYPE, 'cache-control': 'public, max-age=300' },
      }),
    )
  }
  return res
}
