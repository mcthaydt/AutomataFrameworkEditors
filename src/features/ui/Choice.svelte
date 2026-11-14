<script lang="ts">
  // One choice out of a few, as a real radio group: a finger taps a row, and the arrow keys move the choice. Each row
  // is at least 48 px tall and says what it means under its name.
  interface Option {
    readonly value: string
    readonly label: string
    readonly hint?: string
  }
  interface Props {
    label: string
    options: readonly Option[]
    value: string
    onchange: (value: string) => void
  }
  let { label, options, value, onchange }: Props = $props()
  // One group name for each choice on the page, so two of them never share the arrow keys.
  const group = `choice-${Math.random().toString(36).slice(2, 10)}`
</script>

<div class="choice" role="radiogroup" aria-label={label}>
  <span class="label">{label}</span>
  {#each options as option (option.value)}
    <label class="row" class:on={option.value === value}>
      <input
        type="radio"
        name={group}
        value={option.value}
        checked={option.value === value}
        onchange={() => onchange(option.value)}
      />
      <span class="words">
        <span class="name">{option.label}</span>
        {#if option.hint !== undefined}<span class="hint">{option.hint}</span>{/if}
      </span>
    </label>
  {/each}
</div>

<style>
  .choice {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }
  .label {
    font-weight: 600;
  }
  .row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-height: 48px;
    padding: var(--space-2) var(--space-3);
    border: 2px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    cursor: pointer;
  }
  .on {
    border-color: var(--primary);
  }
  input {
    flex: none;
    width: 24px;
    height: 24px;
    margin: 0;
  }
  .words {
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .name {
    font-weight: 600;
  }
  .hint {
    color: var(--muted);
  }
</style>
