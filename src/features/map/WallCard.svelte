<script lang="ts">
  // Two levels meet at a wall: players would walk into it. The four ways out, each a single step that can be undone.
  import { type Lang, nameOf, type Row, wordsIn } from '../words/words.ts'

  interface Props {
    lang: Lang
    /** The level that is open where they meet, and the one whose ground is in the way. */
    open: string
    solid: string
    /** Tiles of ground that clearing would take. */
    tiles: number
    /** What sliding a level so the openings meet would do: which way and how far; none when it cannot. */
    slide: { readonly level: string; readonly way: 'up' | 'down' | 'left' | 'right'; readonly tiles: number } | undefined
    onclear: () => void
    onslide: () => void
    onapart: () => void
    onleave: () => void
  }
  let { lang, open, solid, tiles, slide, onclear, onslide, onapart, onleave }: Props = $props()

  const words = $derived(wordsIn(lang).arrange)
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row
  const way = $derived(
    slide === undefined ? '' : text({ up: words.wayUp, down: words.wayDown, left: words.wayLeft, right: words.wayRight }[slide.way]),
  )
</script>

<section class="card" aria-label={text(words.wallTitle)}>
  <h2>{text(words.wallTitle)}</h2>
  <p>{text(words.wallBody, nameOf(open), nameOf(solid))}</p>
  <div class="ways">
  <button type="button" data-way="clear" onclick={onclear}>
    <span>{text(words.wallClear, nameOf(solid))}</span><small>{text(words.wallClearAbout, tiles)}</small>
  </button>
  {#if slide !== undefined}
    <button type="button" data-way="move" onclick={onslide}>
      <span>{text(words.wallMove, nameOf(slide.level))}</span><small>{text(words.wallMoveAbout, way, slide.tiles)}</small>
    </button>
  {/if}
  <button type="button" data-way="apart" onclick={onapart}><span>{text(words.wallApart)}</span></button>
  <button type="button" data-way="leave" onclick={onleave}>
    <span>{text(words.wallLeave)}</span><small>{text(words.wallLeaveAbout)}</small>
  </button>
  </div>
</section>

<style>
  .card {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: min(520px, calc(100vw - 32px));
    padding: 12px;
    border-radius: 14px;
    border: 1px solid var(--glass-edge);
    background: var(--panel);
    box-shadow: var(--shadow);
    color: var(--words);
  }
  h2 {
    margin: 0;
    font-size: 16px;
  }
  .ways {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 6px;
  }
  p {
    margin: 0 0 4px;
    font-size: 14px;
    color: var(--quiet);
  }
  button {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    min-height: 48px;
    padding: 6px 12px;
    border: 0;
    border-radius: 10px;
    background: var(--raised);
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  button:hover {
    background: var(--hover);
  }
  small {
    color: var(--quiet);
    font-size: 12px;
  }
</style>
