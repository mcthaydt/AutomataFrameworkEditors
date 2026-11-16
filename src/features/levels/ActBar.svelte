<script lang="ts">
  // What can be done with what is picked, in one row of big buttons next to it and never on top of it: Move, Make a copy,
  // Delete and the three dots. The caller places it (`LevelPart`); it only draws the buttons.
  import { Icon } from '../ui/ui.ts'
  import { type Lang, type Row, wordsIn } from '../words/words.ts'

  interface Props {
    lang: Lang
    /** The pad of four arrows is open. */
    moving?: boolean
    onmove: () => void
    oncopy: () => void
    ondelete: () => void
    onmore: () => void
  }
  let { lang, moving = false, onmove, oncopy, ondelete, onmore }: Props = $props()

  const words = $derived(wordsIn(lang).levels)
  const text = (row: Row): string => (typeof row === 'string' ? row : row())
</script>

<div class="bar" role="toolbar" aria-label={text(words.actBar)}>
  <button type="button" class="act" aria-pressed={moving} onclick={onmove}>
    <Icon name="arrows-out-cardinal" /><span>{text(words.actMove)}</span>
  </button>
  <button type="button" class="act" onclick={oncopy}>
    <Icon name="copy" /><span>{text(words.actCopy)}</span>
  </button>
  <button type="button" class="act" onclick={ondelete}>
    <Icon name="trash" /><span>{text(words.actDelete)}</span>
  </button>
  <button type="button" class="act" aria-label={text(words.actMore)} onclick={onmore}>
    <Icon name="dots-three" />
  </button>
</div>

<style>
  .bar {
    display: flex;
    gap: 4px;
    padding: 4px;
    border-radius: 14px;
    border: 1px solid var(--glass-edge);
    background: var(--panel);
    box-shadow: var(--shadow);
    color: var(--words);
  }
  .act {
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
  .act:hover {
    background: var(--hover);
  }
  .act[aria-pressed='true'] {
    background: var(--picked);
    box-shadow: inset 0 0 0 2px var(--accent);
  }
</style>
