<script lang="ts">
  // The hand that paints the ground (and, for the Erase tool, empties it): one stroke over the level is one step back,
  // and what it did to the ground is said in plain words. It draws nothing: the level's own picture shows the result, and
  // `LevelPart` hands it every drag and tap that belongs to the Paint and Erase tools.
  import type { Level } from '@automataframework/framework/headless'
  import type { Done } from './done.ts'
  import type { Edge } from './edges.ts'
  import type { Characters } from './edit.ts'
  import { type Lang, nameOf, type Row, wordsIn } from '../words/words.ts'
  import { type Hand, handOf, kindOfStroke, paintStroke, type Stroke, startStroke, strokeTo, wayChanged } from './brush.ts'
  import type { Act } from './gestures.ts'
  import type { Cell, Kind } from './ground.ts'
  import { kindName } from './kinds.ts'
  import type { Point } from './place.ts'

  interface Props {
    lang: Lang
    level: Level
    characters: Characters
    /** What the ground can be, and the one being painted. */
    kinds: readonly Kind[]
    chosen: Kind
    /** `paint` paints the chosen kind; `erase` empties the ground. */
    tool: 'paint' | 'erase'
    /** The free thumb's buttons that are held. */
    held: ReadonlySet<string>
    cellAt: (px: Point) => Cell
    /** The edges of a level that touch another and are open there, as that level would have them. */
    edgesFor?: ((next: Level) => readonly Edge[]) | undefined
    ongrab: () => void
    onedit: (next: Level) => void
    ondrop: (gaveUp: boolean) => void
    /** A note with Undo. */
    say: (words: string) => void
    refuse: (done: Done<unknown>) => void
    /** Press and hold picked the kind that is under the finger. */
    onbrush: (letter: string) => void
  }
  let { lang, level, characters, kinds, chosen, tool, held, cellAt, edgesFor, ongrab, onedit, ondrop, say, refuse, onbrush }: Props = $props()

  const words = $derived(wordsIn(lang))
  const text = (row: Row, ...parts: (string | number)[]): string => (typeof row === 'function' ? row(...parts) : row)

  let stroke: Stroke | undefined
  let latest: Level | undefined
  let left: readonly Cell[] = []
  let why: Done<unknown> | undefined

  const handNow = (keys: { shift: boolean; alt: boolean }): Hand => {
    const hand = handOf(held, keys.shift, keys.alt)
    return tool === 'erase' ? (hand === 'box' ? 'box' : 'erase') : hand
  }

  /** The stroke has gone to `to`: the level is the stroke's cells painted on the level as it was. */
  function reach(from: Stroke, to: Cell): void {
    const painted = paintStroke(from, characters, strokeTo(from, to), kindOfStroke(from, chosen, kinds))
    left = painted.left
    if (painted.done.ok) {
      latest = painted.done.value
      onedit(painted.done.value)
    } else {
      why = painted.done
      // A box that shrank back to nothing or onto only a spot a thing stands on, or a stroke that has nowhere to go yet, is
      // the level as it was.
      latest = undefined
      if (painted.done.why === 'same' || painted.done.why === 'occupied') onedit(from.base)
    }
  }

  /** Says what a finished stroke did: a way across that opened or closed first, then what was left alone, then the paint. */
  function sayDone(from: Stroke, next: Level): void {
    const way = edgesFor === undefined ? undefined : wayChanged(edgesFor(from.base), edgesFor(next))
    if (way !== undefined) {
      const said = { opened: words.ground.edgeOpened, closed: words.ground.edgeClosed, wider: words.ground.edgeWider, narrower: words.ground.edgeNarrower }[way.how]
      say(text(said, nameOf(way.other)))
    } else if (left.length > 0) say(text(words.ground.noteSkipped))
    else if (from.hand === 'erase') say(text(words.levels.noteErased))
    else say(text(words.ground.notePainted, kindName(kindOfStroke(from, chosen, kinds), lang)))
  }

  export function drag(act: Extract<Act, { kind: 'drag' }>, keys: { shift: boolean; alt: boolean }): void {
    if (act.phase === 'cancel') {
      if (stroke !== undefined) ondrop(true)
      stroke = latest = undefined
      return
    }
    if (act.phase === 'start') {
      stroke = startStroke(level, handNow(keys), cellAt(act.from))
      latest = why = undefined
      left = []
      ongrab()
      if (stroke.hand === 'fill') reach(stroke, stroke.first)
      return
    }
    if (stroke === undefined) return
    if (act.phase === 'move') return reach(stroke, cellAt(act.to))
    const was = stroke
    const next = latest
    stroke = latest = undefined
    ondrop(false)
    if (next !== undefined) sayDone(was, next)
    else if (why !== undefined) refuse(why)
  }

  /** A tap paints the spot it is on (a fill, what is joined to it). */
  export function tap(at: Point, keys: { shift: boolean; alt: boolean }): void {
    const cell = cellAt(at)
    const one = startStroke(level, handNow(keys), cell)
    left = []
    const painted = paintStroke(one, characters, strokeTo(one, cell), kindOfStroke(one, chosen, kinds))
    left = painted.left
    if (!painted.done.ok) return refuse(painted.done)
    onedit(painted.done.value)
    sayDone(one, painted.done.value)
  }

  /** Press and hold: paint with what is there. */
  export function hold(at: Point): void {
    const cell = cellAt(at)
    const letter = level.tiles[cell.row]?.[cell.col]
    if (letter === undefined || !kinds.some((kind) => kind.letter === letter)) return
    onbrush(letter)
  }
</script>
