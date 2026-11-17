<script lang="ts">
  // An edge that touches the next level, drawn as the map draws it: a bar along the stretch where the hero walks straight
  // across, with a card that says so and the way to go and look. Painting ground over the stretch closes it (the edge is
  // worked out from the empty tiles), so nothing is marked by hand.
  import type { Level } from '@automataframework/framework/headless'
  import { Icon } from '../ui/ui.ts'
  import { type Lang, nameOf, type Row, wordsIn } from '../words/words.ts'
  import { type Edge, edgeBar } from './edges.ts'
  import { menuPlace } from './float.ts'
  import { hintAt } from './joins.ts'
  import type { Mark } from './marks.ts'
  import type { Camera, Screen } from './view.ts'

  interface Props {
    lang: Lang
    level: Level
    levelId: string
    edges: readonly Edge[]
    camera: Camera
    /** What the card must keep clear of. */
    marks: readonly Mark[]
    size: Screen
    /** The cards are drawn (nothing is picked, and nothing else is asking); the bars always are. */
    cards: boolean
    ongo: (level: string) => void
  }
  let { lang, level, levelId, edges, camera, marks, size, cards, ongo }: Props = $props()

  const words = $derived(wordsIn(lang))
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row
  const bars = $derived(edges.map((edge) => ({ edge, bar: edgeBar(edge, level, camera, size) })))
  /** One card for each level across, at its first stretch. */
  const across = $derived(bars.filter((one, at) => bars.findIndex((two) => two.edge.other === one.edge.other) === at))
  const wide = $derived(Math.min(300, size.w * 0.7))
  const place = (bar: { x: number; y: number; w: number; h: number }, side: Edge['side']) => {
    const x = side === 'right' ? bar.x - wide - 12 : side === 'left' ? bar.x + 12 : bar.x + bar.w / 2 - wide / 2
    const y = side === 'top' ? bar.y + 12 : side === 'bottom' ? bar.y - 150 : bar.y
    // Beside the bar when that covers nothing a finger may want, else the freest corner.
    const card = { w: wide, h: 150 }
    const near = menuPlace({ x, y }, size, card)
    return hintAt(card, marks.map((m) => m.box), size, [near])
  }
</script>

{#each bars as { edge, bar }, at (`${edge.side}/${edge.other}/${edge.from}/${at}`)}
  <div
    class="bar"
    data-edge={edge.side}
    data-edge-to={edge.other}
    aria-hidden="true"
    style:left="{bar.x - (edge.side === 'right' || edge.side === 'left' ? 4 : 0)}px"
    style:top="{bar.y - (edge.side === 'top' || edge.side === 'bottom' ? 4 : 0)}px"
    style:width="{edge.side === 'right' || edge.side === 'left' ? 8 : bar.w}px"
    style:height="{edge.side === 'right' || edge.side === 'left' ? bar.h : 8}px"
  ></div>
{/each}
{#if cards}
  {#each across as { edge, bar } (edge.other)}
    {@const spot = place(bar, edge.side)}
    <div class="card" data-ui role="note" data-edge-card={edge.other} style:left="{spot.x}px" style:top="{spot.y}px" style:width="{wide}px">
      <b><Icon name="arrows-left-right" />{text(words.thing.edgeTitle, nameOf(edge.other))}</b>
      <small>{text(words.thing.edgeAbout, nameOf(levelId), nameOf(edge.other))}</small>
      <button type="button" onclick={() => ongo(edge.other)}>
        <Icon name="arrow-right" />{text(words.thing.goTo, nameOf(edge.other))}
      </button>
    </div>
  {/each}
{/if}

<style>
  .bar {
    position: absolute;
    z-index: 3;
    background: var(--accent);
    border-radius: 2px;
    pointer-events: none;
  }
  .card {
    position: absolute;
    z-index: 28;
    display: grid;
    gap: 6px;
    box-sizing: border-box;
    padding: 12px;
    border: 1px solid var(--accent);
    border-radius: 12px;
    background: var(--panel);
    box-shadow: var(--shadow);
    color: var(--words);
  }
  b {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  small {
    color: var(--quiet);
  }
  button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 44px;
    border: 0;
    border-radius: 8px;
    background: var(--raised);
    color: var(--words);
    font: inherit;
    cursor: pointer;
  }
  @media (max-width: 600px), (max-height: 500px) {
    small {
      display: none;
    }
  }
</style>
