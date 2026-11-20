<script lang="ts">
  import { Icon, type IconName } from '../ui/ui.ts'
  import { type Lang, type Row, wordsIn } from '../words/words.ts'

  // Four arrow buttons that move the picked thing a step: the same move as the arrow keys, for a finger. An even cross
  // of arrows, each with its spoken name and a tooltip (the Owner, 2026-11-17: icons over words), so no word wraps one
  // button taller than the others.
  type Way = 'left' | 'right' | 'up' | 'down'
  interface Props {
    lang: Lang
    onnudge: (way: Way) => void
  }
  let { lang, onnudge }: Props = $props()

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
      class={arrow.way}
      aria-label={text(words[arrow.name])}
      title={text(words[arrow.name])}
      onclick={() => onnudge(arrow.way)}
    >
      <Icon name={arrow.icon} size={24} />
    </button>
  {/each}
</div>

<style>
  .pad {
    display: grid;
    grid-template-areas:
      '. up .'
      'left . right'
      '. down .';
    grid-template-columns: repeat(3, 52px);
    grid-template-rows: repeat(3, 52px);
    justify-content: center;
    gap: var(--space-1);
    padding-top: var(--space-3);
  }
  button {
    display: grid;
    place-items: center;
    padding: 0;
    border: 0;
    border-radius: 10px;
    background: var(--raised);
    color: var(--words);
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
</style>
