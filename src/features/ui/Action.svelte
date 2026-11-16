<script lang="ts">
  // A button on the editors' look: the one thing a card most wants pressed is `main` (accent, at least 48 tall), the
  // rest are plain (at least 44). It is a real button, so Enter and Space press it and a screen reader names it.
  import Icon from './Icon.svelte'
  import type { IconName } from './icons.ts'

  interface Props {
    label: string
    icon?: IconName
    kind?: 'main' | 'plain'
    disabled?: boolean
    onpress: () => void
  }
  let { label, icon, kind = 'plain', disabled = false, onpress }: Props = $props()
</script>

<button type="button" class="action {kind}" {disabled} onclick={() => onpress()}>
  {#if icon}<Icon name={icon} />{/if}<span>{label}</span>
</button>

<style>
  .action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-width: 44px;
    min-height: 44px;
    max-width: 100%;
    padding: 0 16px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--raised);
    color: var(--words);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    touch-action: manipulation;
  }
  .action:hover {
    background: var(--hover);
  }
  .action.main {
    min-height: 48px;
    border-color: transparent;
    background: var(--accent);
    color: var(--on-accent);
  }
  .action.main:hover {
    background: var(--accent);
    filter: brightness(1.08);
  }
  .action:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .action:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
</style>
