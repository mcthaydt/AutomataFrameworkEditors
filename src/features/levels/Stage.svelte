<script lang="ts">
  import { fitWorld } from '@automataframework/framework'
  import { type Character, type Level, levelSize } from '@automataframework/framework/headless'
  import { onMount } from 'svelte'
  import { WORDS } from '../words/words.ts'
  import { createLevelCanvas, type LevelCanvas } from './level-canvas.ts'
  import { type Point, toScreen, toWorld } from './place.ts'

  // A level drawn on the screen, with every thing laid over the picture as a real button, so a finger, a keyboard and a
  // screen reader all reach it; the picture only draws. The stage decides nothing about the level: a finger on a thing
  // says where it wants it (`ondrag`), a key says which way (`onnudge`), and whoever holds the level works out what
  // happens and gives the stage the level to draw.
  interface Props {
    level: Level
    characters: Readonly<Record<string, Character>>
    /** The character a start point shows. */
    hero?: string | undefined
    /** What a screen reader calls the picture. */
    label?: string
    /** Only to look at: nothing moves. */
    readOnly?: boolean
    /** Things to ring (a change being looked at). */
    marked?: readonly string[]
    /** The thing that is picked, if one is. */
    picked?: string | undefined
    onpick?: (id: string | undefined) => void
    /** A finger took hold of a thing. */
    ongrab?: () => void
    /** The thing is wanted at `to`, counted from where the finger took hold. */
    ondrag?: (id: string, to: Point) => void
    /** The finger let go (false), or the drag was given up (true). */
    ondrop?: (gaveUp: boolean) => void
    onnudge?: (id: string, way: 'left' | 'right' | 'up' | 'down') => void
  }
  let {
    level,
    characters,
    hero,
    label = '',
    readOnly = false,
    marked = [],
    picked,
    onpick,
    ongrab,
    ondrag,
    ondrop,
    onnudge,
  }: Props = $props()

  /** The most a finger may wander before a press is a drag. */
  const DRAG_START_PX = 6
  /** The least a button on a thing may measure. */
  const MIN_TOUCH = 48

  let stage: HTMLDivElement | undefined = $state()
  let size = $state({ w: 0, h: 0 })
  let picture: LevelCanvas | undefined

  const fit = $derived(fitWorld(size, levelSize(level)))

  /** The drag a finger is in the middle of. */
  interface Drag {
    readonly id: string
    readonly pointer: number
    readonly x: number
    readonly y: number
    /** Where in the thing the finger took hold, in tiles, so the thing does not jump to the finger. */
    readonly grab: { x: number; y: number }
    /** Where the stage was, and how the level was fitted to it, when the finger went down. A line of text above
     *  wrapping or unwrapping while the finger is down moves the stage; the drag keeps counting from where it began. */
    readonly rect: { readonly left: number; readonly top: number }
    readonly fit: typeof fit
    active: boolean
  }
  let drag: Drag | undefined

  /** Gives the drag up: whoever holds the level puts the thing back where the drag began. */
  function cancelDrag(): void {
    if (drag === undefined) return
    const was = drag
    drag = undefined
    if (was.active) ondrop?.(true)
  }

  const stagePoint = (e: PointerEvent, rect: { left: number; top: number }): { x: number; y: number } => ({
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  })

  function down(e: PointerEvent): void {
    if (readOnly) return
    // A second finger cancels the drag in progress.
    if (drag !== undefined && e.pointerId !== drag.pointer) return cancelDrag()
    const button = (e.target as HTMLElement).closest<HTMLElement>('[data-thing]')
    const id = button?.dataset.thing
    if (button === null || id === undefined) {
      onpick?.(undefined)
      return
    }
    onpick?.(id)
    const thing = level.things.find((t) => t.id === id)
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
      ongrab?.()
    }
    const finger = toWorld(drag.fit, stagePoint(e, drag.rect))
    ondrag?.(drag.id, { x: finger.x - drag.grab.x, y: finger.y - drag.grab.y })
  }

  function up(e: PointerEvent): void {
    if (drag === undefined || e.pointerId !== drag.pointer) return
    const was = drag
    drag = undefined
    if (was.active) ondrop?.(false)
  }
  function cancelled(e: PointerEvent): void {
    if (drag !== undefined && e.pointerId === drag.pointer) cancelDrag()
  }

  const KEYS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' } as const
  function key(e: KeyboardEvent, id: string): void {
    if (readOnly) return
    if (e.key === 'Escape') {
      onpick?.(undefined)
      return
    }
    const way = KEYS[e.key as keyof typeof KEYS]
    if (way === undefined) return
    e.preventDefault()
    onnudge?.(id, way)
  }

  onMount(() => {
    let alive = true
    const watcher = new ResizeObserver(() => {
      if (stage === undefined) return
      // Turning the iPad changes the stage's width and cancels a drag; everything is fitted again. A change of height
      // alone is a line of text above wrapping or unwrapping, and must not drop a finger's drag.
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
      made.show(level, characters, readOnly ? marked : picked, hero)
    })
    return () => {
      alive = false
      watcher.disconnect()
      picture?.destroy()
    }
  })

  // Redraws the picture after every move, pick and resize. The state is read before the optional calls: `picture` is
  // still unset when this first runs (Pixi starts later), and an optional call that short-circuits never evaluates its
  // arguments, so reading them inside it left the effect with no dependencies and the picture drawn once only.
  $effect(() => {
    const { w, h } = size
    const now = level
    const ringed = readOnly ? marked : picked
    picture?.resize(w, h)
    picture?.show(now, characters, ringed, hero)
  })

  const thingBox = (id: string): { x: number; y: number; w: number; h: number } | undefined => {
    const thing = level.things.find((t) => t.id === id)
    if (thing === undefined) return undefined
    const c = characters[thing.character]
    const at = toScreen(fit, thing)
    const w = Math.max(MIN_TOUCH, (c?.size.w ?? 1) * fit.scale)
    const h = Math.max(MIN_TOUCH, (c?.size.h ?? 1) * fit.scale)
    return { x: at.x - w / 2, y: at.y - h / 2, w, h }
  }
</script>

<div
  class="stage"
  role="group"
  aria-label={label}
  bind:this={stage}
  data-scale={fit.scale}
  onpointerdown={down}
  onpointermove={move}
  onpointerup={up}
  onpointercancel={cancelled}
>
  {#each level.things as thing (thing.id)}
    {@const box = thingBox(thing.id)}
    {#if box !== undefined}
      <button
        type="button"
        class="thing"
        data-thing={thing.id}
        data-x={thing.x}
        data-y={thing.y}
        aria-label={readOnly ? thing.id : WORDS.thingLabel(thing.id)}
        aria-pressed={readOnly ? undefined : picked === thing.id}
        data-marked={marked.includes(thing.id) ? '' : undefined}
        style:left="{box.x}px"
        style:top="{box.y}px"
        style:width="{box.w}px"
        style:height="{box.h}px"
        onfocus={() => {
          if (!readOnly) onpick?.(thing.id)
        }}
        onkeydown={(e) => key(e, thing.id)}
      ></button>
    {/if}
  {/each}
</div>

<style>
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
    border-color: var(--accent, var(--focus));
  }
</style>
