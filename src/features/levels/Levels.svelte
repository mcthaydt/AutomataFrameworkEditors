<script lang="ts">
  import { fitWorld } from '@automataframework/framework'
  import { type Character, type Level, levelSize } from '@automataframework/framework/headless'
  import { onMount, untrack } from 'svelte'
  import { Button, Notice } from '../ui/ui.ts'
  import { WORDS } from '../words/words.ts'
  import { type LevelEdit, moveThing, nudgeThing, startEdit, undo } from './edit.ts'
  import { createLevelCanvas, type LevelCanvas } from './level-canvas.ts'
  import { toScreen, toWorld } from './place.ts'

  // The levels editor on the screen. A thing is a real button laid over the picture, so a finger, a keyboard and a
  // screen reader all reach it; the picture only draws. Every move is a plain function from `edit.ts`, so what a
  // finger does and what the arrow buttons do are the same thing. The edit is kept here until the screen above saves.
  interface Props {
    level: Level
    characters: Readonly<Record<string, Character>>
    /** The character a start point shows. */
    hero?: string | undefined
    canSave: boolean
    /** `plain` while another button on the screen is the one thing to press. */
    saveKind?: 'primary' | 'plain'
    /** Owned by the screen that saves. */
    status: 'clean' | 'dirty' | 'saving' | 'saved'
    /** The words for `status`. */
    statusText: string
    /** The title: the level's id. */
    title: string
    back: { label: string; onpress: () => void }
    /** After every move and undo. */
    onchange: (edit: LevelEdit) => void
    onsave: () => void
  }
  let { level, characters, hero, canSave, saveKind = 'primary', status, statusText, title, back, onchange, onsave }: Props = $props()

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

  const fit = $derived(fitWorld(size, levelSize(edit.now)))

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

  const stagePoint = (e: PointerEvent): { x: number; y: number } => {
    const rect = stage?.getBoundingClientRect()
    return { x: e.clientX - (rect?.left ?? 0), y: e.clientY - (rect?.top ?? 0) }
  }

  function down(e: PointerEvent): void {
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
    const finger = toWorld(fit, stagePoint(e))
    drag = {
      id,
      pointer: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      from: edit,
      grab: { x: finger.x - thing.x, y: finger.y - thing.y },
      active: false,
    }
  }

  function move(e: PointerEvent): void {
    if (drag === undefined || e.pointerId !== drag.pointer) return
    if (!drag.active) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) <= DRAG_START_PX) return
      drag.active = true
    }
    const finger = toWorld(fit, stagePoint(e))
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
      // Turning the iPad cancels a drag, and everything is fitted again.
      cancelDrag()
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
      made.show(edit.now, characters, selected, hero)
    })
    return () => {
      alive = false
      watcher.disconnect()
      picture?.destroy()
    }
  })

  $effect(() => {
    picture?.resize(size.w, size.h)
    picture?.show(edit.now, characters, selected, hero)
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
  <header class="top">
    <Button label={back.label} onpress={back.onpress} />
    <h1>{title}</h1>
    <Button
      label={WORDS.save}
      kind={saveKind}
      disabled={!canSave || status === 'clean' || status === 'saving' || status === 'saved'}
      onpress={onsave}
    />
  </header>
  <div class="status" role="status">{statusText}</div>
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
              aria-label={WORDS.thingLabel(thing.id)}
              aria-pressed={selected === thing.id}
              style:left="{box.x}px"
              style:top="{box.y}px"
              style:width="{box.w}px"
              style:height="{box.h}px"
              onfocus={() => (selected = thing.id)}
              onkeydown={(e) => key(e, thing.id)}
            ></button>
          {/if}
        {/each}
      </div>
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
      </div>
    </div>
  </div>
</div>

<style>
  .editor {
    display: flex;
    flex-direction: column;
    height: 100%;
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
  h1 {
    flex: 1 1 8ch;
    margin: 0;
    font-size: var(--font-size-big);
    text-align: center;
    overflow-wrap: anywhere;
  }
  .status {
    min-height: 1.4em;
    color: var(--muted);
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
    border-radius: var(--radius);
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
    border-radius: var(--radius);
    background: transparent;
    touch-action: none;
    cursor: grab;
  }
  .thing[aria-pressed='true'] {
    border-color: var(--focus);
  }
  .tools {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  .hint {
    margin: 0;
  }
  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  @container (min-aspect-ratio: 1/1) {
    .body {
      flex-direction: row;
    }
    .tools {
      flex: 0 0 14rem;
      overflow-y: auto;
    }
  }
</style>
