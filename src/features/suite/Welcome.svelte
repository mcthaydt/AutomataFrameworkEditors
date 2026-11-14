<script lang="ts">
  import { Button, Notice, Screen } from '../ui/ui.ts'
  import { WORDS } from '../words/words.ts'

  // The first screen for someone who needs to sign in: what this is, one big button, and why GitHub is in it at all.
  interface Props {
    /** What happened the last time, if anything: a sign-in cancelled or failed, or one that ran out. */
    notice: 'cancelled' | 'failed' | 'signed-out' | undefined
    /** False when the site has no sign-in set up yet. */
    ready: boolean
    onsignin: () => void
  }
  let { notice, ready, onsignin }: Props = $props()
  const NOTICE_WORDS = {
    cancelled: WORDS.signInCancelled,
    failed: WORDS.signInFailed,
    'signed-out': WORDS.signedOutAgain,
  } as const
</script>

<Screen title={WORDS.appName}>
  <p class="line">{WORDS.welcomeLine}</p>
  {#if !ready}<Notice kind="problem" text={WORDS.signInNotReady} />{/if}
  {#if notice !== undefined}<Notice kind="problem" text={NOTICE_WORDS[notice]} />{/if}
  <div class="action">
    <Button label={WORDS.signIn} kind="primary" disabled={!ready} onpress={onsignin} />
  </div>
  <p class="why">{WORDS.signInWhy}</p>
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
    color: var(--muted);
  }
</style>
