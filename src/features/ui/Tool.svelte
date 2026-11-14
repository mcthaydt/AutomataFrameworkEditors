<script lang="ts">
  import type { IconName } from './icons.ts'
  import Icon from './Icon.svelte'

  // A tool that floats over the stage: an icon with its word under it, at least 56 px each way so a finger finds it
  // without looking. A real <button>, so the keyboard and a screen reader treat it as one.
  interface Props {
    label: string
    icon: IconName
    disabled?: boolean
    onpress: () => void
  }
  let { label, icon, disabled = false, onpress }: Props = $props()
</script>

<button type="button" class="tool" {disabled} onclick={() => onpress()}>
  <span class="glyph"><Icon name={icon} /></span>
  <span class="label">{label}</span>
</button>

<style>
  .tool {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-1);
    min-width: 56px;
    min-height: 56px;
    max-width: 100%;
    padding: var(--space-1) var(--space-2);
    border: 1px solid var(--words);
    border-radius: var(--corner);
    background: var(--raised);
    box-shadow: var(--float-shadow);
    color: var(--touch);
    font: inherit;
    cursor: pointer;
    touch-action: manipulation;
  }
  /* The icon is 24 px whatever the type size around it. */
  .glyph {
    display: inline-flex;
    line-height: 1;
  }
  .glyph :global(.icon) {
    width: 24px;
    height: 24px;
  }
  .label {
    text-align: center;
    overflow-wrap: anywhere;
  }
  .tool:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
