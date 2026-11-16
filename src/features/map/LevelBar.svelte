<script lang="ts">
  // What can be done with the picked level, in one row of big buttons beside it: Go in, Move, Move apart (only when it
  // touches another level) and the three dots. The three dots (and press and hold) open the same with a small line under
  // each saying what it does, so a finger reads it too, and Rename, Make a copy and Delete. The caller places it.
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
  /** A choice in the menu closes it first. */
  const choose = (what: () => void) => () => {
    onmore()
    what()
  }
  const text = (row: Row, ...parts: string[]): string => (typeof row === 'function' ? row(...parts) : row)
</script>

<div class="bar" role="toolbar" aria-label={text(words.levelBar, nameOf(level))}>
  <button type="button" class="act" onclick={ongo}><Icon name="arrow-right" /><span>{text(words.goIn)}</span></button>
  <button type="button" class="act" aria-pressed={moving} onclick={onmove}>
    <Icon name="arrows-out-cardinal" /><span>{text(words.move)}</span>
  </button>
  {#if touching !== undefined}
    <button type="button" class="act" onclick={onapart}>
      <Icon name="arrows-out-line-horizontal" /><span>{text(words.pullApart)}</span>
    </button>
  {/if}
  <button type="button" class="act" aria-label={text(words.more)} aria-expanded={more} onclick={onmore}>
    <Icon name="dots-three" />
  </button>
  {#if more}
    <div class="menu" role="menu">
      <button type="button" role="menuitem" class="item" onclick={choose(ongo)}>
        <Icon name="arrow-right" /><span class="label">{text(words.goIn)}</span>
      </button>
      <button type="button" role="menuitem" class="item" onclick={choose(onmove)}>
        <Icon name="arrows-out-cardinal" /><span class="label">{text(words.move)}<small>{text(words.moveAbout)}</small></span>
      </button>
      {#if touching !== undefined}
        <button type="button" role="menuitem" class="item" onclick={choose(onapart)}>
          <Icon name="arrows-out-line-horizontal" /><span class="label">{text(words.pullApart)}<small>{text(words.pullAbout, nameOf(touching))}</small></span>
        </button>
      {/if}
      <button type="button" role="menuitem" class="item" onclick={onrename}>
        <Icon name="pencil-simple" /><span class="label">{text(words.rename)}</span>
      </button>
      <button type="button" role="menuitem" class="item" onclick={oncopy}>
        <Icon name="copy" /><span class="label">{text(words.copy)}</span>
      </button>
      <button type="button" role="menuitem" class="item" onclick={onremove}>
        <Icon name="trash" /><span class="label">{text(words.remove)}<small>{text(words.removeAbout)}</small></span>
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
    width: 280px;
    max-width: calc(100vw - 24px);
    padding: 4px;
    border-radius: 14px;
    border: 1px solid var(--glass-edge);
    background: var(--panel);
    box-shadow: var(--shadow);
  }
  .item {
    justify-content: flex-start;
    text-align: left;
  }
  .label {
    display: flex;
    flex-direction: column;
  }
  small {
    color: var(--quiet);
    font-size: 12px;
    white-space: normal;
  }
</style>
