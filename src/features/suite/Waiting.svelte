<script lang="ts">
  import { onMount } from 'svelte'
  import type { Api } from '../api/api.ts'
  import { Button, Notice, Screen } from '../ui/ui.ts'
  import type { GameRef, Waiting } from '../wire/wire.ts'
  import { WORDS } from '../words/words.ts'
  import { routeHash } from './route.ts'

  // The changes that wait for someone to approve them: one row for each, and nothing else to decide here.
  interface Props {
    api: Api
    game: GameRef
    onsignedout: () => void
    onback: () => void
  }
  let { api, game, onsignedout, onback }: Props = $props()

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
  const back = $derived({ label: WORDS.back, onpress: onback })
</script>

<Screen title={WORDS.waitingTitle} {back}>
  {#if problem}
    <Notice kind="problem" text={WORDS.cantReach} />
    <div><Button label={WORDS.tryAgain} kind="primary" onpress={() => void load()} /></div>
  {:else if rows === undefined}
    <p>{WORDS.loading}</p>
  {:else if rows.length === 0}
    <p>{WORDS.waitingNone}</p>
  {:else}
    <ul class="rows">
      {#each rows as row (row.number)}
        <li>
          <a class="row" href={routeHash({ screen: 'change', owner: game.owner, name: game.name, number: row.number })}>
            <span class="title">{row.title}</span>
            <span class="by">{row.mine ? WORDS.waitingMine : WORDS.waitingBy(row.by)}</span>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</Screen>

<style>
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
    border: 2px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--fg);
    text-decoration: none;
    overflow-wrap: anywhere;
  }
  .title {
    font-weight: 600;
  }
  .by {
    color: var(--muted);
  }
</style>
