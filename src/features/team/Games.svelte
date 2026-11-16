<script lang="ts">
  import { onMount } from 'svelte'
  import type { Api } from '../api/api.ts'
  import { recentGames } from '../game/game.ts'
  import { Icon } from '../ui/ui.ts'
  import type { GameRef } from '../wire/wire.ts'
  import { WORDS } from '../words/words.ts'
  import { routeHash } from './route.ts'

  // Your games: the ones GitHub says the person can reach with the editor added, and the ones this device has opened,
  // once each. The first screen after signing in, and where "Your games" in a game's menu goes.
  interface Props {
    api: Api
    remembered: Storage
    onadd: () => void
    onsignout: () => void
    /** Told how many games the list holds, once it is known. */
    ongames: (count: number) => void
    /** True when GitHub has just sent the person back from adding the editor. */
    justAdded: boolean
    onsignedout: () => void
  }
  let { api, remembered, onadd, onsignout, ongames, justAdded, onsignedout }: Props = $props()

  let games = $state<readonly GameRef[] | undefined>(undefined)
  let trouble = $state(false)
  let filter = $state('')

  const same = (a: GameRef, b: GameRef): boolean =>
    a.owner.toLowerCase() === b.owner.toLowerCase() && a.name.toLowerCase() === b.name.toLowerCase()

  async function load(): Promise<void> {
    trouble = false
    const answer = await api.games()
    if (!answer.ok) {
      if (answer.problem === 'signed-out') return onsignedout()
      // The list of games on this device is still worth showing.
      trouble = true
    }
    const all = [...(answer.ok ? answer.value : [])]
    for (const game of recentGames(remembered)) if (!all.some((one) => same(one, game))) all.push(game)
    games = all
    // A list that could not be fetched and has nothing on this device says nothing about whether there are games.
    if (!(trouble && all.length === 0)) ongames(all.length)
    // Back from adding the editor to exactly one game: open it, nothing more to choose.
    const only = all[0]
    if (justAdded && all.length === 1 && only !== undefined) {
      location.hash = routeHash({ screen: 'level', owner: only.owner, name: only.name })
    }
  }
  onMount(() => void load())

  const shown = $derived(
    (games ?? []).filter((g) => `${g.name} ${g.owner}`.toLowerCase().includes(filter.trim().toLowerCase())),
  )
</script>

<main class="look games">
  <section class="card">
    <h1>{WORDS.pickTitle}</h1>
    {#if games === undefined}
      <p>{WORDS.loading}</p>
    {:else}
      {#if trouble}
        <p class="problem" role="status">{WORDS.cantReach}</p>
        <!-- Not being able to ask GitHub is not "you have no games": the way on is to try again. -->
        <div>
          <button type="button" class:main={games.length === 0} onclick={() => void load()}>
            {WORDS.tryAgain}
          </button>
        </div>
      {/if}
      {#if games.length === 0}
        {#if !trouble}
          <p>{WORDS.pickEmpty}</p>
          <p class="quiet">{WORDS.pickEmptyLink}</p>
          <div><button type="button" class="main" onclick={onadd}>{WORDS.pickAdd}</button></div>
        {/if}
      {:else}
        <label class="find">
          <span>{WORDS.pickFind}</span>
          <input type="search" bind:value={filter} autocomplete="off" />
        </label>
        {#if shown.length === 0}
          <p>{WORDS.pickNoMatch}</p>
        {:else}
          <ul class="list">
            {#each shown as game (`${game.owner}/${game.name}`)}
              <li>
                <a class="row" href={routeHash({ screen: 'level', owner: game.owner, name: game.name })}>
                  <span class="words">
                    <b>{game.name}</b>
                    <small>{game.owner}</small>
                  </span>
                  <Icon name="caret-right" />
                </a>
              </li>
            {/each}
          </ul>
        {/if}
        <div><button type="button" onclick={onadd}>{WORDS.pickAdd}</button></div>
      {/if}
    {/if}
    <hr />
    <div class="foot">
      <button type="button" onclick={onsignout}>{WORDS.signOut}</button>
    </div>
  </section>
</main>

<style>
  .games {
    display: flex;
    justify-content: center;
    min-height: 100%;
    padding: 24px 16px;
    box-sizing: border-box;
    overflow: auto;
  }
  .card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    max-width: 520px;
    height: fit-content;
    padding: 20px;
    box-sizing: border-box;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--panel);
  }
  h1 {
    margin: 0;
    font: 600 24px / 1.2 var(--title);
  }
  p {
    margin: 0;
  }
  .quiet {
    color: var(--quiet);
  }
  .problem {
    color: var(--problem);
  }
  .find {
    display: flex;
    flex-direction: column;
    gap: 4px;
    color: var(--quiet);
  }
  input {
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--raised);
    color: var(--words);
    font: inherit;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding: 6px 14px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--raised);
    color: var(--words);
    text-decoration: none;
    overflow-wrap: anywhere;
  }
  .row:hover {
    background: var(--hover);
  }
  .words {
    display: flex;
    flex: 1;
    flex-direction: column;
  }
  small {
    color: var(--quiet);
  }
  button {
    min-width: 44px;
    min-height: 44px;
    padding: 0 16px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--raised);
    color: var(--words);
    font: 600 inherit;
    font-family: var(--label);
    cursor: pointer;
  }
  button:hover {
    background: var(--hover);
  }
  button.main {
    min-height: 48px;
    border-color: transparent;
    background: var(--accent);
    color: var(--on-accent);
  }
  hr {
    width: 100%;
    margin: 4px 0;
    border: 0;
    border-top: 1px solid var(--line);
  }
  .foot {
    display: flex;
    justify-content: flex-end;
  }
</style>
