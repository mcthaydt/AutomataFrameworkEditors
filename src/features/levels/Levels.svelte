<script lang="ts">
  import { type Character, type Level, levelSize } from '@automataframework/framework/headless'
  import { onMount, type Snippet, untrack } from 'svelte'
  import { WORDS } from '../words/words.ts'
  import { type LevelEdit, moveThing, nudgeThing, redo, startEdit, undo } from './edit.ts'
  import { createLevelCanvas, type LevelCanvas } from './level-canvas.ts'
  import { fitInside, type Inset, type Size, toScreen, toWorld } from './place.ts'
  import { type Box, notesFor } from './notes.ts'
  import type { NotesMode } from './notes-mode.ts'
  import NotesLayer from './Notes.svelte'
  import Floats from './Floats.svelte'

  // The levels editor on the screen. The level fills the screen edge to edge and the tools float over it: the title,
  // Save and the status on top, copy tools at the side, the picked thing's card, and Undo and Redo. The level is fitted
  // into the clear cell the tools leave, so it never lies under one. A thing is a real button laid over the picture,
  // so a finger, a keyboard and a screen reader all reach it; the picture only draws. Every move is a plain function from `edit.ts`, so what a
  // finger does and what the arrow buttons do are the same thing. The edit is kept here until the screen above saves.
  interface Props {
    level: Level
    characters: Readonly<Record<string, Character>>
    /** The character a start point shows. */
    hero?: string | undefined
    canSave: boolean
    /** Only to look at: nothing moves, nothing floats, and there are no arrows, Undo or Save. */
    readOnly?: boolean
    /** Things to ring (a change being looked at). */
    marked?: readonly string[]
    /** `plain` while another button on the screen is the one thing to press. */
    saveKind?: 'primary' | 'plain'
    /** Owned by the screen that saves. */
    status: 'clean' | 'dirty' | 'saving' | 'saved'
    /** The words for `status`. */
    statusText: string
    /** A sentence that is true for as long as the level is open (what this person may do); it sits in the top panel. */
    standing?: Snippet | undefined
    /** What just happened, with the buttons it needs: floated over the clear cell until it is answered. */
    said?: Snippet | undefined
    /** The words on the stamp that lands over the level's corner after a save, if there is one. */
    stamp?: string | undefined
    /** The drawing notes' switch: a setting of this device, kept by the screen above. */
    notes?: NotesMode
    onnotes?: (mode: NotesMode) => void
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
  let { level, characters, hero, canSave, readOnly = false, marked = [], saveKind = 'primary', status, statusText, standing, said, stamp = undefined, notes = 'on', onnotes = () => {}, title, back, onchange, onsave, oncopytext, oncopyfile }: Props = $props()

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
  /** The empty cell the floating panels leave: it only measures, and the level is fitted inside it. */
  let clearBox: HTMLElement | undefined = $state()

  const NO_INSET: Inset = { top: 0, right: 0, bottom: 0, left: 0 }
  // How much of the stage the floating panels cover: the clear cell's box measured against the stage's. Read only,
  // nothing floats and the level has the whole stage.
  let inset = $state.raw<Inset>(NO_INSET)
  const fit = $derived(fitInside(size, inset, levelSize(edit.now)))

  const thingBox = (id: string): { x: number; y: number; w: number; h: number } | undefined => {
    const thing = edit.now.things.find((t) => t.id === id)
    if (thing === undefined) return undefined
    const c = characters[thing.character]
    const at = toScreen(fit, thing)
    const w = Math.max(MIN_TOUCH, (c?.size.w ?? 1) * fit.scale)
    const h = Math.max(MIN_TOUCH, (c?.size.h ?? 1) * fit.scale)
    return { x: at.x - w / 2, y: at.y - h / 2, w, h }
  }

  // The drawing notes: where they go depends on the clear cell, the picked thing's button and the block's own size.
  let blockSize = $state.raw<Size>({ w: 180, h: 96 })
  /** Counts every Undo and Redo, so the notes are written again at the new place. */
  let again = $state(0)
  /** Which pair of arrows a pressed note is pointing at, until the next press anywhere. */
  let asked = $state<'x' | 'y' | undefined>(undefined)
  let card: HTMLElement | undefined = $state()
  const clearBounds = $derived<Box>({
    x: inset.left,
    y: inset.top,
    w: Math.max(0, size.w - inset.left - inset.right),
    h: Math.max(0, size.h - inset.top - inset.bottom),
  })
  const pickedThing = $derived(
    selected === undefined || readOnly ? undefined : edit.now.things.find((t) => t.id === selected),
  )
  const placed = $derived(
    notesFor({
      level: edit.now,
      fit,
      thing: pickedThing === undefined ? undefined : thingBox(pickedThing.id),
      clear: clearBounds,
      block: blockSize,
    }),
  )
  /** The clear cell is under 30 rem wide (rem is this page's own type size): one note holds both numbers. */
  const joined = $derived(clearBounds.w < 30 * 18)

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
    // A press on a note is for the note, not for the stage: the picked thing stays picked.
    if ((e.target as HTMLElement).closest('.note') !== null) return
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
    again += 1
    change(undo(edit))
  }
  function giveBack(): void {
    solid = false
    again += 1
    change(redo(edit))
  }

  /** A pressed note: the keyboard goes to the arrows that change it, and a finger is shown where they are. */
  function ask(axis: 'x' | 'y'): void {
    asked = axis
    const first = card?.querySelector<HTMLElement>(`[data-move="${axis === 'x' ? 'left' : 'up'}"]`)
    first?.focus({ preventScroll: true })
    first?.scrollIntoView({ block: 'nearest' })
  }

  /** Measures the stage and the clear cell. Whole pixels would hide a half-pixel change, so the numbers are kept. */
  function measure(): void {
    if (stage === undefined) return
    size = { w: stage.clientWidth, h: stage.clientHeight }
    if (clearBox === undefined) {
      inset = NO_INSET
      return
    }
    const s = stage.getBoundingClientRect()
    const c = clearBox.getBoundingClientRect()
    const next = { top: c.top - s.top, right: s.right - c.right, bottom: s.bottom - c.bottom, left: c.left - s.left }
    if (JSON.stringify(next) !== JSON.stringify(inset)) inset = next
  }

  onMount(() => {
    let alive = true
    // The mark that points at a pair of arrows goes at the next press anywhere. A note's own press comes after this one
    // (a press, then a click), so it sets the mark again.
    const unmark = (): void => {
      asked = undefined
    }
    window.addEventListener('pointerdown', unmark, true)
    window.addEventListener('keydown', unmark, true)
    let frame = 0
    const watcher = new ResizeObserver(() => {
      if (stage === undefined) return
      // Turning the iPad changes the stage's width and cancels a drag; everything is fitted again. A change of height
      // alone is a line of text above wrapping or unwrapping (the status, the tip), and must not drop a finger's drag.
      if (stage.clientWidth !== size.w) cancelDrag()
      // Measured a frame later: fitting the level can change the page's scroll bar and so the stage again, and a browser
      // reports a change made while it is still delivering changes as an error ("loop completed with undelivered
      // notifications") that nothing in the page can catch.
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    })
    if (stage !== undefined) {
      watcher.observe(stage)
      // The top row wrapping changes the clear cell and not the stage, so the cell is watched itself.
      if (clearBox !== undefined) watcher.observe(clearBox)
      measure()
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
      window.removeEventListener('pointerdown', unmark, true)
      window.removeEventListener('keydown', unmark, true)
      cancelAnimationFrame(frame)
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
    const cell = inset
    picture?.resize(w, h)
    picture?.fitTo(cell)
    picture?.show(now, characters, hero)
  })

</script>

<div class="editor">
  <div class="area" class:floating={!readOnly}>
    <div
      class="stage"
      role="group"
      aria-label={title}
      bind:this={stage}
      data-scale={fit.scale}
      onpointerdown={down}
      onpointermove={move}
      onpointerup={up}
      onpointercancel={cancelled}
    >
      <NotesLayer
        notes={placed}
        mode={notes}
        picked={pickedThing}
        {joined}
        {again}
        onnote={ask}
        onblock={(measured) => {
          if (measured.w !== blockSize.w || measured.h !== blockSize.h) blockSize = measured
        }}
      />
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
    <!-- A level only to look at has nothing floating over it: the screen around it has the heading and the way back. -->
    {#if !readOnly}
      <Floats
        bind:clearBox
        bind:card
        {back}
        {title}
        {canSave}
        {saveKind}
        {status}
        {statusText}
        {standing}
        {said}
        {stamp}
        {notes}
        {onnotes}
        {oncopytext}
        {oncopyfile}
        {asked}
        thing={selected === undefined ? undefined : edit.now.things.find((t) => t.id === selected)}
        {solid}
        onnudge={(way) => selected !== undefined && nudge(selected, way)}
        canUndo={edit.past.length > 0}
        canRedo={edit.future.length > 0}
        onundo={takeBack}
        onredo={giveBack}
        {onsave}
      />
    {/if}
  </div>
</div>

<style>
  .editor {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
  }
  /* The shape of this box, not of the device, decides how the tools are laid out. It is a size container so the
     floating grid can ask it. The stage fills it edge to edge, and the tools float above. */
  .area {
    position: relative;
    flex: 1;
    min-height: 0;
    container-type: size;
  }
  /* The tools need a height of their own, or on a phone they leave the level no room at all: below it the page scrolls
     (the screen holding this scrolls inside itself), and above it the level takes what is left. 44rem is the top panel,
     the tools row and the card, with 10rem clear between them; sideways, with the card at the side, 24rem is enough. */
  .area.floating {
    min-height: 44rem;
  }
  @media (min-aspect-ratio: 1/1) and (min-width: 36rem) {
    .area.floating {
      min-height: 24rem;
    }
  }
  /* The game's art is never rounded, tinted or covered by anything but the tools' own boxes. */
  .stage {
    position: absolute;
    inset: 0;
    z-index: 0;
    overflow: hidden;
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
  /* The ring round a picked thing, and round a thing a waiting change moved, is the thing's own button: touch-coloured
     dashes over a ground band, so it shows on any art, and the canvas draws the game's art and nothing else. It is also
     the sign that a thing has the keyboard's focus: this rule outranks `:focus-visible`. */
  .thing[aria-pressed='true'],
  .thing[data-marked] {
    border-color: var(--ground);
    outline: 2px dashed var(--touch);
    outline-offset: 0;
  }
</style>
