<script lang="ts">
  // What can be done with the picked level, in one row of big buttons beside it: Go in, Move, Move apart (only when it
  // touches another level) and the three dots, which open Rename, Make a copy and Delete. The caller places it.
  import { Icon } from '../ui/ui.ts'
  import { type Lang, nameOf, type Row, wordsIn } from '../words/words.ts'

  interface Props {
    lang: Lang
    level: string
    /** The pad of arrows is open. */
    moving: boolean
    /** A level it touches, said in what Move apart does; none when it touches nothing. */
    touching: string | undefined
    /** The three dots are open. */
    more: boolean
    ongo: () => void
    onmove: () => void
    onapart: () => void
    onmore: () => void
    onrename: () => void
    oncopy: () => void
    onremove: () => void
  }
  let { lang, level, moving, touching, more, ongo, onmove, onapart, onmore, onrename, oncopy, onremove }: Props = $props()

  const words = $derived(wordsIn(lang).arrange)
  const text = (row: Row, ...parts: string[]): string => (typeof row === 'function' ? row(...parts) : row)
</script>

<div class="bar" role="toolbar" aria-label={text(words.levelBar, nameOf(level))}>
  <button type="button" class="act" onclick={ongo}><Icon name="arrow-right" /><span>{text(words.goIn)}</span></button>
  <button type="button" class="act" aria-pressed={moving} title={text(words.moveAbout)} onclick={onmove}>
    <Icon name="arrows-out-cardinal" /><span>{text(words.move)}</span>
  </button>
  {#if touching !== undefined}
    <button type="button" class="act" title={text(words.pullAbout, nameOf(touching))} onclick={onapart}>
      <Icon name="arrows-out-line-horizontal" /><span>{text(words.pullApart)}</span>
    </button>
  {/if}
  <button type="button" class="act" aria-label={text(words.more)} aria-expanded={more} onclick={onmore}>
    <Icon name="dots-three" />
  </button>
  {#if more}
    <div class="menu" role="menu">
      <button type="button" role="menuitem" class="item" onclick={onrename}>
        <Icon name="pencil-simple" /><span>{text(words.rename)}</span>
      </button>
      <button type="button" role="menuitem" class="item" onclick={oncopy}>
        <Icon name="copy" /><span>{text(words.copy)}</span>
      </button>
      <button type="button" role="menuitem" class="item" onclick={onremove}>
        <Icon name="trash" /><span>{text(words.remove)}</span><small>{text(words.removeAbout)}</small>
      </button>
    </div>
  {/if}
</div>

<style>
  .bar {
    position: relative;
    display: flex;
    gap: 4px;
    padding: 4px;
    border-radius: 14px;
    border: 1px solid var(--glass-edge);
    background: var(--panel);
    box-shadow: var(--shadow);
    color: var(--words);
  }
  .act,
  .item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 48px;
    min-height: 48px;
    padding: 0 12px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: 14px;
    cursor: pointer;
  }
  .act:hover,
  .item:hover {
    background: var(--hover);
  }
  .act[aria-pressed='true'] {
    background: var(--picked);
    box-shadow: inset 0 0 0 2px var(--accent);
  }
  .menu {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    display: flex;
    flex-direction: column;
    min-width: 200px;
    padding: 4px;
    border-radius: 14px;
    border: 1px solid var(--glass-edge);
    background: var(--panel);
    box-shadow: var(--shadow);
  }
  .item {
    justify-content: flex-start;
  }
  small {
    margin-left: auto;
    color: var(--quiet);
    font-size: 12px;
  }
</style>
