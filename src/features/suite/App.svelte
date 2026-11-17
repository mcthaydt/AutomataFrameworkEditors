<script lang="ts">
  import { onMount } from 'svelte'
  import type { Api } from '../api/api.ts'
  import { keepMe, languageFor, type Me, readMe } from '../device/device.ts'
  import type { Session } from '../session/session.ts'
  import { guideWanted, Language } from '../shell/shell.ts'
  import { Games, needsPerson, parseRoute, type Route, routeHash } from '../team/team.ts'
  import { loadLanguageFont, Notice } from '../ui/ui.ts'
  import type { GameRef } from '../wire/wire.ts'
  import { WORDS } from '../words/words.ts'
  import { Opening } from '../world/world.ts'
  import Welcome from './Welcome.svelte'

  // The whole page: which screen the address asks for, and the bar at the top with the one sign-in button. A person
  // is shown Welcome only for the screens that are about a person; a game and its levels open for a visitor. The very
  // first time, the language card comes before anything else.
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
  // The person's own choices (See-through panels, row size, language and the rest): read when the page opens, kept on
  // this device whenever they change.
  // svelte-ignore state_referenced_locally
  let me = $state<Me>(readMe(remembered))
  function changeMe(next: Me): void {
    me = next
    keepMe(remembered, next)
    if (next.language !== undefined) void loadLanguageFont(next.language)
  }
  // The language card is the first thing a new person sees, before anything is said, and is chosen once; it starts on the
  // language the device asks for.
  // svelte-ignore state_referenced_locally
  const firstRun = guideWanted(remembered)
  const picking = $derived(firstRun && me.language === undefined)
  onMount(() => {
    if (me.language !== undefined) void loadLanguageFont(me.language)
  })
  // Both start from what the page was given; after that the person's own presses change them.
  // svelte-ignore state_referenced_locally
  let signedIn = $state(session.token() !== undefined)
  // svelte-ignore state_referenced_locally
  let notice = $state<'cancelled' | 'failed' | 'signed-out' | undefined>(start)

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

</script>

<div class="page">
<div class="content">
{#if picking}
  <Language initial={languageFor(navigator.languages)} ongo={(lang) => changeMe({ ...me, language: lang })} />
{:else if !signedIn && (asksForPerson || notice === 'signed-out')}
  <Welcome {notice} {ready} {demo} {signupUrl} landing={route.screen === 'games' && notice !== 'signed-out'} onsignin={begin} />
{:else}
  {#if !signedIn && (notice === 'cancelled' || notice === 'failed')}
    <!-- A sign-in that did not happen, on a screen that does not need one: say so, and the way to try again is the game's menu. -->
    <div class="said"><Notice kind="problem" text={notice === 'failed' ? WORDS.signInFailed : WORDS.signInCancelled} /></div>
  {/if}
  {#if route.screen === 'games'}
    <Games
      lang={me.language ?? 'en'}
      {api}
      {remembered}
      {justAdded}
      onadd={() => location.assign(addUrl)}
      onsignout={signOut}
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
        onsaved={saved}
        onme={changeMe}
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
