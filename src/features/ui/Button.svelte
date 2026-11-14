<script lang="ts">
  // A real <button>: Enter and Space press it, a screen reader names it, and it is never smaller than a finger.
  // `primary` is the one thing a screen most wants pressed (at least 48 px tall); the others are at least 44.
  interface Props {
    label: string
    kind?: 'primary' | 'plain' | 'danger'
    disabled?: boolean
    onpress: () => void
  }
  let { label, kind = 'plain', disabled = false, onpress }: Props = $props()
</script>

<button type="button" class="button {kind}" {disabled} onclick={() => onpress()}>{label}</button>

<style>
  .button {
    min-width: 44px;
    min-height: 44px;
    max-width: 100%;
    padding: var(--space-2) var(--space-3);
    border: 2px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--fg);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    /* A long label wraps inside its box instead of running off the side. */
    white-space: normal;
    overflow-wrap: anywhere;
    touch-action: manipulation;
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
