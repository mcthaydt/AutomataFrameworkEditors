// The fixture game: a level 16 tiles wide and 9 tall (a floor on the bottom row, a wall at each side), a hero and a
// crate, all in the game's own art (the framework paints the pictures: see `pictures.ts`). The files are imported as
// text with Vite's `?raw`, so the same fixture loads in Node and in a browser. Each is byte for byte what the
// framework's `writeContent` writes; `tests/fixtures/game.test.ts` checks it. `../plain-game/` is the same game with no
// art, every thing a box.
import automata from './automata.toml?raw'
import backdropValley from './content/backdrops/valley.json?raw'
import crate from './content/characters/crate.json?raw'
import hero from './content/characters/hero.json?raw'
import figureCrate from './content/figures/crate.json?raw'
import figureHero from './content/figures/hero.json?raw'
import figureMeadow from './content/figures/meadow.json?raw'
import figureTree from './content/figures/tree.json?raw'
import level1 from './content/levels/level-1.json?raw'
import tilesetMeadow from './content/tilesets/meadow.json?raw'

/** Every file of the fixture game, by its path from the game's root. */
export const fixtureFiles: Readonly<Record<string, string>> = {
  'automata.toml': automata,
  'content/levels/level-1.json': level1,
  'content/characters/hero.json': hero,
  'content/characters/crate.json': crate,
  'content/tilesets/meadow.json': tilesetMeadow,
  'content/figures/hero.json': figureHero,
  'content/figures/crate.json': figureCrate,
  'content/figures/meadow.json': figureMeadow,
  'content/figures/tree.json': figureTree,
  'content/backdrops/valley.json': backdropValley,
}

/** The same files as a map, the shape the pretend GitHub keeps a branch in. */
export function fixtureMap(): Map<string, string> {
  return new Map(Object.entries(fixtureFiles))
}

/** The path of the one level the fixture has. */
export const LEVEL_PATH = 'content/levels/level-1.json'

/**
 * A `read` over files, as the framework's `loadGame` takes it. A path that is not there rejects the way a real read
 * of a missing file does.
 */
export function readFrom(
  files: ReadonlyMap<string, string> | Readonly<Record<string, string>>,
): (path: string) => Promise<string> {
  const lookup =
    files instanceof Map
      ? (path: string) => files.get(path)
      : (path: string) => (files as Record<string, string>)[path]
  return async (path) => {
    const text = lookup(path)
    if (text === undefined) throw new Error(`${path}: no such file`)
    return text
  }
}
