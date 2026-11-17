<script lang="ts">
  import type { Level } from '@automataframework/framework/headless'
  import { onMount, untrack } from 'svelte'
  import { type AccessLevel, can } from '../access/access.ts'
  import type { Api } from '../api/api.ts'
  import { deviceWord, type Me, nextPointers, type Pointers, rowSize, sizeClass } from '../device/device.ts'
  import {
    change,
    describe,
    dropDrafts,
    type Edits,
    inLevel,
    isChanged,
    keepDrafts,
    levelCopy,
    type OpenGame,
    redo,
    saveLevel,
    titleOf,
    undo,
  } from '../game/game.ts'
  import { type Clip, LevelPart, nudgeThings } from '../levels/levels.ts'
  import { edgesOf, MapPart } from '../map/map.ts'
  import { PlayPart } from '../play/play.ts'
  import { commandFor, type Docks, layout, type StatusFacts, type Tool, TopBar } from '../shell/shell.ts'
  import { type Route, withoutSheet } from '../team/team.ts'
  import { type Row, WORDS, wordsIn } from '../words/words.ts'
  import { begin } from './begin.ts'
  import { didWhat } from './did.ts'
  import { type Answer, cantPlay, type Saying, say, saveProblem, unsay } from './events.ts'
  import Events from './Events.svelte'
  import { showGlass } from './glass.ts'
  import Guidance from './Guidance.svelte'
  import { afterFinger } from './finger.svelte.ts'
  import { bottomOf, insetsOf } from './insets.ts'
  import { copyFile, copyText, type Update } from './keeping.ts'
  import { listen, measure, onControl, typing } from './listen.ts'
  import { createLook } from './look.svelte.ts'
  import { savedAs } from './saved.ts'
  import Panels from './Panels.svelte'
  import Sheets from './Sheets.svelte'
  import { playTip, tipKept } from './tips.ts'
  import { withId } from './with-id.ts'
  import { WORLD } from './world-workspace.ts'

  // The World editor on the page: the open level under floating glass (top bar, toolbar, list, settings) and everything a
  // person does to it. Changes are held as `Edits`, one history, kept on the device as they go; the main button saves
  // the one level that is open (only it can have changed here).
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
  /** What is picked: thing ids, and `start-1` for a start. */
  let picked = $state.raw<readonly string[]>([])
  /** The level that is picked on the map; one that is gone (undone away) is no longer picked. */
  let pickedLevel = $state<string | undefined>(untrack(() => (route.screen === 'map' ? route.level : undefined)))
  const pickedOnMap = $derived(pickedLevel !== undefined && edits.now.levels[pickedLevel] ? pickedLevel : undefined)
  let tool = $state<Tool>('pick')
  const look = createLook()
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
    problems: 0,
    changes: lines.length,
    mine: held.mine,
    toCheck,
  })
  const sheet = $derived(route.screen === 'level' ? route.sheet : undefined)

  $effect(() => showGlass(me))

  onMount(() =>
    listen({
      resized: () => void (viewport = measure()),
      // The browser's own question when the tab is closed with something unsaved.
      leaving: (e) => void (dirty && e.preventDefault()),
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
      online: (on) => void (online = on),
      pointer: (e) => void (pointers = nextPointers(pointers, e)),
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
    events = on ? say(events, { id: 'solid', kind: 'info', text: WORDS.solid }) : unsay(events, 'solid')
  }

  // A hand holding things: moves are worked out from the level as it was when the hand took hold: one grab, one step back.
  let dragFrom: Edits | undefined
  const grab = (): void => void (dragFrom = edits)
  function edit(next: Level): void {
    for (const kind of didWhat(edits.now.levels[levelId], next)) guide?.happen({ kind })
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

  async function put(): Promise<void> {
    const now = edits.now.levels[levelId]
    if (now === undefined || saving) return
    saving = true
    events = []
    const result = await saveLevel(api, held, now, titleOf(lines))
    saving = false
    if (result.ok) {
      const next = savedAs(result, edits, levelId, now)
      held = next.game
      edits = next.edits
      keepDrafts(drafts, held, edits)
      events = say(events, next.saying)
      onsaved(result.how)
      return
    }
    if (result.problem === 'signed-out') return onsignedout()
    if (result.problem === 'not-allowed') access = 'look'
    events = say(events, saveProblem(result.problem, result.details))
  }

  /** The level as it is on the screen now, saved or not. */
  const copyOfNow = () => (level === undefined ? undefined : levelCopy(held, level))
  function askKeep(): void {
    events = say(events, { id: 'keep', kind: 'info', text: text(words.menus.keepCopyAbout), ask: 'keep' })
  }
  const update: Update = (next) => void (events = next(events))

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
      case 'copy-file': {
        const copy = copyOfNow()
        return copy === undefined ? undefined : copyFile(copy, update)
      }
      case 'copy-text': {
        const copy = copyOfNow()
        return copy === undefined ? undefined : void copyText(copy, update)
      }
      case 'dismiss':
        if (event.id === 'tip-share') tipKept(remembered, 'share')
        if (event.id === 'tip-approve') tipKept(remembered, 'approve')
        events = unsay(events, event.id)
        return
    }
  }

  const here = $derived({ owner: held.ref.owner, name: held.ref.name })
  /** Opens `next` with the door you come out of picked, when it has one there. */
  const goLevel = (next: string, door?: string): void => {
    go({ screen: 'level', ...here, level: next })
    picked = edits.now.levels[next]?.things.some((t) => t.id === door) ? [door as string] : []
  }
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
    if (id === 'part:levels') {
      if (onMap) go({ screen: 'level', ...here, level: pickedLevel ?? levelId })
      return
    }
    if (id === 'map') return onmap()
    if (!id.startsWith('level:')) return
    const next = id.slice('level:'.length)
    if (next !== levelId || onMap) leave(() => go({ screen: 'level', ...here, level: next }))
  }
  /** The Map button: the map when a level is open, the level that was open when the map is. */
  function onmap(): void {
    if (onMap) return go({ screen: 'level', ...here, level: pickedLevel ?? levelId })
    pickedLevel = levelId
    go({ screen: 'map', ...here, level: levelId })
  }

  const insets = afterFinger(() => insetsOf(lay, layout(device, size, docks, true, me.leftHand).settings, playing && big, onMap, size === 'phone'))
</script>

{#if sheet !== undefined}
  <Sheets {sheet} {api} game={held.ref} {onsignedout} onclose={closeSheet} onwaiting={() => asSheet({ kind: 'waiting' })} />
{:else}
  <div
    class="look world"
    {lang}
    data-size={size}
    data-rows={rows}
    style:--tools-room={lay.toolbar === 'bottom' ? (size === 'phone' ? '132px' : '72px') : '0px'}
  >
    {#if onMap || level !== undefined}
      <div
        class="level"
        class:hidden={playing}
        style:left="{insets.value.left}px"
        style:right="{insets.value.right}px"
        style:bottom={bottomOf(insets.value)}
      >
        {#if onMap}
          <MapPart
            content={held.content}
            pictures={held.pictures}
            working={edits.now}
            {lang}
            picked={pickedOnMap}
            onpick={(next) => (pickedLevel = next)}
            ongo={goLevel}
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
          show={look.show}
          brush={look.brush}
          onbrush={look.paintWith}
          onnear={(near) => look.showing({ near })}
          edgesFor={(next) => edgesOf({ ...edits.now, levels: { ...edits.now.levels, [levelId]: next } }, held.content, levelId)}
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
          edges={edgesOf(edits.now, held.content, levelId)}
          ongo={goLevel}
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
      {levelId}
      ways={edits.now.levels}
      hand={{ grab, edit, drop }}
      ongo={goLevel}
      content={held.content}
      {look}
      {me}
      {onme}
      onnear={(near) => part?.command(near)}
    />

    <Events {events} low={playing} onanswer={answered} />

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
    isolation: isolate; /* what floats over the level stays under the tour and the dialogs, whatever its z-index */
    position: absolute;
    top: calc(var(--bar) + 20px);
    display: flex;
    flex-direction: column;
    padding: 0 8px 8px;
  }
</style>
