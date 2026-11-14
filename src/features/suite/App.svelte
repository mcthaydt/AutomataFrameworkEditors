<script lang="ts">
  import { onMount } from 'svelte'
  import type { Api } from '../api/api.ts'
  import type { Session } from '../session/session.ts'
  import { Button, Screen } from '../ui/ui.ts'
  import { WORDS } from '../words/words.ts'
  import { needsPerson, parseRoute } from './route.ts'
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
  }
  let { api, session, ready, start }: Props = $props()

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

  // The list of games is asked for as soon as it is shown: that is what notices a sign-in that ran out, renews it, or
  // (when it cannot be renewed) sends the person back to Welcome.
  $effect(() => {
    if (route.screen !== 'games' || !signedIn) return
    void api.games().then((answer) => {
      if (!answer.ok && answer.problem === 'signed-out') {
        session.signOut()
        signedIn = false
        notice = 'signed-out'
      }
    })
  })

  const begin = (): void => session.begin(location.hash === '' ? '#/' : location.hash)
  const signOut = (): void => {
    session.signOut()
    signedIn = false
    notice = undefined
    location.hash = '#/'
  }
  const asksForPerson = $derived(needsPerson(route))
</script>

{#if !signedIn && asksForPerson}
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
    <Screen title={WORDS.pickTitle}><p>{WORDS.loading}</p></Screen>
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
