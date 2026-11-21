<script lang="ts">
  // What the game's own check found, under the top bar's "N problems": the framework's sentence for each, and "Show me",
  // which opens the level or the map at it. It closes on Escape and on a press outside it.
  import { onMount } from 'svelte'
  import type { Problem } from '../game/game.ts'
  import { Action } from '../ui/ui.ts'
  import { type Lang, type Row, wordsIn } from '../words/words.ts'

  interface Props {
    lang: Lang
    problems: readonly Problem[]
    onshow: (at: number) => void
    onclose: () => void
  }
  let { lang, problems, onshow, onclose }: Props = $props()

  const words = $derived(wordsIn(lang))
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row

  let pop: HTMLElement | undefined = $state()
  onMount(() => pop?.focus())
  function keys(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return
    event.stopPropagation()
    onclose()
  }
</script>

<svelte:window onkeydown={keys} />
<button type="button" class="dim" tabindex="-1" aria-label={text(words.shell.close)} onclick={onclose}></button>
<div class="pop glass-2" role="dialog" aria-modal="true" aria-label={text(words.kept.problemsTitle)} tabindex="-1" bind:this={pop}>
  <h2>{problems.length === 0 ? text(words.kept.problemsNone) : text(words.bar.problems, problems.length)}</h2>
  <ul>
    {#each problems as problem, at (`${problem.file}:${problem.words}`)}
      <li>
        <span>{problem.words}</span>
        <Action label={text(words.changes.showMe)} onpress={() => onshow(at)} />
      </li>
    {/each}
  </ul>
</div>

<style>
  .dim {
    position: absolute;
    inset: 0;
    z-index: 39;
    border: 0;
    background: transparent;
    cursor: default;
  }
  .pop {
    position: absolute;
    top: calc(var(--bar) + 20px);
    right: 12px;
    z-index: 40;
    width: min(420px, calc(100% - 24px));
    max-height: calc(100% - var(--bar) - 40px);
    overflow-y: auto;
    padding: 12px 16px;
    border-radius: 14px;
    color: var(--words);
    outline: none;
  }
  h2 {
    margin: 0 0 4px;
    color: var(--g-quiet);
    font: 600 14px / 1.2 var(--label);
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 0;
  }
  li + li {
    border-top: 1px solid var(--line);
  }
  span {
    overflow-wrap: anywhere;
  }
</style>
