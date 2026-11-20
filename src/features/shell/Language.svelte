<script lang="ts">
  // The very first card, before the welcome: the language, with the one this device uses already chosen, so most
  // people only press "Go on". Every language is written in its own words with its flag, so someone who cannot read
  // the page can still find theirs. The page reads in the chosen language at once.
  import { onMount, untrack } from 'svelte'
  import { Action, Icon } from '../ui/ui.ts'
  import { LANGUAGE_NAMES, LANGUAGES, type Lang, type Row, wordsIn } from '../words/words.ts'

  interface Props {
    /** The language the card starts on: the device's own. */
    initial: Lang
    /** Told when a language is tapped, for a page that reads in it before "Go on". */
    onpick?: (lang: Lang) => void
    /** "Go on": this language is kept. */
    ongo: (lang: Lang) => void
  }
  let { initial, onpick, ongo }: Props = $props()

  let chosen = $state<Lang>(untrack(() => initial))
  const words = $derived(wordsIn(chosen))
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row
  /** A flag, drawn from its country's two letters. */
  const flagOf = (code: string): string =>
    String.fromCodePoint(...[...code.toUpperCase()].map((letter) => 0x1f1a5 + letter.charCodeAt(0)))
  const headingId = $props.id()
  let card: HTMLElement | undefined

  onMount(() => card?.focus())
  function choose(lang: Lang): void {
    chosen = lang
    onpick?.(lang)
  }
</script>

<div class="look cover" lang={chosen} data-size="wide" data-rows="touch">
  <div
    class="card glass-3"
    role="dialog"
    aria-modal="true"
    aria-labelledby={headingId}
    tabindex="-1"
    bind:this={card}
  >
    <h1 id={headingId}>{text(words.first.languageTitle)}</h1>
    <p>{text(words.first.languageHint)}</p>
    <div class="langs">
      {#each LANGUAGES as lang (lang)}
        {@const named = LANGUAGE_NAMES[lang]}
        <button
          type="button"
          class:on={lang === chosen}
          aria-pressed={lang === chosen}
          aria-label={text(wordsIn(lang).first.languageUse, named.name)}
          lang={lang}
          onclick={() => choose(lang)}
        >
          <span class="flag" aria-hidden="true">{flagOf(named.flag)}</span>
          <span class="name">{named.name}</span>
          {#if lang === chosen}<Icon name="check" />{/if}
        </button>
      {/each}
    </div>
    <div class="go"><Action kind="main" icon="arrow-right" label={text(words.first.languageGo)} onpress={() => ongo(chosen)} /></div>
  </div>
</div>

<style>
  .cover {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 16px;
    overflow: auto;
  }
  .card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: min(560px, 100%);
    padding: 24px;
    border: 1px solid var(--line);
    border-radius: 16px;
    outline: none;
  }
  h1 {
    margin: 0;
    font: 600 24px / 1.2 var(--title);
  }
  p {
    margin: 0;
    color: var(--quiet);
  }
  .langs {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 8px;
  }
  .langs button {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 48px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--raised);
    color: var(--words);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .langs button:hover {
    background: var(--hover);
  }
  .langs button.on {
    border-color: var(--accent);
    background: var(--picked);
    color: var(--bright);
  }
  .name {
    flex: 1;
  }
  .flag {
    font-size: 22px;
  }
  .go {
    display: flex;
    justify-content: flex-end;
  }
</style>
