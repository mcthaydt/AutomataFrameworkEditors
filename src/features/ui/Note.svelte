<script lang="ts">
  import { stack } from './noted.svelte.ts'

  // What just happened, in a few words, with the one thing to press (usually Undo). It sits at the top of the level.
  interface Props {
    words: string
    button?: string
    onpress?: () => void
    /** Floating by itself at the top: what is stacked there steps down below it. Not for a note inside a stack. */
    floats?: boolean
  }
  let { words, button, onpress, floats = false }: Props = $props()
</script>

<div class="note glass-2" role="status" use:stack={floats}>
  <span>{words}</span>
  {#if button}
    <button type="button" onclick={() => onpress?.()}>{button}</button>
  {/if}
</div>

<style>
  .note {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 4px 4px 4px 16px;
    border-radius: 12px;
    color: var(--words);
  }
  button {
    min-width: 44px;
    min-height: 44px;
    padding: 0 14px;
    white-space: nowrap;
    border: 0;
    border-radius: 8px;
    background: var(--raised);
    color: var(--words);
    font: 600 inherit;
    font-family: var(--label);
    cursor: pointer;
  }
</style>
