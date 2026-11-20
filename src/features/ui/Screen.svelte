<script lang="ts">
  import type { Snippet } from 'svelte'
  import Button from './Button.svelte'

  // One screen: one <h1>, which takes the focus when the screen appears so a screen reader and a keyboard start at
  // the top. `back` is the way out, always the first thing after the title. With `glass` it is drawn in the editors'
  // look, as a glass card on their dark ground, so going from the editor to it is no jump from dark to white.
  interface Props {
    title: string
    back?: { label: string; onpress: () => void }
    glass?: boolean
    children: Snippet
  }
  let { title, back, glass = false, children }: Props = $props()
  let heading: HTMLHeadingElement | undefined = $state()
  $effect(() => heading?.focus())
</script>

{#snippet body()}
  <header>
    <h1 tabindex="-1" bind:this={heading}>{title}</h1>
    {#if back}<Button label={back.label} onpress={back.onpress} />{/if}
  </header>
  {@render children()}
{/snippet}

{#if glass}
  <main class="look plain">
    <section class="screen card glass-1">{@render body()}</section>
  </main>
{:else}
  <main class="screen">{@render body()}</main>
{/if}

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
  .plain {
    min-height: 100%;
    padding: 24px max(8px, env(safe-area-inset-right)) 24px max(8px, env(safe-area-inset-left));
  }
  .card {
    max-width: 520px;
    padding: 20px;
    border-radius: 16px;
  }
  .plain h1 {
    font: 600 26px / 1.2 var(--title);
  }
  h1:focus {
    outline: none;
  }
</style>
