<script lang="ts">
  import { type Character, type Level, levelSize } from '@automataframework/framework/headless'
  import { onMount, untrack } from 'svelte'
  import { Button, Notice } from '../ui/ui.ts'
  import { WORDS } from '../words/words.ts'
  import { type LevelEdit, moveThing, nudgeThing, startEdit, undo } from './edit.ts'
  import { createLevelCanvas, type LevelCanvas } from './level-canvas.ts'
  import { fitInside, type Inset, toScreen, toWorld } from './place.ts'

  // The levels editor on the screen. A thing is a real button laid over the picture, so a finger, a keyboard and a
  // screen reader all reach it; the picture only draws. Every move is a plain function from `edit.ts`, so what a
  // finger does and what the arrow buttons do are the same thing. The edit is kept here until the screen above saves.
  interface Props {
    level: Level
    characters: Readonly<Record<string, Character>>
    /** The character a start point shows. */
    hero?: string | undefined
    canSave: boolean
    /** Only to look at: nothing moves, and there are no arrows, Undo or Save. */
    readOnly?: boolean
    /** Things to ring (a change being looked at). */
    marked?: readonly string[]
    /** `plain` while another button on the screen is the one thing to press. */
    saveKind?: 'primary' | 'plain'
    /** Owned by the screen that saves. */
    status: 'clean' | 'dirty' | 'saving' | 'saved'
    /** The words for `status`. */
    statusText: string
    /** The level's id: the editor's heading, and what the stage is called to a screen reader. */
    title: string
    /** The way out. Not needed read only: the screen around it has the heading and the way back. */
    back?: { label: string; onpress: () => void }
    /** After every move and undo. */
    onchange: (edit: LevelEdit) => void
    onsave: () => void
    /** Puts the level's text where a person can paste it. Always on: it never needs a sign-in. */
    oncopytext?: () => void
    /** Hands the level over as a file. */
    oncopyfile?: () => void
  }
  let { level, characters, hero, canSave, readOnly = false, marked = [], saveKind = 'primary', status, statusText, title, back, onchange, onsave, oncopytext, oncopyfile }: Props = $props()

  /** The most a finger may wander before a press is a drag. */
  const DRAG_START_PX = 6
  /** The least a button on a thing may measure. */
  const MIN_TOUCH = 48

  // What the person has done so far. Replaced whole on every move, never changed in place.
  let edit = $state.raw<LevelEdit>(untrack(() => startEdit(level)))
  let selected = $state<string | undefined>(undefined)
  let solid = $state(false)
  let stage: HTMLDivElement | undefined = $state()
  let size = $state({ w: 0, h: 0 })
  let picture: LevelCanvas | undefined

  // How much of the stage the floating tools cover. All zeros until the tools float (Task 4 measures the clear cell).
  const inset: Inset = { top: 0, right: 0, bottom: 0, left: 0 }
  const fit = $derived(fitInside(size, inset, levelSize(edit.now)))

  /** The drag a finger is in the middle of. */
  interface Drag {
    readonly id: string
    readonly pointer: number
    readonly x: number
    readonly y: number
    /** The edit as it was when the finger went down: every move is worked out from it, so a drag is one undo step. */
    readonly from: LevelEdit
    /** Where in the thing the finger took hold, in tiles, so the thing does not jump to the finger. */
    readonly grab: { x: number; y: number }
    /** Where the stage was, and how the level was fitted to it, when the finger went down. A line of text above
     *  wrapping or unwrapping while the finger is down moves the stage; the drag keeps counting from where it began. */
    readonly rect: { readonly left: number; readonly top: number }
    readonly fit: typeof fit
    active: boolean
  }
  let drag: Drag | undefined

  function change(next: LevelEdit): void {
    edit = next
    onchange(next)
  }

  /** Puts the thing back where the drag began, and forgets that drag's undo steps. */
  function cancelDrag(): void {
    if (drag === undefined) return
    const { from } = drag
    drag = undefined
    solid = false
    if (edit !== from) change(from)
  }

  const stagePoint = (e: PointerEvent, rect: { left: number; top: number }): { x: number; y: number } => ({
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  })

  function down(e: PointerEvent): void {
    if (readOnly) return
    solid = false
    // A second finger cancels the drag in progress.
    if (drag !== undefined && e.pointerId !== drag.pointer) return cancelDrag()
    const button = (e.target as HTMLElement).closest<HTMLElement>('[data-thing]')
    const id = button?.dataset.thing
    if (button === null || id === undefined) {
      selected = undefined
      return
    }
    selected = id
    const thing = edit.now.things.find((t) => t.id === id)
    if (thing === undefined) return
    try {
      button.setPointerCapture(e.pointerId)
    } catch {
      // A pointer that is already gone cannot be captured; the drag still works from the events it gets.
    }
    const box = stage?.getBoundingClientRect()
    const rect = { left: box?.left ?? 0, top: box?.top ?? 0 }
    const finger = toWorld(fit, stagePoint(e, rect))
    drag = {
      id,
      pointer: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      from: edit,
      grab: { x: finger.x - thing.x, y: finger.y - thing.y },
      rect,
      fit,
      active: false,
    }
  }

  function move(e: PointerEvent): void {
    if (drag === undefined || e.pointerId !== drag.pointer) return
    if (!drag.active) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) <= DRAG_START_PX) return
      drag.active = true
    }
    const finger = toWorld(drag.fit, stagePoint(e, drag.rect))
    const result = moveThing(drag.from, characters, drag.id, {
      x: finger.x - drag.grab.x,
      y: finger.y - drag.grab.y,
    })
    if (result.moved) {
      solid = false
      change(result.edit)
    } else if (result.why === 'solid') {
      // The thing stays at the last free spot, and the person is told why.
      solid = true
    } else if (result.why === 'same' && edit !== drag.from) {
      solid = false
      change(drag.from)
    }
  }

  function up(e: PointerEvent): void {
    if (drag !== undefined && e.pointerId === drag.pointer) drag = undefined
  }
  function cancelled(e: PointerEvent): void {
    if (drag !== undefined && e.pointerId === drag.pointer) cancelDrag()
  }

  function nudge(id: string, way: 'left' | 'right' | 'up' | 'down'): void {
    const result = nudgeThing(edit, characters, id, way)
    solid = !result.moved && result.why === 'solid'
    if (result.moved) change(result.edit)
  }

  const KEYS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' } as const
  function key(e: KeyboardEvent, id: string): void {
    if (readOnly) return
    if (e.key === 'Escape') {
      selected = undefined
      solid = false
      return
    }
    const way = KEYS[e.key as keyof typeof KEYS]
    if (way === undefined) return
    e.preventDefault()
    nudge(id, way)
  }

  function takeBack(): void {
    solid = false
    change(undo(edit))
  }

  onMount(() => {
    let alive = true
    const watcher = new ResizeObserver(() => {
      if (stage === undefined) return
      // Turning the iPad changes the stage's width and cancels a drag; everything is fitted again. A change of height
      // alone is a line of text above wrapping or unwrapping (the status, the tip), and must not drop a finger's drag.
      if (stage.clientWidth !== size.w) cancelDrag()
      size = { w: stage.clientWidth, h: stage.clientHeight }
    })
    if (stage !== undefined) {
      watcher.observe(stage)
      size = { w: stage.clientWidth, h: stage.clientHeight }
    }
    void createLevelCanvas().then((made) => {
      if (!alive) return made.destroy()
      picture = made
      stage?.prepend(made.canvas)
      made.resize(size.w, size.h)
      made.fitTo(inset)
      made.show(edit.now, characters, hero)
    })
    return () => {
      alive = false
      watcher.disconnect()
      picture?.destroy()
    }
  })

  // Redraws the picture after every move, selection and resize. The state is read before the optional calls: `picture`
  // is still unset when this first runs (Pixi starts later), and an optional call that short-circuits never evaluates
  // its arguments, so reading them inside it left the effect with no dependencies and the picture drawn once only.
  $effect(() => {
    const { w, h } = size
    const now = edit.now
    picture?.resize(w, h)
    picture?.fitTo(inset)
    picture?.show(now, characters, hero)
  })

  const thingBox = (id: string): { x: number; y: number; w: number; h: number } | undefined => {
    const thing = edit.now.things.find((t) => t.id === id)
    if (thing === undefined) return undefined
    const c = characters[thing.character]
    const at = toScreen(fit, thing)
    const w = Math.max(MIN_TOUCH, (c?.size.w ?? 1) * fit.scale)
    const h = Math.max(MIN_TOUCH, (c?.size.h ?? 1) * fit.scale)
    return { x: at.x - w / 2, y: at.y - h / 2, w, h }
  }
</script>

<div class="editor">
  <!-- A level only to look at has no header: the screen around it has the heading and the one way back. -->
  {#if !readOnly}
    <header class="top">
      {#if back !== undefined}<Button label={back.label} onpress={back.onpress} />{/if}
      <h1 class="title">{title}</h1>
      <Button
        label={WORDS.save}
        kind={saveKind}
        disabled={!canSave || status === 'clean' || status === 'saving' || status === 'saved'}
        onpress={onsave}
      />
    </header>
  {/if}
  {#if !readOnly}<div class="status" role="status">{statusText}</div>{/if}
  <div class="area">
    <div class="body">
      <div class="stage" role="group" aria-label={title} bind:this={stage} data-scale={fit.scale} onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={cancelled}>
        {#each edit.now.things as thing (thing.id)}
          {@const box = thingBox(thing.id)}
          {#if box !== undefined}
            <button
              type="button"
              class="thing"
              data-thing={thing.id}
              data-x={thing.x}
              data-y={thing.y}
              aria-label={readOnly ? thing.id : WORDS.thingLabel(thing.id)}
              aria-pressed={readOnly ? undefined : selected === thing.id}
              data-marked={marked.includes(thing.id) ? '' : undefined}
              style:left="{box.x}px"
              style:top="{box.y}px"
              style:width="{box.w}px"
              style:height="{box.h}px"
              onfocus={() => {
                if (!readOnly) selected = thing.id
              }}
              onkeydown={(e) => key(e, thing.id)}
            ></button>
          {/if}
        {/each}
      </div>
      {#if !readOnly}
      <div class="tools">
        <p class="hint">{selected === undefined ? WORDS.hintIdle : WORDS.hintSelected(selected)}</p>
        {#if solid}<Notice kind="info" text={WORDS.solid} />{/if}
        <div class="buttons">
          {#if selected !== undefined}
            {@const id = selected}
            <Button label={WORDS.moveLeft} onpress={() => nudge(id, 'left')} />
            <Button label={WORDS.moveRight} onpress={() => nudge(id, 'right')} />
            <Button label={WORDS.moveUp} onpress={() => nudge(id, 'up')} />
            <Button label={WORDS.moveDown} onpress={() => nudge(id, 'down')} />
          {/if}
          <Button label={WORDS.undo} disabled={edit.past.length === 0} onpress={takeBack} />
        </div>
        {#if oncopytext !== undefined || oncopyfile !== undefined}
          <div class="buttons">
            {#if oncopytext !== undefined}<Button label={WORDS.copyLevel} onpress={oncopytext} />{/if}
            {#if oncopyfile !== undefined}<Button label={WORDS.copyKeep} onpress={oncopyfile} />{/if}
          </div>
        {/if}
      </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .editor {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
  }
  .top {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    align-items: center;
    justify-content: space-between;
  }
  .title {
    flex: 1 1 8ch;
    margin: 0;
    font-size: var(--font-size-big);
    text-align: center;
    overflow-wrap: anywhere;
  }
  .status {
    min-height: 1.4em;
    color: var(--quiet);
  }
  /* The shape of this box, not of the device, decides whether the tools sit under the stage or beside it. */
  .area {
    flex: 1;
    min-height: 0;
    container-type: size;
  }
  .body {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    height: 100%;
  }
  .stage {
    position: relative;
    flex: 1;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
    border-radius: var(--corner);
    touch-action: none;
  }
  .stage :global(canvas) {
    position: absolute;
    inset: 0;
  }
  .thing {
    position: absolute;
    padding: 0;
    border: 2px solid transparent;
    border-radius: var(--corner);
    background: transparent;
    touch-action: none;
    cursor: grab;
  }
  /* The ring round a picked thing, and round a thing a waiting change moved, is the thing's own button: the canvas
     draws the game's art and nothing else. */
  .thing[aria-pressed='true'],
  .thing[data-marked] {
    border-color: var(--touch);
  }
  /* Under the stage the tools have a height of their own and scroll inside it, so the stage keeps its size when the
     arrows appear or a note comes and goes: a drag in progress must not see the picture shrink under the finger. */
  .tools {
    display: flex;
    flex: 0 0 clamp(10rem, 38cqh, 20rem);
    flex-direction: column;
    gap: var(--space-2);
    overflow-y: auto;
  }
  .hint {
    margin: 0;
  }
  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  /* Beside each other only when the box is wide enough for a stage worth dragging in: on a phone held upright the
     stage keeps the full width and the tools go under it, even when the box is nearly square. */
  @container (min-aspect-ratio: 1/1) and (min-width: 36rem) {
    .body {
      flex-direction: row;
    }
    .tools {
      flex: 0 0 14rem;
      overflow-y: auto;
    }
  }
</style>
