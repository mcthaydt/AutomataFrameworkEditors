<script lang="ts">
  import { formatDiagnostic, type Level, parseContent } from '@automataframework/framework/headless'
  import { onMount } from 'svelte'
  import { can } from '../access/access.ts'
  import type { Api } from '../api/api.ts'
  import { type Opened, openGame } from '../game/game.ts'
  import { compareLevels, Levels } from '../levels/levels.ts'
  import { Button, Notice, Screen } from '../ui/ui.ts'
  import type { GameRef, ProblemKind, WaitingChange } from '../wire/wire.ts'
  import { WORDS } from '../words/words.ts'

  // One waiting change: the level as it would be, what moved, and the buttons that suit who is looking.
  interface Props {
    api: Api
    game: GameRef
    number: number
    onsignedout: () => void
    onback: () => void
    /** To the game's page. */
    onhome: () => void
  }
  let { api, game: ref, number, onsignedout, onback, onhome }: Props = $props()

  let opened = $state.raw<Opened | undefined>(undefined)
  let change = $state.raw<WaitingChange | undefined>(undefined)
  let failed = $state<ProblemKind | undefined>(undefined)
  let busy = $state(false)
  let done = $state<'approved' | 'turned-down' | undefined>(undefined)
  let said = $state<string | undefined>(undefined)
  /** The change was waiting a moment ago and is not any more (someone else approved it, or turned it down). */
  let wentAway = $state(false)

  async function load(): Promise<void> {
    opened = undefined
    change = undefined
    failed = undefined
    const [game, asked] = await Promise.all([openGame(api, ref), api.change({ game: ref, number })])
    if (!game.ok && game.problem === 'signed-out') return onsignedout()
    if (!asked.ok && asked.problem === 'signed-out') return onsignedout()
    opened = game
    if (asked.ok) change = asked.value
    else failed = asked.problem
  }
  onMount(() => void load())

  const back = $derived({ label: WORDS.back, onpress: onback })
  /** The game opened, and the change is not there: followed an old link, or someone else was quicker. */
  const gone = $derived(wentAway || (failed === 'not-found' && opened?.ok === true))
  /** What is wrong when the game itself could not be opened, in the words the game's own page uses. */
  const trouble = $derived.by((): { text: string; again: boolean; lines?: readonly string[] } => {
    if (opened === undefined || opened.ok) return { text: WORDS.cantReach, again: true }
    switch (opened.problem) {
      case 'broken':
        return { text: WORDS.brokenGame, again: false, lines: opened.diagnostics.map(formatDiagnostic) }
      case 'not-a-game':
        return { text: WORDS.notAGame, again: false }
      case 'not-found':
      case 'not-allowed':
        return { text: WORDS.cantFindGame, again: false }
      default:
        return { text: WORDS.cantReach, again: true }
    }
  })

  /** The level this change is about, as it was and as it would be, with the sentence for each move. */
  const shown = $derived.by(() => {
    if (change === undefined || opened === undefined || !opened.ok) return undefined
    const paths = new Set(
      opened.game.content.project.content.filter((c) => c.type === 'level').map((c) => c.path),
    )
    const levels = change.changes.filter((c) => paths.has(c.path) && c.after !== undefined)
    const first = levels[0]
    if (first === undefined || first.after === undefined) return undefined
    const after = parseContent('level', first.after, first.path)
    if (!after.ok) return undefined
    const was = first.before === undefined ? undefined : parseContent('level', first.before, first.path)
    const before: Level | undefined = was?.ok ? was.value : undefined
    const compared = before === undefined ? { moved: [], other: 1 } : compareLevels(before, after.value)
    return {
      level: after.value,
      moved: compared.moved,
      other: compared.other + (levels.length - 1) + (change.changes.length - levels.length),
    }
  })

  /** What this person may do with the change. */
  const role = $derived.by(() => {
    if (opened === undefined || !opened.ok || change === undefined) return 'none' as const
    const level = opened.game.level
    const mine = change.mine
    if (can(level, 'approve') && (!mine || can(level, 'save-direct'))) return 'approver' as const
    if (mine) return can(level, 'approve') ? ('own-approver' as const) : ('own' as const)
    return 'none' as const
  })

  async function act(what: 'approve' | 'turn-down'): Promise<void> {
    if (busy) return
    busy = true
    said = undefined
    const answer =
      what === 'approve'
        ? await api.approve({ game: ref, number })
        : await api.turnDown({ game: ref, number })
    busy = false
    if (answer.ok) {
      done = what === 'approve' ? 'approved' : 'turned-down'
      return
    }
    const WORDS_FOR: Partial<Record<ProblemKind, string>> = {
      clashes: WORDS.clashes,
      'not-ready': WORDS.checksRunning,
      'checks-failed': WORDS.checksFailed,
      'own-change': WORDS.ownChange,
      blocked: WORDS.blockedOwner,
      'not-allowed': WORDS.cantApprove,
      offline: WORDS.offline,
      busy: WORDS.busy,
    }
    if (answer.problem === 'signed-out') return onsignedout()
    // The game is fine; the change is gone. Pressing the button again can only fail again.
    if (answer.problem === 'not-found') {
      wentAway = true
      return
    }
    said = WORDS_FOR[answer.problem] ?? WORDS.saveFailed
  }
</script>

{#if opened === undefined && failed === undefined}
  <Screen title={WORDS.waitingTitle} {back}><p>{WORDS.loading}</p></Screen>
{:else if done !== undefined}
  <Screen title={change?.title ?? WORDS.waitingTitle}>
    <Notice kind="good" text={done === 'approved' ? WORDS.approved : WORDS.turnedDown} />
    <div><Button label={WORDS.back} kind="primary" onpress={onhome} /></div>
  </Screen>
{:else if gone}
  <Screen title={WORDS.waitingTitle}>
    <Notice kind="info" text={WORDS.changeGone} />
    <div><Button label={WORDS.back} kind="primary" onpress={onhome} /></div>
  </Screen>
{:else if change === undefined || opened === undefined || !opened.ok}
  <Screen title={WORDS.waitingTitle} {back}>
    <Notice kind="problem" text={trouble.text} />
    {#if trouble.lines !== undefined}
      <ul class="lines">
        {#each trouble.lines as line (line)}<li>{line}</li>{/each}
      </ul>
    {/if}
    {#if trouble.again}<div><Button label={WORDS.tryAgain} kind="primary" onpress={() => void load()} /></div>{/if}
  </Screen>
{:else}
  <Screen title={change.title} {back}>
    <p class="by">{change.mine ? WORDS.waitingMine : WORDS.waitingBy(change.by)}</p>
    {#if shown !== undefined}
      <div class="picture">
        <Levels
          readOnly
          level={shown.level}
          characters={opened.game.content.characters}
          hero={opened.game.content.project.hero}
          marked={shown.moved.map((m) => m.id)}
          canSave={false}
          status="clean"
          statusText=""
          title={shown.level.id}
          onchange={() => {}}
          onsave={() => {}}
        />
      </div>
      <ul class="lines">
        {#each shown.moved as move (move.id)}<li>{WORDS.changeMoved(move.id)}</li>{/each}
        {#if shown.other > 0}<li>{WORDS.changeOther}</li>{/if}
      </ul>
    {:else}
      <!-- A change that moves nothing in a level (another kind of file, or a level taken away): say so. -->
      <p>{WORDS.changeOther}</p>
    {/if}
    {#if said !== undefined}<Notice kind="problem" text={said} />{/if}
    {#if role === 'approver'}
      {#if !change.here}
        <Notice kind="info" text={WORDS.notHere} />
      {:else if change.checks === 'running'}
        <Notice kind="info" text={WORDS.checksRunning} />
      {:else if change.checks === 'failing'}
        <Notice kind="problem" text={WORDS.checksFailed} />
      {/if}
      <div class="actions">
        {#if change.here}
          <Button
            label={WORDS.approve}
            kind="primary"
            disabled={busy || change.checks === 'running' || change.checks === 'failing'}
            onpress={() => void act('approve')}
          />
        {/if}
        <Button label={WORDS.turnDown} disabled={busy} onpress={() => void act('turn-down')} />
      </div>
    {:else if role === 'own-approver' || role === 'own'}
      {#if role === 'own-approver'}<Notice kind="info" text={WORDS.ownChange} />{/if}
      <div class="actions">
        <Button label={WORDS.takeBack} disabled={busy} onpress={() => void act('turn-down')} />
      </div>
    {:else}
      <Notice kind="info" text={WORDS.cantApprove} />
    {/if}
  </Screen>
{/if}

<style>
  .by {
    margin: 0;
    color: var(--muted);
  }
  /* The read-only picture needs a height of its own: it is made to fill what it is given. */
  .picture {
    display: flex;
    flex-direction: column;
    height: min(60vh, 28rem);
  }
  .lines {
    margin: 0;
    padding-left: var(--space-3);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
</style>
