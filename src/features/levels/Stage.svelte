<script lang="ts">
  import type { Fit } from '@automataframework/framework'
  import { type GameContent, type Level, levelSize } from '@automataframework/framework/headless'
  import { onMount, type Snippet, untrack } from 'svelte'
  import { type HitId, startId } from './compare.ts'
  import { placeOf, rulesOf, sizeOf } from './edit.ts'
  import { WORDS } from '../words/words.ts'
  import { type Art, type LevelPicture, openLevelPicture } from './level-picture.ts'
  import { fitInRoom, type Point, type Room, toScreen, toWorld } from './place.ts'
  import {
    type Box,
    clampView,
    edgeSlide,
    fitOf,
    isWhole,
    type LevelView,
    mostZoom,
    panBy,
    pinch,
    reveal as revealView,
    stepZoom,
    whole,
    zoomAbout,
  } from './view.ts'

  // The level on the screen: the framework's picture of it, and over the picture one real button for every thing and
  // start point, so a finger, a keyboard and a screen reader all reach them. One finger moves a thing; two fingers (or
  // a trackpad, a wheel, the buttons and the keys) make the level bigger and move it. The picture is drawn again at
  // the view's scale, never stretched, and the buttons are laid by the same `Fit`, so they always agree with it.
  interface Props {
    content: GameContent
    /** The version of the level to draw. */
    level: Level
    /** The level's pictures, loaded by the screen around it; the picture owns them from here and frees them. */
    art: Art | undefined
    /** Kept clear of the level (CSS pixels): where the floating parts sit. The clear cell is the stage less this. */
    room: Room
    picked: HitId | undefined
    /** `edit`: pick and drag. `look`: pick only. `read`: neither; the level can still be zoomed and moved. */
    mode: 'edit' | 'look' | 'read'
    /** What a screen reader calls the stage. */
    title: string
    /** Things to ring (a change being looked at). */
    marked?: readonly HitId[]
    /** What lies over the picture, laid by the level's own `Fit` (the drawing notes). */
    layer?: Snippet<[Fit]>
    onpick: (id: HitId | undefined) => void
    /** A finger holds `id`, wanting its middle at `to`. Says whether it went there. */
    ondrag: (id: HitId, to: Point) => 'moved' | 'solid' | 'same'
    ondragend: () => void
    /** A second finger landed in the middle of a drag: the thing goes back and no step is made. */
    ondragcancel: () => void
    /** A key on a thing. */
    onthingkey?: (e: KeyboardEvent, id: HitId) => void
    /** Every change of the view, and what made it. */
    onview?: (view: LevelView, by: 'fingers' | 'wheel' | 'buttons' | 'reveal') => void
  }
  let {
    content,
    level,
    art,
    room,
    picked,
    mode,
    title,
    marked = [],
    layer,
    onpick,
    ondrag,
    ondragend,
    ondragcancel,
    onthingkey,
    onview,
  }: Props = $props()

  /** The most a finger may wander before a press is a drag, and before a tap is no longer a tap. */
  const DRAG_START_PX = 6
  const TAP_PX = 10
  /** The least a button on a thing may measure. */
  const MIN_TOUCH = 48
  /** How far one turn of the mouse wheel (or a trackpad's step) zooms with Ctrl or Cmd: about one button press. */
  const WHEEL_ZOOM = 0.01
  const WHEEL_ZOOM_MOST = 40
  const GLIDE_MS = 150
  const WHOLE_MS = 200

  let stage: HTMLDivElement | undefined = $state()
  let size = $state({ w: 0, h: 0 })
  let picture: LevelPicture | undefined
  /** Fingers are making the level bigger or moving it. */
  let moving = $state(false)

  const world = $derived(levelSize(level))
  const rules = $derived(rulesOf(content, level))
  const clear = $derived<Box>({
    x: room.left,
    y: room.top,
    w: Math.max(0, size.w - room.left - room.right),
    h: Math.max(0, size.h - room.top - room.bottom),
  })
  /** The whole level in the clear cell: where the level is at zoom 1. */
  const home = $derived(fitInRoom(size, room, world))
  // What was asked for, kept legal against the level and the room as they are now (a turn of the device, another level).
  let wanted = $state.raw<LevelView>(untrack(() => whole(levelSize(level))))
  const now = $derived(clampView(wanted, home, clear, world))
  const fit = $derived<Fit>(isWhole(now) ? home : fitOf(now, home, clear))
  const hits = $derived([
    ...level.things.map((t) => ({ id: t.id, x: t.x, y: t.y })),
    ...level.starts.map((s) => ({ id: startId(s.player), x: s.x, y: s.y })),
  ])

  // A new level opens whole.
  let seen = untrack(() => level.id)
  $effect(() => {
    const id = level.id
    if (id === seen) return
    seen = id
    wanted = whole(untrack(() => world))
  })

  // ---- the view --------------------------------------------------------------------------------------------------

  let frame = 0
  let next: { view: LevelView; by: 'fingers' | 'wheel' | 'buttons' | 'reveal' } | undefined
  let gliding = 0

  /** Takes a new view at once, wherever it came from. */
  function take(view: LevelView, by: 'fingers' | 'wheel' | 'buttons' | 'reveal'): void {
    wanted = view
    onview?.(view, by)
  }
  /** Fingers and the wheel: once a frame, however many events came. */
  function queue(view: LevelView, by: 'fingers' | 'wheel'): void {
    // A person's hand takes over from a glide that is still on its way.
    cancelAnimationFrame(gliding)
    next = { view, by }
    if (frame !== 0) return
    frame = requestAnimationFrame(() => {
      frame = 0
      if (next !== undefined) take(next.view, next.by)
      next = undefined
    })
  }
  const reducedMotion = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches

  /** Moves to `target` over `ms` (at once under reduced motion). Fingers and the wheel are never eased. */
  function glide(target: LevelView, ms: number, by: 'buttons' | 'reveal'): void {
    cancelAnimationFrame(gliding)
    const from = now
    const goal = clampView(target, home, clear, world)
    if (reducedMotion() || ms <= 0) return take(goal, by)
    const began = performance.now()
    const step = (at: number): void => {
      const k = Math.min(1, (at - began) / ms)
      const eased = 1 - (1 - k) ** 3
      const lerp = (a: number, b: number): number => a + (b - a) * eased
      take(
        k === 1
          ? goal
          : clampView(
              { zoom: lerp(from.zoom, goal.zoom), x: lerp(from.x, goal.x), y: lerp(from.y, goal.y) },
              home,
              clear,
              world,
            ),
        by,
      )
      if (k < 1) gliding = requestAnimationFrame(step)
    }
    gliding = requestAnimationFrame(step)
  }

  /** The point a button or key zooms about: the picked thing's middle when it is in view, else the cell's middle. */
  function anchor(): Point {
    const at = picked === undefined ? undefined : placeOf(level, picked)
    if (at !== undefined) {
      const p = toScreen(fit, at)
      if (p.x >= clear.x && p.x <= clear.x + clear.w && p.y >= clear.y && p.y <= clear.y + clear.h) return p
    }
    return { x: clear.x + clear.w / 2, y: clear.y + clear.h / 2 }
  }

  /** The buttons and keys: one step in or out about the picked thing, or all the way back. */
  export function zoom(way: 'in' | 'out' | 'whole'): void {
    if (way === 'whole') return glide(whole(world), WHOLE_MS, 'buttons')
    const to = stepZoom(now.zoom, way, mostZoom(home))
    glide(zoomAbout(now, home, clear, world, anchor(), to / now.zoom), GLIDE_MS, 'buttons')
  }

  /** Brings a thing into the clear cell by the least move. */
  export function reveal(id: HitId): void {
    const at = placeOf(level, id)
    if (at === undefined) return
    const box = sizeOf(rules, level, id)
    glide(
      revealView(now, home, clear, world, { x: at.x - box.w / 2, y: at.y - box.h / 2, w: box.w, h: box.h }),
      GLIDE_MS,
      'reveal',
    )
  }

  /** Moves the level one tile (or half the clear cell) so a keyboard can reach all of it. */
  export function pan(way: 'left' | 'right' | 'up' | 'down', far = false): void {
    const across = way === 'left' || way === 'right'
    const step = far ? (across ? clear.w : clear.h) / 2 : fit.scale
    // The level goes the other way: pressing right brings what is to the right into the middle.
    const by = way === 'right' || way === 'down' ? -step : step
    cancelAnimationFrame(gliding)
    take(panBy(now, home, clear, world, across ? by : 0, across ? 0 : by), 'buttons')
  }

  // ---- fingers ---------------------------------------------------------------------------------------------------

  interface Finger {
    x: number
    y: number
  }
  /** The fingers that went down on the stage, by pointer, in the stage's own pixels. */
  const fingers = new Map<number, Finger>()
  let rect = { left: 0, top: 0 }
  /** Two fingers making the level bigger and moving it, from the view they started with. */
  let gesture: { start: LevelView; from: [Point, Point]; ids: [number, number] } | undefined
  /** A gesture ended while a finger is still down: nothing counts until every finger is off. */
  let spent = false
  /** One finger down on empty ground that has not moved: a tap when it lifts. */
  let tap: { pointer: number; at: Point } | undefined
  /** The drag a finger is in the middle of. */
  let drag:
    | { id: HitId; pointer: number; start: Point; grab: Point; active: boolean; before: HitId | undefined }
    | undefined
  let slide = 0

  const pointOf = (e: PointerEvent): Point => ({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  const idOf = (target: EventTarget | null): HitId | undefined =>
    (target as HTMLElement | null)?.closest<HTMLElement>('[data-thing]')?.dataset.thing

  /** The thing is held at the finger's place, less where in it the finger took hold. */
  function dragTo(finger: Point): void {
    if (drag === undefined) return
    const at = toWorld(fit, finger)
    ondrag(drag.id, { x: at.x - drag.grab.x, y: at.y - drag.grab.y })
  }

  /** While a thing is held near the edge of the clear cell, the level slides under it. */
  function sliding(last: number): void {
    slide = requestAnimationFrame((at) => {
      const finger = drag === undefined ? undefined : fingers.get(drag.pointer)
      if (drag === undefined || finger === undefined) return
      const move = edgeSlide(finger, clear, (at - last) / 1000)
      if (move.dx !== 0 || move.dy !== 0) {
        const before = now
        const moved = panBy(now, home, clear, world, -move.dx, -move.dy)
        if (moved.x !== before.x || moved.y !== before.y) {
          take(moved, 'fingers')
          // The level moved under the finger, so the thing is held at the finger's new place in it.
          dragTo(finger)
        }
      }
      sliding(at)
    })
  }

  function endDrag(): void {
    cancelAnimationFrame(slide)
    drag = undefined
  }

  function down(e: PointerEvent): void {
    if (spent || fingers.size >= 2) return
    if (fingers.size === 0) {
      const box = stage?.getBoundingClientRect()
      rect = { left: box?.left ?? 0, top: box?.top ?? 0 }
    }
    const finger = pointOf(e)
    fingers.set(e.pointerId, finger)
    try {
      stage?.setPointerCapture(e.pointerId)
    } catch {
      // A pointer that is already gone cannot be captured; the events it sends still arrive.
    }
    if (fingers.size === 2) return startGesture()
    const id = idOf(e.target)
    if (id === undefined) {
      tap = mode === 'read' ? undefined : { pointer: e.pointerId, at: finger }
      return
    }
    if (mode === 'read') return
    const before = picked
    onpick(id)
    // Where in the thing the finger took hold, in tiles, so the thing does not jump to the finger.
    const at = placeOf(level, id)
    const held = toWorld(fit, finger)
    const grab = at === undefined ? { x: 0, y: 0 } : { x: held.x - at.x, y: held.y - at.y }
    drag = { id, pointer: e.pointerId, start: { x: e.clientX, y: e.clientY }, grab, active: false, before }
  }

  /** The second finger landed: a drag is called off, a pick the first finger made is put back, and the two zoom. */
  function startGesture(): void {
    tap = undefined
    if (drag !== undefined) {
      const { active, before, id } = drag
      endDrag()
      if (active) ondragcancel()
      if (before !== id) onpick(before)
    }
    const entries = [...fingers.entries()]
    const [a, b] = entries
    if (a === undefined || b === undefined) return
    // Copies: the fingers' own points are changed on every move, and the gesture is worked out from where they began.
    gesture = { start: now, from: [{ ...a[1] }, { ...b[1] }], ids: [a[0], b[0]] }
    moving = true
  }

  function move(e: PointerEvent): void {
    const finger = fingers.get(e.pointerId)
    if (finger === undefined) return
    const at = pointOf(e)
    finger.x = at.x
    finger.y = at.y
    if (gesture !== undefined) {
      const a = fingers.get(gesture.ids[0])
      const b = fingers.get(gesture.ids[1])
      if (a !== undefined && b !== undefined) {
        queue(pinch(gesture.start, home, clear, world, gesture.from, [{ ...a }, { ...b }]), 'fingers')
      }
      return
    }
    if (spent) return
    if (tap?.pointer === e.pointerId && Math.hypot(at.x - tap.at.x, at.y - tap.at.y) > TAP_PX) tap = undefined
    if (drag === undefined || e.pointerId !== drag.pointer || mode !== 'edit') return
    if (!drag.active) {
      if (Math.hypot(e.clientX - drag.start.x, e.clientY - drag.start.y) <= DRAG_START_PX) return
      drag.active = true
      sliding(performance.now())
    }
    dragTo(at)
  }

  function lift(e: PointerEvent, cancelled: boolean): void {
    if (!fingers.delete(e.pointerId)) return
    if (gesture !== undefined) {
      // The gesture ends where it is; the finger that is left does nothing until it lifts too.
      gesture = undefined
      moving = false
      spent = fingers.size > 0
    } else if (drag !== undefined && drag.pointer === e.pointerId) {
      const { active } = drag
      endDrag()
      if (active) (cancelled ? ondragcancel : ondragend)()
    } else if (tap?.pointer === e.pointerId && !cancelled && fingers.size === 0) {
      onpick(undefined)
    }
    if (fingers.size === 0) {
      spent = false
      tap = undefined
    }
  }

  // ---- the wheel, a trackpad and the keys --------------------------------------------------------------------------

  /** Safari sends its own gesture events for a trackpad pinch; Ctrl wheel events that come with them are not counted. */
  let inGesture = false
  let gestureFrom: LevelView | undefined

  const stagePoint = (e: { clientX: number; clientY: number }): Point => {
    const box = stage?.getBoundingClientRect()
    return { x: e.clientX - (box?.left ?? 0), y: e.clientY - (box?.top ?? 0) }
  }
  /** A wheel's delta in pixels, whether it counts lines or pages. */
  const pixels = (delta: number, mode: number): number =>
    mode === 1 ? delta * 16 : mode === 2 ? delta * clear.h : delta

  function wheel(e: WheelEvent): void {
    e.preventDefault()
    if (inGesture) return
    if (e.ctrlKey || e.metaKey) {
      const step = Math.max(-WHEEL_ZOOM_MOST, Math.min(WHEEL_ZOOM_MOST, pixels(e.deltaY, e.deltaMode)))
      queue(zoomAbout(now, home, clear, world, stagePoint(e), Math.exp(-step * WHEEL_ZOOM)), 'wheel')
      return
    }
    let dx = pixels(e.deltaX, e.deltaMode)
    let dy = pixels(e.deltaY, e.deltaMode)
    if (e.shiftKey && dx === 0) [dx, dy] = [dy, 0]
    queue(panBy(now, home, clear, world, -dx, -dy), 'wheel')
  }

  type Gesture = Event & { scale: number; clientX: number; clientY: number }
  function gestureStart(e: Event): void {
    e.preventDefault()
    inGesture = true
    gestureFrom = now
  }
  function gestureChange(e: Event): void {
    e.preventDefault()
    const g = e as Gesture
    // Fingers on the stage already pinch it; Safari reports the same pinch a second time.
    if (fingers.size > 0 || gestureFrom === undefined) return
    queue(zoomAbout(gestureFrom, home, clear, world, stagePoint(g), g.scale), 'wheel')
  }
  function gestureEnd(e: Event): void {
    e.preventDefault()
    inGesture = false
    gestureFrom = undefined
  }

  const ARROWS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' } as const
  function key(e: KeyboardEvent): void {
    const way = ARROWS[e.key as keyof typeof ARROWS]
    // With a thing picked the arrows move it (the screen's job); with nothing picked they move the level.
    if (way === undefined || picked !== undefined || e.defaultPrevented) return
    e.preventDefault()
    pan(way, e.shiftKey)
  }

  /** The keyboard's focus brings a thing into view and picks it; a press's focus does neither. */
  function focused(e: FocusEvent): void {
    const target = e.target as HTMLElement | null
    const id = idOf(target)
    if (id === undefined || target?.matches(':focus-visible') !== true) return
    if (mode !== 'read') onpick(id)
    reveal(id)
  }

  /** The least a hit button measures, and where it sits, by the level's own `Fit`. */
  function boxOf(h: { id: HitId; x: number; y: number }): { x: number; y: number; w: number; h: number } {
    const at = toScreen(fit, h)
    const s = sizeOf(rules, level, h.id)
    const w = Math.max(MIN_TOUCH, s.w * fit.scale)
    const height = Math.max(MIN_TOUCH, s.h * fit.scale)
    return { x: at.x - w / 2, y: at.y - height / 2, w, h: height }
  }

  // ---- the picture -----------------------------------------------------------------------------------------------

  onMount(() => {
    let alive = true
    const watcher = new ResizeObserver(() => {
      if (stage === undefined) return
      size = { w: stage.clientWidth, h: stage.clientHeight }
    })
    const node = stage
    if (node !== undefined) {
      watcher.observe(node)
      size = { w: node.clientWidth, h: node.clientHeight }
      node.addEventListener('wheel', wheel, { passive: false })
      node.addEventListener('gesturestart', gestureStart, { passive: false })
      node.addEventListener('gesturechange', gestureChange, { passive: false })
      node.addEventListener('gestureend', gestureEnd, { passive: false })
      void openLevelPicture({ mount: node, content, level, art })
        .then((made) => {
          if (!alive) return made.destroy()
          picture = made
          made.setRoom(room)
          made.setView(isWhole(now) ? undefined : fit)
          made.show(level)
        })
        .catch(() => {
          // A picture that cannot be made (no WebGL) leaves the buttons over an empty stage; the art is freed.
          art?.destroy()
        })
    } else art?.destroy()
    return () => {
      alive = false
      watcher.disconnect()
      cancelAnimationFrame(frame)
      cancelAnimationFrame(gliding)
      cancelAnimationFrame(slide)
      node?.removeEventListener('wheel', wheel)
      node?.removeEventListener('gesturestart', gestureStart)
      node?.removeEventListener('gesturechange', gestureChange)
      node?.removeEventListener('gestureend', gestureEnd)
      picture?.destroy()
    }
  })

  // Draws the picture again after every change. The state is read before the optional call: `picture` is unset when
  // this first runs (Pixi starts later), and an optional call that short-circuits never evaluates its arguments.
  $effect(() => {
    const space = room
    picture?.setRoom(space)
  })
  $effect(() => {
    const view = isWhole(now) ? undefined : fit
    picture?.setView(view)
  })
  $effect(() => {
    const drawn = level
    picture?.show(drawn)
  })
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="stage"
  role="group"
  aria-label={title}
  bind:this={stage}
  data-scale={fit.scale}
  data-zoom={isWhole(now) ? '1' : String(Math.round(now.zoom * 100) / 100)}
  data-view="{now.x.toFixed(2)},{now.y.toFixed(2)}"
  data-moving={moving ? '' : undefined}
  onpointerdown={down}
  onpointermove={move}
  onpointerup={(e) => lift(e, false)}
  onpointercancel={(e) => lift(e, true)}
  onkeydown={key}
  onfocusin={focused}
>
  <!-- The clear cell: where the level is fitted. It does not zoom. -->
  <div
    class="clear"
    data-clear
    style:left="{clear.x}px"
    style:top="{clear.y}px"
    style:width="{clear.w}px"
    style:height="{clear.h}px"
  ></div>
  {#if layer !== undefined}<div class="layer">{@render layer(fit)}</div>{/if}
  {#each hits as hit (hit.id)}
    {@const box = boxOf(hit)}
    <button
      type="button"
      class="thing"
      data-thing={hit.id}
      data-x={hit.x}
      data-y={hit.y}
      aria-label={mode === 'read' ? hit.id : WORDS.thingLabel(hit.id)}
      aria-pressed={mode === 'read' ? undefined : picked === hit.id}
      data-marked={marked.includes(hit.id) ? '' : undefined}
      style:left="{box.x}px"
      style:top="{box.y}px"
      style:width="{box.w}px"
      style:height="{box.h}px"
      onkeydown={(e) => onthingkey?.(e, hit.id)}
    ></button>
  {/each}
</div>

<style>
  .stage {
    position: absolute;
    inset: 0;
    overflow: hidden;
    touch-action: none;
  }
  .stage :global(canvas) {
    position: absolute;
    inset: 0;
  }
  .clear,
  .layer {
    position: absolute;
    pointer-events: none;
  }
  .layer {
    inset: 0;
  }
  .thing {
    position: absolute;
    padding: 0;
    border: 0;
    border-radius: var(--corner);
    background: transparent;
    touch-action: none;
    cursor: grab;
  }
  /* The ring is a page element, never drawn into the picture: the art stays exactly as the game draws it. */
  .thing[aria-pressed='true'] {
    outline: 2px dashed var(--touch, currentColor);
    outline-offset: 2px;
    animation: draw 200ms ease-out;
  }
  .thing[data-marked] {
    outline: 2px solid var(--touch, currentColor);
    outline-offset: 2px;
  }
  @keyframes draw {
    from {
      opacity: 0;
      outline-offset: 8px;
    }
    to {
      opacity: 1;
      outline-offset: 2px;
    }
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .thing[aria-pressed='true'] {
      animation-name: fade;
    }
  }
</style>
