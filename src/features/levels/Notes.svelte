<script lang="ts">
  import { WORDS } from '../words/words.ts'
  import type { Notes } from './notes.ts'
  import type { NotesMode } from './notes-mode.ts'
  import type { Size } from './place.ts'

  // The drawing notes: a layer of ordinary page elements over the game's picture, never in it. The tile grid is always
  // there; with a thing picked, two measure lines and a block of notes beside it say where it is, in the same numbers
  // as the level's file. Each note is a button: pressing it takes a keyboard or a finger to the arrows that change it.
  // On, faded (35%) and hidden are a setting of this device. A fade 200 ms long marks a thing being picked and let go.
  interface Props {
    notes: Notes
    mode: NotesMode
    /** The picked thing's place as the file has it; undefined when nothing is picked. */
    picked: { readonly x: number; readonly y: number } | undefined
    /** The clear cell is narrow: one note holds both numbers. */
    joined: boolean
    /** Counts every Undo and Redo, so the lines are drawn in again at the new place. */
    again: number
    onnote: (axis: 'x' | 'y') => void
    onblock: (size: Size) => void
  }
  let { notes, mode, picked, joined, again, onnote, onblock }: Props = $props()

  // What is drawn for the picked thing is held until its fade out has ended, so letting go is a fade and not a jump.
  let held = $state.raw<{ readonly notes: Notes; readonly picked: { readonly x: number; readonly y: number } } | undefined>(undefined)
  let leaving = $state(false)
  $effect(() => {
    if (mode === 'hidden') {
      held = undefined
      leaving = false
    } else if (picked !== undefined && notes.block !== undefined) {
      held = { notes, picked }
      leaving = false
    } else if (held !== undefined) {
      leaving = true
    }
  })

  let block: HTMLDivElement | undefined = $state()
  // The block is measured on the page, since its width depends on the words, and the layout waits for the answer.
  $effect(() => {
    const watched = block
    if (watched === undefined) return
    const tell = (): void => onblock({ w: watched.offsetWidth, h: watched.offsetHeight })
    const watcher = new ResizeObserver(tell)
    watcher.observe(watched)
    tell()
    return () => watcher.disconnect()
  })

  const lines = $derived.by(() => {
    const { grid } = notes
    if (!(grid.tile > 0)) return { across: [] as number[], down: [] as number[] }
    const cols = Math.round(grid.w / grid.tile)
    const rows = Math.round(grid.h / grid.tile)
    return {
      across: Array.from({ length: rows + 1 }, (_, i) => grid.y + i * grid.tile),
      down: Array.from({ length: cols + 1 }, (_, i) => grid.x + i * grid.tile),
    }
  })
  const amount = (n: number): string => WORDS.noteTiles(n)
  const ended = (e: AnimationEvent): void => {
    if (leaving && e.target === e.currentTarget) {
      held = undefined
      leaving = false
    }
  }
</script>

{#if mode !== 'hidden'}
  <div class="notes" data-notes={mode}>
    <svg class="art" width="100%" height="100%" aria-hidden="true">
      <!-- Each line is two strokes side by side, one words and one ground, so one of them shows on any art. -->
      <g class="grid">
        {#each lines.down as x (x)}
          <line class="gw" x1={x + 0.5} y1={notes.grid.y} x2={x + 0.5} y2={notes.grid.y + notes.grid.h} />
          <line class="gg" x1={x + 1.5} y1={notes.grid.y} x2={x + 1.5} y2={notes.grid.y + notes.grid.h} />
        {/each}
        {#each lines.across as y (y)}
          <line class="gw" x1={notes.grid.x} y1={y + 0.5} x2={notes.grid.x + notes.grid.w} y2={y + 0.5} />
          <line class="gg" x1={notes.grid.x} y1={y + 1.5} x2={notes.grid.x + notes.grid.w} y2={y + 1.5} />
        {/each}
      </g>
      {#if held !== undefined}
        {#key again}
          <g class="lines" class:leaving onanimationend={ended}>
            {#each [...held.notes.measures, ...(held.notes.block ? [held.notes.block.leader] : [])] as line, i (i)}
              <!-- A 3 px words stroke under a 1 px ground one: a line that reads on light and dark art. -->
              <line class="stroke words-stroke" pathLength="1" x1={line.from.x} y1={line.from.y} x2={line.to.x} y2={line.to.y} />
              <line class="stroke ground-stroke" pathLength="1" x1={line.from.x} y1={line.from.y} x2={line.to.x} y2={line.to.y} />
            {/each}
          </g>
        {/key}
      {/if}
    </svg>
    {#if held !== undefined && held.notes.block !== undefined}
      {#key again}
        <div
          class="block"
          class:leaving
          bind:this={block}
          style:left="{held.notes.block.at.x}px"
          style:top="{held.notes.block.at.y}px"
          onanimationend={ended}
        >
          {#if joined}
            <button
              type="button"
              class="note"
              data-note="x"
              aria-label={WORDS.noteChange(
                `${WORDS.noteAcross} ${amount(held.picked.x)}. ${WORDS.noteDown}`,
                amount(held.picked.y),
              )}
              onclick={() => onnote('x')}
            >
              <span><span class="label">{WORDS.noteAcross}</span> <span class="measure">{amount(held.picked.x)}</span></span>
              <span><span class="label">{WORDS.noteDown}</span> <span class="measure">{amount(held.picked.y)}</span></span>
            </button>
          {:else}
            <button
              type="button"
              class="note"
              data-note="x"
              aria-label={WORDS.noteChange(WORDS.noteAcross, amount(held.picked.x))}
              onclick={() => onnote('x')}
            >
              <span class="label">{WORDS.noteAcross}</span> <span class="measure">{amount(held.picked.x)}</span>
            </button>
            <button
              type="button"
              class="note"
              data-note="y"
              aria-label={WORDS.noteChange(WORDS.noteDown, amount(held.picked.y))}
              onclick={() => onnote('y')}
            >
              <span class="label">{WORDS.noteDown}</span> <span class="measure">{amount(held.picked.y)}</span>
            </button>
          {/if}
        </div>
      {/key}
    {/if}
  </div>
{/if}

<style>
  /* Over the picture and under the floating panels. The layer takes no press, but for its notes. */
  .notes {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .art {
    position: absolute;
    inset: 0;
    overflow: visible;
  }
  .grid line {
    stroke-width: 1;
    opacity: 0.25;
  }
  .gw {
    stroke: var(--words);
  }
  .gg {
    stroke: var(--ground);
  }
  .stroke {
    stroke-linecap: round;
    stroke-dasharray: 1;
    animation: draw 200ms ease-out;
  }
  .words-stroke {
    stroke: var(--words);
    stroke-width: 3;
  }
  .ground-stroke {
    stroke: var(--ground);
    stroke-width: 1;
  }
  /* Above the things' buttons, so a note can be pressed wherever it lies; below the panels (the stage is its own
     stacking context). */
  .block {
    position: absolute;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    animation: fade 200ms ease-out;
  }
  .note {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    min-height: 44px;
    padding: var(--space-1) var(--space-2);
    border: 1px solid var(--words);
    border-radius: var(--corner);
    background: var(--ground);
    color: var(--words);
    font: inherit;
    text-align: left;
    cursor: pointer;
    pointer-events: auto;
    touch-action: manipulation;
  }
  .note .measure {
    color: var(--touch);
  }
  /* Let go: the same fade, backwards, and then the notes are taken away. */
  .leaving {
    animation: fade 200ms ease-out reverse forwards;
  }
  .notes[data-notes='faded'] > .art,
  .notes[data-notes='faded'] > .block {
    opacity: 0.35;
  }
  @keyframes draw {
    from {
      stroke-dashoffset: 1;
    }
    to {
      stroke-dashoffset: 0;
    }
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  /* A person who asked for less motion sees the notes fade in and out, and nothing drawn or moved. */
  @media (prefers-reduced-motion: reduce) {
    .stroke {
      animation-name: fade;
    }
  }
</style>
