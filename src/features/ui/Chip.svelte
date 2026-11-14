<script lang="ts">
  import type { Snippet } from 'svelte'

  // A few words that have to lie over the game's art (a name over a thing, a count over the level). The art is never
  // restyled and words never lie straight on it, so the words carry a ground of their own: the ground color, with a
  // thin edge of the words color.
  interface Props {
    children: Snippet
  }
  let { children }: Props = $props()
</script>

<span class="chip">{@render children()}</span>

<style>
  .chip {
    display: inline-block;
    max-width: 100%;
    padding: var(--space-1) var(--space-2);
    border: 1px solid var(--words);
    border-radius: var(--corner);
    background: var(--ground);
    color: var(--words);
    overflow-wrap: anywhere;
  }
</style>
