<script lang="ts">
  // Putting what a person changed into the game, and the sheets around it: what to put in and the game's problems, what
  // waits to be checked, keeping a copy, and looking at one problem. It holds what the sheets are in the middle of;
  // what the person holds (the game, their changes) stays with the screen, which is told each time it changes.
  import { untrack } from 'svelte'
  import type { AccessLevel } from '../access/access.ts'
  import type { Api } from '../api/api.ts'
  import {
    approverOf,
    cameIn,
    type ChangeLine,
    chooseSide,
    keepDrafts,
    type Merged,
    describe,
    type Edits,
    laidOver,
    levelCopy,
    type OpenGame,
    type Problem,
    problemsOf,
    put,
    takeBack,
  } from '../game/game.ts'
  import { type ClashSet, KeepCopy, type Failure, type Phase, ProblemStrip, Problems, PutSheet, WaitingSheet } from '../team/team.ts'
  import { type Lang, wordsIn } from '../words/words.ts'

  interface Props {
    lang: Lang
    device: 'ipad' | 'phone' | 'computer'
    api: Api
    /** The game as the page holds it, and what the person changed in it. */
    game: OpenGame
    edits: Edits
    /** The device's store: what is sent to be checked is kept here until it is answered. */
    drafts: Storage
    /** The level that is open, if one is. */
    level: string | undefined
    /** What is wrong with the game as it would be, 300 ms after the last change. */
    problems?: readonly Problem[]
    /** The game and the person's changes moved: something went in, came in, or was taken back. */
    onchanged: (game: OpenGame, edits: Edits) => void
    /** Something went in: straight into the game, or to be checked. */
    onput: (how: 'direct' | 'suggestion') => void
    /** What the person may do is less than the screen thought. */
    onlowered: (level: AccessLevel) => void
    /** A call got through, or did not: the top bar says "No internet" until one does. */
    ononline: (on: boolean) => void
    onsignin: () => void
    onsignedout: () => void
    /** Open the level or the map where a problem is. */
    onshow: (where: Problem['where']) => void
  }
  let {
    lang,
    device,
    api,
    game,
    edits,
    drafts,
    level,
    problems = $bindable([]),
    onchanged,
    onput,
    onlowered,
    ononline,
    onsignin,
    onsignedout,
    onshow,
  }: Props = $props()

  type Sheet = 'put' | 'send' | 'keep' | 'waiting' | 'problems'
  let shown = $state<Sheet | undefined>(undefined)
  let phase = $state<Phase>('ask')
  let failure = $state<Failure | undefined>(undefined)
  /** What came in from the game while the person worked. */
  let came = $state(0)
  /** Where two people changed one thing: asked one by one, and answered before the put goes on. */
  let clashing = $state.raw<{ held: Merged; set: ClashSet } | undefined>(undefined)
  const clash = $derived(clashing?.set)
  /** What was pressed to go in, kept for the sheet that says it went. */
  let sent = $state.raw<readonly ChangeLine[]>([])
  let backing = $state<'idle' | 'working' | 'taken' | 'failed'>('idle')
  /** The problem being looked at, from 0, and the sheet to go back to. */
  let strip = $state<{ at: number; back: 'put' | 'send' | undefined } | undefined>(undefined)

  const lines = $derived(describe(edits.base, edits.now))
  const by = $derived(approverOf(game))
  const shownLines = $derived(phase === 'ask' ? lines : sent)
  const stops = $derived(game.editors.problems === 'stop')

  /** Opens one of the sheets. */
  export function open(which: Sheet): void {
    phase = 'ask'
    failure = undefined
    came = 0
    clashing = undefined
    backing = 'idle'
    strip = undefined
    shown = which
  }
  const close = (): void => {
    if (phase !== 'working') shown = undefined
  }

  // The game's own check, a moment after the last change, never while a hand is still moving.
  $effect(() => {
    const [now, held] = [edits, game]
    if (now.base === now.now) {
      problems = []
      return
    }
    let stale = false
    const timer = setTimeout(async () => {
      const found = await problemsOf(held, now)
      if (!stale) problems = found
    }, 300)
    return () => {
      stale = true
      clearTimeout(timer)
    }
  })
  // A problem that was mended is no longer looked at.
  $effect(() => {
    const at = untrack(() => strip)
    if (at === undefined) return
    if (problems.length === 0) strip = undefined
    else if (at.at >= problems.length) strip = { ...at, at: problems.length - 1 }
  })

  async function press(): Promise<void> {
    if (phase === 'working') return
    sent = lines
    phase = 'working'
    failure = undefined
    const mineNow = edits.now
    const [before, mine] = [game, edits]
    const result = await put(api, game, edits)
    if (result.ok) {
      // Sent to be checked: a no, or a request for a change, brings these back, so they stay on this device for now.
      if (result.how === 'suggestion') keepDrafts(drafts, before, mine, 'sent')
      ononline(true)
      onchanged(result.game, result.edits)
      onput(result.how)
      phase = result.how === 'direct' ? 'done' : 'sent'
      return
    }
    if (result.problem === 'changed-elsewhere') {
      // Nothing was written. The game as it is now, with the person's changes laid over it, is on screen: press again.
      ononline(true)
      onchanged(result.game, laidOver(edits, result.game, result.merged))
      came = cameIn(result.merged).length
      const who = await whoChanged(result.game.ref)
      clashing =
        result.merged.clashes.length === 0
          ? undefined
          : {
              held: result.merged,
              set: { list: result.merged.clashes, mine: mineNow, theirs: result.merged.their, answers: {}, by: who },
            }
      phase = 'ask'
      return
    }
    if (result.problem === 'signed-out') return onsignedout()
    ononline(result.problem !== 'offline')
    if (result.problem === 'not-allowed') onlowered('look')
    failure = { problem: result.problem, details: result.details ?? [] }
    phase = 'failed'
  }

  /** Who changed the game last, by name, for "So did Mia"; someone else when it is not known. */
  async function whoChanged(ref: OpenGame['ref']): Promise<string> {
    const found = await api.history(ref, 0)
    const by = found.ok ? found.value.lines.find((line) => line.by !== game.login)?.by : undefined
    const someone = wordsIn(lang).whose.someone
    return by ?? (typeof someone === 'string' ? someone : someone())
  }
  /** One answer: that clash goes the way the person says, and the screen shows it so the put sends exactly that. */
  function choose(at: number, whose: 'mine' | 'theirs'): void {
    const now = clashing
    const one = now?.set.list[at]
    if (now === undefined || one === undefined) return
    const next = chooseSide(now.held, now.set.mine, one, whose)
    clashing = { ...now, held: next, set: { ...now.set, answers: { ...now.set.answers, [at]: whose } } }
    onchanged(game, { ...edits, now: next.now })
  }

  async function takeItBack(): Promise<void> {
    shown = 'waiting'
    backing = 'working'
    const result = await takeBack(api, game, edits)
    if (result.ok) {
      ononline(true)
      sent = []
      onchanged(result.game, result.edits)
      backing = 'taken'
      return
    }
    if (result.problem === 'signed-out') return onsignedout()
    ononline(result.problem !== 'offline')
    backing = 'failed'
  }

  function show(at: number): void {
    const found = problems[at]
    if (found === undefined) return
    // Going on to the next problem keeps the way back to the sheet this began in.
    const back = strip !== undefined ? strip.back : shown === 'put' || shown === 'send' ? shown : undefined
    strip = { at, back }
    shown = undefined
    onshow(found.where)
  }
  function onback(): void {
    const back = strip?.back
    strip = undefined
    if (back !== undefined) open(back)
  }
  const copy = $derived.by(() => {
    const current = level === undefined ? undefined : edits.now.levels[level]
    return current === undefined ? undefined : levelCopy(game, current)
  })
  const looked = $derived(strip === undefined ? undefined : problems[strip.at])
</script>

{#if shown === 'put' || shown === 'send'}
  <PutSheet
    {lang}
    {device}
    kind={shown}
    {phase}
    lines={shownLines}
    {problems}
    {stops}
    {by}
    waiting={game.mine !== undefined}
    gameName={game.content.project.name}
    {failure}
    {came}
    {clash}
    content={game.content}
    pictures={game.pictures}
    onchoose={choose}
    onput={() => void press()}
    onshow={(found) => show(problems.indexOf(found))}
    ontakeback={() => void takeItBack()}
    onclose={close}
  />
{:else if shown === 'waiting'}
  <WaitingSheet
    {lang}
    {by}
    lines={sent}
    title={game.mine?.title ?? ''}
    working={backing === 'working'}
    taken={backing === 'taken'}
    failed={backing === 'failed'}
    ontakeback={() => void takeItBack()}
    onclose={() => (shown = undefined)}
  />
{:else if shown === 'keep'}
  <KeepCopy
    {lang}
    gameName={game.content.project.name}
    {copy}
    {level}
    {lines}
    signedIn={game.login !== undefined}
    {onsignin}
    onclose={close}
  />
{:else if shown === 'problems'}
  <Problems {lang} {problems} onshow={show} onclose={close} />
{/if}
{#if strip !== undefined && looked !== undefined}
  <ProblemStrip
    {lang}
    at={strip.at + 1}
    of={problems.length}
    words={looked.words}
    back={strip.back}
    onnext={() => show((strip?.at ?? 0) + 1 >= problems.length ? 0 : (strip?.at ?? 0) + 1)}
    {onback}
  />
{/if}
