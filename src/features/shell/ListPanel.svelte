<script lang="ts">
  // The list of what is in the open thing, and the things to add. Shut, it is a thin rail with a word under each icon;
  // open, it has two tabs and a way to hide it. A long list draws only the rows on screen. It is never glass inside
  // glass: the rows are solid.
  import type { Snippet } from 'svelte'
  import { Icon, Rows } from '../ui/ui.ts'
  import { type Lang, type Row, wordsIn } from '../words/words.ts'

  interface Props {
    lang: Lang
    mode: 'rail' | 'beside' | 'over'
    tab: 'list' | 'add'
    /** What the list is called ("In this level"). */
    name: string
    count: number
    /** Every row's height; read once, when the panel opens, so rows never change under a finger. */
    rowHeight: number
    row: Snippet<[number]>
    /** The things to add; the tab is not drawn when there are none. */
    add?: Snippet | undefined
    /** Start further in: the toolbar is down the left edge. */
    inset?: boolean
    mirror?: boolean
    onopen: (tab: 'list' | 'add') => void
    onhide: () => void
  }
  let { lang, mode, tab, name, count, rowHeight, row, add, inset = false, mirror = false, onopen, onhide }: Props = $props()

  const words = $derived(wordsIn(lang))
  const text = (one: Row): string => (typeof one === 'string' ? one : one())
</script>

{#if mode === 'rail'}
  <nav class="rail" class:inset class:mirror aria-label={name}>
    <button type="button" onclick={() => onopen('list')}>
      <Icon name="list" /><span>{text(words.panels.listLabel)}</span>
    </button>
    {#if add}
      <button type="button" onclick={() => onopen('add')}>
        <Icon name="plus-circle" /><span>{text(words.panels.addLabel)}</span>
      </button>
    {/if}
  </nav>
{:else}
  <aside class="panel {mode}" class:inset class:mirror aria-label={name}>
    <div class="tabs" role="tablist">
      <button type="button" role="tab" aria-selected={tab === 'list'} onclick={() => onopen('list')}>{name}</button>
      {#if add}
        <button type="button" role="tab" aria-selected={tab === 'add'} onclick={() => onopen('add')}>
          {text(words.panels.addThings)}
        </button>
      {/if}
      <button type="button" class="hide" aria-label={text(words.panels.hideList)} onclick={onhide}>
        <Icon name="x" />
      </button>
    </div>
    <div class="body">
      {#if tab === 'add' && add}
        {@render add()}
      {:else}
        <Rows {count} height={rowHeight} label={name} {row} />
      {/if}
    </div>
  </aside>
{/if}

<style>
  .rail,
  .panel {
    position: absolute;
    top: calc(var(--bar) + 16px);
    bottom: max(8px, env(safe-area-inset-bottom));
    left: max(8px, env(safe-area-inset-left));
    display: flex;
    flex-direction: column;
    border-radius: 14px;
    border: 1px solid var(--g-edge);
    background: var(--g-bg);
    -webkit-backdrop-filter: var(--g-filter);
    backdrop-filter: var(--g-filter);
    box-shadow: var(--g-shine), var(--shadow);
    color: var(--words);
    --quiet: var(--g-quiet);
  }
  .rail {
    bottom: auto;
    width: 60px;
    padding: 4px;
    gap: 4px;
  }
  .panel {
    width: 280px;
    max-width: calc(100% - 16px);
  }
  .inset {
    left: calc(max(8px, env(safe-area-inset-left)) + 76px + var(--bar-extra, 0px));
  }
  .mirror {
    left: auto;
    right: max(8px, env(safe-area-inset-right));
  }
  .mirror.inset {
    right: calc(max(8px, env(safe-area-inset-right)) + 76px + var(--bar-extra, 0px));
  }
  .over {
    z-index: 5;
  }
  .rail button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-width: 44px;
    min-height: 52px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: 12px;
    cursor: pointer;
  }
  .tabs {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px;
    border-bottom: 1px solid var(--g-edge);
  }
  .tabs button {
    min-width: 44px;
    min-height: 44px;
    padding: 0 10px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
  .tabs button[aria-selected='true'] {
    background: var(--picked);
    color: var(--bright);
  }
  .hide {
    margin-left: auto;
  }
  .body {
    flex: 1;
    min-height: 0;
    padding: 4px;
  }
</style>
