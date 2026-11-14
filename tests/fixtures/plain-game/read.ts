// A game with no art at all, as the test game was before it had pictures: a level of `#` walls and every thing a
// box. The pretend GitHub serves it as `grandma/plain-game`, so a test can see a game drawn in boxes. Each file is
// byte for byte what the framework's `writeContent` writes.
import automata from './automata.toml?raw'
import crate from './content/characters/crate.json?raw'
import hero from './content/characters/hero.json?raw'
import level1 from './content/levels/level-1.json?raw'

/** Every file of the plain game, by its path from the game's root. */
export const plainFiles: Readonly<Record<string, string>> = {
  'automata.toml': automata,
  'content/levels/level-1.json': level1,
  'content/characters/hero.json': hero,
  'content/characters/crate.json': crate,
}

/** The same files as a map, the shape the pretend GitHub keeps a branch in. */
export function plainMap(): Map<string, string> {
  return new Map(Object.entries(plainFiles))
}
