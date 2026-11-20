<script lang="ts">
  // What the ground can be, each a colour and a word: the kinds of the level's tileset, or Solid and Empty for a level
  // without one. It is the strip over the level while the Paint tool is in hand; tap one, then paint with it.
  import { type Lang, type Row, wordsIn } from '../words/words.ts'
  import type { Kind } from './ground.ts'
  import { kindName, kindTint } from './kinds.ts'

  interface Props {
    lang: Lang
    kinds: readonly Kind[]
    /** The letter of the kind being painted. */
    letter: string | undefined
    onchoose: (letter: string) => void
  }
  let { lang, kinds, letter, onchoose }: Props = $props()

  const text = (row: Row): string => (typeof row === 'function' ? row() : row)
  const label = $derived(text(wordsIn(lang).ground.groundLabel))
</script>

<div class="tray" role="group" aria-label={label}>
  {#each kinds as kind (kind.letter)}
    <button
      type="button"
      class="one"
      data-kind={kind.letter}
      aria-pressed={kind.letter === letter}
      onclick={() => onchoose(kind.letter)}
    >
      <span class="swatch" class:empty={kindTint(kinds, kind) === undefined} aria-hidden="true" style:background={kindTint(kinds, kind)}></span>{kindName(kind, lang)}
    </button>
  {/each}
</div>

<style>
  .tray {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 6px;
    color: var(--words);
  }
  .one {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 96px;
    min-height: 48px;
    padding: 4px 14px 4px 8px;
    border: 0;
    border-radius: 10px;
    background: var(--raised);
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .one:hover {
    background: var(--hover);
  }
  .one[aria-pressed='true'] {
    background: var(--picked);
    box-shadow: inset 0 0 0 2px var(--accent);
  }
  .swatch {
    flex: none;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: 1px solid var(--glass-edge);
  }
  .empty {
    border-style: dashed;
  }
</style>
