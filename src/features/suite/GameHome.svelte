<script lang="ts">
  import { onMount } from 'svelte'
  import { can } from '../access/access.ts'
  import { formatDiagnostic } from '@automataframework/framework/headless'
  import type { Api } from '../api/api.ts'
  import { forgetGame, type Opened, openGame, rememberGame } from '../game/game.ts'
  import { Button, Icon, Notice, Row, Screen } from '../ui/ui.ts'
  import { WORDS } from '../words/words.ts'
  import type { GameRef } from '../wire/wire.ts'
  import type { GameOpened } from './opened.ts'
  import { routeHash } from './route.ts'

  // A game's page: who you are in it, and its levels. Every way it can go wrong says what to press next.
  interface Props {
    api: Api
    game: GameRef
    remembered: Storage
    /** True when the person has no sign-in: the way back is Welcome, and the words say so. */
    visitor: boolean
    /** Has the person saved a change before? Then an Owner is pointed at Share, once. */
    savedBefore: boolean
    /** Told whenever the game has been asked for: its name, or that it could not be opened. */
    onopened: (said: GameOpened) => void
    onsignin: () => void
    onsignedout: () => void
    onback: () => void
  }
  let { api, game, remembered, visitor, savedBefore, onopened, onsignin, onsignedout, onback }: Props = $props()

  let opened = $state<Opened | undefined>(undefined)

  async function load(): Promise<void> {
    opened = undefined
    const result = await openGame(api, game)
    if (result.ok) rememberGame(remembered, game)
    else if (result.problem === 'not-found' || result.problem === 'not-allowed') forgetGame(remembered, game)
    if (!result.ok && result.problem === 'signed-out') return onsignedout()
    opened = result
    const refused = !result.ok && (result.problem === 'not-found' || result.problem === 'not-allowed')
    onopened({ name: result.ok ? result.game.content.project.name : undefined, askSignIn: refused && visitor })
  }
  onMount(() => void load())

  // Two one-time tips, each shown until it is dismissed.
  const tipDone = (key: string): boolean => {
    try {
      return remembered.getItem(key) !== null
    } catch {
      return false
    }
  }
  let shareTipGone = $state(tipDone('af.tip.share'))
  let approveTipGone = $state(tipDone('af.tip.approve'))
  function dismiss(key: string): void {
    try {
      remembered.setItem(key, '1')
    } catch {
      // It may come back next time; nothing is lost.
    }
    if (key === 'af.tip.share') shareTipGone = true
    else approveTipGone = true
  }

  const back = $derived({ label: WORDS.back, onpress: onback })
  const levelIds = $derived(opened?.ok ? Object.keys(opened.game.content.levels) : [])
</script>

{#if opened === undefined}
  <Screen title={`${game.owner}/${game.name}`} {back}><p>{WORDS.loading}</p></Screen>
{:else if opened.ok}
  <Screen title={opened.game.content.project.name} {back}>
    <Notice
      kind="info"
      text={opened.game.login === undefined ? WORDS.visitorCan : WORDS.youAre(opened.game.level)}
    />
    {#if opened.game.mine !== undefined}<Notice kind="info" text={WORDS.mineWaiting} />{/if}
    {#if opened.game.level === 'owner' && opened.game.login !== undefined && savedBefore && !shareTipGone}
      <Notice kind="info" text={WORDS.tipShare} />
      <div><Button label={WORDS.tipGotIt} onpress={() => dismiss('af.tip.share')} /></div>
    {/if}
    {#if can(opened.game.level, 'approve') && opened.game.waiting - (opened.game.mine === undefined ? 0 : 1) > 0 && !approveTipGone}
      <Notice kind="info" text={WORDS.tipApprove} />
      <div><Button label={WORDS.tipGotIt} onpress={() => dismiss('af.tip.approve')} /></div>
    {/if}
    {#if opened.game.level === 'owner' && opened.game.login !== undefined}
      <Row href={routeHash({ screen: 'share', owner: game.owner, name: game.name })} name={WORDS.share} icon="share" />
    {/if}
    {#if opened.game.waiting > 0}
      <Row
        href={routeHash({ screen: 'waiting', owner: game.owner, name: game.name })}
        name={WORDS.waitingRow(opened.game.waiting)}
        icon="waiting"
      />
    {/if}
    <h2 class="label"><Icon name="world" /> {WORDS.gameLevels}</h2>
    <ul class="levels">
      {#each levelIds as id (id)}
        <li>
          <Row href={routeHash({ screen: 'level', owner: game.owner, name: game.name, level: id })} name={id} />
        </li>
      {/each}
    </ul>
    <p class="soon">{WORDS.gameMoreSoon}</p>
  </Screen>
{:else if opened.problem === 'broken'}
  <Screen title={`${game.owner}/${game.name}`} {back}>
    <Notice kind="problem" text={WORDS.brokenGame} />
    <ul class="problems">
      {#each opened.diagnostics as diagnostic (formatDiagnostic(diagnostic))}
        <li>{formatDiagnostic(diagnostic)}</li>
      {/each}
    </ul>
  </Screen>
{:else if opened.problem === 'not-a-game'}
  <Screen title={`${game.owner}/${game.name}`} {back}><Notice kind="problem" text={WORDS.notAGame} /></Screen>
{:else if opened.problem === 'not-found' || opened.problem === 'not-allowed'}
  <Screen title={`${game.owner}/${game.name}`} {back}>
    {#if visitor}
      <Notice kind="problem" text={WORDS.cantFindVisitor} />
      <div><Button label={WORDS.signIn} kind="primary" onpress={onsignin} /></div>
    {:else}
      <Notice kind="problem" text={WORDS.cantFindGame} />
    {/if}
  </Screen>
{:else}
  <Screen title={`${game.owner}/${game.name}`} {back}>
    <Notice kind="problem" text={WORDS.cantReach} />
    <div><Button label={WORDS.tryAgain} icon="again" kind="primary" onpress={() => void load()} /></div>
  </Screen>
{/if}

<style>
  h2 {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    margin: 0;
    color: var(--quiet);
  }
  .levels,
  .problems {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .problems {
    padding-left: var(--space-3);
    list-style: disc;
    overflow-wrap: anywhere;
  }
  .soon {
    margin: 0;
    color: var(--quiet);
  }
</style>
