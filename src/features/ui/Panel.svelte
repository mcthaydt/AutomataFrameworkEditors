<script lang="ts">
  import type { Snippet } from 'svelte'

  // The floating panel every screen's tools, notes and cards sit in: the raised color at 94% over the level, a little
  // blur behind it, a thin edge of the words color at 35%, and the one shadow. `edge="mark"` is the one other edge, for
  // a panel that asks for care. Nothing else floats, and nothing else has a fill like this, so the look is in one place.
  interface Props {
    /** Which part of the screen this is (`tools`, `card`, ...), for a test or a script to find it by. */
    part: string
    edge?: 'mark'
    children: Snippet
  }
  let { part, edge, children }: Props = $props()
</script>

<div class="panel" class:mark={edge === 'mark'} data-panel data-part={part}>
  {@render children()}
</div>

<style>
  .panel {
    border: 1px solid color-mix(in srgb, var(--words) 35%, transparent);
    border-radius: var(--corner);
    background: color-mix(in srgb, var(--raised) 94%, transparent);
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
    box-shadow: var(--float-shadow);
    animation: arrive 200ms ease-out;
  }
  /* The mark edge is as much as mark can be seen against: on the ground, and 2 px. */
  .mark {
    border: 2px solid var(--mark);
  }
  /* A plain fade, which is also what reduced motion gets: the same length, nothing moves. */
  @keyframes arrive {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
