<script lang="ts">
  import { Button, Notice } from '../ui/ui.ts'
  import { WORDS } from '../words/words.ts'

  // The picked thing's card: where it is, in the same numbers as the level's file, and the four arrows that move it.
  // With nothing picked it is one line saying what to do. It scrolls inside its own fixed track, so picking a thing
  // never changes the size of anything else on the screen.
  interface Props {
    thing: { readonly id: string; readonly x: number; readonly y: number } | undefined
    /** True while a move was refused because it would rest in solid ground. */
    solid: boolean
    onnudge: (way: 'left' | 'right' | 'up' | 'down') => void
  }
  let { thing, solid, onnudge }: Props = $props()
</script>

{#if thing === undefined}
  <p class="line">{WORDS.hintIdle}</p>
{:else}
  <div class="where">
    <span class="label">{thing.id}</span>
    <span class="spot"><span class="label">{WORDS.noteAcross}</span> <span class="measure">{thing.x}</span></span>
    <span class="spot"><span class="label">{WORDS.noteDown}</span> <span class="measure">{thing.y}</span></span>
  </div>
  <p class="line">{WORDS.hintSelected(thing.id)}</p>
  <div class="arrows">
    <Button label={WORDS.moveLeft} icon="moveLeft" attrs={{ 'data-move': 'left' }} onpress={() => onnudge('left')} />
    <Button label={WORDS.moveRight} icon="moveRight" attrs={{ 'data-move': 'right' }} onpress={() => onnudge('right')} />
    <Button label={WORDS.moveUp} icon="moveUp" attrs={{ 'data-move': 'up' }} onpress={() => onnudge('up')} />
    <Button label={WORDS.moveDown} icon="moveDown" attrs={{ 'data-move': 'down' }} onpress={() => onnudge('down')} />
  </div>
  {#if solid}<Notice kind="info" text={WORDS.solid} />{/if}
{/if}

<style>
  .line {
    margin: 0;
  }
  .where {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-1) var(--space-3);
    margin-bottom: var(--space-1);
  }
  .spot {
    display: inline-flex;
    align-items: baseline;
    gap: var(--space-2);
  }
  .arrows {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-2);
    margin-top: var(--space-2);
  }
</style>
