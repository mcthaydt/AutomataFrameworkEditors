<script lang="ts">
  import { onMount } from 'svelte'
  import { formatDiagnostic } from '@automataframework/framework/headless'
  import type { Api } from '../api/api.ts'
  import { forgetGame, type Opened, openGame, rememberGame } from '../game/game.ts'
  import { Button, Notice, Screen } from '../ui/ui.ts'
  import { WORDS } from '../words/words.ts'
  import type { GameRef } from '../wire/wire.ts'
  import { routeHash } from './route.ts'

  // A game's page: who you are in it, and its levels. Every way it can go wrong says what to press next.
  interface Props {
    api: Api
    game: GameRef
    remembered: Storage
    /** True when the person has no sign-in: the way back is Welcome, and the words say so. */
    visitor: boolean
    onsignin: () => void
    onsignedout: () => void
    onback: () => void
  }
  let { api, game, remembered, visitor, onsignin, onsignedout, onback }: Props = $props()

  let opened = $state<Opened | undefined>(undefined)

  async function load(): Promise<void> {
    opened = undefined
    const result = await openGame(api, game)
    if (result.ok) rememberGame(remembered, game)
    else if (result.problem === 'not-found' || result.problem === 'not-allowed') forgetGame(remembered, game)
    if (!result.ok && result.problem === 'signed-out') return onsignedout()
    opened = result
  }
  onMount(() => void load())

  const back = $derived({ label: WORDS.back, onpress: onback })
  const levelIds = $derived(opened?.ok ? Object.keys(opened.game.content.levels) : [])
</script>

{#if opened === undefined}
  <Screen title={`${game.owner}/${game.name}`} {back}><p>{WORDS.loading}</p></Screen>
{:else if opened.ok}
  <Screen title={opened.game.content.project.name} {back}>
    <Notice
      kind="info"
      text={opened.game.login === undefined ? WORDS.visitorCan : WORDS.youAre(opened.game.level)}
    />
    {#if opened.game.mine !== undefined}<Notice kind="info" text={WORDS.mineWaiting} />{/if}
    <h2>{WORDS.gameLevels}</h2>
    <ul class="levels">
      {#each levelIds as id (id)}
        <li>
          <a class="row" href={routeHash({ screen: 'level', owner: game.owner, name: game.name, level: id })}>{id}</a>
        </li>
      {/each}
    </ul>
    <p class="soon">{WORDS.gameMoreSoon}</p>
  </Screen>
{:else if opened.problem === 'broken'}
  <Screen title={`${game.owner}/${game.name}`} {back}>
    <Notice kind="problem" text={WORDS.brokenGame} />
    <ul class="problems">
      {#each opened.diagnostics as diagnostic (formatDiagnostic(diagnostic))}
        <li>{formatDiagnostic(diagnostic)}</li>
      {/each}
    </ul>
  </Screen>
{:else if opened.problem === 'not-a-game'}
  <Screen title={`${game.owner}/${game.name}`} {back}><Notice kind="problem" text={WORDS.notAGame} /></Screen>
{:else if opened.problem === 'not-found' || opened.problem === 'not-allowed'}
  <Screen title={`${game.owner}/${game.name}`} {back}>
    {#if visitor}
      <Notice kind="problem" text={WORDS.cantFindVisitor} />
      <div><Button label={WORDS.signIn} kind="primary" onpress={onsignin} /></div>
    {:else}
      <Notice kind="problem" text={WORDS.cantFindGame} />
    {/if}
  </Screen>
{:else}
  <Screen title={`${game.owner}/${game.name}`} {back}>
    <Notice kind="problem" text={WORDS.cantReach} />
    <div><Button label={WORDS.tryAgain} kind="primary" onpress={() => void load()} /></div>
  </Screen>
{/if}

<style>
  h2 {
    margin: 0;
    font-size: var(--font-size);
  }
  .levels,
  .problems {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .problems {
    padding-left: var(--space-3);
    list-style: disc;
    overflow-wrap: anywhere;
  }
  .row {
    display: flex;
    align-items: center;
    min-height: 56px;
    padding: var(--space-2) var(--space-3);
    border: 2px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--fg);
    font-weight: 600;
    text-decoration: none;
    overflow-wrap: anywhere;
  }
  .soon {
    margin: 0;
    color: var(--muted);
  }
</style>
