<script lang="ts">
  // Keeping the open level as a file, or as text to paste to a helper, for someone who cannot put changes in the game:
  // a visitor, or someone who may only look. A visitor is offered the sign-in beside it.
  import { keepCopy, type ChangeLine, type LevelCopy } from '../game/game.ts'
  import { Action, Sheet } from '../ui/ui.ts'
  import { type Lang, nameOf, type Row, wordsIn } from '../words/words.ts'
  import Lines from './Lines.svelte'

  interface Props {
    lang: Lang
    gameName: string
    /** The open level as a file, undefined when there is no level to keep (the map is open). */
    copy: LevelCopy | undefined
    level: string | undefined
    lines: readonly ChangeLine[]
    /** Signed in but only able to look: there is nothing to sign in for. */
    signedIn: boolean
    onsignin: () => void
    onclose: () => void
  }
  let { lang, gameName, copy, level, lines, signedIn, onsignin, onclose }: Props = $props()

  const words = $derived(wordsIn(lang))
  const c = $derived(words.changes)
  const k = $derived(words.kept)
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row

  /** What was kept, and how: a file on the device, text on the clipboard, or text to select by hand. */
  let kept = $state<'file' | 'text' | 'select' | undefined>(undefined)
  let box: HTMLTextAreaElement | undefined = $state()
  $effect(() => {
    box?.focus()
    box?.select()
  })

  function asFile(): void {
    if (copy === undefined) return
    keepCopy(document, copy)
    kept = 'file'
  }
  async function asText(): Promise<void> {
    if (copy === undefined) return
    try {
      await navigator.clipboard.writeText(copy.text)
      kept = 'text'
    } catch {
      // Where the clipboard is not allowed, the text is shown, selected, to copy by hand.
      kept = 'select'
    }
  }
  const levelName = $derived(level === undefined ? '' : nameOf(level))
</script>

<div class="scrim">
  <Sheet
    title={kept === 'file' ? text(k.keptTitle, levelName) : text(k.keepTitle)}
    close={text(words.shell.close)}
    {onclose}
    side
  >
    {#if kept === 'file' && copy !== undefined}
      <p role="status">{text(k.keptFile, copy.name)}</p>
    {:else if kept === 'text'}
      <p role="status">{text(k.keptText)}</p>
    {:else if kept === 'select' && copy !== undefined}
      <p role="status">{text(k.keptSelect)}</p>
      <textarea class="box" readonly rows="6" bind:this={box} value={copy.text}></textarea>
    {:else}
      <p>{signedIn ? text(k.keepLook, gameName) : text(k.keepVisitor, gameName)}</p>
      <Lines {words} {lines} />
      {#if copy !== undefined}
        <div class="keep">
          <Action
            label={text(words.menus.keepCopyOf, levelName)}
            icon="download-simple"
            kind="main"
            onpress={asFile}
          />
          <Action label={text(k.keepText)} icon="copy" onpress={() => void asText()} />
        </div>
      {/if}
    {/if}
    {#if !signedIn}
      <p class="own">{text(k.keepOwn)}</p>
      <Action label={text(words.menus.signIn)} onpress={onsignin} />
      <p class="why">{text(k.keepGitHub)}</p>
    {/if}
    {#snippet foot()}
      <Action label={kept === undefined ? text(c.notNow) : text(words.shell.close)} onpress={onclose} />
    {/snippet}
  </Sheet>
</div>

<style>
  .scrim {
    position: absolute;
    inset: 0;
    z-index: 30;
    background: var(--dim);
  }
  p {
    margin: 0 0 12px;
  }
  .keep {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 12px 0;
  }
  .own {
    margin-top: 16px;
  }
  .why {
    margin: 8px 0 0;
    color: var(--g-quiet);
    font-size: 13px;
  }
  .box {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--raised);
    color: var(--words);
    font: 12px / 1.4 var(--measure);
  }
</style>
