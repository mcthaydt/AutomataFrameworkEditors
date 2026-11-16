<script lang="ts">
  import { onMount, untrack } from 'svelte'
  import { type AccessLevel, can } from '../access/access.ts'
  import type { Api } from '../api/api.ts'
  import { deviceWord, type Me, nextPointers, type Pointers, rowSize, sizeClass } from '../device/device.ts'
  import {
    describe,
    dropDrafts,
    type Edits,
    inLevel,
    isChanged,
    keepCopy,
    keepDrafts,
    levelCopy,
    type OpenGame,
    redo,
    saveLevel,
    titleOf,
    undo,
  } from '../game/game.ts'
  import { moveThing, nudgeThing, type Point, Stage, startEdit } from '../levels/levels.ts'
  import {
    commandFor,
    type Docks,
    layout,
    ListPanel,
    SettingsPanel,
    type StatusFacts,
    Toolbar,
    TopBar,
  } from '../shell/shell.ts'
  import { type Route, Share, Waiting, WaitingChange, withoutSheet } from '../team/team.ts'
  import { nameOf, type Row, WORDS, wordsIn } from '../words/words.ts'
  import { begin } from './begin.ts'
  import { type Answer, type Saying, say, unsay } from './events.ts'
  import Events from './Events.svelte'
  import { showGlass } from './glass.ts'
  import Guidance from './Guidance.svelte'
  import { listen, typing } from './listen.ts'
  import Nudge from './Nudge.svelte'
  import ThingRow from './ThingRow.svelte'
  import { tipKept } from './tips.ts'
  import { WORLD } from './world-workspace.ts'

  // The World editor on the page: the open level under floating glass (the top bar, the toolbar, the list and the
  // settings), and everything a person does to it. What is changed is held as `Edits`, with one history, and kept on
  // the device as it goes. The main button still saves the one level that is open (only it can have changed here).
  interface Props {
    game: OpenGame
    api: Api
    route: Route
    me: Me
    go: (route: Route) => void
    /** Where a change that is not saved yet is kept. */
    drafts: Storage
    /** Where first-run tips are marked done. */
    remembered: Storage
    /** Has the person saved a change before? Then an Owner is pointed at who can change the game, once. */
    savedBefore: boolean
    onsignin: () => void
    onsignout: () => void
    onsignedout: () => void
    /** Open the game again: their version, with nothing of mine. */
    onreload: () => void
    /** Told once a save has gone in, and how. */
    onsaved: (how: 'direct' | 'suggestion') => void
    /** Told when something "For me" in Settings is changed: the page keeps it on this device. */
    onme: (next: Me) => void
  }
  let {
    game: given,
    api,
    route,
    me,
    go,
    drafts,
    remembered,
    savedBefore,
    onsignin,
    onsignout,
    onsignedout,
    onreload,
    onsaved,
    onme,
  }: Props = $props()

  const measure = (): { w: number; h: number } => ({
    w: document.documentElement.clientWidth,
    h: document.documentElement.clientHeight,
  })
  const first = measure()

  /** What the screen says when it opens: a change brought back or let go, who I am here, and the tips. */
  const started = untrack(() => begin(given, drafts, remembered, savedBefore, me.tips))

  let held = $state.raw<OpenGame>(untrack(() => given))
  /** What I may do. It can be lowered by a save the API refuses. */
  let access = $state<AccessLevel>(untrack(() => given.level))
  let edits = $state.raw<Edits>(started.edits)
  let events = $state.raw<readonly Saying[]>(started.said)
  let saving = $state(false)
  let online = $state(navigator.onLine)
  let picked = $state<string | undefined>(undefined)
  let viewport = $state(first)
  let docks = $state<Docks>({
    list: 'closed',
    settings: sizeClass(first.w, first.h) === 'wide' ? 'shown' : 'hidden',
    hold: false,
  })
  let pointers: Pointers = {
    last: matchMedia('(hover: hover) and (pointer: fine)').matches ? 'mouse' : 'touch',
    penSeen: false,
    hovering: false,
  }
  // Read when a panel opens, never while a hand is moving: rows never change size under a finger.
  let rows = $state<'touch' | 'small'>(untrack(() => rowSize(pointers, me.rows)))
  /** What to do once "Leave without saving" is pressed. */
  let pending: (() => void) | undefined

  /** The first run and the sheets of help: told what the person does, asked to open a sheet. */
  let guide = $state.raw<ReturnType<typeof Guidance>>()

  const lang = $derived(me.language ?? 'en')
  const words = $derived(wordsIn(lang))
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row

  const size = $derived(sizeClass(viewport.w, viewport.h))
  const device = $derived(deviceWord(navigator.userAgent, size, navigator.maxTouchPoints > 0))
  const lay = $derived(layout(device, size, docks, picked !== undefined, me.leftHand))
  const rowHeight = $derived(rows === 'small' ? 30 : 44)

  const signedIn = $derived(held.login !== undefined)
  const levelId = $derived(route.screen === 'level' && route.level !== undefined ? route.level : held.content.project.start)
  const level = $derived(edits.now.levels[levelId])
  const things = $derived(level?.things ?? [])
  const dirty = $derived(isChanged(edits))
  const lines = $derived(describe(edits.base, edits.now))
  const toCheck = $derived(can(access, 'approve') ? Math.max(0, held.waiting - (held.mine === undefined ? 0 : 1)) : 0)
  const facts = $derived<StatusFacts>({
    online,
    problems: 0,
    changes: lines.length,
    mine: held.mine,
    toCheck,
  })
  const sheet = $derived(route.screen === 'level' ? route.sheet : undefined)
  const placed = $derived(picked === undefined ? undefined : things.find((thing) => thing.id === picked))

  $effect(() => showGlass(me))

  onMount(() =>
    listen({
      resized: () => {
        viewport = measure()
      },
      // The browser's own question when the tab is closed with something unsaved.
      leaving: (e) => {
        if (dirty) e.preventDefault()
      },
      key: (e) => {
        const command = commandFor({
          key: e.key,
          meta: e.metaKey,
          ctrl: e.ctrlKey,
          shift: e.shiftKey,
          inField: typing(e),
        })
        if (command === 'undo' || command === 'redo') {
          e.preventDefault()
          step(command)
        } else if (command === 'escape') {
          picked = undefined
        } else if (command === 'help') {
          e.preventDefault()
          guide?.open('help')
        } else if (command?.startsWith('nudge:') && picked !== undefined && !e.defaultPrevented && guide?.sheetOpen() !== true) {
          // A thing that has focus moves itself; this is for a picked thing when the focus is elsewhere.
          e.preventDefault()
          const way = command.slice('nudge:'.length)
          if (way === 'left' || way === 'right' || way === 'up' || way === 'down') nudge(picked, way)
        }
      },
      online: (on) => {
        online = on
      },
      pointer: (e) => {
        const next = nextPointers(pointers, e)
        if (next.last !== pointers.last || next.penSeen !== pointers.penSeen || next.hovering !== pointers.hovering) {
          pointers = next
        }
      },
    }),
  )

  function pick(id: string | undefined): void {
    picked = id
    if (id !== undefined) guide?.happen({ kind: 'picked' })
  }

  /** A new `Edits`: shown, kept on the device, and the last "saved" is no longer true. */
  function keep(next: Edits): void {
    if (next === edits) return
    edits = next
    events = unsay(events, 'saved')
    keepDrafts(drafts, held, next)
  }
  function step(which: 'undo' | 'redo'): void {
    solid(false)
    keep(which === 'undo' ? undo(edits) : redo(edits))
  }
  const solid = (on: boolean): void => {
    events = on
      ? say(events, { id: 'solid', kind: 'info', text: WORDS.solid })
      : unsay(events, 'solid')
  }

  // A finger dragging a thing: every move is worked out from the level as it was when the finger went down, so the whole
  // drag is one step back.
  let dragFrom: Edits | undefined
  const grab = (): void => {
    dragFrom = edits
  }
  function drag(id: string, to: Point): void {
    const from = dragFrom ?? edits
    const start = from.now.levels[levelId]
    if (start === undefined) return
    const result = moveThing(startEdit(start), held.content.characters, id, to)
    if (result.moved) {
      solid(false)
      keep(inLevel(from, levelId, () => result.edit.now))
      guide?.happen({ kind: 'moved' })
    } else if (result.why === 'solid') {
      // The thing stays at the last free spot, and the person is told why.
      solid(true)
    } else if (result.why === 'same' && edits !== from) {
      solid(false)
      keep(from)
    }
  }
  function drop(gaveUp: boolean): void {
    const from = dragFrom
    dragFrom = undefined
    if (gaveUp && from !== undefined) {
      solid(false)
      keep(from)
    }
  }
  function nudge(id: string, way: 'left' | 'right' | 'up' | 'down'): void {
    const start = edits.now.levels[levelId]
    if (start === undefined) return
    const result = nudgeThing(startEdit(start), held.content.characters, id, way)
    solid(!result.moved && result.why === 'solid')
    if (result.moved) {
      keep(inLevel(edits, levelId, () => result.edit.now))
      guide?.happen({ kind: 'moved' })
    }
  }

  function openList(tab: 'list' | 'add'): void {
    rows = rowSize(pointers, me.rows)
    docks = { ...docks, list: tab === 'add' ? 'add' : 'list' }
  }

  /** Asks first when something is not saved; `then` is what the person wanted to do. */
  function leave(then: () => void): void {
    if (!dirty) return then()
    pending = then
    events = say(events, { id: 'leave', kind: 'info', text: WORDS.leaveAsk, ask: 'leave' })
  }
  const closeSheet = (): void => go(withoutSheet(route))
  // Who can change the game is for its Owner only: anyone else who opens that address lands on the level.
  $effect(() => {
    if (sheet?.kind === 'share' && !can(access, 'share')) closeSheet()
  })

  async function put(): Promise<void> {
    const now = edits.now.levels[levelId]
    if (now === undefined || saving) return
    saving = true
    events = []
    const result = await saveLevel(api, held, now, titleOf(lines))
    saving = false
    if (result.ok) {
      held = result.game
      const base = { ...edits.base, levels: { ...edits.base.levels, [levelId]: now } }
      edits = { ...edits, base }
      keepDrafts(drafts, held, edits)
      events = say(events, {
        id: 'saved',
        kind: 'good',
        text: result.how === 'suggestion' ? WORDS.savedSuggestion : WORDS.savedDirect,
        dismiss: true,
      })
      onsaved(result.how)
      return
    }
    const problem = (id: string, said: string, details?: readonly string[]): void => {
      events = say(events, {
        id,
        kind: 'problem',
        text: said,
        ...(details === undefined ? {} : { details }),
      })
    }
    switch (result.problem) {
      case 'signed-out':
        return onsignedout()
      case 'changed-elsewhere':
        events = say(events, {
          id: 'elsewhere',
          kind: 'problem',
          text: WORDS.changedElsewhere,
          ask: 'changed-elsewhere',
        })
        return
      case 'not-allowed':
        access = 'look'
        events = say(events, { id: 'standing', kind: 'info', text: WORDS.lookOnly, dismiss: true })
        return
      case 'broken':
        return problem('failed', WORDS.saveFailed, result.details ?? [])
      case 'blocked':
        return problem('failed', WORDS.blockedOwner)
      case 'offline':
        return problem('failed', WORDS.offline)
      case 'busy':
        return problem('failed', WORDS.busy)
      default:
        return problem('failed', WORDS.saveFailed)
    }
  }

  /** The level as it is on the screen now, saved or not. */
  const copyOfNow = () => (level === undefined ? undefined : levelCopy(held, level))
  function askKeep(): void {
    events = say(events, { id: 'keep', kind: 'info', text: text(words.menus.keepCopyAbout), ask: 'keep' })
  }
  async function copyText(): Promise<void> {
    const copy = copyOfNow()
    if (copy === undefined) return
    events = unsay(events, 'keep')
    try {
      await navigator.clipboard.writeText(copy.text)
      events = say(events, { id: 'copied', kind: 'good', text: WORDS.copyCopied, dismiss: true })
    } catch {
      // Where the clipboard is not allowed, the text is shown and selected so it can be copied by hand.
      events = say(events, { id: 'copied', kind: 'info', text: WORDS.copySelect, box: copy.text, dismiss: true })
    }
  }
  function copyFile(): void {
    const copy = copyOfNow()
    if (copy === undefined) return
    keepCopy(document, copy)
    events = unsay(events, 'keep')
    events = say(events, { id: 'copied', kind: 'good', text: WORDS.copyKept, dismiss: true })
  }

  function answered(event: Saying, answer: Answer): void {
    switch (answer) {
      case 'sign-in':
        return onsignin()
      case 'take-theirs':
        dropDrafts(drafts, held)
        return onreload()
      case 'keep-mine':
        events = unsay(events, event.id)
        return
      case 'stay':
        pending = undefined
        events = unsay(events, event.id)
        return
      case 'leave': {
        const then = pending
        pending = undefined
        dropDrafts(drafts, held)
        events = unsay(events, event.id)
        then?.()
        return
      }
      case 'copy-file':
        return copyFile()
      case 'copy-text':
        return void copyText()
      case 'dismiss':
        if (event.id === 'tip-share') tipKept(remembered, 'share')
        if (event.id === 'tip-approve') tipKept(remembered, 'approve')
        events = unsay(events, event.id)
        return
    }
  }

  const here = $derived({ owner: held.ref.owner, name: held.ref.name })
  const asSheet = (next: NonNullable<typeof sheet>): void => go({ screen: 'level', ...here, level: levelId, sheet: next })

  function onmenu(id: string): void {
    if (id === 'share') asSheet({ kind: 'share' })
    else if (id === 'waiting') asSheet({ kind: 'waiting' })
    else if (id === 'keep') askKeep()
    else if (id === 'games') leave(() => go({ screen: 'games' }))
    else if (id === 'help' || id === 'settings') guide?.open(id)
    else if (id === 'sign-in') onsignin()
    else if (id === 'sign-out') onsignout()
  }
  function onmain(what: 'put' | 'send' | 'keep' | 'waiting'): void {
    if (what === 'waiting') asSheet({ kind: 'waiting' })
    else if (what === 'keep') askKeep()
    else void put()
  }
  function onpart(id: string): void {
    if (!id.startsWith('level:')) return
    const next = id.slice('level:'.length)
    if (next !== levelId) leave(() => go({ screen: 'level', ...here, level: next }))
  }

  // Where the level may be drawn: clear of the top bar, the toolbar and whatever panels are open.
  const insets = $derived.by(() => {
    const toolbar = lay.toolbar === 'left' ? 76 : 0
    const list = lay.list === 'rail' ? 68 : lay.list === 'beside' ? 288 : 0
    // Held whether or not a thing is picked, so picking one never moves the level under a finger that is dragging it.
    const wide = layout(device, size, docks, true, me.leftHand).settings
    const settings = wide === 'side' ? 296 : wide === 'tab' ? 44 : 0
    const bottom = (lay.toolbar === 'bottom' ? 76 : 0) + (lay.settings === 'bar' ? 56 : 0)
    return lay.mirror
      ? { left: settings, right: toolbar + list, bottom }
      : { left: toolbar + list, right: settings, bottom }
  })
</script>

{#if sheet !== undefined}
  <div class="sheet">
    {#if sheet.kind === 'share'}
      <Share {api} game={held.ref} {onsignedout} onhome={closeSheet} />
    {:else if sheet.kind === 'waiting'}
      <Waiting {api} game={held.ref} {onsignedout} onback={closeSheet} />
    {:else}
      {#key sheet.number}
        <WaitingChange
          {api}
          game={held.ref}
          number={sheet.number}
          {onsignedout}
          onback={() => asSheet({ kind: 'waiting' })}
          onhome={closeSheet}
        />
      {/key}
    {/if}
  </div>
{:else}
  <div
    class="look world"
    {lang}
    data-size={size}
    data-rows={rows}
    style:--tools-room={lay.toolbar === 'bottom' ? '72px' : '0px'}
  >
    {#if level !== undefined}
      <div
        class="level"
        style:left="{insets.left}px"
        style:right="{insets.right}px"
        style:bottom="{insets.bottom}px"
      >
        <Stage
          {level}
          characters={held.content.characters}
          hero={held.content.project.hero}
          label={nameOf(levelId)}
          {picked}
          onpick={pick}
          ongrab={grab}
          ondrag={drag}
          ondrop={drop}
          onnudge={nudge}
        />
      </div>
    {/if}

    <TopBar
      workspace={WORLD}
      {lang}
      {size}
      {device}
      gameName={held.content.project.name}
      part="levels"
      place={levelId}
      levels={Object.keys(held.content.levels)}
      {signedIn}
      login={held.login}
      level={access}
      waiting={held.waiting}
      {facts}
      people={[]}
      canUndo={edits.past.length > 0}
      canRedo={edits.future.length > 0}
      onundo={() => step('undo')}
      onredo={() => step('redo')}
      {onmain}
      {onmenu}
      {onpart}
      onpeople={() => {
        if (signedIn && can(access, 'share')) asSheet({ kind: 'share' })
      }}
      ontocheck={toCheck > 0 ? () => asSheet({ kind: 'waiting' }) : undefined}
    />

    <Toolbar
      workspace={WORLD}
      {lang}
      tool="pick"
      side={lay.toolbar}
      keys={device === 'computer'}
      undoHere={size === 'phone'}
      canUndo={edits.past.length > 0}
      canRedo={edits.future.length > 0}
      mirror={lay.mirror}
      onpick={() => {}}
      onundo={() => step('undo')}
      onredo={() => step('redo')}
      onlist={lay.list === 'hidden' ? () => openList('list') : undefined}
    />

    {#if lay.list !== 'hidden'}
      <ListPanel
        {lang}
        mode={lay.list}
        tab="list"
        name={text(words.panels.listIn)}
        count={things.length}
        {rowHeight}
        inset={lay.toolbar === 'left'}
        mirror={lay.mirror}
        onopen={openList}
        onhide={() => (docks = { ...docks, list: 'closed' })}
      >
        {#snippet row(at)}
          {@const thing = things[at]}
          {#if thing !== undefined}
            <ThingRow {thing} picked={picked === thing.id} onpick={() => pick(thing.id)} />
          {/if}
        {/snippet}
      </ListPanel>
    {/if}

    {#if lay.settings !== 'none' && placed !== undefined}
      <SettingsPanel
        {lang}
        mode={lay.settings}
        name={nameOf(placed.id)}
        mirror={lay.mirror}
        onhide={() => (docks = { ...docks, settings: 'hidden' })}
        onshow={() => (docks = { ...docks, settings: 'shown' })}
      >
        <Nudge onnudge={(way) => nudge(placed.id, way)} />
      </SettingsPanel>
    {/if}

    <Events {events} onanswer={answered} />

    <Guidance
      bind:this={guide}
      {lang}
      {me}
      game={held}
      {api}
      owner={signedIn && can(access, 'share')}
      {remembered}
      {things}
      {picked}
      {onme}
      onsettings={(settings) => (held = { ...held, ...settings })}
      {onsignedout}
      onkeep={level === undefined ? undefined : askKeep}
    />
  </div>
{/if}

<style>
  .world {
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
  .sheet {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    overflow: auto;
  }
  /* The level sits under the glass: clear of the top bar, and of whatever sits at its sides and foot. */
  .level {
    position: absolute;
    top: calc(var(--bar) + 20px);
    display: flex;
    flex-direction: column;
    padding: 0 8px 8px;
  }
</style>
