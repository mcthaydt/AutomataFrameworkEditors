<script lang="ts">
  import { onMount, untrack } from 'svelte'
  import { type AccessLevel, can } from '../access/access.ts'
  import type { Api } from '../api/api.ts'
  import {
    deviceWord,
    glassOn,
    type Me,
    nextPointers,
    type Pointers,
    rowSize,
    sizeClass,
  } from '../device/device.ts'
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
    startEdits,
    takeDrafts,
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
  import { type Answer, type Saying, say, unsay } from './events.ts'
  import Events from './Events.svelte'
  import { tipDone, tipKept } from './tips.ts'
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
    /** Where the person is in the first run: told whenever it changes. */
    onfacts: (facts: { dirty: boolean; look: boolean }) => void
    /** Told once a save has gone in, and how. */
    onsaved: (how: 'direct' | 'suggestion') => void
    /** Told when a copy was made. */
    onkept: () => void
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
    onfacts,
    onsaved,
    onkept,
  }: Props = $props()

  const measure = (): { w: number; h: number } => ({
    w: document.documentElement.clientWidth,
    h: document.documentElement.clientHeight,
  })
  const first = measure()

  /** What the screen says when it opens: a change brought back or let go, who I am here, and the tips. */
  function begin(): { edits: Edits; said: readonly Saying[] } {
    const taken = takeDrafts(drafts, given)
    let said: readonly Saying[] = []
    let edits = startEdits(given)
    if (taken !== undefined && taken.moved.length > 0) {
      dropDrafts(drafts, given)
      said = say(said, { id: 'draft', kind: 'info', text: WORDS.draftDropped, dismiss: true })
    } else if (taken !== undefined) {
      edits = taken.edits
      said = say(said, { id: 'draft', kind: 'good', text: WORDS.draftBack, dismiss: true })
    }
    if (given.login === undefined) {
      said = say(said, { id: 'standing', kind: 'info', text: WORDS.visitorCan, dismiss: true })
    } else if (!can(given.level, 'save')) {
      said = say(said, { id: 'standing', kind: 'info', text: WORDS.lookOnly, dismiss: true })
    } else if (given.mine !== undefined) {
      said = say(said, { id: 'standing', kind: 'info', text: WORDS.mineWaiting, dismiss: true })
    }
    const toCheck = given.waiting - (given.mine === undefined ? 0 : 1)
    if (given.level === 'owner' && given.login !== undefined && savedBefore && !tipDone(remembered, 'share')) {
      said = say(said, { id: 'tip-share', kind: 'info', text: WORDS.tipShare, dismiss: true })
    }
    if (can(given.level, 'approve') && toCheck > 0 && !tipDone(remembered, 'approve')) {
      said = say(said, { id: 'tip-approve', kind: 'info', text: WORDS.tipApprove, dismiss: true })
    }
    return { edits, said }
  }
  const started = begin()

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

  $effect(() => onfacts({ dirty, look: signedIn && !can(access, 'save') }))

  // What the page is made of is told to the stylesheet once, on the page itself: the glass (when it is see-through),
  // and below, on the screen's own root, the size and the row size.
  $effect(() => {
    const support = {
      blur: CSS.supports('backdrop-filter', 'blur(1px)') || CSS.supports('-webkit-backdrop-filter', 'blur(1px)'),
      lessSeeThrough: matchMedia('(prefers-reduced-transparency: reduce)').matches,
      moreContrast: matchMedia('(prefers-contrast: more)').matches,
    }
    document.documentElement.dataset.glass = glassOn(me, support) ? 'on' : 'off'
    return () => {
      delete document.documentElement.dataset.glass
    }
  })

  onMount(() => {
    const measured = (): void => {
      viewport = measure()
    }
    const warn = (e: BeforeUnloadEvent): void => {
      // The browser's own question when the tab is closed with something unsaved.
      if (dirty) e.preventDefault()
    }
    const heard = (e: PointerEvent): void => {
      const next = nextPointers(pointers, e)
      if (next.last !== pointers.last || next.penSeen !== pointers.penSeen || next.hovering !== pointers.hovering) {
        pointers = next
      }
    }
    const typing = (e: KeyboardEvent): boolean => {
      const target = e.target
      return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
    }
    const key = (e: KeyboardEvent): void => {
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
      }
    }
    const up = (): void => {
      online = true
    }
    const down = (): void => {
      online = false
    }
    window.addEventListener('resize', measured)
    window.addEventListener('beforeunload', warn)
    window.addEventListener('keydown', key)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    for (const type of ['pointerdown', 'pointermove', 'pointerover', 'pointerout', 'pointercancel']) {
      window.addEventListener(type, heard as EventListener, { capture: true, passive: true })
    }
    return () => {
      window.removeEventListener('resize', measured)
      window.removeEventListener('beforeunload', warn)
      window.removeEventListener('keydown', key)
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
      for (const type of ['pointerdown', 'pointermove', 'pointerover', 'pointerout', 'pointercancel']) {
        window.removeEventListener(type, heard as EventListener, { capture: true })
      }
    }
  })

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
    if (result.moved) keep(inLevel(edits, levelId, () => result.edit.now))
  }

  function openList(tab: 'list' | 'add'): void {
    rows = rowSize(pointers, me.rows)
    docks.list = tab === 'add' ? 'add' : 'list'
  }

  /** Asks first when something is not saved; `then` is what the person wanted to do. */
  function leave(then: () => void): void {
    if (!dirty) return then()
    pending = then
    events = say(events, { id: 'leave', kind: 'info', text: WORDS.leaveAsk, ask: 'leave' })
  }
  const closeSheet = (): void => go(withoutSheet(route))

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
    onkept()
  }
  function copyFile(): void {
    const copy = copyOfNow()
    if (copy === undefined) return
    keepCopy(document, copy)
    events = unsay(events, 'keep')
    events = say(events, { id: 'copied', kind: 'good', text: WORDS.copyKept, dismiss: true })
    onkept()
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
    const settings = lay.settings === 'side' ? 296 : lay.settings === 'tab' ? 44 : 0
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
  <div class="look world" {lang} data-size={size} data-rows={rows}>
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
          onpick={(id) => (picked = id)}
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
        onhide={() => (docks.list = 'closed')}
      >
        {#snippet row(at)}
          {@const thing = things[at]}
          {#if thing !== undefined}
            <button
              type="button"
              class="thing-row"
              data-row={thing.id}
              aria-pressed={picked === thing.id}
              onclick={() => (picked = thing.id)}
            >
              <span class="what">{nameOf(thing.id)}</span>
              <small>{nameOf(thing.character)}</small>
            </button>
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
        onhide={() => (docks.settings = 'hidden')}
        onshow={() => (docks.settings = 'shown')}
      >
        <div class="pad">
          <button type="button" class="up" onclick={() => nudge(placed.id, 'up')}>{WORDS.moveUp}</button>
          <button type="button" class="left" onclick={() => nudge(placed.id, 'left')}>{WORDS.moveLeft}</button>
          <button type="button" class="right" onclick={() => nudge(placed.id, 'right')}>{WORDS.moveRight}</button>
          <button type="button" class="down" onclick={() => nudge(placed.id, 'down')}>{WORDS.moveDown}</button>
        </div>
      </SettingsPanel>
    {/if}

    <Events {events} onanswer={answered} />
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
  .thing-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    height: 100%;
    padding: 0 12px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--words);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .thing-row:hover {
    background: var(--hover);
  }
  .thing-row[aria-pressed='true'] {
    background: var(--picked);
    color: var(--bright);
  }
  .thing-row small {
    color: var(--quiet);
  }
  .pad {
    display: grid;
    grid-template-areas:
      '. up .'
      'left . right'
      '. down .';
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    padding: 8px;
  }
  .pad button {
    min-width: 44px;
    min-height: 44px;
    padding: 0 6px;
    border: 0;
    border-radius: 8px;
    background: var(--raised);
    color: var(--words);
    font: inherit;
    cursor: pointer;
  }
  .pad button:hover {
    background: var(--hover);
  }
  .up {
    grid-area: up;
  }
  .left {
    grid-area: left;
  }
  .right {
    grid-area: right;
  }
  .down {
    grid-area: down;
  }
</style>
