<script lang="ts">
  // Writing a note: what it is pinned to, a box for the words, and the button that pins it. Nothing is sent until then.
  import { Action, Sheet } from '../ui/ui.ts'
  import { type Lang, type Row, wordsIn } from '../words/words.ts'

  interface Props {
    lang: Lang
    /** What it will be pinned to, in words: a thing's name, or "a spot on this level". */
    about: string
    /** What is written so far; "Ask the owner" starts it with a greeting. */
    start: string
    /** What went wrong the last time it was sent, in words. */
    problem?: string | undefined
    sending: boolean
    onsend: (words: string) => void
    onclose: () => void
  }
  let { lang, about, start, problem, sending, onsend, onclose }: Props = $props()

  const words = $derived(wordsIn(lang))
  const n = $derived(words.notes)
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row

  // svelte-ignore state_referenced_locally
  let said = $state(start)
  const ready = $derived(said.trim() !== '' && !sending)
</script>

<div class="scrim dim-2">
  <Sheet title={text(n.noteAdd)} close={text(words.shell.close)} {onclose} side>
    <p class="quiet">{text(n.noteNewAbout, about)}</p>
    <label class="label" for="note-words">{text(n.noteWrite)}</label>
    <textarea id="note-words" rows="5" bind:value={said}></textarea>
    {#if problem !== undefined}<p class="bad" role="alert">{problem}</p>{/if}

    {#snippet foot()}
      <Action label={text(n.notePin)} icon="push-pin" kind="main" disabled={!ready} onpress={() => onsend(said.trim())} />
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
  .quiet,
  .label {
    color: var(--g-quiet);
  }
  .label {
    display: block;
    margin: 0 0 6px;
    font-size: 14px;
  }
  textarea {
    box-sizing: border-box;
    width: 100%;
    min-height: 110px;
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
