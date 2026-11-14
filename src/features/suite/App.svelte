<script lang="ts">
  import { onMount } from 'svelte'
  import type { Api } from '../api/api.ts'
  import type { Session } from '../session/session.ts'
  import { Button, Screen } from '../ui/ui.ts'
  import { WORDS } from '../words/words.ts'
  import { needsPerson, parseRoute, routeHash } from './route.ts'
  import GameHome from './GameHome.svelte'
  import LevelScreen from './LevelScreen.svelte'
  import PickGame from './PickGame.svelte'
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
    /** Where a change that is not saved yet is kept. */
    drafts: Storage
  }
  let { api, session, ready, start, addUrl, remembered, drafts }: Props = $props()

  let route = $state(parseRoute(location.hash))
  // Both start from what the page was given; after that the person's own presses change them.
  // svelte-ignore state_referenced_locally
  let signedIn = $state(session.token() !== undefined)
  // svelte-ignore state_referenced_locally
  let notice = $state<'cancelled' | 'failed' | 'signed-out' | undefined>(start)

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
</script>

{#if !signedIn && (asksForPerson || notice === 'signed-out')}
  <Welcome {notice} {ready} onsignin={begin} />
{:else}
  <div class="bar">
    {#if signedIn}
      <Button label={WORDS.signOut} onpress={signOut} />
    {:else}
      <Button label={WORDS.signIn} onpress={begin} />
    {/if}
  </div>
  {#if route.screen === 'games'}
    <PickGame {api} {remembered} onadd={() => location.assign(addUrl)} onsignedout={signedOut} />
  {:else if route.screen === 'game'}
    {#key `${route.owner}/${route.name}`}
      <GameHome
        {api}
        game={{ owner: route.owner, name: route.name }}
        {remembered}
        visitor={!signedIn}
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
        onsignin={begin}
        onsignedout={signedOut}
        onback={() => (location.hash = routeHash({ screen: 'game', ...here }))}
      />
    {/key}
  {:else}
    <Screen title={`${route.owner}/${route.name}`}><p>{WORDS.loading}</p></Screen>
  {/if}
{/if}

<style>
  .bar {
    display: flex;
    justify-content: flex-end;
    padding: var(--space-2) var(--space-3) 0;
  }
</style>
