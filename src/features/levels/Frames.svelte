<script lang="ts">
  // The part of the level each screen sees while the game is played: a frame round each player's start the size the
  // level's `view` says (and, dashed, the most the camera pulls back to), or round the whole level when it has none.
  import { type Level, levelSize } from '@automataframework/framework/headless'
  import type { Rect } from './marks.ts'
  import { type Camera, type Screen, toScreen } from './view.ts'

  interface Props {
    level: Level
    camera: Camera
    size: Screen
  }
  let { level, camera, size }: Props = $props()

  const world = $derived(levelSize(level))
  const around = (x: number, y: number, w: number, h: number): Rect => {
    // The camera never leaves the level, so neither does its frame.
    const left = Math.min(Math.max(0, x - w / 2), Math.max(0, world.w - w))
    const top = Math.min(Math.max(0, y - h / 2), Math.max(0, world.h - h))
    const corner = toScreen(camera, size, { x: left, y: top })
    return { x: corner.x, y: corner.y, w: Math.min(w, world.w) * camera.scale, h: Math.min(h, world.h) * camera.scale }
  }
  const frames = $derived.by((): readonly { key: string; rect: Rect; most: boolean }[] => {
    const view = level.view
    if (view === undefined) return [{ key: 'whole', rect: around(world.w / 2, world.h / 2, world.w, world.h), most: false }]
    return level.starts.flatMap((start) => [
      ...(view.most === undefined
        ? []
        : [{ key: `most-${start.player}`, rect: around(start.x, start.y, view.most.w, view.most.h), most: true }]),
      { key: `view-${start.player}`, rect: around(start.x, start.y, view.w, view.h), most: false },
    ])
  })
</script>

{#each frames as frame (frame.key)}
  <div
    class="frame"
    class:most={frame.most}
    data-frame={frame.key}
    style:left="{frame.rect.x}px"
    style:top="{frame.rect.y}px"
    style:width="{frame.rect.w}px"
    style:height="{frame.rect.h}px"
  ></div>
{/each}

<style>
  .frame {
    position: absolute;
    box-sizing: border-box;
    border: 2px solid var(--accent);
    border-radius: 3px;
    pointer-events: none;
  }
  .most {
    border-style: dashed;
    border-color: var(--faint);
  }
</style>
