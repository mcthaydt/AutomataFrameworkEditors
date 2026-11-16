// The pictures of a game's tilesets, sent with the game: a tileset names a PNG that is a file of the game, and the page
// has no way to ask GitHub for it. One that is not safe or not small is left out, and the game still opens.
import type { ContentRef } from '@automataframework/framework/headless'
import { bytesToBase64 } from '../../lib/base64.ts'
import type { Repo } from '../github/github.ts'
import type { Answer, OpenPicture, WireFile } from '../wire/wire.ts'

/** The biggest picture, and the biggest of all of them together, in bytes. */
export const MOST_ONE = 1024 * 1024
export const MOST_ALL = 4 * 1024 * 1024

/** A `.png` inside the game's own folder: no leading slash, no backslash, no `..` or `.` or empty step. */
export function isPicturePath(path: string): boolean {
  if (!path.endsWith('.png') || path.startsWith('/') || path.includes('\\')) return false
  return path.split('/').every((step) => step !== '' && step !== '.' && step !== '..')
}

/** The picture a tileset file names, as text it holds: undefined when it does not read or names none. */
function imageOf(text: string): string | undefined {
  try {
    const image = (JSON.parse(text) as { image?: unknown } | null)?.image
    return typeof image === 'string' ? image : undefined
  } catch {
    return undefined
  }
}

/**
 * The pictures of every tileset the game lists, read from `branch`: the ones that pass the rules, once each, in the order
 * the tilesets are listed. A picture that would take them past the total is left out, and so is one GitHub does not have.
 */
export async function readPictures(
  repo: Repo,
  branch: string,
  listed: readonly ContentRef[],
  files: readonly WireFile[],
): Promise<Answer<readonly OpenPicture[]>> {
  const texts = new Map(files.map((file) => [file.path, file.text]))
  const seen = new Set<string>()
  const pictures: OpenPicture[] = []
  let total = 0
  for (const ref of listed) {
    if (ref.type !== 'tileset') continue
    const text = texts.get(ref.path)
    const path = text === undefined ? undefined : imageOf(text)
    if (path === undefined || seen.has(path) || !isPicturePath(path)) continue
    seen.add(path)
    const read = await repo.readBytes(branch, path)
    if (!read.ok) {
      if (read.problem === 'not-found') continue
      return read
    }
    const size = read.value.bytes.length
    if (size > MOST_ONE || total + size > MOST_ALL) continue
    total += size
    pictures.push({ path, base64: bytesToBase64(read.value.bytes) })
  }
  return { ok: true, value: pictures }
}
