<script lang="ts">
  // Renaming changes the name the game's files use, so the card says so first, in plain words, and offers the way back.
  import { onMount, untrack } from 'svelte'
  import { type Lang, nameOf, type Row, wordsIn } from '../words/words.ts'

  interface Props {
    lang: Lang
    id: string
    onrename: (name: string) => void
    oncancel: () => void
  }
  let { lang, id, onrename, oncancel }: Props = $props()

  const words = $derived(wordsIn(lang))
  const text = (row: Row): string => (typeof row === 'string' ? row : row())
  let name = $state(untrack(() => nameOf(id)))
  let field: HTMLInputElement | undefined = $state()
  onMount(() => field?.select())

  function key(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.stopPropagation()
      oncancel()
    }
  }
</script>

<svelte:window onkeydown={key} />

<form
  class="card"
  aria-label={text(words.levels.menuRename)}
  onsubmit={(e) => {
    e.preventDefault()
    onrename(name)
  }}

>
  <p>{text(words.levels.renameCareful)}</p>
  <label>
    <span>{text(words.levels.renameName)}</span>
    <input bind:this={field} bind:value={name} autocomplete="off" autocapitalize="off" spellcheck="false" />
  </label>
  <div class="row">
    <button type="button" onclick={oncancel}>{text(words.shell.cancel)}</button>
    <button type="submit" class="go">{text(words.levels.renameDo)}</button>
  </div>
</form>

<style>
  .card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: min(360px, calc(100vw - 32px));
    padding: 14px;
    border-radius: 14px;
    border: 1px solid var(--glass-edge);
    background: var(--panel);
    box-shadow: var(--shadow);
    color: var(--words);
  }
  p {
    margin: 0;
    font-size: 14px;
    color: var(--quiet);
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  input {
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--ground);
    color: inherit;
    font: inherit;
  }
  .row {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  button {
    min-width: 48px;
    min-height: 48px;
    padding: 0 16px;
    border: 0;
    border-radius: 10px;
    background: var(--raised);
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
  .go {
    background: var(--accent);
    color: var(--on-accent);
  }
</style>
