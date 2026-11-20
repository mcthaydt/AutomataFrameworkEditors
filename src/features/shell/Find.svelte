<script lang="ts">
  // One box that finds anything: things, levels, settings and what can be done. Enter takes the first, the arrows walk the
  // list, and Escape puts it away. It says which of the open level's things match, so the list behind can show only those.
  import type { GameContent } from '@automataframework/framework/headless'
  import { onMount, tick } from 'svelte'
  import type { Working } from '../game/game.ts'
  import { Icon, type IconName, Sheet } from '../ui/ui.ts'
  import { type Lang, type Row, wordsIn } from '../words/words.ts'
  import { type Found, find, parseGo } from './find.ts'
  import { KEYS } from './keys.ts'

  interface Props {
    lang: Lang
    working: Working
    content: GameContent
    /** The level that is open, whose things come first. */
    open: string | undefined
    /** What was pressed: its `go`, to be read with `parseGo`. */
    onpick: (found: Found) => void
    onclose: () => void
    /** The things of the open level that match, or undefined while nothing is typed. */
    onfilter?: ((ids: readonly string[] | undefined) => void) | undefined
  }
  let { lang, working, content, open, onpick, onclose, onfilter }: Props = $props()

  const words = $derived(wordsIn(lang))
  const h = $derived(words.helper)
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row

  const ICON: Readonly<Record<Found['kind'], IconName>> = {
    thing: 'cursor',
    level: 'map-trifold',
    value: 'sliders-horizontal',
    command: 'sparkle',
    file: 'clipboard-text',
  }

  let query = $state('')
  let box: HTMLInputElement | undefined = $state()
  let list: HTMLUListElement | undefined = $state()
  const found = $derived(find(query, working, content, KEYS, words, open))

  $effect(() => {
    const here = found.flatMap((one) => {
      const go = parseGo(one.go)
      return one.kind === 'thing' && go?.kind === 'thing' && go.level === open ? [go.thing] : []
    })
    onfilter?.(query.trim() === '' ? undefined : here)
  })
  onMount(() => {
    void tick().then(() => box?.focus())
    return () => onfilter?.(undefined)
  })

  function move(from: Element | null, by: 1 | -1): void {
    const rows = [...(list?.querySelectorAll<HTMLButtonElement>('button') ?? [])]
    const at = from === null ? -1 : rows.indexOf(from as HTMLButtonElement)
    if (by === -1 && at <= 0) return box?.focus()
    rows[Math.min(rows.length - 1, at + by)]?.focus()
  }
  function keys(e: KeyboardEvent): void {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      move(e.target === box ? null : (e.target as Element), e.key === 'ArrowDown' ? 1 : -1)
    } else if (e.key === 'Enter' && e.target === box && found[0] !== undefined) {
      e.preventDefault()
      onpick(found[0])
    }
  }
</script>

<div class="scrim">
  <Sheet title={text(h.findTitle)} close={text(words.shell.close)} {onclose}>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div onkeydown={keys}>
      <div class="field">
        <Icon name="magnifying-glass" />
        <input
          bind:this={box}
          bind:value={query}
          type="search"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          aria-label={text(h.findPlaceholder)}
          placeholder={text(h.findPlaceholder)}
        />
      </div>
      {#if found.length > 0}
        <ul bind:this={list}>
          {#each found as one (one.go + one.words)}
            <li>
              <button type="button" onclick={() => onpick(one)}>
                <Icon name={ICON[one.kind]} />
                <span class="said"><b>{one.words}</b><small>{one.hint}</small></span>
                {#if one.key !== undefined}<kbd>{one.key}</kbd>{/if}
              </button>
            </li>
          {/each}
        </ul>
      {:else if query.trim() !== ''}
        <p class="quiet" role="status">{text(h.findNone)}</p>
      {/if}
    </div>
  </Sheet>
</div>

<style>
  .scrim {
    position: absolute;
    inset: 0;
    z-index: 30;
    background: var(--dim);
  }
  .field {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 8px;
    padding: 0 10px;
    border: 1px solid var(--line);
    border-radius: 10px;
  }
  input {
    flex: 1;
    min-width: 0;
    min-height: 48px;
    border: 0;
    background: transparent;
    color: var(--words);
    font: inherit;
    outline: none;
  }
  ul {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  button {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 48px;
    padding: 4px 8px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: var(--words);
    font: inherit;
    text-align: start;
    cursor: pointer;
  }
  button:hover,
  button:focus-visible {
    background: var(--hover);
  }
  .said {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  small,
  .quiet {
    color: var(--g-quiet);
  }
  small {
    font-size: 13px;
  }
  kbd {
    flex: none;
    color: var(--g-quiet);
    font: inherit;
    font-size: 13px;
  }
  .quiet {
    margin: 8px 0;
  }
</style>
