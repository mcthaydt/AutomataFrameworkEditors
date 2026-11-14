<script lang="ts">
  import { formatDiagnostic, type Level } from '@automataframework/framework/headless'
  import { onMount, untrack } from 'svelte'
  import { type AccessLevel, can } from '../access/access.ts'
  import type { Api } from '../api/api.ts'
  import {
    dropDraft,
    keepCopy,
    keepDraft,
    levelCopy,
    type Opened,
    type OpenGame,
    openGame,
    rememberGame,
    saveLevel,
    takeDraft,
  } from '../game/game.ts'
  import {
    describeChange,
    keepNotesMode,
    type LevelEdit,
    Levels,
    type NotesMode,
    readNotesMode,
  } from '../levels/levels.ts'
  import { Button, Notice, Screen } from '../ui/ui.ts'
  import type { GameOpened } from './opened.ts'
  import type { GameRef } from '../wire/wire.ts'
  import { WORDS } from '../words/words.ts'

  // One level on the screen: opens the game, brings back a change that was not saved, shows the editor, and saves.
  // What a person may do is what the API said when it opened the game; the API asks again on every save.
  interface Props {
    api: Api
    game: GameRef
    levelId: string
    remembered: Storage
    /** False for someone who has not signed in. */
    signedIn: boolean
    /** Where an unsaved change is kept on this device. */
    drafts: Storage
    /** The game's own name when the page already knows it: the loading screen says it instead of `owner/name`. */
    gameName?: string | undefined
    /** Told whenever the game has been asked for: its name, or that it could not be opened. */
    onopened: (said: GameOpened) => void
    /** Where the person is in the first run: told whenever it changes. */
    onfacts: (facts: { dirty: boolean; look: boolean }) => void
    /** Told once a save has gone in, and how. */
    onsaved: (how: 'direct' | 'suggestion') => void
    /** Told when a copy was made. */
    onkept: () => void
    onsignin: () => void
    onsignedout: () => void
    onback: () => void
  }
  let { api, game: ref, levelId, remembered, signedIn, drafts, gameName, onopened, onfacts, onsaved, onkept, onsignin, onsignedout, onback }: Props = $props()

  /** A sentence about what just happened, with the buttons it needs. */
  interface Event {
    readonly kind: 'info' | 'good' | 'problem'
    readonly text: string
    readonly details?: readonly string[]
    readonly ask?: 'sign-in' | 'changed-elsewhere' | 'leave'
    /** The level's text, in a box that is selected, where the clipboard was refused. */
    readonly box?: string
  }

  let opened = $state<Opened | undefined>(undefined)
  let game = $state.raw<OpenGame | undefined>(undefined)
  /** What I may do. It can be lowered by a save the API refuses. */
  let level = $state<AccessLevel>('look')
  /** The level the editor was started from; a new one remounts the editor. */
  let start = $state.raw<Level | undefined>(undefined)
  let generation = $state(0)
  let current = $state.raw<Level | undefined>(undefined)
  let saving = $state(false)
  let saved = $state<'direct' | 'suggestion' | undefined>(undefined)
  let events = $state.raw<readonly Event[]>([])
  // The drawing notes' switch is a setting of this device, kept beside the other things the device remembers.
  let notes = $state<NotesMode>(untrack(() => readNotesMode(remembered)))
  const setNotes = (mode: NotesMode): void => {
    notes = mode
    keepNotesMode(remembered, mode)
  }

  const same = (a: Level | undefined, b: Level | undefined): boolean => JSON.stringify(a) === JSON.stringify(b)
  const visitor = $derived(game?.login === undefined)
  const savedLevel = $derived(game?.content.levels[levelId])
  const dirty = $derived(!same(current, savedLevel))
  const canSave = $derived(visitor || can(level, 'save'))
  const status = $derived(saving ? 'saving' : dirty ? 'dirty' : saved !== undefined ? 'saved' : 'clean')
  const statusText = $derived(
    status === 'saving'
      ? WORDS.statusSaving
      : status === 'dirty'
        ? WORDS.statusDirty
        : status === 'saved'
          ? saved === 'suggestion'
            ? WORDS.savedSuggestion
            : WORDS.savedDirect
          : WORDS.statusClean,
  )
  $effect(() => onfacts({ dirty, look: opened?.ok === true && !visitor && !can(level, 'save') }))
  const asked = $derived(events.some((e) => e.ask === 'sign-in' || e.ask === 'leave'))

  function show(next: Opened): void {
    opened = next
    if (!next.ok) return
    game = next.game
    level = next.game.level
    const base = next.game.content.levels[levelId]
    if (base === undefined) return
    const draft = takeDraft(drafts, next.game, levelId)
    start = draft !== undefined && draft !== 'changed' ? draft.level : base
    current = start
    generation += 1
    saved = undefined
    events =
      draft === 'changed'
        ? [{ kind: 'info', text: WORDS.draftDropped }]
        : draft !== undefined
          ? [{ kind: 'good', text: WORDS.draftBack }]
          : []
  }

  async function load(): Promise<void> {
    opened = undefined
    const result = await openGame(api, ref)
    if (!result.ok && result.problem === 'signed-out') return onsignedout()
    if (result.ok) rememberGame(remembered, ref)
    show(result)
    const refused = !result.ok && (result.problem === 'not-found' || result.problem === 'not-allowed')
    onopened({
      name: result.ok ? result.game.content.project.name : undefined,
      askSignIn: refused && !signedIn,
    })
  }
  onMount(() => {
    void load()
    // The browser's own question when the tab is closed with something unsaved.
    const warn = (e: BeforeUnloadEvent): void => {
      if (dirty) e.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  })

  function changed(edit: LevelEdit): void {
    if (game === undefined) return
    current = edit.now
    saved = undefined
    // The next move takes away what was said and asked nothing; an ask stays until it is answered.
    if (events.some((e) => e.ask === undefined)) events = events.filter((e) => e.ask !== undefined)
    if (same(edit.now, savedLevel)) dropDraft(drafts, game, levelId)
    else keepDraft(drafts, game, edit.now)
  }

  async function save(): Promise<void> {
    if (game === undefined || current === undefined || saving) return
    if (visitor) {
      events = [{ kind: 'info', text: WORDS.signInToSave, ask: 'sign-in' }]
      return
    }
    saving = true
    events = []
    const message = describeChange({ opened: savedLevel ?? current, now: current, past: [], future: [] })
    const result = await saveLevel(api, game, current, message)
    saving = false
    if (result.ok) {
      dropDraft(drafts, game, levelId)
      game = result.game
      start = result.game.content.levels[levelId]
      current = start
      generation += 1
      saved = result.how
      onsaved(result.how)
      return
    }
    switch (result.problem) {
      case 'signed-out':
        return onsignedout()
      case 'changed-elsewhere':
        events = [{ kind: 'problem', text: WORDS.changedElsewhere, ask: 'changed-elsewhere' }]
        return
      case 'not-allowed':
        level = 'look'
        return
      case 'broken':
        events = [{ kind: 'problem', text: WORDS.saveFailed, details: result.details ?? [] }]
        return
      case 'blocked':
        events = [{ kind: 'problem', text: WORDS.blockedOwner }]
        return
      case 'offline':
        events = [{ kind: 'problem', text: WORDS.offline }]
        return
      case 'busy':
        events = [{ kind: 'problem', text: WORDS.busy }]
        return
      default:
        events = [{ kind: 'problem', text: WORDS.saveFailed }]
    }
  }

  /** Their version: drops my change and opens the game again. */
  async function takeTheirs(): Promise<void> {
    if (game !== undefined) dropDraft(drafts, game, levelId)
    events = []
    await load()
  }
  const keepMine = (): void => {
    events = []
  }
  /** "Got it": takes away a sentence that asked nothing. */
  const dismiss = (event: Event): void => {
    events = events.filter((e) => e !== event)
  }

  /** The level as it is on the screen now, saved or not. */
  const copyOfNow = () => (game === undefined || current === undefined ? undefined : levelCopy(game, current))

  async function copyText(): Promise<void> {
    const copy = copyOfNow()
    if (copy === undefined) return
    try {
      await navigator.clipboard.writeText(copy.text)
      events = [{ kind: 'good', text: WORDS.copyCopied }]
      onkept()
    } catch {
      // Where the clipboard is not allowed, the text is shown and selected so it can be copied by hand.
      events = [{ kind: 'info', text: WORDS.copySelect, box: copy.text }]
      onkept()
    }
  }
  function copyFile(): void {
    const copy = copyOfNow()
    if (copy === undefined) return
    keepCopy(document, copy)
    events = [{ kind: 'good', text: WORDS.copyKept }]
    onkept()
  }
  let textBox: HTMLTextAreaElement | undefined = $state()
  $effect(() => {
    textBox?.focus()
    textBox?.select()
  })

  function leave(): void {
    if (dirty) events = [{ kind: 'info', text: WORDS.leaveAsk, ask: 'leave' }]
    else onback()
  }
  function leaveForGood(): void {
    if (game !== undefined) dropDraft(drafts, game, levelId)
    onback()
  }

  const title = $derived(opened?.ok ? (game?.content.project.name ?? `${ref.owner}/${ref.name}`) : (gameName ?? `${ref.owner}/${ref.name}`))
  const back = $derived({ label: WORDS.back, onpress: onback })
  const standing = $derived(
    visitor ? WORDS.visitorCan : !can(level, 'save') ? WORDS.lookOnly : game?.mine !== undefined ? WORDS.mineWaiting : '',
  )
</script>

{#if opened === undefined}
  <Screen {title} {back}><p>{WORDS.loading}</p></Screen>
{:else if opened.ok && game !== undefined && start !== undefined && current !== undefined}
  <div class="level">
    <!-- The sentence that is true for as long as the level is open sits in the top panel. -->
    {#snippet standingNote()}
      <Notice kind="info" text={standing} />
    {/snippet}
    <!-- What just happened floats over the level until it is answered. A sentence that asks nothing has "Got it". -->
    {#snippet saidNow()}
      {#each events as event (event.text)}
        <Notice kind={event.kind} text={event.text} />
        {#if event.box !== undefined}
          <textarea class="box measure" readonly rows="8" bind:this={textBox} value={event.box}></textarea>
        {/if}
        {#if event.details !== undefined && event.details.length > 0}
          <ul class="details">
            {#each event.details as line (line)}<li>{line}</li>{/each}
          </ul>
        {/if}
        {#if event.ask === 'sign-in'}
          <div class="actions"><Button label={WORDS.signIn} icon="signIn" kind="primary" onpress={onsignin} /></div>
        {:else if event.ask === 'changed-elsewhere'}
          <div class="actions">
            <Button label={WORDS.takeTheirs} onpress={() => void takeTheirs()} />
            <Button label={WORDS.keepMine} onpress={keepMine} />
          </div>
        {:else if event.ask === 'leave'}
          <div class="actions">
            <Button label={WORDS.leaveNo} kind="primary" onpress={keepMine} />
            <Button label={WORDS.leaveYes} onpress={leaveForGood} />
          </div>
        {:else}
          <div class="actions"><Button label={WORDS.tipGotIt} onpress={() => dismiss(event)} /></div>
        {/if}
      {/each}
    {/snippet}
    {#key generation}
      <Levels
        level={start}
        characters={game.content.characters}
        hero={game.content.project.hero}
        {canSave}
        saveKind={asked ? 'plain' : 'primary'}
        {status}
        {statusText}
        standing={standing !== '' ? standingNote : undefined}
        said={events.length > 0 ? saidNow : undefined}
        stamp={saved !== undefined && game?.login !== undefined ? WORDS.stampSaved(game.login) : undefined}
        {notes}
        onnotes={setNotes}
        title={levelId}
        back={{ label: WORDS.back, onpress: leave }}
        onchange={changed}
        onsave={() => void save()}
        oncopytext={() => void copyText()}
        oncopyfile={copyFile}
      />
    {/key}
  </div>
{:else if opened.ok}
  <Screen {title} {back}><Notice kind="problem" text={WORDS.cantFindGame} /></Screen>
{:else if opened.problem === 'broken'}
  <Screen {title} {back}>
    <Notice kind="problem" text={WORDS.brokenGame} />
    <ul class="details">
      {#each opened.diagnostics as diagnostic (formatDiagnostic(diagnostic))}
        <li>{formatDiagnostic(diagnostic)}</li>
      {/each}
    </ul>
  </Screen>
{:else if opened.problem === 'not-found' || opened.problem === 'not-allowed'}
  <Screen {title} {back}>
    <Notice kind="problem" text={signedIn ? WORDS.cantFindGame : WORDS.cantFindVisitor} />
    {#if !signedIn}<div><Button label={WORDS.signIn} kind="primary" onpress={onsignin} /></div>{/if}
  </Screen>
{:else if opened.problem === 'not-a-game'}
  <Screen {title} {back}><Notice kind="problem" text={WORDS.notAGame} /></Screen>
{:else}
  <Screen {title} {back}>
    <Notice kind="problem" text={WORDS.cantReach} />
    <div><Button label={WORDS.tryAgain} kind="primary" onpress={() => void load()} /></div>
  </Screen>
{/if}

<style>
  .level {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  .box {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid var(--words);
    border-radius: var(--corner);
    background: var(--raised);
    color: var(--words);
  }
  .details {
    margin: 0;
    padding-left: var(--space-3);
    overflow-wrap: anywhere;
  }
</style>
