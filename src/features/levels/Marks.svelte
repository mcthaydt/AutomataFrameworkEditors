<script lang="ts">
  // The marks over a level: a real button for each thing and start, found by its name, with the picked ones ringed. A
  // finger, a Pencil and a mouse reach them through `gestures.ts` on the stage that holds these; a keyboard and a screen
  // reader reach them here: Tab goes through the level's things in the order the list has them, the arrows nudge, and
  // Enter or Space picks.
  import { Icon } from '../ui/ui.ts'
  import { WAYS, type Way } from './nudge.ts'
  import type { Mark } from './marks.ts'

  interface Props {
    marks: readonly Mark[]
    picked: readonly string[]
    /** Only to look at: nothing moves or is picked. */
    readOnly?: boolean
    /** Ringed because a change is being looked at. */
    marked?: readonly string[]
    /** The ground is being painted: the things are drawn faint and are not touched. */
    faint?: boolean
    onpick?: (id: string) => void
    onnudge?: (id: string, way: Way) => void
    onclear?: () => void
    /** What is laid over the level: a helper's ghosts, which are only drawn, and notes, which are pins to press. */
    extras?: readonly Mark[]
    onextra?: (id: string) => void
  }
  let {
    marks,
    picked,
    readOnly = false,
    marked = [],
    faint = false,
    onpick,
    onnudge,
    onclear,
    extras = [],
    onextra,
  }: Props = $props()

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

<div class="marks" class:faint>
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
  {#each extras as extra (extra.id)}
    {#if extra.kind === 'ghost'}
      <div
        class="ghost"
        data-ghost={extra.id}
        aria-hidden="true"
        style:left="{extra.box.x}px"
        style:top="{extra.box.y}px"
        style:width="{extra.box.w}px"
        style:height="{extra.box.h}px"
      ></div>
    {:else}
      <button
        type="button"
        class="pin"
        class:done={extra.done}
        data-note={extra.id}
        aria-label={extra.name}
        style:left="{extra.hit.x}px"
        style:top="{extra.hit.y}px"
        style:width="{extra.hit.w}px"
        style:height="{extra.hit.h}px"
        onpointerdown={(e) => e.stopPropagation()}
        onclick={() => onextra?.(extra.id)}
      >
        <Icon name="push-pin" />
      </button>
    {/if}
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
  .faint .mark {
    pointer-events: none;
    opacity: 0.45;
  }
  .mark:focus-visible {
    outline: 3px solid var(--focus, var(--accent));
    outline-offset: 2px;
  }
  .ghost {
    position: absolute;
    box-sizing: border-box;
    border: 2px dashed var(--agent);
    border-radius: 3px;
    background: color-mix(in srgb, var(--agent) 25%, transparent);
    pointer-events: none;
  }
  .pin {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--accent);
    cursor: pointer;
    pointer-events: auto;
  }
  .pin.done {
    opacity: 0.45;
  }
  .pin:focus-visible {
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
