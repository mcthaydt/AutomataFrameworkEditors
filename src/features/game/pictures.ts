// A game's painted pictures, read through the API for the framework's `loadArt`. The framework asks for each picture
// by its path; the page cannot read GitHub, so each is a call to /api/picture, made once and kept for as long as the
// page is open (the API keeps them for a few minutes more, for everyone).
import type { ReadPicture } from '@automataframework/framework'
import { bytesFromBase64 } from '../../lib/base64.ts'
import type { Api } from '../api/api.ts'
import type { OpenGame } from './open.ts'

/** Each page's calls, by the `Api` that made them, so a new `Api` (a test, a new sign-in) starts with none. */
const kept = new WeakMap<Api, Map<string, Promise<Blob>>>()

/** One picture of the game, as the framework's `ReadPicture` wants it. Rejects when the API says no. */
export function readPictureFor(api: Api, game: OpenGame): ReadPicture {
  const mine = kept.get(api) ?? new Map<string, Promise<Blob>>()
  kept.set(api, mine)
  return (path) => {
    const key = `${game.ref.owner}/${game.ref.name}@${game.branch}:${path}`
    const known = mine.get(key)
    if (known !== undefined) return known
    const fetched = (async (): Promise<Blob> => {
      const got = await api.picture({ game: game.ref, branch: game.branch, path })
      if (!got.ok) throw new Error(`${path}: ${got.problem}`)
      return new Blob([bytesFromBase64(got.value.base64).slice()], { type: 'image/png' })
    })()
    mine.set(key, fetched)
    // A picture that could not be read is asked for again next time.
    fetched.catch(() => mine.delete(key))
    return fetched
  }
}
