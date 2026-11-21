<script lang="ts">
  // A short list of things to do. The arrow keys move through every row, a row that cannot act is still reachable and
  // says why under its word (so a person is never left guessing), and Escape closes it. Enter or a tap picks.
  import { onMount, type Snippet } from 'svelte'
  import Icon from './Icon.svelte'
  import type { MenuItem } from './menu.ts'

  interface Props {
    items: readonly MenuItem[]
    /** Something above the rows: who the menu is about. */
    head?: Snippet
    onpick: (id: string) => void
    onclose: () => void
  }
  let { items, head, onpick, onclose }: Props = $props()

  let list: HTMLElement | undefined
  /** Rows wait below the fold: the foot fades, so a person sees there is more to scroll to. */
  let more = $state(false)
  const measure = (): void => {
    // Bound to null once the menu is gone; a last resize can still arrive then.
    if (list) more = list.scrollTop + list.clientHeight < list.scrollHeight - 1
  }
  const rows = (): HTMLElement[] => [...(list?.querySelectorAll<HTMLElement>('[role=menuitem]') ?? [])]

  onMount(() => {
    measure()
    const watch = new ResizeObserver(measure)
    if (list !== undefined) watch.observe(list)
    const all = rows()
    ;(all.find((row) => row.getAttribute('aria-disabled') !== 'true') ?? all[0])?.focus()
    return () => watch.disconnect()
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

  function pick(item: MenuItem): void {
    if (item.off === undefined) onpick(item.id)
  }
</script>

<div class="menu glass-2" class:more role="menu" tabindex="-1" bind:this={list} onkeydown={keys} onscroll={measure}>
  {#if head}<div class="head">{@render head()}</div>{/if}
  {#each items as item (item.id)}
    {#if item.kind === 'heading'}
      <div class="heading" role="presentation">{item.words}</div>
    {:else if item.kind === 'rule'}
      <hr />
    {:else}
      <button
        type="button"
        role="menuitem"
        class="item"
        aria-disabled={item.off === undefined ? undefined : 'true'}
        aria-current={item.here ? 'true' : undefined}
        onclick={() => pick(item)}
      >
        {#if item.icon}<Icon name={item.icon} />{/if}
        <span class="what">
          <span class="words">{item.words}</span>
          {#if item.off}<span class="why">{item.off}</span>{:else if item.about}<span class="why">{item.about}</span>{/if}
        </span>
        {#if item.here}<Icon name="check" />{:else if item.key}<kbd>{item.key}</kbd>{/if}
      </button>
    {/if}
  {/each}
</div>

<style>
  /* Never taller than the room it opens into (its holder sets that): the rows scroll, and a fade says there are more. */
  .menu {
    display: flex;
    flex-direction: column;
    max-height: 100%;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    min-width: 220px;
    padding: 6px;
    border-radius: 14px;
    color: var(--words);
  }
  .more {
    mask-image: linear-gradient(to bottom, black calc(100% - 40px), transparent); /* a mask: only its opacity counts */
  }
  .item {
    flex: none;
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
  .head {
    padding: 8px 12px;
  }
  .heading {
    padding: 8px 12px 4px;
    font-size: 12px;
    color: var(--quiet);
  }
  hr {
    width: 100%;
    margin: 4px 0;
    border: 0;
    border-top: 1px solid var(--g-edge);
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
