<script lang="ts">
  // A level to look at, with some of its things ringed (a change being looked at): the picture and the marks, and
  // nothing moves. The level a person works in is `LevelPart`.
  import type { GameContent, Level } from '@automataframework/framework/headless'
  import { onMount } from 'svelte'
  import type { OpenPicture } from '../wire/wire.ts'
  import { nameOf } from '../words/words.ts'
  import { createStage, type Stage } from './level-canvas.ts'
  import Marks from './Marks.svelte'
  import { marksFor } from './marks.ts'
  import type { Point } from './place.ts'
  import { framing, wholeLevel } from './view.ts'

  interface Props {
    content: GameContent
    pictures: readonly OpenPicture[]
    level: Level
    /** What a screen reader calls the picture. */
    label?: string
    /** Things to ring. */
    marked?: readonly string[]
    /** Show only the part of the level around these points (in tiles), close enough to tell them apart. */
    around?: readonly Point[]
    /** Names drawn on those rings (whose place it is). */
    tags?: Readonly<Record<string, string>>
    /** Where a thing is in another version of this level, drawn dashed and named. */
    elsewhere?: readonly { readonly level: Level; readonly thing: string; readonly name: string }[]
  }
  let { content, pictures, level, label = '', marked = [], around, tags = {}, elsewhere = [] }: Props = $props()

  let holder: HTMLDivElement | undefined = $state()
  let size = $state({ w: 0, h: 0 })
  let engine = $state.raw<Stage | undefined>()
  const camera = $derived(
    around !== undefined && around.length > 0
      ? framing(level, around, size)
      : wholeLevel(level, size, { top: 0, right: 0, bottom: 0, left: 0 }),
  )
  const marks = $derived(
    marksFor(
      level,
      content.characters,
      { tool: 'pick', picked: [], locked: new Set(), hidden: new Set(), camera, ground: false },
      size,
      nameOf,
    ),
  )

  const ghosts = $derived(
    elsewhere.flatMap((other) => {
      const found = marksFor(
        other.level,
        content.characters,
        { tool: 'pick', picked: [], locked: new Set(), hidden: new Set(), camera, ground: false },
        size,
        nameOf,
      ).find((mark) => mark.id === other.thing)
      return found === undefined ? [] : [{ mark: found, name: other.name }]
    }),
  )

  onMount(() => {
    let alive = true
    const watcher = new ResizeObserver(() => {
      if (holder !== undefined) size = { w: holder.clientWidth, h: holder.clientHeight }
    })
    if (holder !== undefined) {
      watcher.observe(holder)
      size = { w: holder.clientWidth, h: holder.clientHeight }
    }
    void createStage().then((made) => {
      if (!alive) return made.destroy()
      holder?.prepend(made.canvas)
      engine = made
    })
    return () => {
      alive = false
      watcher.disconnect()
      engine?.destroy()
    }
  })
  $effect(() => {
    const drawn = engine
    const { w, h } = size
    const now = { content, pictures, level, camera }
    if (drawn === undefined) return
    drawn.levels.resize(w, h)
    drawn.levels.show(now.content, now.pictures, now.level, now.camera, {
      faint: new Set(),
      hidden: new Set(),
      whatItIs: false,
      grid: 'off',
    })
  })
</script>

<div class="stage" role="group" aria-label={label} bind:this={holder} data-scale={camera.scale}>
  <Marks {marks} picked={[]} readOnly {marked} {tags} {ghosts} />
</div>

<style>
  .stage {
    position: relative;
    flex: 1;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
    border-radius: var(--radius);
  }
  .stage :global(canvas) {
    position: absolute;
    inset: 0;
  }
</style>
