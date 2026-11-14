<script lang="ts">
  import { onMount } from 'svelte'
  import type { Api } from '../api/api.ts'
  import type { GameRef } from '../wire/wire.ts'
  import type { Session } from '../session/session.ts'
  import { Button, Notice } from '../ui/ui.ts'
  import { WORDS } from '../words/words.ts'
  import { needsPerson, parseRoute, routeHash } from './route.ts'
  import GameHome from './GameHome.svelte'
  import Guide from './Guide.svelte'
  import { finishGuide, guideStep, guideSteps, guideWanted } from './guide.ts'
  import LevelScreen from './LevelScreen.svelte'
  import PickGame from './PickGame.svelte'
  import Share from './Share.svelte'
  import Waiting from './Waiting.svelte'
  import WaitingChange from './WaitingChange.svelte'
  import Welcome from './Welcome.svelte'

  // The whole page: which screen the address asks for, and the bar at the top with the one sign-in button. A person
  // is shown Welcome only for the screens that are about a person; a game and its levels open for a visitor.
  interface Props {
    api: Api
    session: Session
    /** Whether the site has a sign-in set up. */
    ready: boolean
    /** How the last sign-in ended, if it was one. */
    start: 'cancelled' | 'failed' | undefined
    /** Where an Owner adds the editor to a game. */
    addUrl: string
    /** The games this device has opened. */
    remembered: Storage
    /** The example game "Try it now" opens, if this site has one. */
    demo: GameRef | undefined
    /** Where a change that is not saved yet is kept. */
    drafts: Storage
    /** Where GitHub's own "sign up" page is: for someone with no account. */
    signupUrl: string
    /** True when GitHub has just sent the person back from adding the editor to a game. */
    justAdded: boolean
  }
  let { api, session, ready, start, addUrl, remembered, demo, drafts, signupUrl, justAdded }: Props = $props()

  let route = $state(parseRoute(location.hash))
  // Both start from what the page was given; after that the person's own presses change them.
  // svelte-ignore state_referenced_locally
  let signedIn = $state(session.token() !== undefined)
  // svelte-ignore state_referenced_locally
  let notice = $state<'cancelled' | 'failed' | 'signed-out' | undefined>(start)

  // The first run: where the person is, and what they have done. Screens report facts; the strip works out the step.
  // svelte-ignore state_referenced_locally
  let guideOn = $state(guideWanted(remembered))
  let games = $state<number | undefined>(undefined)
  let level = $state({ dirty: false, look: false })
  let savedHow = $state<'direct' | 'suggestion' | undefined>(undefined)
  let keptCopy = $state(false)
  /** True once the person has been shown their own list of games; a link or "Try it now" never shows it. */
  let sawList = $state(false)
  const hideGuide = (): void => {
    finishGuide(remembered)
    guideOn = false
  }
  const SAVED = 'af.saved'
  const everSaved = (): boolean => {
    try {
      return remembered.getItem(SAVED) !== null
    } catch {
      return false
    }
  }
  function saved(how: 'direct' | 'suggestion'): void {
    savedHow = how
    try {
      remembered.setItem(SAVED, '1')
    } catch {
      // The tip about Share simply does not show.
    }
  }

  onMount(() => {
    const follow = (): void => {
      route = parseRoute(location.hash)
      if (route.screen !== 'level') level = { dirty: false, look: false }
    }
    window.addEventListener('hashchange', follow)
    return () => window.removeEventListener('hashchange', follow)
  })

  // A sign-in that cannot be renewed: the person is signed out, and shown Welcome wherever they were.
  function signedOut(): void {
    session.signOut()
    signedIn = false
    notice = 'signed-out'
  }
  const goBack = (): void => {
    location.hash = '#/'
  }

  const begin = (): void => session.begin(location.hash === '' ? '#/' : location.hash)
  const signOut = (): void => {
    session.signOut()
    signedIn = false
    notice = undefined
    location.hash = '#/'
  }
  const asksForPerson = $derived(needsPerson(route))
  const savedBefore = $derived(savedHow !== undefined || everSaved())

  const inGame = $derived(route.screen !== 'games')
  const step = $derived(
    guideStep({
      signedIn,
      games,
      inGame,
      inLevel: route.screen === 'level',
      dirty: level.dirty,
      savedOnce: savedHow !== undefined,
      keptCopy,
    }),
  )
  const steps = $derived(guideSteps(!sawList))
  const count = $derived.by(() => {
    const at = steps.indexOf(step)
    return at < 0 ? undefined : { n: at + 1, of: steps.length }
  })
  const guideText = $derived.by(() => {
    switch (step) {
      case 'start':
        return demo === undefined ? WORDS.guideStartPlain : WORDS.guideStart
      case 'add-editor':
        return WORDS.guideAdd
      case 'pick-game':
        return inGame ? WORDS.guidePickLevel : WORDS.guidePick
      case 'move':
        return level.look ? WORDS.guideLook : WORDS.guideMove
      case 'save':
        return signedIn ? WORDS.guideSave : WORDS.guideSaveVisitor
      case 'done':
        return savedHow === undefined
          ? WORDS.guideDoneCopy
          : savedHow === 'suggestion'
            ? WORDS.guideDoneSuggestion
            : WORDS.guideDoneDirect
    }
  })
</script>

<div class="page">
{#if guideOn}
  <Guide count={level.look && step === 'move' ? undefined : count} text={guideText} onhide={hideGuide} />
{/if}
<div class="content">
{#if !signedIn && (asksForPerson || notice === 'signed-out')}
  <Welcome {notice} {ready} {demo} {signupUrl} landing={route.screen === 'games' && notice !== 'signed-out'} onsignin={begin} />
{:else}
  <div class="bar">
    {#if signedIn}
      <Button label={WORDS.signOut} onpress={signOut} />
    {:else}
      <Button label={WORDS.signIn} onpress={begin} />
    {/if}
  </div>
  {#if !signedIn && (notice === 'cancelled' || notice === 'failed')}
    <!-- A sign-in that did not happen, on a screen that does not need one: say so, and the way to try again is the bar. -->
    <div class="said"><Notice kind="problem" text={notice === 'failed' ? WORDS.signInFailed : WORDS.signInCancelled} /></div>
  {/if}
  {#if route.screen === 'games'}
    <PickGame
      {api}
      {remembered}
      {justAdded}
      onadd={() => location.assign(addUrl)}
      ongames={(n) => {
        games = n
        sawList = true
      }}
      onsignedout={signedOut}
    />
  {:else if route.screen === 'game'}
    {#key `${route.owner}/${route.name}`}
      <GameHome
        {api}
        game={{ owner: route.owner, name: route.name }}
        {remembered}
        visitor={!signedIn}
        {savedBefore}
        onsignin={begin}
        onsignedout={signedOut}
        onback={goBack}
      />
    {/key}
  {:else if route.screen === 'level'}
    {@const here = { owner: route.owner, name: route.name }}
    {#key `${route.owner}/${route.name}/${route.level}`}
      <LevelScreen
        {api}
        game={{ owner: route.owner, name: route.name }}
        levelId={route.level}
        {remembered}
        {drafts}
        {signedIn}
        onfacts={(f) => (level = { dirty: f.dirty, look: f.look })}
        onsaved={saved}
        onkept={() => (keptCopy = true)}
        onsignin={begin}
        onsignedout={signedOut}
        onback={() => (location.hash = routeHash({ screen: 'game', ...here }))}
      />
    {/key}
  {:else if route.screen === 'waiting'}
    {@const here = { owner: route.owner, name: route.name }}
    <Waiting
      {api}
      game={here}
      onsignedout={signedOut}
      onback={() => (location.hash = routeHash({ screen: 'game', ...here }))}
    />
  {:else if route.screen === 'change'}
    {@const here = { owner: route.owner, name: route.name }}
    {#key route.number}
      <WaitingChange
        {api}
        game={here}
        number={route.number}
        onsignedout={signedOut}
        onback={() => (location.hash = routeHash({ screen: 'waiting', ...here }))}
        onhome={() => (location.hash = routeHash({ screen: 'game', ...here }))}
      />
    {/key}
  {:else}
    {@const here = { owner: route.owner, name: route.name }}
    <Share
      {api}
      game={here}
      onsignedout={signedOut}
      onhome={() => (location.hash = routeHash({ screen: 'game', ...here }))}
    />
{/if}
{/if}
</div>
</div>

<style>
  /* The page is exactly as tall as the window: the strip and the bar on top, and the screen takes the rest, scrolling
     inside itself. The level editor needs this: it fills what it is given. */
  .page {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .content {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    overflow: auto;
  }
  .said {
    padding: var(--space-2) var(--space-3) 0;
  }
  .bar {
    display: flex;
    justify-content: flex-end;
    padding: var(--space-2) var(--space-3) 0;
  }
</style>
