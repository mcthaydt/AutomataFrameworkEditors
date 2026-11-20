<script lang="ts">
  // What changed in the game: the saved changes, ten a page, newest first, each with who, what, where and when, and
  // "Show me", which opens it. "Show more" asks for the next ten, up to five pages.
  import { onMount } from 'svelte'
  import type { Api } from '../api/api.ts'
  import type { OpenGame } from '../game/game.ts'
  import { Face } from '../shell/shell.ts'
  import { Action, Sheet } from '../ui/ui.ts'
  import type { HistoryLine } from '../wire/wire.ts'
  import { type Lang, type Row, wordsIn } from '../words/words.ts'
  import { openingOf, whenWords, whereWords } from './history.ts'

  interface Props {
    lang: Lang
    api: Api
    game: OpenGame
    /** The clock, so a time is said from one moment. */
    now?: () => number
    onsignedout: () => void
    onclose: () => void
    /** "Show me": the level or the map the change touched. */
    onshow: (opening: { level: string } | { map: true }) => void
  }
  let { lang, api, game, now = Date.now, onsignedout, onclose, onshow }: Props = $props()

  const PAGES = 5
  const words = $derived(wordsIn(lang))
  const t = $derived(words.team)
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row

  let lines = $state.raw<readonly HistoryLine[]>([])
  let page = $state(0)
  let more = $state(false)
  let loading = $state(true)
  let trouble = $state<string | undefined>(undefined)

  async function ask(next: number): Promise<void> {
    loading = true
    trouble = undefined
    const answer = await api.history(game.ref, next)
    loading = false
    if (!answer.ok) {
      if (answer.problem === 'signed-out') return onsignedout()
      trouble = text(answer.problem === 'busy' ? t.busyFail : t.reachFail)
      return
    }
    lines = next === 0 ? answer.value.lines : [...lines, ...answer.value.lines]
    page = next
    more = answer.value.more && next + 1 < PAGES
  }
  onMount(() => void ask(0))
</script>

<div class="scrim dim-2">
  <Sheet title={text(t.historyTitle, game.content.project.name)} close={text(words.shell.close)} {onclose} side>
    <p class="quiet">{text(t.historyAbout)}</p>
    {#if lines.length > 0}
      <ul>
        {#each lines as line (line.commit)}
          {@const opening = openingOf(line)}
          <li>
            <Face login={line.by} size={36} />
            <span class="what">
              <b>{line.words}</b>
              <small>{line.by} · {whereWords(line, t)} · {whenWords(line.at, now(), lang)}</small>
            </span>
            {#if opening !== undefined}
              <Action label={text(t.historyShow)} icon="eye" onpress={() => onshow(opening)} />
            {/if}
          </li>
        {/each}
      </ul>
      {#if !more && !loading && trouble === undefined}<p class="quiet">{text(t.historyEnd)}</p>{/if}
    {:else if loading}
      <p role="status">{text(t.historyLoading)}</p>
    {:else if trouble === undefined}
      <p>{text(t.historyNone)}</p>
    {/if}
    {#if trouble !== undefined}
      <p class="bad" role="alert">{trouble}</p>
      <Action label={text(words.changes.again)} icon="arrow-clockwise" onpress={() => void ask(lines.length === 0 ? 0 : page + 1)} />
    {:else if more}
      <Action label={text(t.historyMore)} icon="caret-down" disabled={loading} onpress={() => void ask(page + 1)} />
    {/if}
  </Sheet>
</div>

<style>
  .scrim {
    position: absolute;
    inset: 0;
    z-index: 30;
  }
  p {
    margin: 0 0 12px;
  }
  .quiet,
  small {
    color: var(--g-quiet);
  }
  small {
    font-size: 13px;
  }
  .bad {
    color: var(--problem);
  }
  ul {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 0 0 12px;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 48px;
  }
  .what {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    overflow-wrap: anywhere;
  }
</style>
