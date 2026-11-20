<script lang="ts">
  // A real <button>: Enter and Space press it, a screen reader names it, and it is never smaller than a finger.
  // `primary` is the one thing a screen most wants pressed (at least 48 px tall); the others are at least 44.
  import Icon from './Icon.svelte'
  import type { IconName } from './icons.ts'

  interface Props {
    label: string
    /** An icon before the label. The label stays: an icon is never the only way to tell what a button does. */
    icon?: IconName
    kind?: 'primary' | 'plain' | 'danger'
    disabled?: boolean
    onpress: () => void
  }
  let { label, icon, kind = 'plain', disabled = false, onpress }: Props = $props()
</script>

<button type="button" class="button {kind}" {disabled} onclick={() => onpress()}>
  {#if icon}<Icon name={icon} />{/if}{label}
</button>

<style>
  .button {
    min-width: 44px;
    min-height: 44px;
    max-width: 100%;
    padding: var(--space-2) var(--space-3);
    border: 2px solid var(--line);
    border-radius: var(--radius);
    background: var(--fill);
    color: var(--fg);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    /* A long label wraps inside its box instead of running off the side. */
    white-space: normal;
    overflow-wrap: anywhere;
    touch-action: manipulation;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
  }
  .primary {
    min-height: 48px;
    border-color: var(--primary);
    background: var(--primary);
    color: var(--primary-fg);
  }
  .danger {
    border-color: var(--danger);
    color: var(--danger);
    background: transparent;
  }
  .button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
