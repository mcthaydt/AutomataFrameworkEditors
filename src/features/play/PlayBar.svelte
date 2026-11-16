<script lang="ts">
  // What a person can do while the level plays: hold it still (and go on), start it again, and make the game bigger by
  // putting the panels away. Stop is in the top bar and on Escape. One step, slow and the strip that goes back are not
  // here: they come with the framework that can do them, and a control with nothing to do is never drawn.
  import { Icon } from '../ui/ui.ts'
  import { type Lang, type Row, wordsIn } from '../words/words.ts'

  interface Props {
    lang: Lang
    paused: boolean
    /** The panels are put away. */
    big: boolean
    onpause: () => void
    onagain: () => void
    onbig: () => void
  }
  let { lang, paused, big, onpause, onagain, onbig }: Props = $props()

  const words = $derived(wordsIn(lang).play)
  const text = (row: Row): string => (typeof row === 'string' ? row : row())
</script>

<div class="bar" role="toolbar" aria-label={text(words.playBar)}>
  <button type="button" class="act" data-play="pause" onclick={onpause}>
    <Icon name={paused ? 'play' : 'pause'} /><span>{text(paused ? words.goOn : words.pause)}</span>
  </button>
  <button type="button" class="act" data-play="again" onclick={onagain}>
    <Icon name="arrow-counter-clockwise" /><span>{text(words.again)}</span>
  </button>
  <button
    type="button"
    class="act"
    data-play="big"
    title={text(big ? words.smallerAbout : words.biggerAbout)}
    onclick={onbig}
  >
    <Icon name={big ? 'arrows-in' : 'arrows-out'} /><span>{text(big ? words.smaller : words.bigger)}</span>
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
</style>
