<script lang="ts">
  import { onMount } from 'svelte'
  import type { Api } from '../api/api.ts'
  import { Action, Notice, Sheet } from '../ui/ui.ts'
  import type { GameRef, Waiting } from '../wire/wire.ts'
  import { type Lang, WORDS, wordsIn } from '../words/words.ts'
  import { routeHash } from './route.ts'

  // The changes that wait for someone to approve them: one row for each, and nothing else to decide here.
  interface Props {
    api: Api
    game: GameRef
    lang: Lang
    onsignedout: () => void
    onback: () => void
  }
  let { api, game, lang, onsignedout, onback }: Props = $props()

  let rows = $state.raw<readonly Waiting[] | undefined>(undefined)
  let problem = $state(false)

  async function load(): Promise<void> {
    rows = undefined
    problem = false
    const answer = await api.waiting(game)
    if (answer.ok) rows = answer.value
    else if (answer.problem === 'signed-out') onsignedout()
    else problem = true
  }
  onMount(() => void load())
  const notNow = $derived(wordsIn(lang).check.notNow as string)
</script>

<div class="scrim dim-2">
<Sheet title={WORDS.waitingTitle} close={notNow} onclose={onback} side>
  {#if problem}
    <Notice kind="problem" text={WORDS.cantReach} />
    <div><Action label={WORDS.tryAgain} icon="arrow-clockwise" kind="main" onpress={() => void load()} /></div>
  {:else if rows === undefined}
    <p>{WORDS.loading}</p>
  {:else if rows.length === 0}
    <p>{WORDS.waitingNone}</p>
  {:else}
    <ul class="rows">
      {#each rows as row (row.number)}
        <li>
          <a class="row" href={routeHash({ screen: 'level', owner: game.owner, name: game.name, sheet: { kind: 'change', number: row.number } })}>
            <span class="title">{row.title}</span>
            <span class="by">{row.mine ? WORDS.waitingMine : WORDS.waitingBy(row.by)}</span>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</Sheet>
</div>

<style>
  .scrim {
    position: absolute;
    inset: 0;
    z-index: 30;
  }
  /* A side sheet starts below the top bar, so it is cut to the room under it: one that is taller would be scrolled into
     view, and the whole page with it. */
  @media (min-width: 501px) {
    .scrim :global(.sheet) {
      max-height: calc(100% - var(--bar) - 28px);
    }
  }
  .rows {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .row {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 56px;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--line);
    border-radius: 12px;
    background: transparent;
    color: var(--words);
    text-decoration: none;
    overflow-wrap: anywhere;
  }
  .title {
    font-weight: 600;
  }
  .row:hover {
    background: var(--hover);
  }
  .by {
    color: var(--g-quiet);
  }
</style>
