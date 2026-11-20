<script lang="ts">
  // What a hovering Pencil (or a mouse) shows before it touches: the faint thing a tap would put down, the brush's
  // outline on the tile it would paint, and a light on the thing a tap would pick. It only draws, and nothing it draws
  // can be touched.
  import type { Characters } from './edit.ts'
  import { ghostBox } from './float.ts'
  import type { Mark, Rect } from './marks.ts'
  import type { Point } from './place.ts'
  import type { Tool } from '../shell/shell.ts'
  import { START } from './tray.ts'
  import { type Camera, type Screen, toScreen, toTiles } from './view.ts'

  interface Props {
    tool: Tool
    /** Where the tip is, in the stage's pixels; undefined when it is not over the stage. */
    at: Point | undefined
    camera: Camera
    size: Screen
    characters: Characters
    hero: string
    placing: string | undefined
    marks: readonly Mark[]
  }
  let { tool, at, camera, size, characters, hero, placing, marks }: Props = $props()

  const box = $derived.by((): { kind: 'place' | 'paint' | 'pick'; rect: Rect } | undefined => {
    if (at === undefined) return undefined
    const tiles = toTiles(camera, size, at)
    if (tool === 'place' && placing !== undefined) {
      const c = placing === START ? hero : placing
      return { kind: 'place', rect: ghostBox(camera, size, tiles, characters[c]?.size ?? { w: 1, h: 1 }) }
    }
    if (tool === 'paint' || tool === 'erase') {
      const corner = toScreen(camera, size, { x: Math.floor(tiles.x), y: Math.floor(tiles.y) })
      return { kind: 'paint', rect: { x: corner.x, y: corner.y, w: camera.scale, h: camera.scale } }
    }
    if (tool === 'pick') {
      const under = marks.find((m) => m.hit.x <= at.x && at.x <= m.hit.x + m.hit.w && m.hit.y <= at.y && at.y <= m.hit.y + m.hit.h)
      return under === undefined ? undefined : { kind: 'pick', rect: under.box }
    }
    return undefined
  })
</script>

{#if box !== undefined}
  <div
    class="hover {box.kind}"
    data-hover={box.kind}
    style:left="{box.rect.x}px"
    style:top="{box.rect.y}px"
    style:width="{box.rect.w}px"
    style:height="{box.rect.h}px"
  ></div>
{/if}

<style>
  .hover {
    position: absolute;
    box-sizing: border-box;
    border-radius: 3px;
    pointer-events: none;
  }
  .place {
    border: 2px solid var(--accent);
    background: color-mix(in srgb, var(--bright) 18%, transparent);
  }
  .paint {
    border: 2px solid var(--bright);
    box-shadow: 0 0 0 1px var(--words);
  }
  .pick {
    border: 2px solid var(--accent);
    box-shadow: 0 0 10px 2px var(--accent);
  }
</style>
