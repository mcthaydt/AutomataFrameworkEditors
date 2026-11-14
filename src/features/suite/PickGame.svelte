<script lang="ts">
  import { onMount } from 'svelte'
  import type { Api } from '../api/api.ts'
  import { recentGames } from '../game/game.ts'
  import { Button, Notice, Screen } from '../ui/ui.ts'
  import { WORDS } from '../words/words.ts'
  import type { GameRef } from '../wire/wire.ts'
  import AddEditor from './AddEditor.svelte'
  import { routeHash } from './route.ts'

  // The list of games: the ones GitHub says the person can reach with the editor added, and the ones this device has
  // opened, once each.
  interface Props {
    api: Api
    remembered: Storage
    onadd: () => void
    /** Told how many games the list holds, once it is known. */
    ongames: (count: number) => void
    /** True when GitHub has just sent the person back from adding the editor. */
    justAdded: boolean
    onsignedout: () => void
  }
  let { api, remembered, onadd, ongames, justAdded, onsignedout }: Props = $props()

  let games = $state<readonly GameRef[] | undefined>(undefined)
  let trouble = $state(false)
  let filter = $state('')

  async function load(): Promise<void> {
    trouble = false
    const answer = await api.games()
    if (!answer.ok) {
      if (answer.problem === 'signed-out') return onsignedout()
      // The list of games on this device is still worth showing.
      trouble = true
    }
    const found = answer.ok ? answer.value : []
    const all = [...found]
    for (const game of recentGames(remembered)) {
      if (!all.some((g) => g.owner.toLowerCase() === game.owner.toLowerCase() && g.name.toLowerCase() === game.name.toLowerCase())) {
        all.push(game)
      }
    }
    games = all
    // A list that could not be fetched and has nothing on this device says nothing about whether there are games.
    if (!(trouble && all.length === 0)) ongames(all.length)
    // Back from adding the editor to exactly one game: open it, nothing more to choose.
    const only = all[0]
    if (justAdded && all.length === 1 && only !== undefined) {
      location.hash = routeHash({ screen: 'game', owner: only.owner, name: only.name })
    }
  }
  onMount(() => void load())

  const shown = $derived(
    (games ?? []).filter((g) => `${g.name} ${g.owner}`.toLowerCase().includes(filter.trim().toLowerCase())),
  )
</script>

<Screen title={WORDS.pickTitle}>
  {#if games === undefined}
    <p>{WORDS.loading}</p>
  {:else}
    {#if trouble}
      <Notice kind="problem" text={WORDS.cantReach} />
      <!-- Not being able to ask GitHub is not "you have no games": the way on is to try again. -->
      <div><Button label={WORDS.tryAgain} kind={games.length === 0 ? 'primary' : 'plain'} onpress={() => void load()} /></div>
    {/if}
    {#if games.length === 0}
      {#if !trouble}<AddEditor {onadd} />{/if}
    {:else}
      <label class="find">
        <span>{WORDS.pickFind}</span>
        <input type="search" bind:value={filter} autocomplete="off" />
      </label>
      {#if shown.length === 0}
        <p>{WORDS.pickNoMatch}</p>
      {:else}
        <ul class="games">
          {#each shown as game (`${game.owner}/${game.name}`)}
            <li>
              <a class="row" href={routeHash({ screen: 'game', owner: game.owner, name: game.name })}>
                <span class="name">{game.name}</span>
                <span class="owner">{game.owner}</span>
              </a>
            </li>
          {/each}
        </ul>
      {/if}
      <div><Button label={WORDS.pickAdd} onpress={onadd} /></div>
    {/if}
  {/if}
</Screen>

<style>
  .find {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }
  input {
    min-height: 48px;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--words);
    border-radius: var(--corner);
    background: var(--raised);
    color: var(--words);
    font: inherit;
  }
  .games {
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
    border: 1px solid var(--words);
    border-radius: var(--corner);
    background: var(--raised);
    color: var(--words);
    text-decoration: none;
    overflow-wrap: anywhere;
  }
  .name {
    font-weight: 600;
  }
  .owner {
    color: var(--quiet);
    font-size: var(--font-size);
  }
</style>
