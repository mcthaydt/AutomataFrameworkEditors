<script lang="ts">
  import type { Snippet } from 'svelte'
  import Button from './Button.svelte'

  // One screen: one <h1>, which takes the focus when the screen appears so a screen reader and a keyboard start at
  // the top. `back` is the way out, always the first thing after the title.
  interface Props {
    title: string
    back?: { label: string; onpress: () => void }
    children: Snippet
  }
  let { title, back, children }: Props = $props()
  let heading: HTMLHeadingElement | undefined = $state()
  $effect(() => heading?.focus())
</script>

<main class="screen">
  <header>
    <h1 tabindex="-1" bind:this={heading}>{title}</h1>
    {#if back}<Button label={back.label} onpress={back.onpress} />{/if}
  </header>
  {@render children()}
</main>

<style>
  .screen {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    width: 100%;
    max-width: 48rem;
    margin: 0 auto;
    padding: var(--space-3);
  }
  header {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-3);
    align-items: center;
    justify-content: space-between;
  }
  h1 {
    margin: 0;
    font-size: var(--font-size-big);
    overflow-wrap: anywhere;
  }
  h1:focus {
    outline: none;
  }
</style>
