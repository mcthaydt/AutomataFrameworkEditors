<script lang="ts">
  // A number you slide. A real range input, so the arrow keys, Home, End and a screen reader work as they do
  // everywhere; whatever it says is held inside its limits and on its step again here, so the value an editor receives
  // is always one it can keep. Its number sits at the right of its label.
  import { snap } from './slider.ts'

  interface Props {
    value: number
    least: number
    most: number
    step: number
    label: string
    /** Said in place of the number when several things hold different ones. */
    mixed?: string | undefined
    onchange: (value: number) => void
    /** A tap on the number: the page opens its number pad. Without it, the number is only read. */
    onnumber?: (() => void) | undefined
  }
  let { value, least, most, step, label, mixed, onchange, onnumber }: Props = $props()

  function moved(event: Event): void {
    const input = event.currentTarget as HTMLInputElement
    const next = snap(Number(input.value), least, most, step)
    input.value = String(next)
    onchange(next)
  }
</script>

<div class="slider">
  <span class="line">
    <span class="name">{label}</span>
    {#if onnumber !== undefined}
      <button type="button" class="num" aria-label="{label}: {mixed ?? value}" onclick={onnumber}>{mixed ?? value}</button>
    {:else}
      <span class="num">{mixed ?? value}</span>
    {/if}
  </span>
  <input type="range" aria-label={label} min={least} max={most} {step} value={mixed === undefined ? value : least} oninput={moved} />
</div>

<style>
  .slider {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .line {
    display: flex;
    justify-content: space-between;
    color: var(--quiet);
  }
  .num {
    font-family: var(--measure);
    color: var(--words);
  }
  button.num {
    min-width: 44px;
    min-height: 44px;
    padding: 0 8px;
    border: 0;
    border-radius: 8px;
    background: var(--raised);
    font-size: inherit;
    cursor: pointer;
  }
  input {
    width: 100%;
    height: 44px;
    margin: 0;
    accent-color: var(--accent);
    touch-action: pan-y;
    cursor: pointer;
  }
</style>
