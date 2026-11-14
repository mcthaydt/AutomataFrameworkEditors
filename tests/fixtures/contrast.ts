// WCAG contrast of two `#rrggbb` colours, so a test can hold a pair of the editors' colours to the rule a person
// needs: 4.5 to 1 for words, 3 to 1 for an edge, an icon or a focus ring.

const channel = (hex: string, at: number): number => Number.parseInt(hex.slice(at, at + 2), 16) / 255

const linear = (value: number): number =>
  value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4

/** The relative luminance of `#rrggbb`. */
export function luminance(hex: string): number {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((at) => linear(channel(hex, at)))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** The contrast ratio of two colours, from 1 (the same) to 21 (black on white). Order does not matter. */
export function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05)
}

/** `colour` let into `ground` by `share` (0 to 1), channel by channel, rounded: how the editors' two shades are made. */
export function mix(colour: string, ground: string, share: number): string {
  const part = (at: number): string =>
    Math.round(channel(colour, at) * 255 * share + channel(ground, at) * 255 * (1 - share))
      .toString(16)
      .padStart(2, '0')
  return `#${part(1)}${part(3)}${part(5)}`
}
