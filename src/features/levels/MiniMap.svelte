<script lang="ts">
  // The level as a small picture at the top left, with the part on screen boxed, when part of the level is off the
  // screen. A tap on it, or a drag that starts on it, takes the view there. The box is a slider that the arrow keys move
  // one tile, so what a finger drags a key can too.
  import { groundOf, type Level, levelSize, skyOf, tileRuns } from '@automataframework/framework/headless'
  import { type Lang, type Row, wordsIn } from '../words/words.ts'
  import { type Camera, fromMini, miniMap, type Screen } from './view.ts'

  interface Props {
    level: Level
    camera: Camera
    /** The size of the level's stage, in CSS pixels. */
    screen: Screen
    lang: Lang
    onmove: (camera: Camera) => void
  }
  let { level, camera, screen, lang, onmove }: Props = $props()

  /** The most the small map may measure, in CSS pixels. */
  const MINI = { w: 132, h: 96 } as const
  const words = $derived(wordsIn(lang).levels)
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row

  const size = $derived(levelSize(level))
  const mine = $derived(miniMap(level, camera, screen, MINI))
  const picture = $derived({ w: size.w * mine.scale, h: size.h * mine.scale })
  const runs = $derived(tileRuns(level.tiles, (letter) => letter !== '.'))
  /** True when the whole level is on screen: the small map has nothing to say. */
  const whole = $derived(
    mine.box.x <= 0.5 &&
      mine.box.y <= 0.5 &&
      mine.box.x + mine.box.w >= picture.w - 0.5 &&
      mine.box.y + mine.box.h >= picture.h - 0.5,
  )

  let holder: HTMLDivElement | undefined = $state()
  let down: number | undefined

  function go(e: PointerEvent): void {
    if (holder === undefined) return
    const at = holder.getBoundingClientRect()
    onmove(fromMini(level, { x: e.clientX - at.left, y: e.clientY - at.top }, camera, screen, MINI))
  }
  function press(e: PointerEvent): void {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    down = e.pointerId
    try {
      holder?.setPointerCapture(e.pointerId)
    } catch {
      // A pointer that is already gone cannot be captured; the tap still counts.
    }
    go(e)
  }
  function drag(e: PointerEvent): void {
    if (down === e.pointerId) go(e)
  }
  function lift(e: PointerEvent): void {
    if (down === e.pointerId) down = undefined
  }
  const WAYS = {
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
  } as const
  function key(e: KeyboardEvent): void {
    const way = WAYS[e.key as keyof typeof WAYS]
    if (way === undefined) return
    e.preventDefault()
    onmove({
      ...camera,
      x: Math.min(size.w, Math.max(0, camera.x + way.x)),
      y: Math.min(size.h, Math.max(0, camera.y + way.y)),
    })
  }
</script>

{#if !whole}
  <div class="mini glass-1" role="group" aria-label={text(words.miniMap)}>
    <div
      class="map"
      role="presentation"
      bind:this={holder}
      style:width="{picture.w}px"
      style:height="{picture.h}px"
      onpointerdown={press}
      onpointermove={drag}
      onpointerup={lift}
      onpointercancel={lift}
    >
      <svg
        width={picture.w}
        height={picture.h}
        viewBox="0 0 {size.w} {size.h}"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <rect width={size.w} height={size.h} fill={`#${skyOf(level).toString(16).padStart(6, '0')}`} />
        {#each runs as run (`${run.row}:${run.col}`)}
          <rect
            x={run.col}
            y={run.row}
            width={run.length}
            height="1"
            fill={`#${groundOf(level).toString(16).padStart(6, '0')}`}
          />
        {/each}
      </svg>
      <div
        class="box"
        role="slider"
        tabindex="0"
        aria-label={text(words.miniMapBox)}
        aria-valuemin="0"
        aria-valuemax={Math.round(size.w)}
        aria-valuenow={Math.round(camera.x)}
        aria-valuetext={text(words.miniMapAt, Math.round(camera.x), Math.round(camera.y))}
        style:left="{mine.box.x}px"
        style:top="{mine.box.y}px"
        style:width="{mine.box.w}px"
        style:height="{mine.box.h}px"
        onkeydown={key}
      ></div>
    </div>
  </div>
{/if}

<style>
  .mini {
    position: absolute;
    top: 8px;
    left: 8px;
    padding: 4px;
    border-radius: 10px;
  }
  .map {
    position: relative;
    min-width: 44px;
    min-height: 44px;
    touch-action: none;
    cursor: pointer;
  }
  svg {
    display: block;
    border-radius: 4px;
  }
  .box {
    position: absolute;
    box-sizing: border-box;
    border: 2px solid var(--accent);
    border-radius: 3px;
    background: color-mix(in srgb, var(--bright) 12%, transparent);
    pointer-events: none;
  }
  .box:focus-visible {
    outline: 3px solid var(--focus, var(--accent));
    outline-offset: 2px;
  }
</style>
