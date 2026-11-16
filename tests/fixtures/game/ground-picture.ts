// The Crate Game's tileset picture: 32 by 16 pixels, two squares of 16, the ground on the left and the water on the
// right. It is made here with the framework's own PNG writer, never committed as a binary, so the bytes are the same
// in Node and in a browser and a change of the framework's writer shows in a test instead of in a file.
import { encodePng } from '@automataframework/framework/headless'

const SIDE = 16
const COLUMNS = 2
/** Colour 0 is clear; 1 is the ground, 2 the water, 3 a lighter line along each square's top. */
const PALETTE = [0x000000, 0x6b4f2a, 0x2f6fb0, 0xa88b5a]

/** The picture's PNG bytes. */
export function groundPicture(): Uint8Array {
  const width = SIDE * COLUMNS
  const pixels = new Uint8Array(width * SIDE)
  for (let y = 0; y < SIDE; y++) {
    for (let x = 0; x < width; x++) {
      const square = Math.floor(x / SIDE)
      pixels[y * width + x] = y === 0 && square === 0 ? 3 : square === 0 ? 1 : 2
    }
  }
  return encodePng({ width, height: SIDE, palette: PALETTE, pixels })
}
