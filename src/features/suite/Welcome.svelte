<script lang="ts">
  import { Button, Notice, Screen } from '../ui/ui.ts'
  import type { GameRef } from '../wire/wire.ts'
  import { routeHash } from './route.ts'
  import { WORDS } from '../words/words.ts'

  // The first screen for someone who needs to sign in: what this is, one big button, and why GitHub is in it at all.
  interface Props {
    /** What happened the last time, if anything: a sign-in cancelled or failed, or one that ran out. */
    notice: 'cancelled' | 'failed' | 'signed-out' | undefined
    /** False when the site has no sign-in set up yet. */
    ready: boolean
    /** True on the first screen of the site (not because a screen asked for a person). */
    landing?: boolean
    /** The example game "try it" opens, if this site has one. */
    demo?: GameRef | undefined
    /** GitHub's own page for making an account. */
    signupUrl: string
    onsignin: () => void
  }
  let { notice, ready, landing = false, demo = undefined, signupUrl, onsignin }: Props = $props()
  // On the landing screen of a site with an example game, trying it is the one thing to press; signing in is plain.
  const tryFirst = $derived(landing && demo !== undefined)
  const NOTICE_WORDS = {
    cancelled: WORDS.signInCancelled,
    failed: WORDS.signInFailed,
    'signed-out': WORDS.signedOutAgain,
  } as const
</script>

<Screen title={WORDS.appName} kicker={WORDS.wordmark}>
  <p class="line">{WORDS.welcomeLine}</p>
  {#if !ready}<Notice kind="problem" text={WORDS.signInNotReady} />{/if}
  {#if notice !== undefined}<Notice kind="problem" text={NOTICE_WORDS[notice]} />{/if}
  {#if demo !== undefined}
    <div class="action">
      <Button
        label={WORDS.tryIt}
        icon="tryIt"
        kind={tryFirst ? 'primary' : 'plain'}
        onpress={() => (location.hash = routeHash({ screen: 'game', ...demo }))}
      />
    </div>
    <p class="why">{WORDS.tryItLine}</p>
  {/if}
  <div class="action">
    <Button label={WORDS.signIn} icon="signIn" kind={tryFirst ? 'plain' : 'primary'} disabled={!ready} onpress={onsignin} />
  </div>
  <p class="why">{WORDS.signInWhy}</p>
  <p class="why"><a href={signupUrl}>{WORDS.noAccount}</a></p>
</Screen>

<style>
  .line {
    margin: 0;
    font-size: var(--font-size-big);
  }
  .action {
    display: flex;
  }
  .why {
    margin: 0;
    color: var(--quiet);
  }
  /* A link is pressed with a finger like a button, so it is as tall as one. */
  .why a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
  }
</style>
