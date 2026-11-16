<script lang="ts">
  // The marks over the map, as a layer of SVG that no finger lands on: a bar across each join, a red dashed bar across
  // each wall, a dashed arrow from each door to where you come out, and the flag on the level the game starts in. Each
  // mark is a real element with a name a screen reader says, so a journey can find it too. The levels themselves (the
  // buttons a person taps) are `MapPart`'s.
  import { Icon } from '../ui/ui.ts'
  import type { Point } from '../levels/levels.ts'
  import { type Lang, nameOf, type Row, wordsIn } from '../words/words.ts'
  import { curve, type Rect } from './shapes.ts'

  export interface Line {
    readonly a: string
    readonly b: string
    readonly from: Point
    readonly to: Point
  }
  export interface Arrow {
    readonly level: string
    readonly thing: string
    readonly goes: string
    readonly from: Point
    readonly to: Point
  }

  interface Props {
    lang: Lang
    size: { readonly w: number; readonly h: number }
    joins: readonly Line[]
    walls: readonly Line[]
    doors: readonly Arrow[]
    /** Where the level the game starts in is on the screen. */
    start: { readonly level: string; readonly rect: Rect } | undefined
    /** The stretch where a level that is being dragged would join, shown before it is let go. */
    soon?: readonly Line[]
    /** A wall's mark was pressed: its card, with the ways out, opens. */
    onwall?: (line: Line) => void
  }
  let { lang, size, joins, walls, doors, start, soon = [], onwall }: Props = $props()

  const words = $derived(wordsIn(lang).map)
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row
  const uid = $props.id()
  const middle = (line: Line): Point => ({ x: (line.from.x + line.to.x) / 2, y: (line.from.y + line.to.y) / 2 })
</script>

<svg class="marks" viewBox="0 0 {size.w} {size.h}" width={size.w} height={size.h} focusable="false">
  <defs>
    <marker id="head-{uid}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" class="head"></path>
    </marker>
  </defs>
  {#each doors as door (`${door.level}/${door.thing}`)}
    <g
      role="img"
      data-mark="door"
      aria-label={text(words.markDoor, nameOf(door.level), nameOf(door.goes))}
    >
      <path d={curve(door.from, door.to)} class="door" marker-end="url(#head-{uid})"></path>
      <circle cx={door.from.x} cy={door.from.y} r="5" class="knob"></circle>
    </g>
  {/each}
  {#each joins as line (`${line.a}/${line.b}/${line.from.x}/${line.from.y}`)}
    <g role="img" data-mark="join" aria-label={text(words.markJoin, nameOf(line.a), nameOf(line.b))}>
      <line x1={line.from.x} y1={line.from.y} x2={line.to.x} y2={line.to.y} class="join"></line>
    </g>
  {/each}
  {#each soon as line (`${line.a}/${line.b}/${line.from.x}/${line.from.y}`)}
    <g role="img" data-mark="soon" aria-label={text(words.markJoin, nameOf(line.a), nameOf(line.b))}>
      <line x1={line.from.x} y1={line.from.y} x2={line.to.x} y2={line.to.y} class="join soon"></line>
    </g>
  {/each}
  {#each walls as line (`${line.a}/${line.b}/${line.from.x}/${line.from.y}`)}
    <g role="img" data-mark="wall" aria-label={text(words.markWall, nameOf(line.a), nameOf(line.b))}>
      <line x1={line.from.x} y1={line.from.y} x2={line.to.x} y2={line.to.y} class="wall"></line>
    </g>
  {/each}
</svg>

{#each joins as line (`${line.a}/${line.b}/${line.from.x}/${line.from.y}`)}
  <span class="chip" style:left="{middle(line).x}px" style:top="{middle(line).y}px" aria-hidden="true">
    <Icon name="arrows-left-right" size={14} />
  </span>
{/each}
{#each walls as line (`${line.a}/${line.b}/${line.from.x}/${line.from.y}`)}
  <button
    type="button"
    class="chip bad"
    data-wall={`${line.a}/${line.b}`}
    aria-label={text(words.markWall, nameOf(line.a), nameOf(line.b))}
    style:left="{middle(line).x}px"
    style:top="{middle(line).y}px"
    onclick={() => onwall?.(line)}
  >
    <Icon name="warning" size={14} />
  </button>
{/each}
{#if start !== undefined}
  <span
    class="start"
    role="img"
    data-mark="start"
    data-on={start.level}
    aria-label={text(words.markStart, nameOf(start.level))}
    style:left="{start.rect.x + 6}px"
    style:top="{start.rect.y + start.rect.h - 6}px"
  >
    <Icon name="flag-pennant" size={14} />{#if start.rect.w >= 84}<span>{text(words.startWord)}</span>{/if}
  </span>
{/if}

<style>
  .marks {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: visible;
  }
  .door {
    fill: none;
    stroke: var(--words);
    stroke-opacity: 0.7;
    stroke-width: 2;
    stroke-dasharray: 6 5;
  }
  .head {
    fill: var(--words);
    fill-opacity: 0.7;
  }
  .knob {
    fill: var(--words);
    stroke: var(--ground);
    stroke-width: 2;
  }
  .join {
    stroke: var(--words);
    stroke-width: 6;
    stroke-linecap: round;
  }
  .soon {
    stroke-dasharray: 8 5;
    stroke: var(--accent);
  }
  .wall {
    stroke: var(--problem);
    stroke-width: 6;
    stroke-linecap: round;
    stroke-dasharray: 8 5;
  }
  .chip {
    position: absolute;
    z-index: 2;
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    margin: -12px 0 0 -12px;
    border-radius: 50%;
    background: var(--words);
    color: var(--ground);
    pointer-events: none;
  }
  .chip.bad {
    width: 32px;
    height: 32px;
    margin: -16px 0 0 -16px;
    border: 0;
    padding: 0;
    background: var(--problem);
    color: var(--bright);
    pointer-events: auto;
    cursor: pointer;
  }
  .start {
    position: absolute;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transform: translateY(-100%);
    padding: 2px 8px 2px 6px;
    border-radius: 8px;
    background: var(--glass-soft);
    color: var(--words);
    font-size: 12px;
    pointer-events: none;
  }
</style>
