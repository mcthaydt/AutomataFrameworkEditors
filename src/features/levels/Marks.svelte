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
    /** A name drawn on a thing's ring: whose place it is, when two places of one thing are shown. */
    tags?: Readonly<Record<string, string>>
    /** Places where a thing could be instead, drawn dashed and named, never touched. */
    ghosts?: readonly { readonly mark: Mark; readonly name: string }[]
    /** The ground is being painted: the things are drawn faint and are not touched. */
    faint?: boolean
    onpick?: (id: string) => void
    onnudge?: (id: string, way: Way) => void
    onclear?: () => void
  }
  let {
    marks,
    picked,
    readOnly = false,
    marked = [],
    tags = {},
    ghosts = [],
    faint = false,
    onpick,
    onnudge,
    onclear,
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
          {#if tags[mark.id] !== undefined}<b class="tag glass-1" class:end={ghosts.some((g) => g.mark.box.x > mark.box.x)} class:start={ghosts.some((g) => g.mark.box.x < mark.box.x)}>{tags[mark.id]}</b>{/if}
        </span>
      {/if}
    </button>
  {/each}
  {#each ghosts as ghost (ghost.name)}
    <span
      class="ghost"
      role="img"
      data-ghost={ghost.mark.id}
      aria-label={ghost.name}
      style:left="{ghost.mark.box.x}px"
      style:top="{ghost.mark.box.y}px"
      style:width="{ghost.mark.box.w}px"
      style:height="{ghost.mark.box.h}px"
    >
      <b class="tag glass-1" class:end={ghost.mark.box.x < (marks.find((m) => marked.includes(m.id))?.box.x ?? 0)} class:start={ghost.mark.box.x > (marks.find((m) => marked.includes(m.id))?.box.x ?? 0)}>{ghost.name}</b>
    </span>
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
  .ring {
    position: absolute;
    box-sizing: border-box;
    border: 2px solid var(--accent);
    border-radius: 3px;
    pointer-events: none;
  }
  .ghost {
    position: absolute;
    box-sizing: border-box;
    border: 2px dashed var(--accent);
    border-radius: 3px;
    pointer-events: none;
  }
  /* The name sits just under its place, on layer 1 glass like the other tags, so it reads over any picture. */
  .tag {
    position: absolute;
    top: 100%;
    left: 50%;
    padding: 1px 6px;
    border-radius: 6px;
    font-family: var(--label);
    font-size: 12px;
    font-weight: 600;
    line-height: 16px;
    white-space: nowrap;
    transform: translateX(-50%);
  }
  /* Two names side by side lean away from each other, so neither covers the other. */
  .tag.end {
    right: 0;
    left: auto;
    transform: none;
  }
  .tag.start {
    left: 0;
    transform: none;
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
