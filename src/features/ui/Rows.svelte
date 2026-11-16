<script lang="ts">
  // A long list that draws only the rows on screen (a game can have a thousand things). Every row is `height` tall, so
  // which rows show is arithmetic on how far it is scrolled; a few extra above and below keep a quick scroll filled.
  import type { Snippet } from 'svelte'

  interface Props {
    count: number
    /** Every row's height, in points. */
    height: number
    /** What the list is, for a screen reader ("Things"). */
    label: string
    row: Snippet<[number]>
  }
  let { count, height, label, row }: Props = $props()

  const EXTRA = 6
  let top = $state(0)
  let view = $state(0)
  const from = $derived(Math.max(0, Math.floor(top / height) - EXTRA))
  const to = $derived(Math.min(count, Math.ceil((top + view) / height) + EXTRA))
  const shown = $derived(Array.from({ length: Math.max(0, to - from) }, (_, k) => from + k))
</script>

<div
  class="rows"
  role="list"
  aria-label={label}
  bind:clientHeight={view}
  onscroll={(event) => (top = event.currentTarget.scrollTop)}
>
  <div class="all" style:height="{count * height}px">
    {#each shown as at (at)}
      <div class="cell" role="listitem" style:top="{at * height}px" style:height="{height}px">
        {@render row(at)}
      </div>
    {/each}
  </div>
</div>

<style>
  .rows {
    height: 100%;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  .all {
    position: relative;
  }
  .cell {
    position: absolute;
    left: 0;
    right: 0;
  }
</style>
