<script lang="ts">
  // Type a number, or press less and more. The field is a real text box with a number keyboard, so a Pencil's
  // handwriting goes into it by itself. A value past a limit stops at the limit, and one off the step moves to it.
  import { type Lang, wordsIn } from '../words/words.ts'
  import { snap } from './slider.ts'

  interface Props {
    value: number
    least: number
    most: number
    step: number
    onchange: (value: number) => void
    onclose: () => void
    /** The person's language; English until the shell says. */
    lang?: Lang
  }
  let { value, least, most, step, onchange, onclose, lang = 'en' }: Props = $props()

  const words = $derived(wordsIn(lang).shell)
  const say = (row: string | ((...parts: readonly (string | number)[]) => string)): string =>
    typeof row === 'string' ? row : row()

  // The pad is opened on one number and keeps its own copy while it is open, so the first values are what is wanted.
  // svelte-ignore state_referenced_locally
  let current = $state(snap(value, least, most, step))
  // svelte-ignore state_referenced_locally
  let text = $state(String(snap(value, least, most, step)))

  function set(next: number): void {
    current = snap(next, least, most, step)
    text = String(current)
    onchange(current)
  }

  function commit(): void {
    const typed = Number(text.replace(',', '.'))
    if (text.trim() === '' || !Number.isFinite(typed)) text = String(current)
    else set(typed)
  }
</script>

<div class="numpad" role="group">
  <input
    class="field"
    inputmode="decimal"
    autocomplete="off"
    aria-label={say(words.typeANumber)}
    bind:value={text}
    onblur={commit}
    onkeydown={(event) => {
      if (event.key === 'Enter') commit()
    }}
  />
  <div class="keys">
    <button type="button" data-step="down" aria-label={say(words.less)} onclick={() => set(current - step)}>−</button>
    <button type="button" data-step="up" aria-label={say(words.more)} onclick={() => set(current + step)}>+</button>
    <button
      type="button"
      class="done"
      onclick={() => {
        commit()
        onclose()
      }}
    >
      {say(words.done)}
    </button>
  </div>
</div>

<style>
  .numpad {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 264px;
    max-width: 100%;
    padding: 12px;
    border-radius: 14px;
    border: 1px solid var(--g-edge);
    background: var(--s-bg);
    -webkit-backdrop-filter: var(--s-filter);
    backdrop-filter: var(--s-filter);
    box-shadow: var(--g-shine), var(--shadow);
    color: var(--words);
  }
  .field {
    height: 48px;
    padding: 0 12px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--raised);
    color: var(--words);
    font: 500 26px var(--measure);
  }
  .keys {
    display: grid;
    grid-template-columns: 1fr 1fr 2fr;
    gap: 6px;
  }
  button {
    min-height: 48px;
    border: 0;
    border-radius: 8px;
    background: var(--raised);
    color: var(--words);
    font: 500 20px var(--measure);
    cursor: pointer;
  }
  .done {
    background: var(--accent);
    color: var(--on-accent);
    font: 600 15px var(--label);
  }
</style>
