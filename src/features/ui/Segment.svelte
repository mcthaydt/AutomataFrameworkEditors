<script lang="ts">
  // A few choices side by side, one picked. The picked one is the lightest and white, the rest are dim. Left and Right
  // move the pick (and it is made at once, as a person expects of a row of choices), and every choice is a finger wide.
  interface Props {
    /** What the choice is for, for a screen reader ("Zoom"). */
    label: string
    options: readonly { id: string; words: string }[]
    value: string
    onchange: (id: string) => void
  }
  let { label, options, value, onchange }: Props = $props()

  function keys(event: KeyboardEvent, at: number): void {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (step === 0) return
    event.preventDefault()
    const next = options[(at + step + options.length) % options.length]
    if (next === undefined) return
    onchange(next.id)
    const radios = (event.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLElement>('[role=radio]')
    radios?.[(at + step + options.length) % options.length]?.focus()
  }
</script>

<div class="segment" role="radiogroup" aria-label={label}>
  {#each options as option, at (option.id)}
    <button
      type="button"
      role="radio"
      class:on={option.id === value}
      aria-checked={option.id === value}
      tabindex={option.id === value ? 0 : -1}
      onclick={() => onchange(option.id)}
      onkeydown={(event) => keys(event, at)}
    >
      {option.words}
    </button>
  {/each}
</div>

<style>
  .segment {
    display: flex;
    gap: 2px;
    padding: 2px;
    border-radius: 10px;
    background: var(--raised);
  }
  button {
    flex: 1;
    min-width: 44px;
    min-height: var(--row);
    padding: 0 12px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--quiet);
    font: inherit;
    cursor: pointer;
  }
  button.on {
    background: var(--picked);
    color: var(--bright);
  }
</style>
