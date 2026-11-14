// A level's painted pictures, loaded for drawing. A game with no art (every thing is a box) needs none.
import { type Art, ArtError, loadArt, needsPictures } from '@automataframework/framework'
import type { Api } from '../api/api.ts'
import type { OpenGame } from './open.ts'
import { readPictureFor } from './pictures.ts'

/**
 * The art `levelId` needs: `undefined` when it needs none, `'missing'` when a picture is missing, old or cannot be read
 * (the level still opens, as boxes), and otherwise the loaded art. A new `Art` on every call, because each level picture
 * frees the one it is given; the bytes are kept by `readPictureFor`, so asking again costs no call to the API.
 */
export async function loadLevelArt(
  api: Api,
  game: OpenGame,
  levelId: string,
): Promise<Art | undefined | 'missing'> {
  if (!needsPictures(game.content, levelId)) return undefined
  try {
    return await loadArt({ content: game.content, level: levelId, readPicture: readPictureFor(api, game) })
  } catch (error) {
    if (error instanceof ArtError) return 'missing'
    throw error
  }
}
