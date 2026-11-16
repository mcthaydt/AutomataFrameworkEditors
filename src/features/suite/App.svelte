<script lang="ts">
  import { onMount } from 'svelte'
  import type { Api } from '../api/api.ts'
  import { readMe } from '../device/device.ts'
  import type { Session } from '../session/session.ts'
  import { Games, needsPerson, parseRoute, type Route, routeHash } from '../team/team.ts'
  import { Notice } from '../ui/ui.ts'
  import type { GameRef } from '../wire/wire.ts'
  import { WORDS } from '../words/words.ts'
  import { Opening } from '../world/world.ts'
  import Guide from './Guide.svelte'
  import { finishGuide, guideStep, guideSteps, guideWanted } from './guide.ts'
  import type { GameOpened } from './opened.ts'
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
  // The person's own choices (See-through panels, left hand, and the rest): read once, when the page opens.
  // svelte-ignore state_referenced_locally
  const me = readMe(remembered)
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
  let keptCopy = $state(false)
  /**
   * What the game on screen said when it was opened: its project name, or that it could not be opened (and whether a
   * visitor is better off signing in). The first-run strip, the sign-in on the bar and the titles are all worked out
   * from it, so none of them speaks about a game that is not there.
   */
  let opened = $state<{ game: string; name: string | undefined; askSignIn: boolean } | undefined>(undefined)
  const told = (game: GameRef, said: GameOpened): void => {
    opened = { game: `${game.owner}/${game.name}`.toLowerCase(), name: said.name, askSignIn: said.askSignIn }
  }
  /** True once the person has been shown their own list of games; a link or "Try it now" never shows it. */
  let sawList = $state(false)
  const hideGuide = (): void => {
    finishGuide(remembered)
    guideOn = false
  }
  // That the person has saved once, and how, is kept with the guide's own key: a reload after their first save shows
  // "You did it", not "Step 2 of 4" again, until they hide the tips. The old value was a plain "1", which meant direct.
  const SAVED = 'af.saved'
  const keptSaved = (): 'direct' | 'suggestion' | undefined => {
    try {
      const kept = remembered.getItem(SAVED)
      return kept === null ? undefined : kept === 'suggestion' ? 'suggestion' : 'direct'
    } catch {
      return undefined
    }
  }
  // svelte-ignore state_referenced_locally
  let savedHow = $state<'direct' | 'suggestion' | undefined>(keptSaved())
  function saved(how: 'direct' | 'suggestion'): void {
    savedHow = how
    try {
      remembered.setItem(SAVED, how)
    } catch {
      // The tip about Share simply does not show, and the strip forgets after a reload.
    }
  }

  onMount(() => {
    const follow = (): void => {
      route = parseRoute(location.hash)
      if (route.screen === 'games') level = { dirty: false, look: false }
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
  const go = (next: Route): void => {
    location.hash = routeHash(next)
  }

  const begin = (): void => session.begin(location.hash === '' ? '#/' : location.hash)
  const signOut = (): void => {
    session.signOut()
    signedIn = false
    notice = undefined
    location.hash = '#/'
  }
  const asksForPerson = $derived(needsPerson(route))

  const gameKey = $derived(
    route.screen === 'games' ? undefined : `${route.owner}/${route.name}`.toLowerCase(),
  )
  /** What the open said about the game on screen now; undefined until it has said, or on a screen with no game. */
  const known = $derived(opened !== undefined && opened.game === gameKey ? opened : undefined)
  /** A game that did not open has nothing to say a first-run step about, and neither do the screens beside it. */
  const guided = $derived(
    route.screen === 'games' || known === undefined || known.name !== undefined,
  )
  const inGame = $derived(route.screen !== 'games')
  const step = $derived(
    guideStep({
      signedIn,
      games,
      inGame,
      inLevel: route.screen !== 'games',
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
{#if guideOn && guided}
  <Guide count={level.look && step === 'move' ? undefined : count} text={guideText} onhide={hideGuide} />
{/if}
<div class="content">
{#if !signedIn && (asksForPerson || notice === 'signed-out')}
  <Welcome {notice} {ready} {demo} {signupUrl} landing={route.screen === 'games' && notice !== 'signed-out'} onsignin={begin} />
{:else}
  {#if !signedIn && (notice === 'cancelled' || notice === 'failed')}
    <!-- A sign-in that did not happen, on a screen that does not need one: say so, and the way to try again is the game's menu. -->
    <div class="said"><Notice kind="problem" text={notice === 'failed' ? WORDS.signInFailed : WORDS.signInCancelled} /></div>
  {/if}
  {#if route.screen === 'games'}
    <Games
      {api}
      {remembered}
      {justAdded}
      onadd={() => location.assign(addUrl)}
      onsignout={signOut}
      ongames={(n) => {
        games = n
        sawList = true
      }}
      onsignedout={signedOut}
    />
  {:else}
    {@const here = { owner: route.owner, name: route.name }}
    {#key `${route.owner}/${route.name}`}
      <Opening
        {api}
        game={here}
        {route}
        {me}
        {signedIn}
        {go}
        {remembered}
        {drafts}
        savedBefore={savedHow !== undefined}
        onopened={(said) => told(here, said)}
        onfacts={(f) => (level = { dirty: f.dirty, look: f.look })}
        onsaved={saved}
        onkept={() => (keptCopy = true)}
        onsignin={begin}
        onsignout={signOut}
        onsignedout={signedOut}
      />
    {/key}
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
</style>
