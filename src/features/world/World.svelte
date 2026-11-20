<script lang="ts">
  import type { Arrive, Level, Way } from '@automataframework/framework/headless'
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
  import { edgesOf, MapPart } from '../map/map.ts'
  import { PlayPart } from '../play/play.ts'
  import { type Docks, Find, type Found, layout, parseGo, type StatusFacts, type Tool, TopBar } from '../shell/shell.ts'
  import { AuthorNote, Helper, Notes, type Route, withoutSheet } from '../team/team.ts'
  import { type Row, WORDS, wordsIn } from '../words/words.ts'
  import { begin } from './begin.ts'
  import { didWhat } from './did.ts'
  import { type Answer, cantPlay, type Saying, say, unsay } from './events.ts'
  import Changes from './Changes.svelte'
  import Events from './Events.svelte'
  import { showGlass } from './glass.ts'
  import Guidance from './Guidance.svelte'
  import { afterFinger } from './finger.svelte.ts'
  import { bottomOf, insetsOf } from './insets.ts'
  import { actOfCommand, actOnKey, type KeyAct } from './keys.ts'
import { listen, measure } from './listen.ts'
  import { createLook } from './look.svelte.ts'
  import Panels from './Panels.svelte'
  import { placesOf } from './places.ts'
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
  /** Beside the door the play came through. */
  let arrival = $state.raw<Arrive | undefined>(undefined)
  let following = false // a door opened the level in view: the play goes on in it
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
  /** The team's notes and a helper's ghost on the level, and Find with the things it says match (the list shows only those). */
  let notes = $state.raw<ReturnType<typeof Notes>>()
  let helper = $state.raw<ReturnType<typeof Helper>>()
  let finding = $state(false)
  let only = $state.raw<readonly string[] | undefined>(undefined)

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
  /** Someone's waiting change is open over the level: the level it draws takes this one's place. */
  const checking = $derived(sheet?.kind === 'change')

  $effect(() => showGlass(me))

  onMount(() =>
    listen({
      resized: () => void (viewport = measure()),
      // The browser's own question when the tab is closed with something unsaved.
      leaving: (e) => void (dirty && e.preventDefault()),
      key: (e) => {
        const act = actOnKey(e, { playing, canPlay: level !== undefined && !onMap, picked: picked.length, sheetOpen: guide?.sheetOpen() === true })
        if (act !== undefined) run(act)
      },
      online: (on) => void (online = on),
      pointer: (e) => void (pointers = nextPointers(pointers, e)),
    }),
  )

  /** Does what a key (or something Find offered) asks for. */
  function run(act: KeyAct): void {
    switch (act.kind) {
      case 'stop-play': return stopPlay()
      case 'step': return step(act.which)
      case 'escape': return void ((picked = []), (pickedLevel = undefined), (placing = undefined))
      case 'play': return startPlay()
      case 'help': return guide?.open('help')
      case 'find': return void (finding = true)
      case 'nudge': return nudge(picked[0] as string, act.way)
      case 'tool': return void (tool = act.tool)
      case 'place': return void ((placing = act.character), (tool = 'place'))
      case 'level': return part?.command(act.command)
    }
  }
  /** Something Find found was pressed: take the person to it. */
  function found(one: Found): void {
    finding = false
    const to = parseGo(one.go)
    const act = to?.kind === 'command' ? actOfCommand(to.id, { canPlay: level !== undefined && !onMap }) : undefined
    if (to?.kind === 'thing') goLevel(to.level, to.thing)
    else if (to?.kind === 'level') goLevel(to.level)
    else if (to?.kind === 'map') onmap()
    else if (act !== undefined) run(act)
  }

  function startPlay(): void {
    events = unsay(events, 'play')
    big = false
    playing = true
  }
  function stopPlay(): void {
    playing = false
    big = false
    arrival = undefined
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
    untrack(() => {
      // A door opened this level: the play goes on in it.
      if (following) following = false
      else stopPlay()
    })
  })
  /** A hero went through a door while the level played: the level it leads to opens, and the play goes on there. */
  function followDoor(way: Way): void {
    arrival = way.thing === undefined ? undefined : { thing: way.thing }
    following = true
    // The panels stay put while it plays: no door is picked, so the settings do not open over the game.
    go({ screen: 'level', ...here, level: way.level })
    picked = []
  }

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
  const solid = (on: boolean): void => void (events = on ? say(events, { id: 'solid', kind: 'info', text: WORDS.solid }) : unsay(events, 'solid'))

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

  function answered(event: Saying, answer: Answer): void {
    const then = answer === 'leave' ? pending : undefined
    if (answer !== 'dismiss') pending = undefined
    if (answer === 'leave') dropDrafts(drafts, held)
    if (answer === 'dismiss' && (event.id === 'tip-share' || event.id === 'tip-approve')) tipKept(remembered, event.id === 'tip-share' ? 'share' : 'approve')
    events = unsay(events, event.id)
    then?.()
  }

  const here = $derived({ owner: held.ref.owner, name: held.ref.name })
  const { goLevel, asSheet, onmap, onpart, show, showChange } = placesOf({
    go: (next) => go(next),
    game: () => here,
    levelId: () => levelId,
    onMap: () => onMap,
    edits: () => edits,
    get pickedLevel() {
      return pickedLevel
    },
    set pickedLevel(next) {
      pickedLevel = next
    },
    get picked() {
      return picked
    },
    set picked(next) {
      picked = next
    },
  })

  function onmenu(id: string): void {
    if (id === 'people') asSheet({ kind: 'people' })
    else if (id === 'history') asSheet({ kind: 'history' })
    else if (id === 'waiting') asSheet({ kind: 'waiting' })
    else if (id === 'keep') changes?.open('keep')
    else if (id === 'games') leave(() => go({ screen: 'games' }))
    else if (id === 'help' || id === 'settings') guide?.open(id)
    else if (id === 'sign-in') onsignin()
    else if (id === 'sign-out') onsignout()
  }
  const onmain = (what: 'put' | 'send' | 'keep' | 'waiting'): void => changes?.open(what)
  const insets = afterFinger(() => insetsOf(lay, layout(device, size, docks, true, me.leftHand).settings, playing && big, onMap, size === 'phone', size === 'phone-sideways'))
</script>

<div
  class="look world"
  {lang}
  data-size={size}
  data-rows={rows}
  style:--tools-room={lay.toolbar === 'bottom' ? (size === 'phone' ? '132px' : '72px') : '0px'}
>
  {#if (onMap || level !== undefined) && !checking}
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
        extras={[...(helper?.extras() ?? []), ...(notes?.extras() ?? [])]} onextra={(id) => notes?.open(id)} onnote={signedIn ? (where) => notes?.add(where) : undefined}
      />
      {/if}
      {#if playing}
        {#key levelId}
          <PlayPart game={held} {edits} level={levelId} {lang} {big} arrive={arrival} waiting={events.some((one) => one.id === 'tip-play-code')} onbig={() => (big = !big)} onstarted={() => (events = playTip(events, remembered, me.tips, text(words.play.tipCode)))} onproblem={noPlay} ondoor={followDoor} />
        {/key}
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
    people={signedIn ? [{ login: held.ref.owner }, ...held.people] : []}
    canUndo={edits.past.length > 0}
    canRedo={edits.future.length > 0}
    onundo={() => step('undo')}
    onredo={() => step('redo')}
    {onmain}
    {onmenu}
    {onpart}
    mapOn={onMap}
    {onmap}
    onpeople={() => asSheet({ kind: 'people' })}
    ontocheck={toCheck > 0 ? () => asSheet({ kind: 'waiting' }) : undefined}
    onproblems={problems.length > 0 ? () => changes?.open('problems') : undefined}
    onfind={() => (finding = true)}
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
    quiet={playing || checking}
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
    {only}
    {look}
    {me}
    {onme}
    onnear={(near) => part?.command(near)}
  />

  <Events {events} low={playing} onanswer={answered} />
  <AuthorNote {lang} game={held} {api} back={started.back} {onsignedout} />

  {#if sheet !== undefined}
    <Sheets {sheet} {api} game={held} {lang} {onsignedout} onclose={closeSheet} onwaiting={() => asSheet({ kind: 'waiting' })} onshow={showChange} onask={signedIn ? (who) => (closeSheet(), notes?.ask(who)) : undefined} />
  {/if}

  <Changes
    bind:this={changes}
    bind:problems
    {lang}
    {device}
    {api}
    game={held}
    {edits}
    {drafts}
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
    onhistory={() => asSheet({ kind: 'history' })}
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
    {picked}
    {onme}
    onsettings={(settings) => (held = { ...held, ...settings })}
    {onsignedout}
    onkeep={level === undefined ? undefined : () => changes?.open('keep')}
    onpaste={level === undefined || onMap ? undefined : () => helper?.paste()}
  />

  {#if level !== undefined}
    <Notes bind:this={notes} {lang} {api} game={held} {levelId} {level} characters={held.content.characters} showDone={look.show.doneNotes} {onsignedout} />
    <Helper bind:this={helper} {lang} {api} game={held} {edits} {levelId} characters={held.content.characters} onchanged={(next, now) => (next !== undefined && (held = next), keep(now))} />
  {/if}
  {#if finding}
    <Find {lang} working={edits.now} content={held.content} open={onMap ? undefined : levelId} onpick={found} onclose={() => (finding = false)} onfilter={(ids) => (only = ids)} />
  {/if}
</div>

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
