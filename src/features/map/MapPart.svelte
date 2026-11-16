<script lang="ts">
  // The world map: every level on one sheet at its true size where the world file puts it, each drawn in the game's own
  // art by the page's Pixi Application, with the marks over it and a key at the foot. It opens fitted to every level
  // ("Whole world"). A level is a real button: a tap picks it, Enter or a second tap goes in.
  import type { GameContent } from '@automataframework/framework/headless'
  import { onMount } from 'svelte'
  import type { Working } from '../game/game.ts'
  import { createStage, type LevelStage } from '../levels/levels.ts'
  import type { OpenPicture } from '../wire/wire.ts'
  import { type Lang, nameOf, wordsIn } from '../words/words.ts'
  import { boxes, marksOf } from './arrange.ts'
  import { mapCanvas } from './map-canvas.ts'
  import MapKey from './MapKey.svelte'
  import MapMarks from './MapMarks.svelte'
  import { arrowOf, mapCamera, rectOf, stretchOf } from './shapes.ts'

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
  }
  let { content, pictures, working, lang, picked, onpick, ongo }: Props = $props()

  const words = $derived(wordsIn(lang).map)
  const text = (row: string | ((...parts: string[]) => string), ...parts: string[]): string =>
    typeof row === 'function' ? row(...parts) : row

  let holder: HTMLDivElement | undefined = $state()
  let size = $state({ w: 0, h: 0 })
  let engine = $state.raw<LevelStage | undefined>()

  const order = $derived(content.project.levels ?? Object.keys(working.levels))
  const all = $derived(boxes(working, order))
  const camera = $derived(mapCamera(all, size))
  const marks = $derived(marksOf(working, content))
  const placed = $derived(all.map((box) => ({ id: box.level, rect: rectOf(box, camera, size) })))
  const line = (stretch: (typeof marks.joins)[number]) => {
    const found = stretchOf(stretch, all, camera, size)
    return found === undefined ? [] : [{ a: stretch.a, b: stretch.b, ...found }]
  }
  const joins = $derived(marks.joins.flatMap(line))
  const walls = $derived(marks.walls.flatMap(line))
  const doors = $derived(
    marks.doors.flatMap((door) => {
      const found = arrowOf(door, all, working.levels, camera, size)
      return found === undefined
        ? []
        : [{ level: door.from.level, thing: door.from.thing, goes: door.to.level, ...found }]
    }),
  )
  const start = $derived.by(() => {
    const at = placed.find((one) => one.id === marks.start)
    return at === undefined ? undefined : { level: at.id, rect: at.rect }
  })

  onMount(() => {
    let alive = true
    const watcher = new ResizeObserver(() => {
      if (holder !== undefined) size = { w: holder.clientWidth, h: holder.clientHeight }
    })
    if (holder !== undefined) {
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
  function tap(level: string): void {
    const now = performance.now()
    if (lastTap?.level === level && now - lastTap.at < 450) {
      lastTap = undefined
      ongo(level)
      return
    }
    lastTap = { level, at: now }
    onpick(level)
  }
  function key(e: KeyboardEvent, level: string): void {
    if (e.key === 'Enter') {
      e.preventDefault()
      ongo(level)
    } else if (e.key === 'Escape') {
      onpick(undefined)
    }
  }
</script>

<div class="sheet stage" role="region" aria-label={text(words.mapName)} bind:this={holder} data-scale={camera.scale}>
  {#each placed as one (one.id)}
    <button
      type="button"
      class="level"
      class:picked={picked === one.id}
      data-level={one.id}
      aria-label={nameOf(one.id)}
      aria-pressed={picked === one.id}
      style:left="{one.rect.x}px"
      style:top="{one.rect.y}px"
      style:width="{one.rect.w}px"
      style:height="{one.rect.h}px"
      onclick={() => tap(one.id)}
      onkeydown={(e) => key(e, one.id)}
    >
      {#if one.rect.w >= 84 && one.rect.h >= 40}<span class="name">{nameOf(one.id)}</span>{/if}
    </button>
  {/each}
  <MapMarks {lang} {size} {joins} {walls} {doors} {start} />
  <MapKey {lang} walls={walls.length > 0} />
</div>

<style>
  .sheet {
    position: relative;
    flex: 1;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
    border-radius: var(--radius);
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
  .level.picked {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent);
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
    background: var(--glass-soft);
    font-size: 13px;
    pointer-events: none;
  }
</style>
