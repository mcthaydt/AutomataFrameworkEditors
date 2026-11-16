<script lang="ts">
  // An on and off switch. It is drawn small and has a finger-sized hit area; its name is for a screen reader.
  interface Props {
    on: boolean
    label: string
    onchange: (on: boolean) => void
  }
  let { on, label, onchange }: Props = $props()
</script>

<button type="button" role="switch" class="knob" class:on aria-checked={on} aria-label={label} onclick={() => onchange(!on)}>
  <span class="track"><span class="dot"></span></span>
</button>

<style>
  .knob {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
  }
  .track {
    display: block;
    width: 40px;
    height: 24px;
    padding: 2px;
    border-radius: 12px;
    background: var(--hover);
    transition: background 0.15s;
  }
  .dot {
    display: block;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--quiet);
    transition: transform 0.15s;
  }
  .on .track {
    background: var(--accent);
  }
  .on .dot {
    background: var(--on-accent);
    transform: translateX(16px);
  }
</style>
