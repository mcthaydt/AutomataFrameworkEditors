<script lang="ts">
  // One note: who wrote it and when, what was said, the answers, a box to answer, and the button that hides it (or shows
  // it again). A note on a thing that has gone says so and stays where it was.
  import type { Note } from '../files/files.ts'
  import { Face } from '../shell/shell.ts'
  import { Action, Sheet } from '../ui/ui.ts'
  import { type Lang, type Row, wordsIn } from '../words/words.ts'
  import { whenWords } from './history.ts'

  interface Props {
    lang: Lang
    note: Note
    /** The note is about a thing that is no longer in the level. */
    gone: boolean
    /** The clock, so a time is said from one moment. */
    now?: () => number
    problem?: string | undefined
    sending: boolean
    /** `sent` is called once the answer has gone; until then the words stay in the box. */
    onanswer: (words: string, sent: () => void) => void
    ondone: (done: boolean) => void
    onclose: () => void
  }
  let { lang, note, gone, now = Date.now, problem, sending, onanswer, ondone, onclose }: Props = $props()

  const words = $derived(wordsIn(lang))
  const n = $derived(words.notes)
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row
  const when = (iso: string): string => whenWords(Date.parse(iso), now(), lang)

  let reply = $state('')
  const ready = $derived(reply.trim() !== '' && !sending)
  function send(): void {
    onanswer(reply.trim(), () => (reply = ''))
  }
</script>

<div class="scrim dim-2">
  <Sheet title={text(n.noteCard, note.by)} close={text(words.shell.close)} {onclose} side>
    <div class="line">
      <Face login={note.by} size={32} />
      <span class="who"><b>{note.by}</b><small>{when(note.when)}</small></span>
    </div>
    <p class="said">{note.words}</p>
    {#if gone}<p class="quiet">{text(n.noteGone)}</p>{/if}

    {#each note.answers as one (one.when + one.by)}
      <div class="line">
        <Face login={one.by} size={28} />
        <span class="who"><b>{one.by}</b><small>{when(one.when)}</small></span>
      </div>
      <p class="said">{one.words}</p>
    {/each}

    <form
      class="answer"
      onsubmit={(e) => {
        e.preventDefault()
        if (ready) send()
      }}
    >
      <label class="label" for="note-answer">{text(n.noteAnswerBox)}</label>
      <div class="row">
        <textarea id="note-answer" rows="2" bind:value={reply}></textarea>
        <Action label={text(n.noteSend)} icon="paper-plane-tilt" kind="main" disabled={!ready} onpress={send} />
      </div>
    </form>
    {#if problem !== undefined}<p class="bad" role="alert">{problem}</p>{/if}

    {#snippet foot()}
      <Action
        label={text(note.done ? n.noteNotDone : n.noteDone)}
        icon={note.done ? 'arrow-counter-clockwise' : 'check'}
        disabled={sending}
        onpress={() => ondone(!note.done)}
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
  .line {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 4px;
  }
  .who {
    display: flex;
    flex-direction: column;
  }
  small,
  .quiet,
  .label {
    color: var(--g-quiet);
  }
  small {
    font-size: 13px;
  }
  .said {
    overflow-wrap: anywhere;
    white-space: pre-wrap;
  }
  .label {
    display: block;
    margin: 0 0 6px;
    font-size: 14px;
  }
  .row {
    display: flex;
    align-items: flex-end;
    gap: 8px;
  }
  textarea {
    box-sizing: border-box;
    flex: 1;
    min-width: 0;
    min-height: 56px;
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
