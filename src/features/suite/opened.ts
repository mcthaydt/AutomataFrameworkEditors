// What a screen that opens a game tells the page about it, so the page can fit the first-run strip, the sign-in on the
// bar and the titles to what is really on screen.
export interface GameOpened {
  /** The game's own name, once it has opened; undefined when it could not be opened. */
  readonly name: string | undefined
  /** True when the screen itself offers a primary Sign in, so the bar need not offer a second one. */
  readonly askSignIn: boolean
}
