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
    onchange: (value: number) => void
  }
  let { value, least, most, step, label, onchange }: Props = $props()

  function moved(event: Event): void {
    const input = event.currentTarget as HTMLInputElement
    const next = snap(Number(input.value), least, most, step)
    input.value = String(next)
    onchange(next)
  }
</script>

<label class="slider">
  <span class="line">
    <span class="name">{label}</span>
    <span class="num">{value}</span>
  </span>
  <input type="range" min={least} max={most} {step} {value} oninput={moved} />
</label>

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
  input {
    width: 100%;
    height: 44px;
    margin: 0;
    accent-color: var(--accent);
    touch-action: pan-y;
    cursor: pointer;
  }
</style>
