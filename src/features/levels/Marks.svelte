<script lang="ts">
  // The marks over a level: a real button for each thing and start, found by its name, with the picked ones ringed. A
  // finger, a Pencil and a mouse reach them through `gestures.ts` on the stage that holds these; a keyboard and a screen
  // reader reach them here: Tab goes through the level's things in the order the list has them, the arrows nudge, and
  // Enter or Space picks.
  import { WAYS, type Way } from './nudge.ts'
  import type { Mark } from './marks.ts'

  interface Props {
    marks: readonly Mark[]
    picked: readonly string[]
    /** Only to look at: nothing moves or is picked. */
    readOnly?: boolean
    /** Ringed because a change is being looked at. */
    marked?: readonly string[]
    onpick?: (id: string) => void
    onnudge?: (id: string, way: Way) => void
    onclear?: () => void
  }
  let { marks, picked, readOnly = false, marked = [], onpick, onnudge, onclear }: Props = $props()

  /** The smaller a thing, the higher it stands, so it can still be reached under a bigger one. */
  const stack = $derived(
    new Map(
      [...marks]
        .sort((a, b) => b.box.w * b.box.h - a.box.w * a.box.h)
        .map((mark, index) => [mark.id, index + 1] as const),
    ),
  )

  function key(e: KeyboardEvent, id: string): void {
    if (readOnly) return
    if (e.key === 'Escape') {
      onclear?.()
      return
    }
    const way = WAYS[e.key]
    if (way === undefined) return
    e.preventDefault()
    onnudge?.(id, way)
  }
</script>

<div class="marks">
  {#each marks as mark (mark.id)}
    {@const ringed = picked.includes(mark.id) || marked.includes(mark.id)}
    <button
      type="button"
      class="mark"
      data-thing={mark.id}
      data-kind={mark.kind}
      data-x={mark.at.x}
      data-y={mark.at.y}
      data-marked={marked.includes(mark.id) ? '' : undefined}
      aria-label={mark.name}
      aria-pressed={readOnly ? undefined : picked.includes(mark.id)}
      style:left="{mark.hit.x}px"
      style:top="{mark.hit.y}px"
      style:width="{mark.hit.w}px"
      style:height="{mark.hit.h}px"
      style:z-index={stack.get(mark.id) ?? 1}
      onclick={(e) => {
        // A pointer's tap was already read by the stage; a click with no pointer is a key or a screen reader's press.
        if (e.detail === 0 && !readOnly) onpick?.(mark.id)
      }}
      onfocus={() => {
        if (!readOnly) onpick?.(mark.id)
      }}
      onkeydown={(e) => key(e, mark.id)}
    >
      {#if ringed}
        <span
          class="ring"
          aria-hidden="true"
          style:left="{mark.box.x - mark.hit.x}px"
          style:top="{mark.box.y - mark.hit.y}px"
          style:width="{mark.box.w}px"
          style:height="{mark.box.h}px"
        >
          <i class="handle tl"></i><i class="handle tr"></i><i class="handle bl"></i><i class="handle br"></i>
        </span>
      {/if}
    </button>
  {/each}
</div>

<style>
  .marks {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .mark {
    position: absolute;
    box-sizing: border-box;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    cursor: grab;
    touch-action: none;
    pointer-events: auto;
  }
  .mark:focus-visible {
    outline: 3px solid var(--focus, var(--accent));
    outline-offset: 2px;
  }
  .ring {
    position: absolute;
    box-sizing: border-box;
    border: 2px solid var(--accent);
    border-radius: 3px;
    pointer-events: none;
  }
  .handle {
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 2px;
    background: var(--accent);
  }
  .tl {
    left: -5px;
    top: -5px;
  }
  .tr {
    right: -5px;
    top: -5px;
  }
  .bl {
    left: -5px;
    bottom: -5px;
  }
  .br {
    right: -5px;
    bottom: -5px;
  }
</style>
