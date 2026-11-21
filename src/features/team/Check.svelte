<script lang="ts">
  // Someone else's waiting changes, looked at over the level they are about: the changes ringed, the game's problems
  // first, a way to play them, and then three answers: put them in, ask for a change in words, or don't put them in
  // (which is at once, and has an Undo). The sheet is glass; the level under it is the changed level.
  import { formatDiagnostic } from '@automataframework/framework/headless'
  import { onMount } from 'svelte'
  import { can } from '../access/access.ts'
  import type { Api } from '../api/api.ts'
  import { approverOf, type Edits, type Opened, openGame, type Problem, problemsOf, sayProblem, startEdits } from '../game/game.ts'
  import { Stage } from '../levels/levels.ts'
  import { PlayPart } from '../play/play.ts'
  import { Action, Sheet } from '../ui/ui.ts'
  import type { GameRef, ProblemKind, WaitingChange } from '../wire/wire.ts'
  import { type Lang, nameOf, type Row, wordsIn } from '../words/words.ts'
  import AskSheet from './AskSheet.svelte'
  import { changeAsWorking } from './check.ts'
  import Lines from './Lines.svelte'

  interface Props {
    api: Api
    game: GameRef
    number: number
    lang: Lang
    onsignedout: () => void
    /** Back to the list of what waits. */
    onback: () => void
    /** Back to the level. */
    onhome: () => void
    /** Told once the change is found not to be waiting any more: there is nothing of it left to draw. */
    ongone?: (() => void) | undefined
  }
  let { api, game: ref, number, lang, onsignedout, onback, onhome, ongone }: Props = $props()

  type Step = 'look' | 'ask' | 'put' | 'asked' | 'down' | 'taken' | 'gone'
  let opened = $state.raw<Opened | undefined>(undefined)
  let change = $state.raw<WaitingChange | undefined>(undefined)
  let failed = $state<ProblemKind | undefined>(undefined)
  let step = $state<Step>('look')
  let busy = $state(false)
  let said = $state<string | undefined>(undefined)
  let askFailed = $state(false)
  let playing = $state(false)
  let cantPlay = $state.raw<readonly string[] | undefined>(undefined)
  let problems = $state.raw<readonly Problem[]>([])

  const words = $derived(wordsIn(lang))
  const c = $derived(words.check)
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row

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

  const game = $derived(opened?.ok === true ? opened.game : undefined)
  const checked = $derived(game === undefined || change === undefined ? undefined : changeAsWorking(game, change))
  const edits = $derived<Edits | undefined>(
    checked === undefined || game === undefined
      ? undefined
      : { base: startEdits(game).base, now: checked.working, past: [], future: [] },
  )
  const by = $derived(change?.by ?? '')
  /** Who checks the person's own change: the waiting sheet's name for them, never the author's own. */
  const checker = $derived(game === undefined ? '' : approverOf(game))
  const count = $derived(Math.max(1, checked?.lines.length ?? 0))
  /** The level the change is about: the first one it touches, else the game's start. */
  const levelId = $derived.by(() => {
    if (checked === undefined || game === undefined) return undefined
    const first = checked.lines[0]?.level
    const id = first !== undefined && checked.working.levels[first] !== undefined ? first : game.content.project.start
    return checked.working.levels[id] === undefined ? Object.keys(checked.working.levels)[0] : id
  })
  const level = $derived(levelId === undefined ? undefined : checked?.working.levels[levelId])
  const marked = $derived(
    (checked?.lines ?? []).flatMap((line) => ('thing' in line && line.level === levelId ? [line.thing] : [])),
  )
  const role = $derived.by(() => {
    if (game === undefined || change === undefined) return 'none' as const
    if (can(game.level, 'approve') && (!change.mine || can(game.level, 'save-direct'))) return 'approver' as const
    return change.mine ? ('own' as const) : ('none' as const)
  })

  // The game's own check of the changes, a moment after they are shown: a problem never stops them being put in.
  $effect(() => {
    const [now, held] = [edits, game]
    if (now === undefined || held === undefined) return
    let stale = false
    void problemsOf(held, now).then((found) => {
      if (!stale) problems = found
    })
    return () => {
      stale = true
    }
  })

  /** What a refusal says, in the person's words. */
  function wordsFor(problem: ProblemKind): string {
    switch (problem) {
      case 'clashes':
        return text(c.noFit)
      case 'not-ready':
        return text(c.checksRunning)
      case 'checks-failed':
        return text(c.checksFailed)
      case 'own-change':
        return text(c.ownChange)
      case 'not-allowed':
        return text(c.cantApprove)
      case 'blocked':
        return text(words.changes.failBlocked, ref.owner)
      default:
        return text(c.failNow)
    }
  }
  /** Runs one answer; a change that is gone says so, a sign-out goes to sign in, anything else is said and can be retried. */
  async function answer(call: () => ReturnType<Api['approve']>, then: Step): Promise<boolean> {
    if (busy) return false
    busy = true
    said = undefined
    const result = await call()
    busy = false
    if (result.ok) {
      step = then
      return true
    }
    if (result.problem === 'signed-out') onsignedout()
    else if (result.problem === 'not-found') step = 'gone'
    else said = wordsFor(result.problem)
    return false
  }
  const put = (): Promise<boolean> => answer(() => api.approve({ game: ref, number }), 'put')
  const turnDown = (): Promise<boolean> => answer(() => api.turnDown({ game: ref, number }), 'down')
  const takeBack = (): Promise<boolean> => answer(() => api.turnDown({ game: ref, number }), 'taken')
  async function undo(): Promise<void> {
    if (await answer(() => api.reopen({ game: ref, number }), 'look')) await load()
  }
  async function ask(wordsSaid: string): Promise<void> {
    askFailed = false
    if (!(await answer(() => api.askChange({ game: ref, number, words: wordsSaid }), 'asked'))) askFailed = true
  }
  const noPlay = (lines: readonly string[]): void => {
    playing = false
    cantPlay = lines
  }
  const trouble = $derived.by((): { text: string; again: boolean; lines?: readonly string[] } => {
    if (opened === undefined || opened.ok) return { text: text(c.cantReach), again: true }
    if (opened.problem === 'broken') {
      return { text: text(c.broken), again: false, lines: opened.diagnostics.map(formatDiagnostic) }
    }
    if (opened.problem === 'not-found' || opened.problem === 'not-allowed') {
      return { text: text(c.cantFind), again: false }
    }
    return { text: text(c.cantReach), again: true }
  })
  const gone = $derived(step === 'gone' || (failed === 'not-found' && opened?.ok === true))
  $effect(() => {
    if (gone) ongone?.()
  })
</script>

<div class="check" {lang}>
  {#if game !== undefined && level !== undefined && levelId !== undefined && !gone}
    <div class="level">
      {#if playing && edits !== undefined}
        <PlayPart
          {game}
          {edits}
          level={levelId}
          {lang}
          big={false}
          waiting={false}
          onbig={() => {}}
          onstarted={() => {}}
          onproblem={noPlay}
        />
      {:else}
        <Stage {level} content={game.content} pictures={game.pictures} {marked} label={nameOf(levelId)} />
      {/if}
    </div>
  {/if}

  {#if opened === undefined && failed === undefined}
    <Sheet title={text(c.loading)} close={text(c.notNow)} onclose={onhome} side><p>{text(c.loading)}</p></Sheet>
  {:else if gone}
    <Sheet title={text(c.goneTitle)} close={text(c.notNow)} onclose={onhome} side>
      <p role="status">{text(c.gone)}</p>
      {#snippet foot()}<Action label={text(words.shell.close)} icon="check" kind="main" onpress={onhome} />{/snippet}
    </Sheet>
  {:else if game === undefined || change === undefined}
    <Sheet title={text(c.cantReach)} close={text(c.notNow)} onclose={onback} side>
      <p role="alert">{trouble.text}</p>
      {#if trouble.lines !== undefined}
        <ul>{#each trouble.lines as line (line)}<li>{line}</li>{/each}</ul>
      {/if}
      {#snippet foot()}
        {#if trouble.again}<Action label={text(c.tryAgain)} icon="arrow-clockwise" kind="main" onpress={() => void load()} />{/if}
        <Action label={text(c.notNow)} onpress={onback} />
      {/snippet}
    </Sheet>
  {:else if playing}
    <div class="stop"><Action label={text(c.stopPlaying)} icon="stop" kind="main" onpress={() => (playing = false)} /></div>
  {:else if step === 'ask'}
    <AskSheet {lang} {by} count={count} working={busy} failed={askFailed} onsend={(w) => void ask(w)} onback={() => (step = 'look')} />
  {:else if step === 'put'}
    <Sheet title={text(c.putDoneTitle)} close={text(words.shell.close)} onclose={onhome} side>
      <p role="status">{text(c.putDoneAbout, count)}</p>
      {#snippet foot()}<Action label={text(words.shell.close)} icon="check" kind="main" onpress={onhome} />{/snippet}
    </Sheet>
  {:else if step === 'asked'}
    <Sheet title={text(c.askedDoneTitle, by)} close={text(words.shell.close)} onclose={onhome} side>
      <p role="status">{text(c.askedDoneAbout, by)}</p>
      {#snippet foot()}<Action label={text(words.shell.close)} icon="check" kind="main" onpress={onhome} />{/snippet}
    </Sheet>
  {:else if step === 'down'}
    <Sheet title={text(c.downTitle, by, count)} close={text(words.shell.close)} onclose={onhome} side>
      <p role="status">{text(c.downAbout, by)}</p>
      {#if said !== undefined}<p role="alert">{said}</p>{/if}
      {#snippet foot()}
        <Action label={text(c.undo)} icon="arrow-counter-clockwise" disabled={busy} onpress={() => void undo()} />
        <Action label={text(words.shell.close)} icon="check" kind="main" onpress={onhome} />
      {/snippet}
    </Sheet>
  {:else if step === 'taken'}
    <Sheet title={text(words.changes.takeBack)} close={text(words.shell.close)} onclose={onhome} side>
      <p role="status">{text(words.changes.takenBack)}</p>
      {#snippet foot()}<Action label={text(words.shell.close)} icon="check" kind="main" onpress={onhome} />{/snippet}
    </Sheet>
  {:else}
    {@const waiting = change}
    <Sheet
      title={role === 'own' ? text(words.changes.waitTitle, checker) : text(c.checkTitle, by, count)}
      close={text(c.notNow)}
      onclose={onback}
      side
    >
      <p>{role === 'own' ? text(words.changes.waitAbout, checker) : text(c.checkAbout)}</p>
      {#if cantPlay !== undefined}
        <div class="problem" role="alert">
          <b>{text(words.play.cantPlay)}</b>
          {#each cantPlay as line (line)}<small>{line}</small>{/each}
        </div>
      {/if}
      {#if problems[0] !== undefined}
        <div class="problem" role="alert">
          <b>{text(words.bar.problems, problems.length)}: {sayProblem(problems[0], (a, b) => text(words.arrange.wallBody, a, b))}</b>
          {#if role === 'approver'}<small>{text(c.problemNote)}</small>{/if}
        </div>
      {/if}
      {#if checked !== undefined}
        <Lines {words} lines={checked.lines} />
        {#if checked.other > 0 || checked.lines.length === 0}<p class="other">{text(c.otherChange)}</p>{/if}
      {/if}
      {#if said !== undefined}<p role="alert">{said}</p>{/if}
      {#if role === 'approver'}
        {#if !waiting.here}<p role="status">{text(c.notHere)}</p>
        {:else if waiting.checks === 'running'}<p role="status">{text(c.checksRunning)}</p>
        {:else if waiting.checks === 'failing'}<p role="alert">{text(c.checksFailed)}</p>{/if}
      {:else if role === 'none'}
        <p role="status">{text(c.cantApprove)}</p>
      {:else if game !== undefined && can(game.level, 'approve')}
        <p role="status">{text(c.ownChange)}</p>
      {/if}
      {#snippet foot()}
        {#if checked !== undefined && levelId !== undefined}
          <Action label={text(c.playThem)} icon="play" onpress={() => ((cantPlay = undefined), (playing = true))} />
        {/if}
        {#if role === 'approver'}
          {#if waiting.here}
            <Action
              label={text(c.putThem)}
              icon="check"
              kind="main"
              disabled={busy || waiting.checks === 'running' || waiting.checks === 'failing'}
              onpress={() => void put()}
            />
            <Action label={text(c.askFor)} icon="chat-circle-text" disabled={busy} onpress={() => (step = 'ask')} />
          {/if}
          <Action label={text(c.dontPut)} icon="x-circle" disabled={busy} onpress={() => void turnDown()} />
        {:else if role === 'own'}
          <Action label={text(words.changes.takeBack)} icon="arrow-counter-clockwise" disabled={busy} onpress={() => void takeBack()} />
        {/if}
      {/snippet}
    </Sheet>
  {/if}
</div>

<style>
  /* Over the editor's level, under its top bar: the changed level is drawn in the same place, and only the sheet takes touches. */
  .check {
    position: absolute;
    inset: 0;
    z-index: 15;
    pointer-events: none;
  }
  .check :global(.sheet),
  .stop,
  .level {
    pointer-events: auto;
  }
  /* The changed level, under the glass. */
  .level {
    isolation: isolate; /* the rings stay under the sheet */
    position: absolute;
    inset: calc(var(--bar) + 20px) 0 0;
    display: flex;
    flex-direction: column;
    padding: 0 8px 8px;
  }
  /* A phone's sheet comes up from the foot: the level is drawn above it, so the rings are not hidden. */
  @media (max-width: 500px) {
    .level {
      bottom: 55%;
    }
  }
  /* Between a phone and a wide screen the kit's sheet sits in the middle, on top of the changes: here it goes to the
     side as it does on a wide screen, and the level is drawn in the room that is left. */
  @media (min-width: 501px) and (max-width: 899px) {
    .level {
      right: calc(min(400px, 36%) + 16px);
    }
    .check :global(.sheet) {
      inset: calc(var(--bar) + 20px) 8px 8px auto;
      margin: 0;
      width: min(400px, 36%);
    }
  }
  /* An iPad held upright: the level has the room above, and the sheet comes from the foot (the check sheet's sketch). */
  @media (min-width: 700px) and (orientation: portrait) {
    .level {
      right: 0;
      bottom: calc(45% + 16px);
    }
    .check :global(.sheet.side[role='dialog']) {
      inset: auto 8px 8px 8px;
      margin: 0 auto;
      width: min(720px, calc(100% - 16px));
      max-height: 45%;
    }
  }
  /* A phone held sideways has little height: the buttons go two to a row, so what the change is about stays in sight. */
  @media (max-height: 500px) and (orientation: landscape) {
    .check :global(.sheet.side[role='dialog']) {
      width: min(440px, 52%);
    }
    .level {
      right: calc(min(440px, 52%) + 16px);
    }
    .check :global(.sheet footer) {
      display: grid;
      grid-template-columns: 1fr 1fr;
      padding: 8px 12px 10px;
    }
  }
  /* A side sheet starts below the top bar, so it is cut to the room under it: one that is taller would be scrolled into
     view, and the whole page with it. */
  @media (min-width: 501px) {
    .check :global(.sheet) {
      max-height: calc(100% - var(--bar) - 28px);
    }
  }
  .stop {
    position: absolute;
    right: 16px;
    bottom: 16px;
    z-index: 40;
  }
  p {
    margin: 0 0 12px;
  }
  ul {
    margin: 0 0 12px;
    padding-left: 18px;
    overflow-wrap: anywhere;
  }
  .other {
    margin-top: 12px;
    color: var(--g-quiet);
    font-size: 13px;
  }
  .problem {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    margin-bottom: 12px;
    padding: 12px;
    border: 1px solid var(--problem);
    border-radius: 12px;
  }
  small {
    color: var(--g-quiet);
    font-size: 13px;
  }
</style>
