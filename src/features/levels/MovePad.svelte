<script lang="ts">
  // Four arrows that move what is picked one tile a tap: the same move as the arrow keys, for a finger or a Pencil.
  import { Icon, type IconName } from '../ui/ui.ts'
  import { type Lang, type Row, wordsIn } from '../words/words.ts'
  import type { Way } from './nudge.ts'

  interface Props {
    lang: Lang
    onnudge: (way: Way) => void
    ondone: () => void
  }
  let { lang, onnudge, ondone }: Props = $props()

  const words = $derived(wordsIn(lang).levels)
  const text = (row: Row): string => (typeof row === 'string' ? row : row())
  const ARROWS: readonly { way: Way; icon: IconName; name: 'padLeft' | 'padRight' | 'padUp' | 'padDown' }[] = [
    { way: 'up', icon: 'arrow-up', name: 'padUp' },
    { way: 'left', icon: 'arrow-left', name: 'padLeft' },
    { way: 'right', icon: 'arrow-right', name: 'padRight' },
    { way: 'down', icon: 'arrow-down', name: 'padDown' },
  ]
</script>

<div class="pad" role="group" aria-label={text(words.padLabel)}>
  {#each ARROWS as arrow (arrow.way)}
    <button
      type="button"
      class="arrow {arrow.way}"
      aria-label={text(words[arrow.name])}
      onclick={() => onnudge(arrow.way)}
    >
      <Icon name={arrow.icon} />
    </button>
  {/each}
  <button type="button" class="done" onclick={ondone}>{text(words.padDone)}</button>
</div>

<style>
  .pad {
    display: grid;
    grid-template-areas:
      '. up .'
      'left done right'
      '. down .';
    grid-template-columns: repeat(3, 48px);
    grid-auto-rows: 48px;
    gap: 4px;
    padding: 6px;
    border-radius: 14px;
    border: 1px solid var(--glass-edge);
    background: var(--panel);
    box-shadow: var(--shadow);
    color: var(--words);
  }
  button {
    min-width: 48px;
    min-height: 48px;
    border: 0;
    border-radius: 10px;
    background: var(--raised);
    color: inherit;
    font: inherit;
    font-size: 12px;
    cursor: pointer;
  }
  button:hover {
    background: var(--hover);
  }
  .up {
    grid-area: up;
  }
  .left {
    grid-area: left;
  }
  .right {
    grid-area: right;
  }
  .down {
    grid-area: down;
  }
  .done {
    grid-area: done;
    background: transparent;
  }
</style>
