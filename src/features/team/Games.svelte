<script lang="ts">
  import { onMount } from 'svelte'
  import type { Api } from '../api/api.ts'
  import { recentGames } from '../game/game.ts'
  import { Action, Icon } from '../ui/ui.ts'
  import type { GameRef } from '../wire/wire.ts'
  import { type Lang, type Row, wordsIn } from '../words/words.ts'
  import { createPeeker, lazyStage, lookWith, type Peek } from './pictures.ts'
  import { routeHash } from './route.ts'

  // Your games: the ones GitHub says the person can reach with the editor added, and the ones this device has opened,
  // once each, each with its first level as a small picture and what the person may do in it. A game is opened for its
  // picture only when its row comes into view, two at a time at most. The first screen after signing in, and where
  // "Your games" in a game's menu goes.
  interface Props {
    lang: Lang
    api: Api
    remembered: Storage
    onadd: () => void
    onsignout: () => void
    /** True when GitHub has just sent the person back from adding the editor. */
    justAdded: boolean
    onsignedout: () => void
  }
  let { lang, api, remembered, onadd, onsignout, justAdded, onsignedout }: Props = $props()

  const words = $derived(wordsIn(lang))
  const t = $derived(words.games)
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row

  let games = $state<readonly GameRef[] | undefined>(undefined)
  let trouble = $state(false)
  let filter = $state('')
  /** What each game's row has learned once it was looked at: its picture, and what the person may do. */
  let seen = $state.raw<Readonly<Record<string, Peek>>>({})

  const same = (a: GameRef, b: GameRef): boolean =>
    a.owner.toLowerCase() === b.owner.toLowerCase() && a.name.toLowerCase() === b.name.toLowerCase()
  const keyOf = (game: GameRef): string => `${game.owner}/${game.name}`

  // svelte-ignore state_referenced_locally
  const drawing = lazyStage()
  // svelte-ignore state_referenced_locally
  const peeker = createPeeker(lookWith(api, drawing.stage), 2)

  async function load(): Promise<void> {
    trouble = false
    const answer = await api.games()
    if (!answer.ok) {
      if (answer.problem === 'signed-out') return onsignedout()
      // The list of games on this device is still worth showing.
      trouble = true
    }
    // One row for each game, however many times it was named.
    const all: GameRef[] = []
    for (const game of [...(answer.ok ? answer.value : []), ...recentGames(remembered)]) {
      if (!all.some((one) => same(one, game))) all.push(game)
    }
    games = all
    // Back from adding the editor to exactly one game: open it, nothing more to choose.
    const only = all[0]
    if (justAdded && all.length === 1 && only !== undefined) {
      location.hash = routeHash({ screen: 'level', owner: only.owner, name: only.name })
    }
  }
  onMount(() => {
    void load()
    // A page being replaced (a reload, a new address) cuts off the opens going on; the ones still waiting must not start
    // in its last moments, where a call that cannot finish is reported by WebKit as a page error.
    addEventListener('pagehide', peeker.stop)
    addEventListener('beforeunload', peeker.stop)
    return () => {
      removeEventListener('pagehide', peeker.stop)
      removeEventListener('beforeunload', peeker.stop)
      peeker.stop()
      drawing.destroy()
    }
  })

  /** Looks at a game when its row first comes into view. */
  function whenSeen(node: HTMLElement, game: GameRef): { destroy: () => void } {
    const watcher = new IntersectionObserver((found) => {
      if (!found.some((one) => one.isIntersecting)) return
      watcher.disconnect()
      void peeker.peek(game).then((one) => {
        if (one !== undefined) seen = { ...seen, [keyOf(game)]: one }
      })
    })
    watcher.observe(node)
    return { destroy: () => watcher.disconnect() }
  }

  const shown = $derived(
    (games ?? []).filter((g) => `${g.name} ${g.owner}`.toLowerCase().includes(filter.trim().toLowerCase())),
  )
  const login = $derived(Object.values(seen).find((one) => one.login !== undefined)?.login)
  const can = (level: Peek['level']): string =>
    text(
      level === 'owner'
        ? t.gameOwner
        : level === 'edit'
          ? t.gameEdit
          : level === 'approve'
            ? t.gameApprove
            : level === 'suggest'
              ? t.gameSuggest
              : t.gameLook,
    )
</script>

<main class="look games centred" {lang}>
  <section class="card glass-1">
    <h1>{text(t.gamesTitle)}</h1>
    {#if games === undefined}
      <p role="status">{text(t.gamesLoading)}</p>
    {:else}
      {#if trouble}
        <p class="problem" role="status">{text(t.gamesTrouble)}</p>
        <!-- Not being able to ask GitHub is not "you have no games": the way on is to try again. -->
        <div><Action label={text(t.gamesAgain)} icon="arrow-clockwise" kind={games.length === 0 ? 'main' : 'plain'} onpress={() => void load()} /></div>
      {/if}
      {#if games.length === 0}
        {#if !trouble}
          <p>{text(t.gamesEmpty)}</p>
          <p class="quiet">{text(t.gamesEmptyHelp)}</p>
          <div><Action label={text(t.gamesAdd)} icon="plus" kind="main" onpress={onadd} /></div>
        {/if}
      {:else}
        <p class="quiet">{text(t.gamesAbout)}</p>
        <label class="find">
          <Icon name="magnifying-glass" />
          <input type="search" aria-label={text(t.gamesFind)} placeholder={text(t.gamesFind)} bind:value={filter} autocomplete="off" />
        </label>
        {#if shown.length === 0}
          <p>{text(t.gamesNoMatch)}</p>
        {:else}
          <ul class="list">
            {#each shown as game (keyOf(game))}
              {@const one = seen[keyOf(game)]}
              <li>
                <a class="row" use:whenSeen={game} href={routeHash({ screen: 'level', owner: game.owner, name: game.name })}>
                  <span class="thumb">
                    {#if one?.picture !== undefined}
                      <img src={one.picture} alt="" />
                    {:else}
                      <Icon name="squares-four" />
                    {/if}
                  </span>
                  <span class="words">
                    <b>{game.name}</b>
                    <small>{one === undefined ? game.owner : can(one.level)}</small>
                  </span>
                  <Icon name="caret-right" />
                </a>
              </li>
            {/each}
          </ul>
        {/if}
        <p class="quiet">{text(t.gamesAsk)}</p>
        <div><Action label={text(t.gamesAdd)} icon="plus" onpress={onadd} /></div>
      {/if}
    {/if}
    <hr />
    <div class="foot">
      {#if login !== undefined}<span class="quiet">{text(t.gamesSignedIn, login)}</span>{/if}
      <Action label={text(words.menus.signOut)} icon="arrow-square-out" onpress={onsignout} />
    </div>
  </section>
</main>

<style>
  .games {
    padding: 24px 16px;
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
  }
  h1 {
    margin: 0;
    font: 600 24px / 1.2 var(--title);
  }
  p {
    margin: 0;
  }
  .quiet,
  small {
    color: var(--g-quiet);
  }
  .problem {
    color: var(--problem-words);
  }
  .find {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 12px;
    border: 1px solid var(--line);
    border-radius: 10px;
    color: var(--g-quiet);
  }
  input {
    flex: 1;
    min-width: 0;
    min-height: 44px;
    border: 0;
    background: transparent;
    color: var(--words);
    font: inherit;
    outline-offset: 4px;
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
    min-height: 64px;
    padding: 6px 14px 6px 6px;
    border: 1px solid var(--line);
    border-radius: 12px;
    color: var(--words);
    text-decoration: none;
    overflow-wrap: anywhere;
  }
  .row:hover {
    background: var(--hover);
  }
  .thumb {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 48px;
    overflow: hidden;
    border-radius: 8px;
    border: 1px solid var(--line);
    color: var(--g-quiet);
  }
  .thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .words {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  }
  hr {
    width: 100%;
    margin: 4px 0;
    border: 0;
    border-top: 1px solid var(--line);
  }
  .foot {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
  }
</style>
