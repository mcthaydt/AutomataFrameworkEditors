<script lang="ts">
  // The smallest thing that holds a level for a Stage, the way the World screen does: it works a drag out from the level
  // as it was when the finger went down, so a whole drag is one step back. Undo and the four arrows are plain buttons.
  import type { Character, Level } from '@automataframework/framework/headless'
  import { untrack } from 'svelte'
  import {
    type LevelEdit,
    moveThing,
    nudgeThing,
    type Point,
    Stage,
    startEdit,
    undo,
  } from '#src/features/levels/levels.ts'

  interface Props {
    level: Level
    characters: Readonly<Record<string, Character>>
    hero?: string
    readOnly?: boolean
    marked?: readonly string[]
    onedit?: (edit: LevelEdit) => void
  }
  let { level, characters, hero, readOnly = false, marked = [], onedit }: Props = $props()

  let edit = $state.raw<LevelEdit>(untrack(() => startEdit(level)))
  let picked = $state<string | undefined>(undefined)
  let solid = $state(false)
  let from: LevelEdit | undefined

  function set(next: LevelEdit): void {
    edit = next
    onedit?.(next)
  }
  function drag(id: string, to: Point): void {
    const start = from ?? edit
    const result = moveThing(start, characters, id, to)
    if (result.moved) {
      solid = false
      set(result.edit)
    } else if (result.why === 'solid') {
      solid = true
    } else if (result.why === 'same' && edit !== start) {
      solid = false
      set(start)
    }
  }
  function drop(gaveUp: boolean): void {
    const start = from
    from = undefined
    if (gaveUp && start !== undefined) set(start)
  }
  function nudge(id: string, way: 'left' | 'right' | 'up' | 'down'): void {
    const result = nudgeThing(edit, characters, id, way)
    solid = !result.moved && result.why === 'solid'
    if (result.moved) set(result.edit)
  }
</script>

<div class="harness">
  <Stage
    level={edit.now}
    {characters}
    {hero}
    label="level-1"
    {readOnly}
    {marked}
    {picked}
    onpick={(id) => (picked = id)}
    ongrab={() => (from = edit)}
    ondrag={drag}
    ondrop={drop}
    onnudge={nudge}
  />
  {#if !readOnly}
    <div class="tools">
      {#if solid}<p>solid</p>{/if}
      {#if picked !== undefined}
        {@const id = picked}
        <button type="button" onclick={() => nudge(id, 'left')}>Move left</button>
        <button type="button" onclick={() => nudge(id, 'right')}>Move right</button>
        <button type="button" onclick={() => nudge(id, 'up')}>Move up</button>
        <button type="button" onclick={() => nudge(id, 'down')}>Move down</button>
      {/if}
      <button type="button" disabled={edit.past.length === 0} onclick={() => set(undo(edit))}>Undo</button>
    </div>
  {/if}
</div>

<style>
  .harness {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
  }
  .tools {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  button {
    min-width: 44px;
    min-height: 44px;
  }
</style>
