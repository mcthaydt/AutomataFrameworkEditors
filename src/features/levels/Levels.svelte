<script lang="ts">
  import type { GameContent, Level } from '@automataframework/framework/headless'
  import { onMount, type Snippet, tick, untrack } from 'svelte'
  import { Button, Notice, Panel, TitleBlock, Tool } from '../ui/ui.ts'
  import { WORDS } from '../words/words.ts'
  import { compareLevels, type HitId } from './compare.ts'
  import {
    type LevelEdit,
    moveThing,
    nudgeThing,
    placeOf,
    redo as stepForward,
    rulesOf,
    startEdit,
    undo as stepBack,
    type Way,
  } from './edit.ts'
  import { roomFor, roomWith, type Shape } from './layout.ts'
  import type { Art } from './level-picture.ts'
  import type { Point, Room } from './place.ts'
  import Stage from './Stage.svelte'

  // The level screen's editor: the level fills the window and everything else floats over it. The tools, the title
  // block and undo and redo are panels set where `shape` says; the level is fitted into what they leave clear. Every
  // change is a plain function from `edit.ts`, so what a finger, a key and a button do are the same thing.
  interface Props {
    content: GameContent
    /** The level's id: what a screen reader calls the stage. */
    levelId: string
    /** The level this editor starts from; a new one remounts the editor. */
    start: Level
    /** The level's pictures, loaded by the screen around it; the stage's picture owns them from here and frees them. */
    art: Art | undefined
    shape: Shape
    /** What the title block says. `saved` is its short words ("Not saved yet"); `status` is the whole sentence. */
    block: { readonly game: string; readonly level: string; readonly saved: string; readonly status: string }
    /** What the screen has to say about what just happened: notices and what they ask, floating under the cluster. */
    notices?: Snippet
    /** After every change and every step back or forward. */
    onchange: (edit: LevelEdit) => void
  }
  let { content, levelId, start, art, shape, block, notices, onchange }: Props = $props()

  // What the person has done so far. Replaced whole on every change, never changed in place.
  let edit = $state.raw<LevelEdit>(untrack(() => startEdit(start)))
  let picked = $state<HitId | undefined>(undefined)
  /** The thing being dragged is held against solid ground. */
  let solid = $state(false)
  let stage: ReturnType<typeof Stage> | undefined = $state()
  const rules = $derived(rulesOf(content, edit.now))

  function change(next: LevelEdit): void {
    edit = next
    onchange(next)
  }

  // ---- the stage's calls -------------------------------------------------------------------------------------------

  /** The edit as it was when the finger went down: every move of a drag is worked out from it, so a drag is one step. */
  let dragFrom: LevelEdit | undefined

  function ondrag(id: HitId, to: Point): 'moved' | 'solid' | 'same' {
    dragFrom ??= edit
    const result = moveThing(dragFrom, rules, id, to)
    if (result.moved) {
      solid = false
      change(result.edit)
      return 'moved'
    }
    if (result.why === 'solid') {
      // The thing stays at the last free spot, and the person is told why.
      solid = true
      return 'solid'
    }
    solid = false
    if (edit !== dragFrom) change(dragFrom)
    return 'same'
  }
  function ondragend(): void {
    dragFrom = undefined
  }
  /** Puts the thing back where the drag began and forgets that drag's step. */
  function ondragcancel(): void {
    const from = dragFrom
    dragFrom = undefined
    solid = false
    if (from !== undefined && edit !== from) change(from)
  }

  function onpick(id: HitId | undefined): void {
    picked = id
    solid = false
  }

  const KEYS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' } as const
  function onthingkey(e: KeyboardEvent, id: HitId): void {
    if (e.key === 'Escape') return onpick(undefined)
    const way = KEYS[e.key as keyof typeof KEYS]
    if (way === undefined) return
    e.preventDefault()
    nudge(way, id)
  }

  // ---- what the screen around may ask ------------------------------------------------------------------------------

  /** Picks a thing (or lets go of the pick), as a touch on it does. */
  export function pick(id?: HitId): void {
    onpick(id)
  }

  /** Moves a thing by one step: the picked one unless `id` says another. */
  export function nudge(way: Way, id: HitId | undefined = picked): void {
    if (id === undefined) return
    picked = id
    const result = nudgeThing(edit, rules, id, way)
    solid = !result.moved && result.why === 'solid'
    if (!result.moved) return
    change(result.edit)
    // The stage learns of the move on the next frame; a thing nudged out of sight is brought back into the clear cell.
    void tick().then(() => stage?.reveal(id))
  }

  /** Steps back or forward, and shows the first thing that changed. */
  function step(next: LevelEdit): void {
    solid = false
    const before = edit.now
    change(next)
    if (picked !== undefined && placeOf(next.now, picked) === undefined) picked = undefined
    const changes = compareLevels(before, next.now)
    const first = changes.moved[0]?.id ?? changes.added[0] ?? changes.retyped[0]
    if (first !== undefined) void tick().then(() => stage?.reveal(first))
  }
  export function undo(): void {
    step(stepBack(edit))
  }
  export function redo(): void {
    step(stepForward(edit))
  }

  // ---- the room ---------------------------------------------------------------------------------------------------

  let layer: HTMLDivElement | undefined = $state()
  let toolsSlot: HTMLDivElement | undefined = $state()
  let blockSlot: HTMLDivElement | undefined = $state()
  let undoSlot: HTMLDivElement | undefined = $state()
  /** How much of each side the parts take, as measured: the far edge of the part from the edge of the screen. */
  let measured = $state<Partial<Room>>({})
  /** The least room for this shape, grown to fit whatever the parts measure (a long word in another language). */
  const room = $derived(roomWith(roomFor(shape), measured))

  const most = (values: readonly (number | undefined)[]): number | undefined => {
    const found = values.filter((v): v is number => v !== undefined)
    return found.length === 0 ? undefined : Math.max(...found)
  }
  function measure(): void {
    if (layer === undefined) return
    const box = layer.getBoundingClientRect()
    const above = (el: HTMLElement | undefined): number | undefined =>
      el === undefined ? undefined : box.bottom - el.getBoundingClientRect().top
    const bottom = most(shape === 'wide' ? [above(blockSlot), above(undoSlot)] : [above(toolsSlot), above(blockSlot), above(undoSlot)])
    const left = shape === 'wide' && toolsSlot !== undefined ? toolsSlot.getBoundingClientRect().right - box.left : undefined
    measured = { ...(bottom === undefined ? {} : { bottom }), ...(left === undefined ? {} : { left }) }
  }
  onMount(() => {
    const watcher = new ResizeObserver(measure)
    for (const part of [layer, toolsSlot, blockSlot, undoSlot]) if (part !== undefined) watcher.observe(part)
    measure()
    return () => watcher.disconnect()
  })
  // The parts move when the shape changes, and a part's words change with the language: measure again after both.
  $effect(() => {
    void shape
    void WORDS.undo
    void tick().then(measure)
  })
</script>

<div class="level" data-shape={shape}>
  <Stage
    bind:this={stage}
    {content}
    level={edit.now}
    {art}
    {room}
    {picked}
    mode="edit"
    title={levelId}
    {onpick}
    {ondrag}
    {ondragend}
    {ondragcancel}
    {onthingkey}
  />
  <!-- What lies over the level is a grid of slots, one per part, set by the shape. The grid takes no touches itself. -->
  <div class="parts" bind:this={layer}>
    <div class="slot tools" bind:this={toolsSlot}>
      <Panel part="tools">
        <div class="toolrow">
          <Tool label={WORDS.toolMove} icon="move" tool="move" pressed onpress={() => {}} />
        </div>
      </Panel>
    </div>
    <div class="slot block" bind:this={blockSlot}>
      <Panel part="block">
        <TitleBlock
          game={block.game}
          level={block.level}
          editor={WORDS.edWorld}
          saved={block.saved}
          compact={shape === 'narrow'}
        />
      </Panel>
    </div>
    <div class="slot undo" bind:this={undoSlot}>
      <Panel part="undo">
        <div class="pair">
          <Button label={WORDS.undo} icon="undo" disabled={edit.past.length === 0} onpress={undo} />
          <Button label={WORDS.redo} icon="redo" disabled={edit.future.length === 0} onpress={redo} />
        </div>
      </Panel>
    </div>
  </div>
  {#if notices !== undefined || solid}
    <div class="notices" data-part="notice">
      {#if solid}<Notice kind="info" text={WORDS.solid} />{/if}
      {@render notices?.()}
    </div>
  {/if}
  <!-- Said once to a screen reader whenever it changes; the title block says it in short for the eye. -->
  <div class="status" role="status">{block.status}</div>
</div>

<style>
  .level {
    position: absolute;
    inset: 0;
  }
  .parts {
    position: absolute;
    inset: 0;
    display: grid;
    gap: var(--space-2);
    padding: var(--margin, 16px);
    pointer-events: none;
  }
  .slot {
    display: flex;
    min-width: 0;
    pointer-events: auto;
  }
  .toolrow,
  .pair {
    display: flex;
    gap: var(--space-1);
    padding: var(--space-1);
  }
  /* The tools are a column on the left of a wide screen, centered; everywhere else a row along the bottom. */
  [data-shape='wide'] .parts {
    grid-template-columns: auto 1fr auto auto;
    grid-template-rows: 1fr auto;
    grid-template-areas:
      'tools . . .'
      'tools . block undo';
  }
  [data-shape='wide'] .toolrow {
    flex-direction: column;
  }
  [data-shape='mid'] .parts {
    grid-template-columns: auto 1fr auto auto;
    grid-template-rows: 1fr auto;
    grid-template-areas:
      '. . . .'
      'tools . block undo';
  }
  [data-shape='narrow'] .parts {
    grid-template-columns: 1fr auto;
    grid-template-rows: 1fr auto auto auto;
    grid-template-areas:
      '. .'
      '. block'
      '. undo'
      'tools tools';
  }
  .tools {
    grid-area: tools;
    align-self: end;
  }
  .block {
    grid-area: block;
    align-self: end;
  }
  .undo {
    grid-area: undo;
    align-self: end;
  }
  [data-shape='wide'] .tools {
    align-self: center;
  }
  /* The panels fill their slots, so a full-width tools row on a phone is one panel and not a small one in a wide box. */
  .slot > :global(.panel) {
    flex: 1;
  }
  /* What just happened floats under the cluster; it scrolls inside itself when the window is short. */
  .notices {
    position: absolute;
    top: 96px;
    right: var(--margin, 16px);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    width: min(380px, calc(100% - 2 * var(--margin, 16px)));
    max-height: calc(100% - 96px - var(--margin, 16px));
    overflow-y: auto;
    touch-action: pan-y;
  }
  /* Present for a screen reader and not for the eye. */
  .status {
    position: absolute;
    top: 0;
    left: 0;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
</style>
