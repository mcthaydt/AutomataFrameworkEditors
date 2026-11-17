// What each kind of tile is tinted when the person asks what the tiles are: the first kind, the second, and so on round.
// The tray's swatches use the same colours, so a kind looks the same wherever it is shown.
export const KIND_TINTS = [0xd9534f, 0x2f9e8f, 0xe0a030, 0x7a5cc8, 0x4a90d9, 0xc0568f] as const

/** The tint of the kind at `index` in the tileset's list, as CSS. */
export function tintCss(index: number): string {
  const tint = KIND_TINTS[index % KIND_TINTS.length] ?? KIND_TINTS[0]
  return `#${tint.toString(16).padStart(6, '0')}`
}
