// The fixture game: a level 16 tiles wide and 9 tall (a floor on the bottom row, a wall at each side), a hero and a
// crate. The files are imported as text with Vite's `?raw`, so the same fixture loads in Node and in a browser. Each
// is byte for byte what the framework's `writeContent` writes; `tests/fixtures/game.test.ts` checks it.
import automata from './automata.toml?raw'
import crate from './content/characters/crate.json?raw'
import hero from './content/characters/hero.json?raw'
import level1 from './content/levels/level-1.json?raw'

/** Every file of the fixture game, by its path from the game's root. */
export const fixtureFiles: Readonly<Record<string, string>> = {
  'automata.toml': automata,
  'content/levels/level-1.json': level1,
  'content/characters/hero.json': hero,
  'content/characters/crate.json': crate,
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
