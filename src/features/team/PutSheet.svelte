<script lang="ts">
  // Putting changes in the game, or sending them to be checked. It lists what changed, the game's problems first, and
  // has one main button. When it could not go it says what happened and that nothing is lost; when it went it says so.
  import type { ChangeLine, Problem } from '../game/game.ts'
  import { Action, Sheet } from '../ui/ui.ts'
  import { type Lang, type Row, wordsIn } from '../words/words.ts'
  import Lines from './Lines.svelte'
  import type { Failure, Phase } from './sheets.ts'

  interface Props {
    lang: Lang
    /** Put them in the game, or send them to be checked. */
    kind: 'put' | 'send'
    phase: Phase
    lines: readonly ChangeLine[]
    problems: readonly Problem[]
    /** The game asks for every problem to be fixed first. */
    stops: boolean
    /** Who checks, said by name; empty when not known. */
    by: string
    /** Someone already has the person's first changes, and these are more. */
    waiting: boolean
    gameName: string
    failure: Failure | undefined
    /** What came in from the game while the person worked, and how many of their own it did not take. */
    came: number
    clashes: number
    onput: () => void
    onshow: (problem: Problem) => void
    ontakeback: () => void
    onclose: () => void
  }
  let {
    lang,
    kind,
    phase,
    lines,
    problems,
    stops,
    by,
    waiting,
    gameName,
    failure,
    came,
    clashes,
    onput,
    onshow,
    ontakeback,
    onclose,
  }: Props = $props()

  const words = $derived(wordsIn(lang))
  const c = $derived(words.changes)
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row
  const n = $derived(lines.length)
  const first = $derived(problems[0])
  const blocked = $derived(stops && problems.length > 0)

  const title = $derived(
    phase === 'done'
      ? text(c.doneTitle)
      : phase === 'sent'
        ? text(c.sentTitle, by)
        : phase === 'failed'
          ? text(kind === 'put' ? c.failPut : c.failSend)
          : kind === 'put'
            ? text(c.putTitle, n)
            : waiting
              ? text(c.waitMoreTitle, by)
              : text(c.sendTitle, n, by),
  )
  const failWords = $derived.by((): string => {
    const f = failure
    if (f === undefined) return ''
    switch (f.problem) {
      case 'offline':
        return text(c.failOffline, n)
      case 'busy':
        return text(c.failBusy, n)
      case 'broken':
        return text(c.failBroken)
      case 'blocked':
        return text(c.failBlocked)
      case 'not-allowed':
        return text(c.failLook)
      default:
        return text(c.failElse)
    }
  })
  const sendWords = $derived(
    problems.length > 0 && !blocked
      ? text(c.sendAnyway)
      : kind === 'send' && waiting
        ? text(c.sendIt, n)
        : text(c.sendThem, by),
  )
  const mainWords = $derived(
    kind === 'put' ? (problems.length > 0 ? text(c.putAnyway) : text(c.putThem)) : sendWords,
  )
</script>

<div class="scrim">
  <Sheet {title} close={text(words.shell.close)} {onclose} side>
    {#if phase === 'done'}
      <p>{text(c.doneAbout, gameName, n)}</p>
    {:else if phase === 'sent'}
      <p>{text(c.sentAbout)}</p>
    {:else if phase === 'working'}
      <p role="status">{text(c.working)}</p>
    {:else if phase === 'failed'}
      <p role="alert">{failWords}</p>
      {#if failure !== undefined && failure.details.length > 0}
        <ul class="details">
          {#each failure.details as line (line)}<li>{line}</li>{/each}
        </ul>
      {/if}
      <Lines {words} {lines} />
    {:else}
      <p>
        {#if kind === 'put'}{text(c.putAbout, text(c.thisDevice))}{:else if waiting}{text(c.waitMoreAbout, n)}{:else}{text(c.sendAbout, by, text(c.thisDevice))}{/if}
      </p>
      {#if came > 0}<p class="note" role="status">{text(c.cameIn, came)}</p>{/if}
      {#if clashes > 0}<p class="note" role="status">{text(c.clashed, clashes)}</p>{/if}
      {#if first !== undefined}
        <div class="problem" role="alert">
          <b>{blocked ? text(c.fixFirst, problems.length) : text(words.bar.problems, problems.length)}: {first.words}</b>
          <small>{blocked ? `${text(c.stopsAbout)} ${text(c.stopsSafe)}` : text(kind === 'put' ? c.warnPut : c.warnSend)}</small>
          <Action label={text(c.showMe)} onpress={() => onshow(first)} />
        </div>
      {/if}
      <Lines {words} {lines} />
      {#if kind === 'send' && !waiting}<p class="after">{text(c.afterSend, by)}</p>{/if}
    {/if}
    {#snippet foot()}
      {#if phase === 'ask'}
        <Action label={mainWords} kind="main" disabled={blocked} onpress={onput} />
        <Action label={text(c.notYet)} onpress={onclose} />
      {:else if phase === 'failed'}
        <Action label={text(c.again)} kind="main" onpress={onput} />
        <Action label={text(c.notNow)} onpress={onclose} />
      {:else if phase === 'sent'}
        <Action label={text(c.takeBack)} onpress={ontakeback} />
        <Action label={text(words.shell.close)} kind="main" onpress={onclose} />
      {:else if phase === 'done'}
        <Action label={text(words.shell.close)} kind="main" onpress={onclose} />
      {/if}
    {/snippet}
  </Sheet>
</div>

<style>
  .scrim {
    position: absolute;
    inset: 0;
    z-index: 30;
    background: var(--dim);
  }
  p {
    margin: 0 0 12px;
  }
  .note {
    padding: 8px 12px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--raised);
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
  .details {
    margin: 0 0 12px;
    padding-left: 18px;
    overflow-wrap: anywhere;
  }
  .after {
    margin: 12px 0 0;
    color: var(--g-quiet);
    font-size: 13px;
  }
</style>
