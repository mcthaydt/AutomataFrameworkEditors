<script lang="ts">
  import type { IconName } from './icons.ts'
  import Icon from './Icon.svelte'

  // A tool that sits in a floating panel: an icon with its word under it, at least 56 px each way so a finger finds it
  // without looking. A real <button>, so the keyboard and a screen reader treat it as one. A tool that is on says so
  // with `aria-pressed` and a touch-colored fill, never by color alone.
  interface Props {
    label: string
    icon: IconName
    /** True when the tool is switched on; leave it out for a tool that is only pressed. */
    pressed?: boolean
    disabled?: boolean
    /** Names the tool in the page (`data-tool`), for a test or a script to find it by. */
    tool?: string
    onpress: () => void
  }
  let { label, icon, pressed, disabled = false, tool, onpress }: Props = $props()
</script>

<button
  type="button"
  class="tool"
  class:on={pressed === true}
  aria-pressed={pressed}
  data-tool={tool}
  {disabled}
  onclick={() => onpress()}
>
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
    border: 0;
    border-radius: var(--corner);
    background: transparent;
    color: var(--touch);
    font: inherit;
    cursor: pointer;
    touch-action: manipulation;
  }
  /* On: the touch color as a fill, with ground words (words on touch would be 1.5 to 1). */
  .on {
    background: var(--touch);
    color: var(--ground);
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
