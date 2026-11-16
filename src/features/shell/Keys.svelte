<script lang="ts">
  // What a finger does and what a key does, in one sheet. It lists only what works on the screen now; a key is added
  // here by the pull request that makes it work.
  import { Sheet } from '../ui/ui.ts'
  import { type Lang, type Row, wordsIn } from '../words/words.ts'

  interface Props {
    lang: Lang
    onclose: () => void
  }
  let { lang, onclose }: Props = $props()

  const words = $derived(wordsIn(lang))
  const k = $derived(words.help)
  const text = (row: Row): string => (typeof row === 'function' ? row() : row)
  const finger = $derived([
    { what: k.keysPick, how: k.keysTap },
    { what: k.keysMove, how: k.keysDrag },
  ])
  const keys = $derived([
    { what: k.keysNudge, how: '← ↑ ↓ →' },
    { what: k.keysUndo, how: '⌘Z' },
    { what: k.keysRedo, how: '⇧⌘Z' },
    { what: k.keysHelp, how: '?' },
    { what: k.keysDrop, how: 'Esc' },
  ])
</script>

<div class="scrim">
  <Sheet title={text(k.keysTitle)} close={text(words.shell.close)} {onclose}>
    <section aria-labelledby="keys-finger">
      <h3 id="keys-finger">{text(k.keysWithFinger)}</h3>
      <dl>
        {#each finger as one (one.what)}
          <div><dt>{text(one.what)}</dt><dd>{text(one.how)}</dd></div>
        {/each}
      </dl>
    </section>
    <section aria-labelledby="keys-keyboard">
      <h3 id="keys-keyboard">{text(k.keysOnKeyboard)}</h3>
      <dl>
        {#each keys as one (one.what)}
          <div><dt>{text(one.what)}</dt><dd><kbd>{text(one.how)}</kbd></dd></div>
        {/each}
      </dl>
    </section>
  </Sheet>
</div>

<style>
  .scrim {
    position: absolute;
    inset: 0;
    z-index: 30;
    background: var(--dim);
  }
  h3 {
    margin: 12px 0 4px;
    font: 600 18px / 1.2 var(--title);
  }
  dl {
    margin: 0;
  }
  dl > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 44px;
  }
  dt {
    flex: 1;
  }
  dd {
    margin: 0;
    color: var(--g-quiet);
  }
  kbd {
    padding: 2px 8px;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--raised);
    color: var(--words);
    font: inherit;
  }
</style>
