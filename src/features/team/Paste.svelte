<script lang="ts">
  // A level a helper made, pasted in whole: one box, and the button that shows what it would change. Nothing changes until
  // the person keeps it.
  import { Action, Sheet } from '../ui/ui.ts'
  import { type Lang, type Row, wordsIn } from '../words/words.ts'

  interface Props {
    lang: Lang
    /** What is wrong with what was pasted, in words, from the last try. */
    problem?: string | undefined
    onshow: (pasted: string) => void
    onclose: () => void
  }
  let { lang, problem, onshow, onclose }: Props = $props()

  const words = $derived(wordsIn(lang))
  const h = $derived(words.helper)
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row
  let pasted = $state('')
</script>

<div class="scrim dim-2">
  <Sheet title={text(h.pasteTitle)} close={text(words.shell.close)} {onclose} side>
    <p class="quiet">{text(h.pasteAbout)}</p>
    <textarea
      rows="8"
      aria-label={text(h.pasteTitle)}
      placeholder={text(h.pastePlaceholder)}
      spellcheck="false"
      autocapitalize="off"
      bind:value={pasted}
    ></textarea>
    {#if problem !== undefined}<p class="bad" role="alert">{problem}</p>{/if}

    {#snippet foot()}
      <Action
        label={text(h.pasteShow)}
        icon="sparkle"
        kind="main"
        disabled={pasted.trim() === ''}
        onpress={() => onshow(pasted)}
      />
    {/snippet}
  </Sheet>
</div>

<style>
  .scrim {
    position: absolute;
    inset: 0;
    z-index: 30;
  }
  p {
    margin: 0 0 12px;
  }
  .quiet {
    color: var(--g-quiet);
  }
  textarea {
    box-sizing: border-box;
    width: 100%;
    min-height: 160px;
    padding: 10px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: transparent;
    color: var(--words);
    font: inherit;
    resize: vertical;
  }
  .bad {
    margin: 10px 0 0;
    color: var(--problem);
  }
</style>
