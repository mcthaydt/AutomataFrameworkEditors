<script lang="ts">
  // A level was just made: what it starts with, and the way in to put things in it.
  import { type Lang, type Row, wordsIn } from '../words/words.ts'

  interface Props {
    lang: Lang
    ongo: () => void
    ondone: () => void
  }
  let { lang, ongo, ondone }: Props = $props()

  const words = $derived(wordsIn(lang))
  const text = (row: Row): string => (typeof row === 'string' ? row : row())
</script>

<section class="card glass-2" aria-label={text(words.arrange.newTitle)}>
  <h2>{text(words.arrange.newTitle)}</h2>
  <p>{text(words.arrange.newBody)}</p>
  <div class="row">
    <button type="button" onclick={ondone}>{text(words.shell.gotIt)}</button>
    <button type="button" class="go" onclick={ongo}>{text(words.arrange.goIn)}</button>
  </div>
</section>

<style>
  .card {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: min(320px, calc(100vw - 32px));
    padding: 14px;
    border-radius: 14px;
    color: var(--words);
  }
  h2 {
    margin: 0;
    font-size: 16px;
  }
  p {
    margin: 0 0 4px;
    font-size: 14px;
    color: var(--quiet);
  }
  .row {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  button {
    min-width: 48px;
    min-height: 48px;
    padding: 0 16px;
    border: 0;
    border-radius: 10px;
    background: var(--raised);
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
  .go {
    background: var(--accent);
    color: var(--on-accent);
  }
</style>
