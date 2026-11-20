<script lang="ts">
  // What is picked, and every value of it. At a wide size it is a panel at the right edge that folds to a tab with the
  // thing's name written upright; on a small screen it is a one-line bar that pulls up into a sheet closed with Done.
  // Nothing is drawn while nothing is picked.
  import type { Snippet } from 'svelte'
  import { Icon } from '../ui/ui.ts'
  import { type Lang, type Row, wordsIn } from '../words/words.ts'

  interface Props {
    lang: Lang
    mode: 'side' | 'tab' | 'bar' | 'sheet'
    /** The thing's name. */
    name: string
    mirror?: boolean
    /** Fold the panel away (side, sheet). */
    onhide: () => void
    /** Bring it back (tab, bar). */
    onshow: () => void
    children: Snippet
  }
  let { lang, mode, name, mirror = false, onhide, onshow, children }: Props = $props()

  const words = $derived(wordsIn(lang))
  const text = (one: Row, ...parts: (string | number)[]): string =>
    typeof one === 'string' ? one : one(...parts)
  const title = $derived(text(words.panels.settingsOf, name))
</script>

{#if mode === 'side' || mode === 'sheet'}
  <aside class="panel {mode}" class:mirror aria-label={title} data-tour="settings">
    <header>
      <b class="name">{name}</b>
      {#if mode === 'side'}
        <button type="button" aria-label={text(words.panels.hideSettings)} title={text(words.panels.hideSettings)} onclick={onhide}>
          <Icon name="x" />
        </button>
      {:else}
        <button type="button" class="done" onclick={onhide}>{text(words.shell.done)}</button>
      {/if}
    </header>
    <div class="body">{@render children()}</div>
  </aside>
{:else if mode === 'tab'}
  <button type="button" class="tab" class:mirror aria-label={title} data-tour="settings" onclick={onshow}>
    <Icon name="caret-left" /><span class="upright">{title}</span>
  </button>
{:else}
  <button type="button" class="peek glass-1" aria-label={title} data-tour="settings" onclick={onshow}>
    <span class="name">{title}</span><Icon name="caret-up" />
  </button>
{/if}

<style>
  .panel,
  .tab,
  .peek {
    position: absolute;
    color: var(--words);
    --quiet: var(--g-quiet);
  }
  .panel {
    display: flex;
    flex-direction: column;
    border-radius: 14px;
  }
  .side {
    top: calc(var(--bar) + 16px);
    right: max(8px, env(safe-area-inset-right));
    bottom: max(8px, env(safe-area-inset-bottom));
    width: 300px;
    max-width: calc(100% - 16px);
  }
  .sheet {
    left: max(8px, env(safe-area-inset-left));
    right: max(8px, env(safe-area-inset-right));
    bottom: max(8px, env(safe-area-inset-bottom));
    max-height: 60%;
    z-index: 6;
  }
  .mirror.side {
    right: auto;
    left: max(8px, env(safe-area-inset-left));
  }
  header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 4px 4px 12px;
    border-bottom: 1px solid var(--g-edge);
  }
  .name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  header button,
  .tab,
  .peek {
    min-width: 44px;
    min-height: 44px;
    border-radius: 10px;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
  header button {
    border: 0;
    background: transparent;
  }
  .done {
    padding: 0 14px;
    background: var(--raised);
  }
  .body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 8px;
  }
  .tab {
    top: calc(var(--bar) + 24px);
    right: max(8px, env(safe-area-inset-right));
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 8px 4px;
  }
  .tab.mirror {
    right: auto;
    left: max(8px, env(safe-area-inset-left));
  }
  .upright {
    writing-mode: vertical-rl;
  }
  .peek {
    left: max(8px, env(safe-area-inset-left));
    right: max(8px, env(safe-area-inset-right));
    /* Above the toolbar when that is along the bottom too. */
    bottom: calc(var(--tools-room, 0px) + max(8px, env(safe-area-inset-bottom)));
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    z-index: 6;
  }
</style>
