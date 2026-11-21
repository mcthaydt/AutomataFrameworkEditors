// What the level shows beyond the level itself, and what the Paint tool is holding. Kept for this visit only: none of it
// is a choice a helper needs or the device keeps.

export interface Show {
  /** Tiles: a faint grid under the things and the ground, there from the start so the empty parts read as a place to
   *  build. Finer: half tiles, over everything. Off: none. */
  readonly grid: 'off' | 'tiles' | 'finer'
  /** Things move by whole tiles (on), or by half tiles (off). */
  readonly lineUp: boolean
  /** The tiles are tinted by what they are. */
  readonly whatItIs: boolean
  /** The part of the level each screen sees. */
  readonly frames: boolean
  /** How near the view is: the whole level, or close up. Said by the level, since a pinch changes it too. */
  readonly near: 'whole' | 'close'
  /** Notes that were finished are shown again, faint. */
  readonly doneNotes: boolean
}
export const SHOW: Show = {
  grid: 'tiles',
  lineUp: true,
  whatItIs: false,
  frames: false,
  near: 'whole',
  doneNotes: false,
}

export interface Brush {
  /** The letter of the kind of ground being painted; undefined until one is picked. */
  readonly letter: string | undefined
  /** The free thumb's buttons that are held: 'box', 'fill' and 'erase'. */
  readonly held: ReadonlySet<string>
}
export const NO_BRUSH: Brush = { letter: undefined, held: new Set() }
