<script lang="ts">
  // The menu a press and hold opens: on a thing, what can be done to it; on empty ground, what can be put there.
  import { Menu, type MenuItem } from '../ui/ui.ts'
  import type { Draw } from './draw.ts'
  import { type Lang, nameOf, type Row, wordsIn } from '../words/words.ts'

  interface Props {
    lang: Lang
    /** The thing it is about, or undefined for empty ground. */
    on: string | undefined
    locked: boolean
    hidden: boolean
    /** How each picked thing is drawn now, so a row that would change nothing can say why. */
    draws: readonly Draw[]
    /** Whether something has been copied that a paste could put down. */
    canPaste: boolean
    onpick: (id: string) => void
    onclose: () => void
  }
  let { lang, on, locked, hidden, draws, canPaste, onpick, onclose }: Props = $props()

  const words = $derived(wordsIn(lang).levels)
  const thing = $derived(wordsIn(lang).thing)
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row

  const items = $derived<readonly MenuItem[]>(
    on === undefined
      ? [
          { id: 'put', words: text(words.holdPut), icon: 'plus-circle' },
          {
            id: 'paste',
            words: text(words.holdPaste),
            icon: 'copy',
            ...(canPaste ? {} : { off: text(words.holdNothing) }),
          },
        ]
      : [
          { id: 'rename', words: text(words.menuRename) },
          locked
            ? { id: 'unlock', words: text(words.menuUnlock), icon: 'lock-open' }
            : { id: 'lock', words: text(words.menuLock), icon: 'lock' },
          hidden
            ? { id: 'show', words: text(words.menuShow), icon: 'eye' }
            : { id: 'hide', words: text(words.menuHide), icon: 'eye-slash' },
          { id: 'copy', words: text(words.menuCopy), icon: 'copy' },
          {
            id: 'front',
            words: text(thing.menuFront),
            icon: 'arrow-line-up',
            ...(draws.every((one) => one === 'in-front') ? { off: text(thing.offFront) } : {}),
          },
          {
            id: 'back',
            words: text(thing.menuBack),
            icon: 'arrow-line-down',
            ...(draws.every((one) => one === 'behind') ? { off: text(thing.offBack) } : {}),
          },
        ],
  )
</script>

<div class="menu" role="presentation">
  <Menu {items} {onpick} {onclose}>
    {#snippet head()}
      <span class="who">{on === undefined ? text(words.holdLabel) : nameOf(on)}</span>
    {/snippet}
  </Menu>
</div>

<style>
  .who {
    font-weight: 600;
  }
</style>
