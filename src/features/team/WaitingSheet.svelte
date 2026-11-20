<script lang="ts">
  // What waits to be checked, from the person who sent it: who has it, what is in it, and a way to take it back.
  import type { ChangeLine } from '../game/game.ts'
  import { Action, Sheet } from '../ui/ui.ts'
  import { type Lang, type Row, wordsIn } from '../words/words.ts'
  import Lines from './Lines.svelte'

  interface Props {
    lang: Lang
    /** Who checks, said by name; empty when not known. */
    by: string
    /** What was sent, when this visit knows it; otherwise the few words the change was called. */
    lines: readonly ChangeLine[]
    title: string
    /** Taking them back is going on. */
    working: boolean
    /** They were taken back. */
    taken: boolean
    /** Taking them back did not work. */
    failed: boolean
    ontakeback: () => void
    onclose: () => void
  }
  let { lang, by, lines, title, working, taken, failed, ontakeback, onclose }: Props = $props()

  const words = $derived(wordsIn(lang))
  const c = $derived(words.changes)
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row
</script>

<div class="scrim dim-2">
  <Sheet title={taken ? text(c.takeBack) : text(c.waitTitle, by)} close={text(words.shell.close)} {onclose} side>
    {#if taken}
      <p role="status">{text(c.takenBack)}</p>
    {:else}
      {#if failed}<p role="alert">{text(c.takeBackFailed)}</p>{/if}
      <p>{text(c.waitAbout, by)}</p>
      {#if lines.length > 0}<Lines {words} {lines} />{:else}<p class="title">{title}</p>{/if}
    {/if}
    {#snippet foot()}
      {#if taken}
        <Action label={text(words.shell.close)} kind="main" onpress={onclose} />
      {:else}
        <Action label={text(c.takeBack)} disabled={working} onpress={ontakeback} />
        <Action label={text(words.shell.close)} kind="main" onpress={onclose} />
      {/if}
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
  .title {
    padding: 10px 0;
    border-top: 1px solid var(--line);
    font-weight: 600;
  }
</style>
