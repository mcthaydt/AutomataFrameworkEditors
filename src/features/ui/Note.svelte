<script lang="ts">
  // What just happened, in a few words, with the one thing to press (usually Undo). It sits at the top of the level.
  interface Props {
    words: string
    button?: string
    onpress?: () => void
  }
  let { words, button, onpress }: Props = $props()
</script>

<div class="note" role="status">
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
    border: 1px solid var(--g-edge);
    background: var(--s-bg);
    -webkit-backdrop-filter: var(--s-filter);
    backdrop-filter: var(--s-filter);
    box-shadow: var(--g-shine), var(--shadow);
    color: var(--words);
  }
  button {
    min-width: 44px;
    min-height: 44px;
    padding: 0 14px;
    border: 0;
    border-radius: 8px;
    background: var(--raised);
    color: var(--words);
    font: 600 inherit;
    font-family: var(--label);
    cursor: pointer;
  }
</style>
