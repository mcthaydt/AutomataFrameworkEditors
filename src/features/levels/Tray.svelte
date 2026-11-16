<script lang="ts">
  // The things the game has that can be put in the level, each saying how many this level has. Tap one, then the level.
  // The same tray is the strip over the level while the Place tool is in hand and the second tab of the list.
  import type { Character } from '@automataframework/framework/headless'
  import { type Lang, nameOf, type Row, wordsIn } from '../words/words.ts'
  import { START } from './tray.ts'

  interface Props {
    lang: Lang
    characters: Readonly<Record<string, Character>>
    /** How many of each character this level has. */
    counts: Readonly<Record<string, number>>
    chosen: string | undefined
    onchoose: (id: string | undefined) => void
  }
  let { lang, characters, counts, chosen, onchoose }: Props = $props()

  const words = $derived(wordsIn(lang).levels)
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row
  const ids = $derived(Object.keys(characters).filter((id) => characters[id]?.moves === undefined))
</script>

<div class="tray" role="group" aria-label={text(words.trayLabel)}>
  <button
    type="button"
    class="one"
    aria-pressed={chosen === START}
    onclick={() => onchoose(chosen === START ? undefined : START)}
  >
    <span class="swatch start" aria-hidden="true"></span>
    <span class="name">{text(words.trayStart)}</span>
  </button>
  {#each ids as id (id)}
    <button
      type="button"
      class="one"
      data-character={id}
      aria-pressed={chosen === id}
      onclick={() => onchoose(chosen === id ? undefined : id)}
    >
      <span class="swatch" aria-hidden="true" style:background={characters[id]?.color}></span>
      <span class="name">{nameOf(id)}</span>
      <small>{text(words.trayCount, counts[id] ?? 0)}</small>
    </button>
  {/each}
  {#if chosen !== undefined}
    <p class="now" role="status">{text(words.trayNow, chosen === START ? text(words.trayStart) : nameOf(chosen))}</p>
  {/if}
</div>

<style>
  .tray {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 6px;
    color: var(--words);
  }
  .one {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 96px;
    min-height: 48px;
    padding: 4px 12px 4px 8px;
    border: 0;
    border-radius: 10px;
    background: var(--raised);
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .one:hover {
    background: var(--hover);
  }
  .one[aria-pressed='true'] {
    background: var(--picked);
    box-shadow: inset 0 0 0 2px var(--accent);
  }
  .swatch {
    flex: none;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    border: 1px solid var(--glass-edge);
  }
  .start {
    background: var(--agent);
  }
  .name {
    flex: 1;
  }
  small {
    color: var(--quiet);
    font-size: 12px;
  }
  .now {
    flex-basis: 100%;
    margin: 0;
    padding: 0 4px;
    color: var(--quiet);
    font-size: 14px;
  }
</style>
