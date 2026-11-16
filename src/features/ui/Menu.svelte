<script lang="ts">
  // A short list of things to do. The arrow keys move through every row, a row that cannot act is still reachable and
  // says why under its word (so a person is never left guessing), and Escape closes it. Enter or a tap picks.
  import { onMount } from 'svelte'
  import Icon from './Icon.svelte'
  import type { IconName } from './icons.ts'

  interface Item {
    id: string
    words: string
    icon?: IconName
    /** Its key, shown at the end of the row ("V"). */
    key?: string
    /** Why this row cannot act ("A level has one Start"). A row with no reason can. */
    off?: string
  }
  interface Props {
    items: readonly Item[]
    onpick: (id: string) => void
    onclose: () => void
  }
  let { items, onpick, onclose }: Props = $props()

  let list: HTMLElement | undefined
  const rows = (): HTMLElement[] => [...(list?.querySelectorAll<HTMLElement>('[role=menuitem]') ?? [])]

  onMount(() => {
    const all = rows()
    ;(all.find((row) => row.getAttribute('aria-disabled') !== 'true') ?? all[0])?.focus()
  })

  function keys(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onclose()
      return
    }
    const step = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0
    if (step === 0 && event.key !== 'Home' && event.key !== 'End') return
    event.preventDefault()
    const all = rows()
    const at = all.indexOf(document.activeElement as HTMLElement)
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? all.length - 1 : (at + step + all.length) % all.length
    all[next]?.focus()
  }

  function pick(item: Item): void {
    if (item.off === undefined) onpick(item.id)
  }
</script>

<div class="menu" role="menu" tabindex="-1" bind:this={list} onkeydown={keys}>
  {#each items as item (item.id)}
    <button
      type="button"
      role="menuitem"
      class="item"
      aria-disabled={item.off === undefined ? undefined : 'true'}
      onclick={() => pick(item)}
    >
      {#if item.icon}<Icon name={item.icon} />{/if}
      <span class="what">
        <span class="words">{item.words}</span>
        {#if item.off}<span class="why">{item.off}</span>{/if}
      </span>
      {#if item.key}<kbd>{item.key}</kbd>{/if}
    </button>
  {/each}
</div>

<style>
  .menu {
    display: flex;
    flex-direction: column;
    min-width: 220px;
    padding: 6px;
    border-radius: 14px;
    border: 1px solid var(--g-edge);
    background: var(--s-bg);
    -webkit-backdrop-filter: var(--s-filter);
    backdrop-filter: var(--s-filter);
    box-shadow: var(--g-shine), var(--shadow);
    color: var(--words);
  }
  .item {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: var(--row);
    padding: 6px 12px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .item:hover,
  .item:focus-visible {
    background: var(--hover);
  }
  .item[aria-disabled='true'] {
    color: var(--quiet);
    cursor: default;
  }
  .what {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }
  .why {
    font-size: 12px;
    color: var(--quiet);
  }
  kbd {
    font: 500 12px var(--measure);
    color: var(--quiet);
  }
</style>
