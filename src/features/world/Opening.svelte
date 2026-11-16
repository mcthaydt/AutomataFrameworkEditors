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
    /** Told whenever the game has been asked for: its name, or that it could not be opened. */
    onopened: (said: { name: string | undefined; askSignIn: boolean }) => void
    onfacts: (facts: { dirty: boolean; look: boolean }) => void
    onsaved: (how: 'direct' | 'suggestion') => void
    onkept: () => void
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
    onopened,
    onfacts,
    onsaved,
    onkept,
    onsignin,
    onsignout,
    onsignedout,
  }: Props = $props()

  let opened = $state.raw<Opened | undefined>(undefined)
  /** A new one remounts the editor: the game was opened again. */
  let generation = $state(0)

  async function load(): Promise<void> {
    opened = undefined
    const result = await openGame(api, ref)
    if (!result.ok && result.problem === 'signed-out') return onsignedout()
    const refused = !result.ok && (result.problem === 'not-found' || result.problem === 'not-allowed')
    if (result.ok) rememberGame(remembered, ref)
    else if (refused) forgetGame(remembered, ref)
    opened = result
    generation += 1
    onopened({
      name: result.ok ? result.game.content.project.name : undefined,
      askSignIn: refused && !signedIn,
    })
  }
  onMount(() => void load())

  const toGames = (): void => go({ screen: 'games' })
  const back = { label: WORDS.back, onpress: toGames }
  const title = $derived(`${ref.owner}/${ref.name}`)
  /** The level the address asks for, or the game's start; it must be one the game has. */
  const wanted = $derived(
    opened?.ok && route.screen === 'level' && route.level !== undefined
      ? route.level
      : opened?.ok
        ? opened.game.content.project.start
        : undefined,
  )
</script>

{#if opened === undefined}
  <Screen {title} {back}><p>{WORDS.loading}</p></Screen>
{:else if opened.ok && wanted !== undefined && opened.game.content.levels[wanted] !== undefined}
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
      {onfacts}
      {onsaved}
      {onkept}
    />
  {/key}
{:else if opened.ok}
  <Screen title={opened.game.content.project.name} {back}>
    <Notice kind="problem" text={WORDS.cantFindGame} />
  </Screen>
{:else if opened.problem === 'broken'}
  <Screen {title} {back}>
    <Notice kind="problem" text={WORDS.brokenGame} />
    <ul class="problems">
      {#each opened.diagnostics as diagnostic (formatDiagnostic(diagnostic))}
        <li>{formatDiagnostic(diagnostic)}</li>
      {/each}
    </ul>
  </Screen>
{:else if opened.problem === 'not-found' || opened.problem === 'not-allowed'}
  <Screen {title} {back}>
    <Notice kind="problem" text={signedIn ? WORDS.cantFindGame : WORDS.cantFindVisitor} />
    {#if !signedIn}<div><Button label={WORDS.signIn} kind="primary" onpress={onsignin} /></div>{/if}
  </Screen>
{:else if opened.problem === 'not-a-game'}
  <Screen {title} {back}><Notice kind="problem" text={WORDS.notAGame} /></Screen>
{:else}
  <Screen {title} {back}>
    <Notice kind="problem" text={WORDS.cantReach} />
    <div><Button label={WORDS.tryAgain} kind="primary" onpress={() => void load()} /></div>
  </Screen>
{/if}

<style>
  .problems {
    margin: 0;
    padding-left: var(--space-3);
    overflow-wrap: anywhere;
  }
</style>
