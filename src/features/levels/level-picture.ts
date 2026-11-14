// The picture of a level: the framework draws it, the way the game does. This is the one file that imports the
// framework's browser renderer (and so Pixi, which the framework carries); no other file here names either.
import { type Art, createLevelPicture, type LevelPicture } from '@automataframework/framework'
import type { GameContent, Level } from '@automataframework/framework/headless'

export type { Art, LevelPicture }

/**
 * Fills `mount` with the level as the game draws it, in its own art. The picture takes the `Art` and frees it with
 * itself. The canvas goes first among `mount`'s children, so the buttons laid over it stay on top and a finger reaches
 * them. It keeps what was drawn readable, for a screenshot and for the tests.
 */
export async function openLevelPicture(options: {
  mount: HTMLElement
  content: GameContent
  level: Level
  art: Art | undefined
}): Promise<LevelPicture> {
  const picture = await createLevelPicture({ ...options, keep: true })
  options.mount.prepend(picture.canvas)
  return picture
}
