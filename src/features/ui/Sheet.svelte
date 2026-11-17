<script lang="ts">
  // Something you read or decide in: soft glass, a heading, a way out, and its buttons at its foot. It closes on its
  // own button and on Escape, takes focus when it opens and gives it back to what opened it. On a phone it is a bottom
  // sheet. A sheet always has its way out in sight.
  import { onMount, type Snippet } from 'svelte'
  import Icon from './Icon.svelte'

  interface Props {
    title: string
    /** The word on the way out ("Close"). */
    close: string
    onclose: () => void
    children: Snippet
    /** The sheet's buttons, kept at its foot. */
    foot?: Snippet
    /** On a wide screen it sits at the right, where the settings panel is, and not in the middle. */
    side?: boolean
  }
  let { title, close, onclose, children, foot, side = false }: Props = $props()

  const headingId = $props.id()
  let sheet: HTMLElement | undefined
  // What had focus before the sheet opened, taken while the sheet is made.
  const opener = document.activeElement

  onMount(() => {
    sheet?.focus()
    return () => {
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus()
    }
  })

  function keys(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return
    event.stopPropagation()
    onclose()
  }
</script>

<svelte:window onkeydown={keys} />

<div class="sheet" class:side role="dialog" aria-modal="true" aria-labelledby={headingId} tabindex="-1" bind:this={sheet}>
  <header>
    <h2 id={headingId}>{title}</h2>
    <button type="button" class="out" data-close onclick={onclose}>
      <Icon name="x" />
      <span>{close}</span>
    </button>
  </header>
  <div class="body">{@render children()}</div>
  {#if foot}
    <footer>{@render foot()}</footer>
  {/if}
</div>

<style>
  .sheet {
    position: absolute;
    inset: 8px;
    margin: auto;
    width: min(560px, calc(100% - 16px));
    height: fit-content;
    max-height: calc(100% - 16px);
    display: flex;
    flex-direction: column;
    border-radius: 16px;
    border: 1px solid var(--g-edge);
    background: var(--s-bg);
    -webkit-backdrop-filter: var(--s-filter);
    backdrop-filter: var(--s-filter);
    box-shadow: var(--g-shine), var(--shadow);
    color: var(--words);
    outline: none;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 12px 4px 20px;
  }
  h2 {
    margin: 0;
    font: 600 22px / 1.2 var(--title);
  }
  .out {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 44px;
    min-height: 44px;
    padding: 0 12px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: var(--words);
    font: inherit;
    cursor: pointer;
  }
  .out:hover {
    background: var(--hover);
  }
  .body {
    padding: 8px 20px 16px;
    overflow: auto;
  }
  footer {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 20px 16px;
    border-top: 1px solid var(--line);
  }
  @media (min-width: 900px) {
    .sheet.side {
      inset: calc(var(--bar) + 20px) 8px 8px auto;
      margin: 0;
      width: min(400px, 36%);
    }
  }
  /* A phone: the sheet comes up from the bottom edge. */
  @media (max-width: 500px) {
    .sheet {
      inset: auto 0 0 0;
      width: 100%;
      border-radius: 16px 16px 0 0;
      padding-bottom: env(safe-area-inset-bottom);
    }
  }
</style>
