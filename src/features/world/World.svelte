<script lang="ts">
  import type { Level } from '@automataframework/framework/headless'
  import { onMount, untrack } from 'svelte'
  import { type AccessLevel, can } from '../access/access.ts'
  import type { Api } from '../api/api.ts'
  import { deviceWord, type Me, nextPointers, type Pointers, rowSize, sizeClass } from '../device/device.ts'
  import {
    approverOf,
    change,
    describe,
    dropDrafts,
    type Edits,
    inLevel,
    isChanged,
    keepDrafts,
    type OpenGame,
    type Problem,
    redo,
    undo,
  } from '../game/game.ts'
  import { type Clip, LevelPart, nudgeThings } from '../levels/levels.ts'
  import { MapPart } from '../map/map.ts'
  import { PlayPart } from '../play/play.ts'
  import { commandFor, type Docks, layout, type StatusFacts, type Tool, TopBar } from '../shell/shell.ts'
  import { type Route, withoutSheet } from '../team/team.ts'
  import { type Row, WORDS, wordsIn } from '../words/words.ts'
  import { begin } from './begin.ts'
  import { type Answer, cantPlay, type Saying, say, unsay } from './events.ts'
  import Changes from './Changes.svelte'
  import Events from './Events.svelte'
  import { showGlass } from './glass.ts'
  import Guidance from './Guidance.svelte'
  import { insetsOf } from './insets.ts'
  import { listen, onControl, typing } from './listen.ts'
  import Panels from './Panels.svelte'
  import Sheets from './Sheets.svelte'
  import { playTip, tipKept } from './tips.ts'
  import { withId } from './with-id.ts'
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
  let online = $state(navigator.onLine)
  /** What is picked: thing ids, and `start-1` for a start. */
  let picked = $state.raw<readonly string[]>([])
  /** The level that is picked on the map; one that is gone (undone away) is no longer picked. */
  let pickedLevel = $state<string | undefined>(untrack(() => (route.screen === 'map' ? route.level : undefined)))
  const pickedOnMap = $derived(pickedLevel !== undefined && edits.now.levels[pickedLevel] ? pickedLevel : undefined)
  let tool = $state<Tool>('pick')
  /** The character the Place tool is holding (or the tray's start). */
  let placing = $state<string | undefined>(undefined)
  /** Copied to paste, for this visit only. */
  let clip = $state.raw<Clip | undefined>(undefined)
  /** Locked and hidden are for this visit only: kept nowhere on the device and in no file. */
  let locked = $state.raw<ReadonlySet<string>>(new Set())
  let hidden = $state.raw<ReadonlySet<string>>(new Set())
  let part: LevelPart | undefined = $state()
  /** The level is playing where it is drawn; `big`: the panels are put away while it does. */
  let playing = $state(false)
  let big = $state(false)
  let viewport = $state(first)
  let docks = $state<Docks>({
    list: 'closed',
    settings: sizeClass(first.w, first.h) === 'wide' ? 'shown' : 'hidden',
    hold: false,
  })
  let pointers = $state.raw<Pointers>({
    last: matchMedia('(hover: hover) and (pointer: fine)').matches ? 'mouse' : 'touch',
    penSeen: false,
    hovering: false,
  })
  // Read when a panel opens, never while a hand is moving: rows never change size under a finger.
  let rows = $state<'touch' | 'small'>(untrack(() => rowSize(pointers, me.rows)))
  /** What to do once "Leave without saving" is pressed. */
  let pending: (() => void) | undefined

  /** The sheets for putting changes in, and what is wrong with the game as the person has changed it. */
  let changes = $state.raw<ReturnType<typeof Changes>>()
  let problems = $state.raw<readonly Problem[]>([])

  /** The first run and the sheets of help: told what the person does, asked to open a sheet. */
  let guide = $state.raw<ReturnType<typeof Guidance>>()

  const lang = $derived(me.language ?? 'en')
  const words = $derived(wordsIn(lang))
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row

  const size = $derived(sizeClass(viewport.w, viewport.h))
  const device = $derived(deviceWord(navigator.userAgent, size, navigator.maxTouchPoints > 0))
  const lay = $derived(layout(device, size, docks, picked.length > 0, me.leftHand))
  const rowHeight = $derived(rows === 'small' ? 30 : 44)

  const signedIn = $derived(held.login !== undefined)
  const onMap = $derived(route.screen === 'map')
  // The level the address asks for; one that is no longer there (made, renamed or taken away since) is the start.
  const asked = $derived(route.screen === 'games' ? undefined : route.level)
  const levelId = $derived(asked !== undefined && edits.now.levels[asked] ? asked : held.content.project.start)
  const level = $derived(edits.now.levels[levelId])
  const things = $derived(level?.things ?? [])
  const dirty = $derived(isChanged(edits))
  const lines = $derived(describe(edits.base, edits.now))
  const toCheck = $derived(can(access, 'approve') ? Math.max(0, held.waiting - (held.mine === undefined ? 0 : 1)) : 0)
  const facts = $derived<StatusFacts>({
    online,
    problems: problems.length,
    changes: lines.length,
    mine: held.mine,
    toCheck,
    approver: approverOf(held),
  })
  const sheet = $derived(route.screen === 'level' ? route.sheet : undefined)
  const placed = $derived(picked.length === 1 ? things.find((thing) => thing.id === picked[0]) : undefined)

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
        // While it plays, a key belongs to the game; only Escape comes back.
        if (playing) {
          if (e.key === 'Escape') {
            e.preventDefault()
            stopPlay()
          }
          return
        }
        const command = commandFor({
          key: e.key,
          meta: e.metaKey,
          ctrl: e.ctrlKey,
          shift: e.shiftKey,
          inField: typing(e) || (e.key === ' ' && onControl(e)),
        })
        if (command === 'undo' || command === 'redo') {
          e.preventDefault()
          step(command)
        } else if (command === 'escape') {
          picked = []
          pickedLevel = undefined
          placing = undefined
        } else if (command === 'play' && level !== undefined && !onMap) {
          e.preventDefault()
          startPlay()
        } else if (command === 'help') {
          e.preventDefault()
          guide?.open('help')
        } else if (command?.startsWith('nudge:') && picked.length === 1 && !e.defaultPrevented && guide?.sheetOpen() !== true) {
          // A thing that has focus moves itself; this is for a picked thing when the focus is elsewhere.
          e.preventDefault()
          const way = command.slice('nudge:'.length)
          if (way === 'left' || way === 'right' || way === 'up' || way === 'down') nudge(picked[0] as string, way)
        } else if (command?.startsWith('tool:') && WORLD.tools.includes(command.slice(5) as Tool)) {
          tool = command.slice(5) as Tool
        } else if (command === 'delete' || command === 'duplicate' || command === 'copy' || command === 'paste') {
          part?.command(command)
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

  function startPlay(): void {
    events = unsay(events, 'play')
    big = false
    playing = true
  }
  function stopPlay(): void {
    playing = false
    big = false
    events = unsay(events, 'tip-play-code')
  }
  /** The level could not be played: what is wrong, said where the person is looking. */
  function noPlay(lines: readonly string[]): void {
    stopPlay()
    events = say(events, cantPlay(words.play, lines))
  }
  // Playing ends when the level in view changes or a sheet takes the screen: it would play a level no one is looking at.
  $effect(() => {
    levelId
    sheet
    onMap
    untrack(stopPlay)
  })

  function pick(ids: readonly string[]): void {
    picked = ids
    if (ids.length > 0) guide?.happen({ kind: 'picked' })
  }

  /** A new `Edits`: shown, and kept on the device. */
  function keep(next: Edits): void {
    if (next === edits) return
    edits = next
    keepDrafts(drafts, held, next)
  }
  function step(which: 'undo' | 'redo'): void {
    solid(false)
    keep(which === 'undo' ? undo(edits) : redo(edits))
  }
  const solid = (on: boolean): void => {
    events = on ? say(events, { id: 'solid', kind: 'info', text: WORDS.solid }) : unsay(events, 'solid')
  }

  // A hand holding things: every move is worked out from the level as it was when the hand took hold, so the whole grab is
  // one step back.
  let dragFrom: Edits | undefined
  const grab = (): void => void (dragFrom = edits)
  function edit(next: Level): void {
    const was = edits.now.levels[levelId]
    const moved = (t: { id: string; x: number; y: number }): boolean => {
      const o = was?.things.find((w) => w.id === t.id)
      return o !== undefined && (o.x !== t.x || o.y !== t.y)
    }
    if (next.things.some(moved)) guide?.happen({ kind: 'moved' })
    keep(inLevel(dragFrom ?? edits, levelId, () => next))
  }
  function drop(gaveUp: boolean): void {
    const from = dragFrom
    dragFrom = undefined
    if (gaveUp && from !== undefined) keep(from)
  }
  /** The settings' own four arrows: one tile a tap. */
  function nudge(id: string, way: 'left' | 'right' | 'up' | 'down'): void {
    const start = edits.now.levels[levelId]
    if (start === undefined) return
    const result = nudgeThings(start, held.content.characters, [id], way)
    solid(!result.ok && result.why === 'solid')
    if (result.ok) edit(result.value)
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
  // Only the Owner may change who can change the game: anyone else lands on the level.
  $effect(() => {
    if (sheet?.kind === 'share' && !can(access, 'share')) closeSheet()
  })

  function answered(event: Saying, answer: Answer): void {
    switch (answer) {
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
      case 'dismiss':
        if (event.id === 'tip-share') tipKept(remembered, 'share')
        if (event.id === 'tip-approve') tipKept(remembered, 'approve')
        events = unsay(events, event.id)
        return
    }
  }

  /** Opens the level or the map at a problem, and picks the thing it is about. */
  function show(where: Problem['where']): void {
    if (where.map === true) {
      pickedLevel = levelId
      go({ screen: 'map', ...here, level: levelId })
      return
    }
    if (where.level !== undefined && (where.level !== levelId || onMap)) {
      go({ screen: 'level', ...here, level: where.level })
    }
    picked = where.thing === undefined ? [] : [where.thing]
  }
  const here = $derived({ owner: held.ref.owner, name: held.ref.name })
  const asSheet = (next: NonNullable<typeof sheet>): void => go({ screen: 'level', ...here, level: levelId, sheet: next })

  function onmenu(id: string): void {
    if (id === 'share') asSheet({ kind: 'share' })
    else if (id === 'waiting') asSheet({ kind: 'waiting' })
    else if (id === 'keep') changes?.open('keep')
    else if (id === 'games') leave(() => go({ screen: 'games' }))
    else if (id === 'help' || id === 'settings') guide?.open(id)
    else if (id === 'sign-in') onsignin()
    else if (id === 'sign-out') onsignout()
  }
  const onmain = (what: 'put' | 'send' | 'keep' | 'waiting'): void => changes?.open(what)
  function onpart(id: string): void {
    if (id === 'part:levels') {
      if (onMap) go({ screen: 'level', ...here, level: pickedLevel ?? levelId })
      return
    }
    if (id === 'map') return onmap()
    if (!id.startsWith('level:')) return
    const next = id.slice('level:'.length)
    // Another level is another file of the same game: nothing is left behind, so nothing is asked.
    if (next !== levelId || onMap) go({ screen: 'level', ...here, level: next })
  }
  /** The Map button: the map when a level is open, the level that was open when the map is. */
  function onmap(): void {
    if (onMap) return go({ screen: 'level', ...here, level: pickedLevel ?? levelId })
    pickedLevel = levelId
    go({ screen: 'map', ...here, level: levelId })
  }

  // Where the level may be drawn: clear of the top bar, the toolbar and whatever panels are open.
  const insets = $derived(insetsOf(lay, layout(device, size, docks, true, me.leftHand).settings, playing && big, onMap))
</script>

{#if sheet !== undefined}
  <Sheets {sheet} {api} game={held.ref} {onsignedout} onclose={closeSheet} onwaiting={() => asSheet({ kind: 'waiting' })} />
{:else}
  <div
    class="look world"
    {lang}
    data-size={size}
    data-rows={rows}
    style:--tools-room={lay.toolbar === 'bottom' ? '72px' : '0px'}
  >
    {#if onMap || level !== undefined}
      <div
        class="level"
        class:hidden={playing}
        style:left="{insets.left}px"
        style:right="{insets.right}px"
        style:bottom="{insets.bottom}px"
      >
        {#if onMap}
          <MapPart
            content={held.content}
            pictures={held.pictures}
            working={edits.now}
            {lang}
            picked={pickedOnMap}
            onpick={(next) => (pickedLevel = next)}
            ongo={(next) => go({ screen: 'level', ...here, level: next })}
            onchange={(next) => keep(change(edits, next))}
            onundo={() => step('undo')}
          />
        {:else if level !== undefined}
        <LevelPart
          bind:this={part}
          content={held.content}
          pictures={held.pictures}
          {level}
          {levelId}
          {lang}
          {tool}
          {picked}
          paused={events.some((one) => one.ask !== undefined)}
          {locked}
          {hidden}
          {placing}
          {clip}
          {pointers}
          fingerDraws={me.fingerDraws}
          onpick={pick}
          onplacing={(id) => (placing = id)}
          ongrab={grab}
          onedit={edit}
          ondrop={drop}
          onlock={(id, on) => (locked = withId(locked, id, on))}
          onhide={(id, on) => (hidden = withId(hidden, id, on))}
          onclip={(next) => (clip = next)}
          onundo={() => step('undo')}
          {onmap}
        />
        {/if}
        {#if playing}
          <PlayPart
            game={held}
            {edits}
            level={levelId}
            {lang}
            {big}
            waiting={events.some((one) => one.id === 'tip-play-code')}
            onbig={() => (big = !big)}
            onstarted={() => (events = playTip(events, remembered, me.tips, text(words.play.tipCode)))}
            onproblem={noPlay}
          />
        {/if}
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
      mapOn={onMap}
      {onmap}
      onpeople={() => {
        if (signedIn && can(access, 'share')) asSheet({ kind: 'share' })
      }}
      ontocheck={toCheck > 0 ? () => asSheet({ kind: 'waiting' }) : undefined}
      onproblems={problems.length > 0 ? () => changes?.open('problems') : undefined}
      onplay={level === undefined || onMap ? undefined : playing ? stopPlay : startPlay}
      {playing}
    />

    <Panels
      {lang}
      {lay}
      {device}
      {size}
      {docks}
      {tool}
      {placing}
      characters={held.content.characters}
      {level}
      {picked}
      {locked}
      {rowHeight}
      canUndo={edits.past.length > 0}
      canRedo={edits.future.length > 0}
      quiet={playing}
      away={playing && big}
      ontool={(next) => (tool = next)}
      onundo={() => step('undo')}
      onredo={() => step('redo')}
      onopen={openList}
      ondocks={(next) => (docks = next)}
      onplacing={(id) => (placing = id)}
      onpick={pick}
      onnudge={nudge}
      levels={onMap ? Object.keys(edits.now.levels) : undefined}
      start={held.content.project.start}
      {pickedLevel}
      onpicklevel={(id) => (pickedLevel = id)}
    />

    <Events {events} low={playing} onanswer={answered} />

    <Changes
      bind:this={changes}
      bind:problems
      {lang}
      {device}
      {api}
      game={held}
      {edits}
      level={onMap ? undefined : levelId}
      onchanged={(next, now) => {
        held = next
        edits = now
        keepDrafts(drafts, next, now)
      }}
      onput={onsaved}
      onlowered={(next) => (access = next)}
      ononline={(on) => (online = on)}
      {onsignin}
      {onsignedout}
      onshow={show}
    />

    <Guidance
      bind:this={guide}
      {lang}
      {me}
      game={held}
      {api}
      owner={signedIn && can(access, 'share')}
      {remembered}
      {things}
      picked={placed?.id}
      {onme}
      onsettings={(settings) => (held = { ...held, ...settings })}
      {onsignedout}
      onkeep={level === undefined ? undefined : () => changes?.open('keep')}
    />
  </div>
{/if}

<style>
  .level.hidden {
    visibility: hidden;
    pointer-events: none;
  }
  .world {
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: hidden;
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
