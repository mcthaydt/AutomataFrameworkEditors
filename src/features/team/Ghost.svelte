<script lang="ts">
  // What a helper (or someone else) changed in the game while the person worked, laid on the level as a ghost and said in
  // a few lines, with Keep and Undo. It is lavender, the helper's colour, and floats over the foot of the level.
  import type { ChangeLine } from '../game/game.ts'
  import { Action, Icon } from '../ui/ui.ts'
  import { type Lang, type Row, wordsIn } from '../words/words.ts'
  import { sayLine } from './lines.ts'

  interface Props {
    lang: Lang
    lines: readonly ChangeLine[]
    /** What the ghost says first; the pasted level has words of its own. */
    about?: string | undefined
    onkeep: () => void
    onundo: () => void
  }
  let { lang, lines, about, onkeep, onundo }: Props = $props()

  const MOST = 3
  const words = $derived(wordsIn(lang))
  const h = $derived(words.helper)
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row
  const shown = $derived(lines.slice(0, MOST))
</script>

<div class="ghost glass-1" role="group" aria-label={about ?? text(h.ghostAbout)} data-ghost-card>
  <p class="about"><Icon name="sparkle" /><span>{about ?? text(h.ghostAbout)}</span></p>
  <ul>
    {#each shown as line, at (at)}
      <li>{sayLine(words, line).words}</li>
    {/each}
    {#if lines.length > MOST}<li class="more">{text(h.ghostMore, lines.length - MOST)}</li>{/if}
  </ul>
  <div class="buttons">
    <Action label={text(h.ghostKeep)} icon="check" kind="main" onpress={onkeep} />
    <Action label={text(h.ghostUndo)} icon="arrow-counter-clockwise" onpress={onundo} />
  </div>
</div>

<style>
  .ghost {
    position: absolute;
    left: 50%;
    bottom: calc(var(--tools-room, 0px) + 16px);
    z-index: 9;
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: min(420px, calc(100% - 16px));
    box-sizing: border-box;
    padding: 12px 14px;
    border-radius: 12px;
    transform: translateX(-50%);
  }
  .about {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-weight: 600;
  }
  .about :global(svg) {
    flex: none;
    color: var(--agent);
  }
  ul {
    margin: 0;
    padding-left: 18px;
    overflow-wrap: anywhere;
  }
  .more {
    list-style: none;
    margin-left: -18px;
    color: var(--g-quiet);
  }
  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
