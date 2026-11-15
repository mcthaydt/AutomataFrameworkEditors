<script lang="ts">
  import { WORDS } from '../words/words.ts'

  // The level's name plate, laid out like a drawing's title block: a grid of small labeled cells, two rows tall. It says
  // what game, which level, which editor and whether there is something to save, so a person always knows where they
  // are. `compact` keeps only the level and what is saved, for a phone: the pill beside it already names the rest.
  interface Props {
    game: string
    level: string
    editor: string
    /** The words for what is saved: "Not saved yet", "Saved". */
    saved: string
    compact?: boolean
  }
  let { game, level, editor, saved, compact = false }: Props = $props()
</script>

<div class="block" class:compact data-block>
  {#if !compact}
    <div class="cell"><span class="label">{WORDS.blockGame}</span><span class="value">{game}</span></div>
  {/if}
  <div class="cell"><span class="label">{WORDS.blockLevel}</span><span class="value">{level}</span></div>
  {#if !compact}
    <div class="cell"><span class="label">{WORDS.blockEditor}</span><span class="value">{editor}</span></div>
  {/if}
  <div class="cell">
    <span class="label">{WORDS.blockStatus}</span>
    <span class="value saved">{saved}</span>
  </div>
</div>

<style>
  .block {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, auto));
    grid-auto-rows: minmax(36px, auto);
    max-width: 100%;
  }
  .compact {
    grid-template-columns: repeat(2, minmax(0, auto));
  }
  .cell {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
    padding: 0 var(--space-2);
    border-right: 1px solid color-mix(in srgb, var(--words) 35%, transparent);
    border-bottom: 1px solid color-mix(in srgb, var(--words) 35%, transparent);
  }
  .cell:nth-child(2n) {
    border-right: 0;
  }
  .cell:nth-last-child(-n + 2) {
    border-bottom: 0;
  }
  .label {
    font-size: var(--font-size-small);
    line-height: 14px;
    color: var(--quiet);
  }
  .value {
    font-size: 16px;
    line-height: 20px;
    overflow-wrap: anywhere;
  }
  /* The saved words never change the block's height: they have a width of their own to fill. */
  .saved {
    min-width: 8.5em;
  }
</style>
