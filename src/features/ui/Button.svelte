<script lang="ts">
  import type { IconName } from './icons.ts'
  import Icon from './Icon.svelte'

  // A real <button>: Enter and Space press it, a screen reader names it, and it is never smaller than a finger.
  // `primary` is the one thing a screen most wants pressed (at least 48 px tall); the others are at least 44. An icon
  // goes before the words and is hidden from a screen reader, so the button is named by its words alone.
  interface Props {
    label: string
    kind?: 'primary' | 'plain' | 'danger'
    icon?: IconName
    disabled?: boolean
    onpress: () => void
  }
  let { label, kind = 'plain', icon, disabled = false, onpress }: Props = $props()
</script>

<button type="button" class="button {kind}" {disabled} onclick={() => onpress()}>
  {#if icon !== undefined}<Icon name={icon} />{/if}
  <span class="words">{label}</span>
</button>

<style>
  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    min-width: 44px;
    min-height: 44px;
    max-width: 100%;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--words);
    border-radius: var(--corner);
    background: var(--raised);
    color: var(--touch);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    touch-action: manipulation;
  }
  /* A long label wraps inside its box instead of running off the side. */
  .words {
    min-width: 0;
    white-space: normal;
    overflow-wrap: anywhere;
  }
  /* The one thing a screen most wants pressed: touch-coloured, with ground words (words on touch would be 1.5 to 1). */
  .primary {
    min-height: 48px;
    /* Tall by its own padding as well as by `min-height`, so no engine rounds it to a hair under 48. */
    padding-block: 12px;
    border-color: var(--touch);
    background: var(--touch);
    color: var(--ground);
  }
  /* Takes something away: a mark edge on the ground, which is as much as mark can be seen against. */
  .danger {
    border: 2px solid var(--mark);
    background: var(--ground);
    color: var(--touch);
  }
  .button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
