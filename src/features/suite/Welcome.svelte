<script lang="ts">
  import { Button, Notice, Screen } from '../ui/ui.ts'
  import Drawing from './Drawing.svelte'
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

<Screen title={WORDS.appName} kicker={WORDS.wordmark} wide>
  <div class="hero">
    <div class="words">
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
    </div>
    <div class="picture"><Drawing /></div>
  </div>
  <!-- The whole way in, in three lines: where it goes, so nobody has to guess what comes after the first press. -->
  {#if demo !== undefined}
    <ol class="steps">
      {#each [WORDS.welcomeStep1, WORDS.welcomeStep2, WORDS.welcomeStep3] as step, i (step)}
        <li><span class="n measure">{i + 1}</span><span>{step}</span></li>
      {/each}
    </ol>
  {/if}
</Screen>

<style>
  .hero {
    display: grid;
    gap: var(--space-4);
    align-items: center;
  }
  @media (min-width: 52rem) {
    .hero {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }
  }
  .words {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  .line {
    margin: 0;
    font-family: var(--title);
    font-size: clamp(30px, 6vw, 44px);
    line-height: 1.12;
  }
  .steps {
    display: grid;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  @media (min-width: 52rem) {
    .steps {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  .steps li {
    display: flex;
    gap: var(--space-3);
    align-items: center;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--words);
    border-radius: var(--corner);
    background: var(--raised);
  }
  .n {
    flex: none;
    color: var(--touch);
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
