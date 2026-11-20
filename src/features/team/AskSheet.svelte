<script lang="ts">
  // Asking the person whose changes these are to change something: a box for words, and the way to send them. Nothing
  // goes in the game. The sheet sits over the level like every other, in the kit's glass.
  import { Action, Sheet } from '../ui/ui.ts'
  import { type Lang, type Row, wordsIn } from '../words/words.ts'

  interface Props {
    lang: Lang
    /** Whose changes these are, said by name. */
    by: string
    /** How many changes are being looked at. */
    count: number
    /** Sending is going on. */
    working: boolean
    /** Sending did not work; the words stay. */
    failed: boolean
    onsend: (words: string) => void
    onback: () => void
  }
  let { lang, by, count, working, failed, onsend, onback }: Props = $props()

  const words = $derived(wordsIn(lang))
  const c = $derived(words.check)
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row
  let said = $state('')
  const ready = $derived(said.trim() !== '' && !working)
  const labelId = $props.id()
</script>

<Sheet title={text(c.askTitle, by)} close={text(c.askBack)} onclose={onback} side>
  <p>{text(c.askAbout, by, count)}</p>
  {#if failed}<p role="alert">{text(c.failNow)}</p>{/if}
  <label for={labelId}>{text(c.askLabel)}</label>
  <textarea id={labelId} rows="4" maxlength="500" bind:value={said}></textarea>
  {#snippet foot()}
    <Action label={text(c.askSend, by)} icon="paper-plane-tilt" kind="main" disabled={!ready} onpress={() => onsend(said.trim())} />
    <Action label={text(c.askBack)} icon="arrow-left" onpress={onback} />
  {/snippet}
</Sheet>

<style>
  p {
    margin: 0 0 12px;
  }
  label {
    display: block;
    margin-bottom: 4px;
    color: var(--g-quiet);
    font-size: 13px;
  }
  textarea {
    box-sizing: border-box;
    width: 100%;
    min-height: 96px;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--raised);
    color: var(--words);
    font: inherit;
    resize: vertical;
  }
  textarea:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
</style>
