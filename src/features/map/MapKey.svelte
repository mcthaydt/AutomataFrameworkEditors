<script lang="ts">
  // What each mark on the map means, in a line along the bottom. The red bar is only listed when there is one.
  import { Icon } from '../ui/ui.ts'
  import { type Lang, type Row, wordsIn } from '../words/words.ts'

  interface Props {
    lang: Lang
    /** The map has a wall on it, so the key says what the red bar is. */
    walls: boolean
  }
  let { lang, walls }: Props = $props()

  const words = $derived(wordsIn(lang).map)
  const text = (row: Row): string => (typeof row === 'string' ? row : row())
</script>

<div class="key" role="group" aria-label={text(words.keyLabel)}>
  <span><i class="bar join"></i><Icon name="arrows-left-right" size={14} />{text(words.keyJoin)}</span>
  {#if walls}
    <span><i class="bar wall"></i><Icon name="warning" size={14} />{text(words.keyWall)}</span>
  {/if}
  <span><i class="arrow"></i>{text(words.keyDoor)}</span>
  <span><Icon name="flag-pennant" size={14} />{text(words.keyStart)}</span>
</div>

<style>
  .key {
    position: absolute;
    left: 50%;
    bottom: 12px;
    transform: translateX(-50%);
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px 16px;
    max-width: calc(100% - 16px);
    padding: 8px 14px;
    border-radius: 12px;
    border: 1px solid var(--g-edge);
    background: var(--g-bg);
    -webkit-backdrop-filter: var(--g-filter);
    backdrop-filter: var(--g-filter);
    box-shadow: var(--g-shine);
    color: var(--words);
    font-size: 13px;
    pointer-events: none;
  }
  span {
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .bar {
    width: 18px;
    height: 0;
    border-top: 4px solid var(--words);
    border-radius: 2px;
  }
  .wall {
    border-top: 4px dashed var(--problem);
  }
  .arrow {
    width: 18px;
    height: 0;
    border-top: 2px dashed var(--words);
  }
</style>
