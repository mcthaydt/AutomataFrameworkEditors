// What kind of window this is, and what kind of device. The design language has four layouts; these two functions are
// the only place a width or a height is turned into one.

export type SizeClass = 'phone' | 'phone-sideways' | 'tablet-upright' | 'wide'

/**
 * Total, in this order: 500 wide or less is a phone; under 500 tall is a phone on its side (a short wide window);
 * taller than wide is an upright iPad (or any tall window over 500 wide); every other window is `wide`: an iPad
 * sideways, a computer, and the in-betweens such as 700 by 650. Read from the layout viewport, which the on-screen
 * keyboard does not shrink (iPadOS, and Chrome's default for the keyboard), so opening the keyboard never changes it.
 */
export function sizeClass(width: number, height: number): SizeClass {
  if (width <= 500) return 'phone'
  if (height < 500) return 'phone-sideways'
  if (height > width) return 'tablet-upright'
  return 'wide'
}

/**
 * The name the top bar uses: "iPad", "phone" or "computer". An iPad sideways and a computer are both `wide`; this is
 * what tells them apart. iPadOS says it is a Mac, and the one thing a Mac does not have is a touch screen.
 */
export function deviceWord(
  userAgent: string,
  size: SizeClass,
  touch: boolean,
): 'ipad' | 'phone' | 'computer' {
  if (size === 'phone' || size === 'phone-sideways') return 'phone'
  if (/iPad/.test(userAgent) || (/Macintosh/.test(userAgent) && touch)) return 'ipad'
  return 'computer'
}
