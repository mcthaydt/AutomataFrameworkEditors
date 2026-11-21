<script lang="ts">
  import { formatDiagnostic } from '@automataframework/framework/headless'
  import { onMount } from 'svelte'
  import type { Api } from '../api/api.ts'
  import type { Me } from '../device/device.ts'
  import { forgetGame, type Opened, openGame, rememberGame } from '../game/game.ts'
  import type { Route } from '../team/team.ts'
  import { Button, Notice, Screen } from '../ui/ui.ts'
  import type { GameRef } from '../wire/wire.ts'
  import { WORDS } from '../words/words.ts'
  import World from './World.svelte'

  // Gets the game from the API and shows the World editor on it. When the game cannot be opened, it says why and what to
  // press next: every way it can go wrong has one.
  interface Props {
    api: Api
    game: GameRef
    route: Route
    me: Me
    /** False for someone who has not signed in. */
    signedIn: boolean
    go: (route: Route) => void
    remembered: Storage
    drafts: Storage
    savedBefore: boolean
    onsaved: (how: 'direct' | 'suggestion') => void
    onme: (next: Me) => void
    onsignin: () => void
    onsignout: () => void
    onsignedout: () => void
  }
  let {
    api,
    game: ref,
    route,
    me,
    signedIn,
    go,
    remembered,
    drafts,
    savedBefore,
    onsaved,
    onme,
    onsignin,
    onsignout,
    onsignedout,
  }: Props = $props()

  let opened = $state.raw<Opened | undefined>(undefined)
  /** A new one remounts the editor: the game was opened again. */
  let generation = $state(0)
  /** The address asked for a level this game has, when the game was opened. A level made here later is not a reason to go. */
  let found = $state(false)

  async function load(): Promise<void> {
    opened = undefined
    const result = await openGame(api, ref)
    if (!result.ok && result.problem === 'signed-out') return onsignedout()
    const refused = !result.ok && (result.problem === 'not-found' || result.problem === 'not-allowed')
    if (result.ok) rememberGame(remembered, ref)
    else if (refused) forgetGame(remembered, ref)
    const asked = route.screen === 'games' ? undefined : route.level
    // The map only picks a level, so one renamed since the link was kept does not make the game unfindable.
    found = result.ok && (route.screen === 'map' || asked === undefined || result.game.content.levels[asked] !== undefined)
    opened = result
    generation += 1
  }
  onMount(() => void load())

  const toGames = (): void => go({ screen: 'games' })
  const back = { label: WORDS.back, onpress: toGames }
  const title = $derived(`${ref.owner}/${ref.name}`)
</script>

{#if opened === undefined}
  <Screen glass {title} {back}><p>{WORDS.loading}</p></Screen>
{:else if opened.ok && found}
  {#key generation}
    <World
      game={opened.game}
      {api}
      {route}
      {me}
      {go}
      {drafts}
      {remembered}
      {savedBefore}
      {onsignin}
      {onsignout}
      {onsignedout}
      onreload={() => void load()}
      {onsaved}
      {onme}
    />
  {/key}
{:else if opened.ok}
  <Screen glass title={opened.game.content.project.name} {back}>
    <Notice kind="problem" text={WORDS.cantFindGame} />
  </Screen>
{:else if opened.problem === 'broken'}
  <!-- Plain words first and one big way back; the file's own line is small print for whoever mends it. -->
  <Screen glass title={WORDS.brokenTitle}>
    <Notice kind="problem" text={WORDS.brokenGame} />
    <div><Button label={WORDS.backToGames} icon="arrow-left" kind="primary" onpress={toGames} /></div>
    <p class="for">{WORDS.brokenFor}</p>
    <ul class="problems">
      {#each opened.diagnostics as diagnostic (formatDiagnostic(diagnostic))}
        <li>{formatDiagnostic(diagnostic)}</li>
      {/each}
    </ul>
  </Screen>
{:else if opened.problem === 'not-found' || opened.problem === 'not-allowed'}
  <Screen glass {title} {back}>
    <Notice kind="problem" text={signedIn ? WORDS.cantFindGame : WORDS.cantFindVisitor} />
    {#if !signedIn}<div><Button label={WORDS.signIn} kind="primary" onpress={onsignin} /></div>{/if}
  </Screen>
{:else if opened.problem === 'not-a-game'}
  <Screen glass title={WORDS.notAGameTitle}>
    <Notice kind="problem" text={WORDS.notAGame} />
    <div><Button label={WORDS.backToGames} icon="arrow-left" kind="primary" onpress={toGames} /></div>
  </Screen>
{:else}
  <Screen glass {title} {back}>
    <Notice kind="problem" text={WORDS.cantReach} />
    <div><Button label={WORDS.tryAgain} icon="arrow-clockwise" kind="primary" onpress={() => void load()} /></div>
  </Screen>
{/if}

<style>
  .problems {
    margin: 0;
    padding-left: var(--space-3);
    overflow-wrap: anywhere;
    color: var(--g-quiet);
    font-size: 13px;
  }
  .for {
    margin: 0;
    color: var(--g-quiet);
    font-size: 13px;
  }
</style>
