<script lang="ts">
  import type { Snippet } from 'svelte'
  import { type Shape, shapeOf } from '../levels/levels.ts'
  import type { MenuItem } from '../ui/ui.ts'
  import ComingSoon from './ComingSoon.svelte'
  import type { EditorId } from './editors.ts'
  import Pill from './Pill.svelte'

  // The level screen's frame: it is the window, whatever is in it. It measures its own box (not the device) to choose a
  // shape, and puts the pill at the top left and the cluster at the top right over whatever fills it. Nothing in it
  // scrolls. The Coming soon card of an editor that is not built yet opens here, and focus goes back to where it came from.
  interface Props {
    game: string
    /** The level's name in words. */
    level: string
    onhome: () => void
    /** What the pill's menu holds after the editors, for a shape that has a menu. */
    menu: (shape: Shape) => readonly MenuItem[]
    cluster: Snippet<[Shape]>
    children: Snippet<[Shape]>
  }
  let { game, level, onhome, menu, cluster, children }: Props = $props()

  let width = $state(0)
  let height = $state(0)
  const shape = $derived(shapeOf({ w: width, h: height }))
  /** Nothing is drawn until the frame knows its size: no part is ever laid out for the wrong shape and moved. */
  const ready = $derived(width > 0 && height > 0)

  let soon = $state<EditorId | undefined>(undefined)
  let from: HTMLElement | undefined
  function onsoon(id: EditorId, trigger: HTMLElement | undefined): void {
    // A menu puts focus back on its own button before it opens this card; a button of the pill passes itself.
    from = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : undefined)
    soon = id
  }
  function close(): void {
    soon = undefined
    from?.focus()
    from = undefined
  }
</script>

<div class="frame" data-frame data-shape={shape} bind:clientWidth={width} bind:clientHeight={height}>
  {#if ready}
    {@render children(shape)}
    <div class="top">
      <Pill {shape} {game} {level} {onhome} extra={menu(shape)} {onsoon} />
      <div class="cluster">{@render cluster(shape)}</div>
    </div>
    {#if soon !== undefined}<ComingSoon editor={soon} onclose={close} />{/if}
  {/if}
</div>

<style>
  .frame {
    --margin: 16px;
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
  /* The top row floats over the level: the pill takes what it needs and the cluster keeps the right edge. */
  .top {
    position: absolute;
    top: var(--margin);
    right: var(--margin);
    left: var(--margin);
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-2);
    pointer-events: none;
  }
  .top > :global(*),
  .cluster {
    pointer-events: auto;
  }
  .cluster {
    flex: none;
  }
</style>
