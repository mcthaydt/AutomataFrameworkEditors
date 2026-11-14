// The test game's painted pictures, made the way `automata art` makes them: none is committed, so a change to a painter
// or a figure in the framework moves them and nothing here is out of date. Every engine paints the same bytes.
import { artFiles, loadGame } from '@automataframework/framework/headless'
import { fixtureFiles, readFrom } from './read.ts'

let painted: Promise<Record<string, Uint8Array>> | undefined

/** Every picture of the test game, by its path in the game, as the framework's `artFiles` gives them. */
export function fixturePictures(): Promise<Record<string, Uint8Array>> {
  painted ??= (async () => {
    const loaded = await loadGame(readFrom(fixtureFiles))
    if (!loaded.ok) throw new Error('the test game did not load, so it cannot be painted')
    return Object.fromEntries(artFiles(loaded.value).map((file) => [file.path, file.bytes]))
  })()
  return painted
}
