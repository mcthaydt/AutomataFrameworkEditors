// How the page reads the pictures of a game for the framework's `loadArt`. A figure's or a backdrop's picture is painted
// right here from its file (`artFiles`: the same bytes `automata art` writes); a tileset's picture is a file of the game
// that the API sent as bytes (`OpenAnswer.pictures`). Each goes back as a `Blob`, which `loadArt` turns into a bitmap with
// `createImageBitmap`: no request is made and no `blob:` address is ever made, so the page's security policy
// (`public/_headers`) stays as it is.
import type { ReadPicture } from '@automataframework/framework'
import { artFiles, type GameContent } from '@automataframework/framework/headless'
import { bytesFromBase64 } from '../../lib/base64.ts'
import type { OpenPicture } from '../wire/wire.ts'

/** What painting a game's figures costs once is not paid again for the same game. */
const painted = new WeakMap<GameContent, ReadonlyMap<string, Uint8Array>>()

function paintedBy(content: GameContent): ReadonlyMap<string, Uint8Array> {
  const known = painted.get(content)
  if (known !== undefined) return known
  const made = new Map<string, Uint8Array>()
  for (const file of artFiles(content)) if (file.path.endsWith('.png')) made.set(file.path, file.bytes)
  painted.set(content, made)
  return made
}

/** A `readPicture` for `loadArt`: painted pictures first, then the game's own files; a path with neither rejects. */
export function readPictureOf(content: GameContent, pictures: readonly OpenPicture[]): ReadPicture {
  const sent = new Map(pictures.map((picture) => [picture.path, picture.base64]))
  return async (path) => {
    const own = paintedBy(content).get(path)
    if (own !== undefined) return new Blob([own as BlobPart], { type: 'image/png' })
    const base64 = sent.get(path)
    if (base64 === undefined) throw new Error(`${path}: no such picture`)
    return new Blob([bytesFromBase64(base64) as BlobPart], { type: 'image/png' })
  }
}
