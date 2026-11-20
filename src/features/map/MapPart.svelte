<script lang="ts">
  // The world map: every level on one sheet at its true size where the world file puts it, each drawn in the game's own
  // art by the page's Pixi Application, with the marks over it and a key at the foot. It opens fitted to every level
  // ("Whole world"). A level is a real button: a tap picks it, Enter or a second tap goes in. It is also where levels
  // are arranged: dragged (or pushed a tile at a time) they land where they would join or meet a wall, and a level can
  // be made, renamed, copied and taken away. Every change goes up through `onchange` as one step.
  import type { GameContent, LevelPoint } from '@automataframework/framework/headless'
  import { onMount, untrack } from 'svelte'
  import type { Working } from '../game/game.ts'
  import {
    type Act,
    type Camera,
    createGestures,
    createStage,
    HOLD_MS,
    type LevelStage,
    type Point,
    pointerLike,
    toTiles,
    type Way,
  } from '../levels/levels.ts'
  import type { OpenPicture } from '../wire/wire.ts'
  import { type Lang, nameOf, type Row, wordsIn } from '../words/words.ts'
  import { boxes, landing, marksOf, moveLevel, nudgeLevel } from './arrange.ts'
  import { mapCanvas } from './map-canvas.ts'
  import MapFloats from './MapFloats.svelte'
  import MapKey from './MapKey.svelte'
  import MapMarks from './MapMarks.svelte'
  import { landingWords, type Rect } from './placing.ts'
  import { arrowsOf, KEY_ROOM, linesOf, mapCamera, rectOf } from './shapes.ts'
  import { reveal, slideMap, zoomMap } from './viewing.ts'

  interface Props {
    content: GameContent
    pictures: readonly OpenPicture[]
    working: Working
    lang: Lang
    /** The level that is picked, if one is. */
    picked: string | undefined
    onpick: (level: string | undefined) => void
    /** Open the level. */
    ongo: (level: string) => void
    /** What the game is now: one step of the history. */
    onchange: (next: Working) => void
    onundo: () => void
  }
  let { content, pictures, working, lang, picked, onpick, ongo, onchange, onundo }: Props = $props()

  const everything = $derived(wordsIn(lang))
  const words = $derived(everything.map)
  const ways = $derived(everything.arrange)
  const text = (row: Row, ...parts: string[]): string => (typeof row === 'function' ? row(...parts) : row)

  let holder: HTMLDivElement | undefined = $state()
  let floats: MapFloats | undefined = $state()
  let size = $state({ w: 0, h: 0 })
  let engine = $state.raw<LevelStage | undefined>()

  const order = $derived(content.project.levels ?? Object.keys(working.levels))
  const all = $derived(boxes(working, order))
  // The view a person made by sliding or zooming; none while every level is fitted ("Whole world"), which follows them.
  let custom = $state.raw<Camera | undefined>()
  const camera = $derived(custom ?? mapCamera(all, size))
  const marks = $derived(marksOf(working, content))

  // A level being dragged: how far the hand has taken it, in pixels; where letting go would put it is `landing`.
  let drag = $state.raw<{ level: string; dx: number; dy: number } | undefined>()
  const origin = (id: string) => all.find((box) => box.level === id)
  const dragAt = (d: { level: string; dx: number; dy: number }): LevelPoint => {
    const box = origin(d.level)
    return { x: (box?.x ?? 0) + d.dx / camera.scale, y: (box?.y ?? 0) + d.dy / camera.scale }
  }
  const dropping = $derived(drag === undefined ? undefined : landing(working, content.tilesets, drag.level, dragAt(drag)))
  // Every level where it is shown: the dragged one under the hand.
  const shown = $derived(
    drag === undefined ? all : all.map((box) => (box.level === drag?.level ? { ...box, ...dragAt(drag) } : box)),
  )
  const placed = $derived(shown.map((box) => ({ id: box.level, rect: rectOf(box, camera, size) })))
  // What the dragged level touches is shown where it would land, not where it was.
  const apart = (one: { a: string; b: string }): boolean => drag === undefined || (one.a !== drag.level && one.b !== drag.level)
  const there = $derived(
    dropping?.kind === 'touch' && drag !== undefined
      ? all.map((box) => (box.level === drag?.level ? { ...box, ...dropping.at } : box))
      : all,
  )
  const lines = (stretches: Parameters<typeof linesOf>[0], at = all) => linesOf(stretches, at, camera, size)
  const joins = $derived(lines(marks.joins.filter(apart)))
  const soon = $derived(dropping?.kind === 'touch' ? lines(dropping.joins, there) : [])
  const walls = $derived([
    ...lines(marks.walls.filter(apart)),
    ...(dropping?.kind === 'touch' ? lines(dropping.walls, there) : []),
  ])
  const doors = $derived(arrowsOf(marks.doors, shown, working.levels, camera, size))
  const start = $derived.by(() => {
    const at = placed.find((one) => one.id === marks.start)
    return at === undefined ? undefined : { level: at.id, rect: at.rect }
  })
  const rectFor = (id: string): Rect | undefined => placed.find((one) => one.id === id)?.rect

  onMount(() => {
    let alive = true
    const watcher = new ResizeObserver(() => {
      if (holder !== undefined) size = { w: holder.clientWidth, h: holder.clientHeight }
    })
    if (holder !== undefined) {
      holder.addEventListener('wheel', wheel, { passive: false })
      watcher.observe(holder)
      size = { w: holder.clientWidth, h: holder.clientHeight }
    }
    void createStage().then((made) => {
      if (!alive) return made.destroy()
      holder?.prepend(made.canvas)
      engine = made
    })
    return () => {
      alive = false
      clearTimeout(holdTimer)
      holder?.removeEventListener('wheel', wheel)
      watcher.disconnect()
      engine?.destroy()
    }
  })

  const sheet = $derived(engine === undefined ? undefined : mapCanvas(engine))
  $effect(() => {
    const drawn = engine
    const canvas = sheet
    const now = { content, pictures, levels: working.levels, boxes: all, camera, size }
    if (drawn === undefined || canvas === undefined) return
    drawn.levels.resize(now.size.w, now.size.h)
    canvas.show(now)
  })

  // A second tap on the same level soon after the first goes in; so does Enter.
  let lastTap: { level: string; at: number } | undefined
  let skip = false
  function tap(level: string): void {
    if (skip) return void (skip = false)
    const now = performance.now()
    if (lastTap?.level === level && now - lastTap.at < 450) {
      lastTap = undefined
      ongo(level)
      return
    }
    lastTap = { level, at: now }
    onpick(level)
  }
  const ARROWS: Readonly<Record<string, Way>> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }
  function key(e: KeyboardEvent, level: string): void {
    const way = ARROWS[e.key]
    if (e.key === 'Enter') {
      e.preventDefault()
      ongo(level)
    } else if (e.key === 'Escape') {
      onpick(undefined)
    } else if (e.key === '+' || e.key === '=') {
      zoom(1.4)
    } else if (e.key === '-') {
      zoom(1 / 1.4)
    } else if (e.key === '0') {
      custom = undefined
    } else if (way !== undefined) {
      e.preventDefault()
      onpick(level)
      floats?.moved(level, nudgeLevel(working, content.tilesets, level, way))
    }
  }

  // What a hand does is read by the same gesture reader the level view uses: a finger on empty ground slides the map, two
  // fingers slide and zoom it, a hand on a level drags it, and staying still opens its menu (or makes a level there).
  const gestures = createGestures({
    pointers: () => ({ last: 'touch', penSeen: false, hovering: false }),
    fingerDraws: () => false,
    tool: () => 'pick',
  })
  let holdTimer: ReturnType<typeof setTimeout> | undefined
  let downBox: { left: number; top: number } | undefined
  let panFrom: Point | undefined
  function feed(type: 'down' | 'move' | 'up' | 'cancel', e: PointerEvent): void {
    if (holder === undefined) return
    const box = type === 'down' || downBox === undefined ? holder.getBoundingClientRect() : downBox
    let on: HTMLElement | null = null
    if (type === 'down') {
      const target = e.target as HTMLElement
      on = target.closest<HTMLElement>('[data-level]')
      if (e.button !== 0 || (on === null && target !== holder && !(target instanceof HTMLCanvasElement))) return
      skip = false
      downBox = { left: box.left, top: box.top }
      try {
        // Held by the level's own button, so its click still comes; on empty ground by the sheet.
        ;(on ?? holder).setPointerCapture(e.pointerId)
      } catch {
        // A pointer that is not there to hold (a pretend one) is followed where it goes, as any other.
      }
      clearTimeout(holdTimer)
      holdTimer = setTimeout(() => handle(gestures.tick(performance.now())), HOLD_MS + 20)
    }
    handle(gestures.feed(pointerLike(type, e, box, on?.dataset.level)))
    if (type === 'up' || type === 'cancel') clearTimeout(holdTimer)
  }
  function handle(acts: readonly Act[]): void {
    for (const act of acts) {
      if (act.kind === 'view') {
        skip = true
        custom = zoomMap(slideMap(camera, act.slide, all), act.zoom, act.about, all, size)
      } else if (act.kind === 'tap') {
        if (act.on === undefined) onpick(undefined)
      } else if (act.kind === 'hold') {
        skip = true
        if (act.on === undefined) {
          const at = toTiles(camera, size, act.at)
          floats?.make({ x: Math.round(at.x - 8), y: Math.round(at.y - 4.5) })
        } else {
          onpick(act.on)
          floats?.menuOf(act.on)
        }
      } else if (act.kind === 'drag') dragged(act)
    }
  }
  function dragged(act: Extract<Act, { kind: 'drag' }>): void {
    if (act.on === undefined) {
      // A mouse or a pen on empty ground slides the map as a finger does.
      if (act.phase === 'move' && panFrom !== undefined) {
        custom = slideMap(camera, { x: act.to.x - panFrom.x, y: act.to.y - panFrom.y }, all)
      }
      panFrom = act.phase === 'start' || act.phase === 'move' ? act.to : undefined
      return
    }
    if (act.phase === 'start') {
      if (picked !== act.on) onpick(act.on)
    } else if (act.phase === 'move') {
      drag = { level: act.on, dx: act.to.x - act.from.x, dy: act.to.y - act.from.y }
      const box = origin(act.on)
      if (box !== undefined) {
        const from = rectOf(box, camera, size)
        sheet?.lift(act.on, { x: from.x + drag.dx, y: from.y + drag.dy })
      }
    } else {
      const d = drag
      drag = undefined
      if (d === undefined) return
      skip = true
      if (act.phase === 'end') {
        const land = landing(working, content.tilesets, d.level, dragAt(d))
        if (land.kind === 'overlap') floats?.overlapped()
        else floats?.moved(d.level, moveLevel(working, d.level, land.at))
      }
      // Where it was, until the new place is drawn (and for good when nothing changed).
      const box = origin(d.level)
      if (box !== undefined) sheet?.lift(d.level, rectOf(box, camera, size))
    }
  }

  // A trackpad's pinch (and Ctrl with the wheel) zooms about the pointer; the wheel or two fingers on a trackpad slide, as
  // they do on a page. With every level in sight there is nothing to slide to.
  function wheel(e: WheelEvent): void {
    if (holder === undefined || (e.target as HTMLElement).closest('[data-ui]') !== null) return
    e.preventDefault()
    const box = holder.getBoundingClientRect()
    const unit = e.deltaMode === 1 ? 16 : 1
    if (e.ctrlKey) {
      const about = { x: e.clientX - box.left, y: e.clientY - box.top }
      custom = zoomMap(camera, Math.exp(-e.deltaY * 0.006), about, all, size)
    } else if (custom !== undefined) {
      custom = slideMap(camera, { x: -e.deltaX * unit, y: -e.deltaY * unit }, all)
    }
  }
  const zoom = (factor: number): void => {
    custom = zoomMap(camera, factor, { x: size.w / 2, y: (size.h - KEY_ROOM) / 2 }, all, size)
  }
  // A level tabbed to while it is out of sight is brought into sight, as one picked from the list is. A press (which
  // focuses it too) is left alone: the hand is already on it.
  function focused(e: FocusEvent, level: string): void {
    const at = custom === undefined || !(e.currentTarget as HTMLElement).matches(':focus-visible') ? undefined : rectFor(level)
    if (at !== undefined) custom = reveal(camera, at, all, size)
  }
  // A level picked while it is out of sight (from the list) is brought into sight.
  $effect(() => {
    const id = picked
    untrack(() => {
      const at = id === undefined || custom === undefined ? undefined : rectFor(id)
      if (at !== undefined) custom = reveal(camera, at, all, size)
    })
  })
</script>

<div
  class="sheet stage"
  role="region"
  aria-label={text(words.mapName)}
  bind:this={holder}
  data-scale={camera.scale}
  oncontextmenu={(e) => e.preventDefault()}
  onpointerdown={(e) => feed('down', e)}
  onpointermove={(e) => feed('move', e)}
  onpointerup={(e) => feed('up', e)}
  onpointercancel={(e) => feed('cancel', e)}
>
  {#if drag !== undefined}
    {@const from = rectFor(drag.level) === undefined ? undefined : origin(drag.level)}
    {#if from !== undefined}
      {@const was = rectOf(from, camera, size)}
      <div class="was" style:left="{was.x}px" style:top="{was.y}px" style:width="{was.w}px" style:height="{was.h}px"></div>
    {/if}
  {/if}
  {#each placed as one (one.id)}
    <button
      type="button"
      class="level"
      class:picked={picked === one.id}
      class:lifted={drag?.level === one.id}
      class:over={drag?.level === one.id && dropping?.kind === 'overlap'}
      data-level={one.id}
      aria-label={nameOf(one.id)}
      aria-pressed={picked === one.id}
      style:left="{one.rect.x}px"
      style:top="{one.rect.y}px"
      style:width="{one.rect.w}px"
      style:height="{one.rect.h}px"
      onclick={() => tap(one.id)}
      onfocus={(e) => focused(e, one.id)}
      onkeydown={(e) => key(e, one.id)}
    >
      {#if one.rect.w >= 84 && one.rect.h >= 40}<span class="name glass-1">{nameOf(one.id)}</span>{/if}
    </button>
  {/each}
  <MapMarks
    {lang}
    {size}
    {joins}
    {walls}
    {doors}
    {start}
    {soon}
    onwall={(one) => floats?.wall(one.a, one.b)}
  />
  <MapKey {lang} walls={walls.length > 0} />
  <button type="button" class="new glass-1" onclick={() => floats?.make(undefined)}>{text(ways.newLevel)}</button>
  <button type="button" class="whole glass-1" aria-pressed={custom === undefined} onclick={() => (custom = undefined)}>
    {text(words.wholeWorld)}
  </button>

  {#if drag !== undefined && dropping !== undefined}
    <p class="landing glass-2" class:over={dropping.kind === 'overlap'} role="status">{landingWords(dropping, everything)}</p>
  {/if}

  <MapFloats
    bind:this={floats}
    {content}
    {working}
    {lang}
    {picked}
    {onpick}
    {ongo}
    {onchange}
    {onundo}
    {all}
    {marks}
    {size}
    {rectFor}
    dragging={drag !== undefined}
  />
</div>

<style>
  .sheet {
    position: relative;
    flex: 1;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
    /* Clipped, not scrolled: a level focused out of sight must not slide the whole sheet. */
    overflow: clip;
    border-radius: var(--radius);
    touch-action: none;
  }
  .sheet :global(canvas) {
    position: absolute;
    inset: 0;
  }
  .level {
    position: absolute;
    box-sizing: border-box;
    z-index: 1;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 3px;
    background: transparent;
    color: var(--words);
    font: inherit;
    cursor: pointer;
    touch-action: none;
  }
  .level.lifted {
    z-index: 4;
    box-shadow: var(--shadow);
  }
  .level.picked {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent);
  }
  .level.over {
    border-color: var(--problem);
    box-shadow: 0 0 0 3px var(--problem);
  }
  .level:focus-visible {
    outline: 3px solid var(--focus, var(--accent));
    outline-offset: 2px;
  }
  .name {
    position: absolute;
    left: 6px;
    top: 6px;
    max-width: calc(100% - 12px);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 2px 8px;
    border-radius: 8px;
    font-size: 13px;
    pointer-events: none;
  }
  .was {
    position: absolute;
    box-sizing: border-box;
    border: 2px dashed var(--faint);
    border-radius: 3px;
    pointer-events: none;
  }
  .landing {
    position: absolute;
    left: 50%;
    top: 8px;
    z-index: 35;
    transform: translateX(-50%);
    max-width: calc(100% - 16px);
    margin: 0;
    padding: 8px 14px;
    border-radius: 12px;
    color: var(--words);
    font-size: 14px;
    pointer-events: none;
  }
  .landing.over {
    color: var(--problem);
  }
  .whole[aria-pressed='true'] {
    box-shadow: inset 0 0 0 2px var(--accent);
  }
  .new {
    right: 8px;
  }
  .whole {
    left: 8px;
  }
  .new,
  .whole {
    position: absolute;
    top: 8px;
    z-index: 20;
    min-height: 44px;
    padding: 0 14px;
    border-radius: 12px;
    color: var(--words);
    font: inherit;
    cursor: pointer;
  }
</style>
