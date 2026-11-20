<script lang="ts">
  // Join: what a switch opens, drawn in the level. A line runs from each switch to what it opens; with the Join tool in
  // hand, draw from a switch to a thing and it opens it (the things it may open light up as the tip comes near). Tap a
  // line to pick it, and "Take this line away" leaves both things where they are. The same link is in the switch's
  // settings, as the list "Opens". A hint says how, and sits where it covers neither a switch nor what it opens.
  import type { Level } from '@automataframework/framework/headless'
  import { type Lang, nameOf, type Row, wordsIn } from '../words/words.ts'
  import type { Done } from './done.ts'
  import type { Characters } from './edit.ts'
  import type { Act } from './gestures.ts'
  import { menuPlace } from './float.ts'
  import { curve, hintAt, joinFacts, joinValueOf, lineShapes, nearTip } from './joins.ts'
  import type { Mark } from './marks.ts'
  import type { Point } from './place.ts'
  import { opens, unlink } from './values.ts'

  interface Props {
    lang: Lang
    level: Level
    characters: Characters
    marks: readonly Mark[]
    picked: readonly string[]
    /** The Join tool is in hand. */
    joining: boolean
    /** A note is on screen at the top, and the hint waits for it rather than sit over its Undo. */
    noted: boolean
    readOnly: boolean
    size: { w: number; h: number }
    onpick: (ids: readonly string[]) => void
    /** Gives an edit to whoever holds the history, or says why not; true when it went in. */
    apply: (done: Done) => boolean
    sayUndoable: (said: string) => void
  }
  let { lang, level, characters, marks, picked, joining: tool, noted, readOnly, size, onpick, apply, sayUndoable }: Props =
    $props()

  const words = $derived(wordsIn(lang))
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row

  const shapes = $derived(lineShapes(joinFacts(level, characters), marks))
  /** A line drawn from a switch and not let go yet. */
  let drawing = $state.raw<{ from: string; value: string; tip: Point; near: string | undefined } | undefined>()
  /** The line that is picked, by its key. */
  let line = $state<string | undefined>()
  const lit = $derived(shapes.find((shape) => shape.key === line))
  $effect(() => {
    if (line !== undefined && lit === undefined) line = undefined
  })

  const boxOf = (id: string | undefined): Mark['box'] | undefined => marks.find((m) => m.id === id)?.box
  const centre = (id: string): Point | undefined => {
    const box = boxOf(id)
    return box === undefined ? undefined : { x: box.x + box.w / 2, y: box.y + box.h / 2 }
  }
  /** The things the switch could open now, the way it is drawn from. */
  const targets = (from: string, value: string): readonly string[] =>
    level.things.filter((t) => t.id !== from && opens(level, characters, from, value, t.id).ok).map((t) => t.id)

  export function clear(): void {
    line = undefined
  }

  /** The Join tool's half of a drag: from a switch to what it opens. */
  export function drag(act: Extract<Act, { kind: 'drag' }>): void {
    if (act.phase === 'cancel') {
      drawing = undefined
      return
    }
    if (act.phase === 'start') {
      const thing = act.on === undefined ? undefined : level.things.find((t) => t.id === act.on)
      const value = thing === undefined ? undefined : joinValueOf(characters, thing.character)
      if (thing === undefined || value === undefined) return
      line = undefined
      onpick([thing.id])
      drawing = { from: thing.id, value, tip: act.from, near: undefined }
      return
    }
    if (drawing === undefined) return
    const tip = act.to
    const near = nearTip(tip, marks, targets(drawing.from, drawing.value))
    if (act.phase === 'move') {
      drawing = { ...drawing, tip, near }
      return
    }
    const done = drawing
    drawing = undefined
    if (done.near === undefined) return
    const before = idsOpened(level, done.from, done.value)
    const result = opens(level, characters, done.from, done.value, done.near)
    if (!apply(result) || !result.ok) return
    // A switch that may open only one thing drops the old line for the new one, and says so.
    const after = idsOpened(result.value, done.from, done.value)
    const dropped = before.find((id) => !after.includes(id))
    sayUndoable(
      dropped === undefined
        ? text(words.thing.noteJoined, nameOf(done.from), nameOf(done.near))
        : text(words.thing.noteReplaced, nameOf(done.from), nameOf(done.near), nameOf(dropped)),
    )
  }

  /** What `from` opens by `value` in `at`, as a list of ids (a switch of one keeps a bare id). */
  const idsOpened = (at: Level, from: string, value: string): readonly string[] =>
    [at.things.find((t) => t.id === from)?.values?.[value]].flat().filter((id): id is string => typeof id === 'string')

  function takeAway(): void {
    const fact = lit?.fact
    if (fact === undefined) return
    line = undefined
    if (apply(unlink(level, fact.from, fact.value, fact.to))) {
      sayUndoable(text(words.thing.noteUnjoined, nameOf(fact.from), nameOf(fact.to)))
    }
  }

  const showHit = (shape: (typeof shapes)[number]): boolean =>
    !readOnly && (tool || picked.includes(shape.fact.from) || picked.includes(shape.fact.to) || line === shape.key)
  const preview = $derived.by(() => {
    const from = drawing === undefined ? undefined : centre(drawing.from)
    return drawing === undefined || from === undefined ? undefined : curve(from, drawing.tip).d
  })
  /** The first thing in the level that can open something: the hint names it, as a person sees it. */
  const switchHere = $derived(level.things.find((t) => joinValueOf(characters, t.character) !== undefined)?.id)
  let hint = $state({ w: 260, h: 44 })
  const hintSpot = $derived(
    hintAt(hint, marks.map((m) => m.box), size),
  )
  const cardSpot = $derived(lit === undefined ? undefined : menuPlace({ x: lit.mid.x - 120, y: lit.mid.y + 26 }, size, { w: 260, h: 150 }))
</script>

<svg class="lines" aria-hidden="true">
  {#each shapes as shape (shape.key)}
    {@const on = picked.includes(shape.fact.from) || picked.includes(shape.fact.to) || line === shape.key}
    <path d={shape.d} class="line" class:on class:picked={line === shape.key} data-line-path={shape.key} />
    <circle cx={shape.from.x} cy={shape.from.y} r="7" class="end" class:on />
    <circle cx={shape.to.x} cy={shape.to.y} r="7" class="end to" class:on />
  {/each}
  {#if preview !== undefined}<path d={preview} class="line on drawing" />{/if}
</svg>
{#if drawing?.near !== undefined}
  {@const box = boxOf(drawing.near)}
  {#if box !== undefined}
    <div class="near" data-near={drawing.near} style:left="{box.x - 4}px" style:top="{box.y - 4}px" style:width="{box.w + 8}px" style:height="{box.h + 8}px"></div>
  {/if}
{/if}
{#each shapes as shape (shape.key)}
  {#if showHit(shape)}
    <button
      type="button"
      class="hit"
      data-ui
      data-line={shape.key}
      aria-label={text(words.thing.joinLine, nameOf(shape.fact.from), nameOf(shape.fact.to))}
      aria-pressed={line === shape.key}
      style:left="{shape.mid.x - 22}px"
      style:top="{shape.mid.y - 22}px"
      onclick={() => (line = line === shape.key ? undefined : shape.key)}
    >
      <i></i>
    </button>
  {/if}
{/each}
{#if lit !== undefined && cardSpot !== undefined && !readOnly}
  <div class="card" data-ui role="group" style:left="{cardSpot.x}px" style:top="{cardSpot.y}px">
    <b>{text(words.thing.joinLine, nameOf(lit.fact.from), nameOf(lit.fact.to))}</b>
    <button type="button" class="take" onclick={takeAway}>{text(words.thing.joinTake)}</button>
    <small>{text(words.thing.joinTakeAbout)}</small>
  </div>
{/if}
{#if tool && !noted && !readOnly && drawing === undefined && line === undefined}
  <p class="hint glass-2" data-ui bind:clientWidth={hint.w} bind:clientHeight={hint.h} style:left="{hintSpot.x}px" style:top="{hintSpot.y}px">
    {switchHere === undefined ? text(words.thing.joinNone) : text(words.thing.joinHint, nameOf(switchHere))}
  </p>
{/if}

<style>
  .lines {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
  }
  .line {
    fill: none;
    stroke: var(--accent);
    stroke-width: 2;
    stroke-dasharray: 6 4;
    opacity: 0.55;
  }
  .line.on {
    stroke-width: 3;
    stroke-dasharray: none;
    opacity: 1;
  }
  .line.picked {
    stroke-width: 5;
  }
  .end {
    fill: var(--accent);
    stroke: var(--bright);
    stroke-width: 2;
    opacity: 0.6;
  }
  .end.to {
    fill: var(--bright);
    stroke: var(--accent);
  }
  .end.on {
    opacity: 1;
  }
  .near {
    position: absolute;
    box-sizing: border-box;
    border: 3px solid var(--accent);
    border-radius: 6px;
    box-shadow: 0 0 14px 2px color-mix(in srgb, var(--accent) 60%, transparent);
    pointer-events: none;
  }
  .hit {
    position: absolute;
    z-index: 40;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
    touch-action: none;
  }
  .hit i {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid var(--accent);
    background: var(--ground);
  }
  .hit:focus-visible {
    outline: 3px solid var(--focus, var(--accent));
    border-radius: 50%;
  }
  .card,
  .hint {
    position: absolute;
    z-index: 45;
    box-sizing: border-box;
    padding: 10px 12px;
    border-radius: 12px;
    color: var(--words);
  }
  .card {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 260px;
  }
  .hint {
    max-width: calc(100% - 16px);
    width: max-content;
    margin: 0;
    pointer-events: none;
  }
  .take {
    min-height: 44px;
    border: 0;
    border-radius: 8px;
    background: var(--accent);
    color: var(--on-accent);
    font: 600 15px var(--label);
    cursor: pointer;
  }
  small {
    color: var(--quiet);
  }
</style>
