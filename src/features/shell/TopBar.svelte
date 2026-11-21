<script lang="ts">
  // The top bar every editor has: the game's menu, the editor and the part, Undo and Redo, what is wrong, Find, Play,
  // and the one button that puts changes in. A control with nothing to do yet is not drawn; one that cannot act now says
  // so (`aria-disabled`), so a person is never left guessing. Menus open under the button that opened them.
  import { tick } from 'svelte'
  import { type AccessLevel, can } from '../access/access.ts'
  import type { SizeClass } from '../device/device.ts'
  import { Dock, Icon, Note } from '../ui/ui.ts'
  import { type Lang, nameOf, type Row, wordsIn } from '../words/words.ts'
  import EditorMenu from './EditorMenu.svelte'
  import Faces from './Faces.svelte'
  import GameMenu from './GameMenu.svelte'
  import { editorItems, gameItems, noteFor, partItems } from './menus.ts'
  import PartMenu from './PartMenu.svelte'
  import { mainButton, type StatusFacts, statusOf } from './status.ts'
  import type { Workspace } from './workspace.ts'

  interface Props {
    workspace: Workspace
    lang: Lang
    size: SizeClass
    device: 'ipad' | 'phone' | 'computer'
    gameName: string
    /** Which part of the editor is open. */
    part: string
    /** The open level, if there is one. */
    place: string | undefined
    levels: readonly string[]
    signedIn: boolean
    login: string | undefined
    level: AccessLevel
    /** How many changes wait in the game for someone to look at. */
    waiting: number
    facts: StatusFacts
    people: readonly { readonly login: string }[]
    /** Someone else's change is open: what the bar would do to the person's own work waits, and says why. */
    held?: boolean | undefined
    canUndo: boolean
    canRedo: boolean
    onundo: () => void
    onredo: () => void
    /** What a press on the main button does. */
    onmain: (what: 'put' | 'send' | 'keep' | 'waiting') => void
    /** The game's menu: share, waiting, keep, games, sign-in, sign-out. */
    onmenu: (id: string) => void
    /** A part or a level picked from the part menu. */
    onpart: (id: string) => void
    onpeople: () => void
    /** Left out: the control is not drawn. */
    onfind?: (() => void) | undefined
    onplay?: (() => void) | undefined
    onproblems?: (() => void) | undefined
    ontocheck?: (() => void) | undefined
    playing?: boolean
    /** The map is the thing on screen. */
    mapOn?: boolean
    /** Left out: there is no map, so no button and no row. */
    onmap?: (() => void) | undefined
  }
  let {
    workspace,
    lang,
    size,
    device,
    gameName,
    part,
    place,
    levels,
    signedIn,
    login,
    level,
    waiting,
    facts,
    people,
    held = false,
    canUndo,
    canRedo,
    onundo,
    onredo,
    onmain,
    onmenu,
    onpart,
    onpeople,
    onfind,
    onplay,
    onproblems,
    ontocheck,
    playing = false,
    mapOn = false,
    onmap,
  }: Props = $props()

  const words = $derived(wordsIn(lang))
  const w = $derived(words.bar)
  const m = $derived(words.menus)
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row
  const compact = $derived(size === 'phone')
  // A game that plays does not show a change made under it, so none is made until it stops.
  const canStep = $derived(!playing && !held)

  type Open = 'game' | 'editors' | 'part'
  let open = $state<Open | undefined>(undefined)
  let left = $state(8)
  let top = $state(64)
  let note = $state<string | undefined>(undefined)
  let opener: HTMLElement | undefined
  const anchors: Record<Open, HTMLElement | undefined> = { game: undefined, editors: undefined, part: undefined }

  function show(which: Open): void {
    if (open === which) return close()
    const anchor = anchors[which]
    if (anchor === undefined) return
    const box = anchor.getBoundingClientRect()
    opener = anchor
    left = Math.max(8, Math.min(box.left, window.innerWidth - 308))
    top = box.bottom + 6
    note = undefined
    open = which
  }
  function close(): void {
    open = undefined
    opener?.focus()
  }

  const gameFacts = $derived({
    signedIn,
    level,
    waiting,
    levelName: place,
  })
  const who = $derived(
    login === undefined
      ? text(w.canVisit)
      : `${login} · ${text(
          level === 'owner'
            ? w.canOwner
            : level === 'edit'
              ? w.canEdit
              : level === 'approve'
                ? w.canApprove
                : level === 'suggest'
                  ? w.canSuggest
                  : w.canLook,
        )}`,
  )
  const gameRows = $derived(gameItems(gameFacts, m))
  const editorRows = $derived(editorItems(m, workspace.id))
  const partRows = $derived(
    partItems(
      {
        workspace,
        part,
        compact,
        levels,
        level: mapOn ? undefined : place,
        map:
          onmap === undefined
            ? undefined
            : { words: text(words.map.mapWord), about: text(words.map.mapAbout), here: mapOn },
      },
      gameFacts,
      m,
    ),
  )

  const current = $derived(workspace.parts.find((one) => one.id === part))
  const partWords = $derived(text(current === undefined ? m.partLevels : m[current.words]))
  // An upright phone has room for the level's name only: the part is said in its menu.
  const partName = $derived(
    mapOn
      ? compact
        ? text(words.map.mapWord)
        : `${partWords} · ${text(words.map.mapWord)}`
      : place === undefined
        ? partWords
        : compact
          ? nameOf(place)
          : `${partWords} · ${nameOf(place)}`,
  )

  const statuses = $derived(statusOf(facts))
  const main = $derived(mainButton(level, signedIn, facts.changes))
  const where = $derived(
    text(device === 'ipad' ? w.onIpad : device === 'phone' ? w.onPhone : w.onComputer),
  )
  const offline = $derived(statuses.some((s) => s.kind === 'offline'))
  const problems = $derived(statuses.find((s) => s.kind === 'problems'))
  const toCheck = $derived(statuses.find((s) => s.kind === 'to-check'))
  const mine = $derived(statuses.find((s) => s.kind === 'waiting' || s.kind === 'more' || s.kind === 'asked'))

  // The names come first. Where the bar has no room for every word, it lets go of words in this order before any name is
  // cut: the second line under the main button, then the status's words (it keeps its icon, and its words stay in its
  // spoken name and its tooltip). The main button keeps its words longest, as it is the one thing the screen most wants
  // pressed: only when the bar still runs off the screen with the names cut does it keep just its icon, with its words in its spoken name and
  // its tooltip.
  let barEl = $state<HTMLDivElement | undefined>(undefined)
  let squeeze = $state(0)
  const MOST = 3
  /** The bar still runs off the screen, or, before the status has let go of its words, a name is cut. */
  const cut = (bar: HTMLElement, step: number): boolean =>
    bar.scrollWidth > bar.clientWidth + 1 ||
    bar.getBoundingClientRect().right > window.innerWidth + 1 ||
    (step < 2 && [...bar.querySelectorAll<HTMLElement>('.name')].some((one) => one.scrollWidth > one.clientWidth + 1))
  let fitting = 0
  async function fit(): Promise<void> {
    const bar = barEl
    if (bar === undefined) return
    const run = ++fitting
    for (let next = 0; next <= MOST; next += 1) {
      squeeze = next
      await tick()
      if (run !== fitting || !cut(bar, next)) return
    }
  }
  $effect(() => {
    void [gameName, partName, statuses, main, people.length, size, onplay, onfind, onmap]
    void fit()
  })
  $effect(() => {
    const bar = barEl
    if (bar === undefined) return
    let width = bar.clientWidth
    const watch = new ResizeObserver(() => {
      if (bar.clientWidth === width) return
      width = bar.clientWidth
      void fit()
    })
    watch.observe(bar)
    return () => watch.disconnect()
  })
  const mainWords = $derived(
    main === undefined
      ? ''
      : text(
          mine?.kind === 'more' ? w.sendMore : main === 'put' ? w.putInGame : main === 'send' ? w.sendToCheck : w.keepCopy,
          ...(mine?.kind === 'more' ? [mine.count, mine.by] : []),
        ),
  )
  const quietWords = $derived(
    mine?.kind === 'waiting'
      ? text(w.waitingFor, mine.by)
      : mine?.kind === 'asked'
        ? text(words.check.askedTitle, mine.by)
        : text(w.upToDate),
  )

  function pickGame(id: string): void {
    close()
    onmenu(id)
  }
  function pickEditor(id: string): void {
    const said = noteFor(m, id)
    close()
    if (said !== undefined) note = said
  }
  function pickPart(id: string): void {
    if (id === 'map') {
      close()
      return onmap?.()
    }
    if (id.startsWith('editor:')) return pickEditor(id.slice('editor:'.length))
    if (id.startsWith('game:')) return pickGame(id.slice('game:'.length))
    close()
    onpart(id)
  }
</script>

<Dock label={text(w.topBar)} side="top" tight>
  <div class="bar" data-bar data-squeeze={squeeze} bind:this={barEl}>
    {#if !compact}
      <button type="button" class="game" bind:this={anchors.game} aria-haspopup="menu" aria-expanded={open === 'game'} onclick={() => show('game')}>
        <i class="logo" aria-hidden="true"></i>
        <span class="name">{gameName}</span>
        <Icon name="caret-down" />
      </button>
      <button type="button" class="editors" bind:this={anchors.editors} aria-haspopup="menu" aria-expanded={open === 'editors'} onclick={() => show('editors')}>
        <b>{text(m.editorWorld)}</b>
        <Icon name="caret-down" />
      </button>
    {/if}
    <button type="button" class="part" bind:this={anchors.part} aria-haspopup="menu" aria-expanded={open === 'part'} onclick={() => show('part')}>
      <span class="name">{partName}</span>
      <Icon name="caret-down" />
    </button>
    {#if onmap && !compact}
      <button type="button" class="chip" aria-pressed={mapOn} aria-label={text(words.map.mapWord)} title={text(words.map.mapWord)} onclick={onmap}>
        <Icon name="map-trifold" />
      </button>
    {/if}
    <span class="fill"></span>
    {#if !compact}
      <button type="button" class="icon" aria-label={text(words.shell.undo)} title={held ? text(w.heldWhy) : text(words.shell.undo)} aria-disabled={canUndo && canStep ? undefined : 'true'} onclick={() => {
          if (canUndo && canStep) onundo()
        }}>
        <Icon name="arrow-counter-clockwise" />
      </button>
      <button type="button" class="icon" aria-label={text(words.shell.redo)} title={held ? text(w.heldWhy) : text(words.shell.redo)} aria-disabled={canRedo && canStep ? undefined : 'true'} onclick={() => {
          if (canRedo && canStep) onredo()
        }}>
        <Icon name="arrow-clockwise" />
      </button>
    {/if}
    {#if problems?.kind === 'problems'}
      {#if onproblems}
        <button type="button" class="chip bad" aria-label={text(w.problems, problems.count)} title={text(w.problems, problems.count)} onclick={onproblems}>
          <Icon name="warning" /><span class="full">{text(w.problems, problems.count)}</span><span class="short" aria-hidden="true">{problems.count}</span>
        </button>
      {:else}
        <span class="chip bad"><Icon name="warning" /><span class="full">{text(w.problems, problems.count)}</span><span class="short" aria-hidden="true">{problems.count}</span></span>
      {/if}
    {/if}
    {#if toCheck?.kind === 'to-check'}
      {#if ontocheck}
        <button type="button" class="chip" aria-label={text(w.toCheck, toCheck.count)} title={text(w.toCheck, toCheck.count)} onclick={ontocheck}>
          <Icon name="list-checks" /><span class="full">{text(w.toCheck, toCheck.count)}</span><span class="short" aria-hidden="true">{toCheck.count}</span>
        </button>
      {:else}
        <span class="chip"><Icon name="list-checks" /><span class="full">{text(w.toCheck, toCheck.count)}</span><span class="short" aria-hidden="true">{toCheck.count}</span></span>
      {/if}
    {/if}
    {#if offline}
      <span class="chip bad" role="status" aria-label={text(w.noInternet)}><Icon name="cloud" /><span class="wordy">{text(w.noInternet)}</span></span>
    {/if}
    {#if onfind}
      <button type="button" class="chip find" aria-label={text(w.find)} title={text(w.find)} onclick={onfind}>
        <Icon name="magnifying-glass" />
      </button>
    {/if}
    <Faces {people} label={text(m.whoCanChange)} onopen={onpeople} most={size === 'phone' ? 1 : size === 'wide' ? 4 : 2} />
    {#if onplay}
      <button
        type="button"
        class="chip play"
        data-tour="play"
        aria-pressed={playing}
        aria-label={text(playing ? w.stop : w.play)}
        title={text(playing ? w.stop : w.play)}
        onclick={onplay}
      >
        <Icon name={playing ? 'stop' : 'play'} />
      </button>
    {/if}
    {#if main !== undefined}
      <button
        type="button"
        class="put"
        data-tour="main"
        class:waiting={mine?.kind === 'more'}
        aria-disabled={held ? 'true' : undefined}
        aria-label={squeeze >= 3 ? mainWords : undefined}
        title={held ? text(w.heldWhy) : squeeze >= 3 ? mainWords : undefined}
        onclick={() => held || onmain(main)}
      >
        <Icon name={main === 'keep' ? 'download-simple' : main === 'send' ? 'paper-plane-tilt' : 'arrow-circle-up'} />
        <span class="what">
          <b>{mainWords}</b>
          {#if mine?.kind !== 'more'}<small class="long">{text(w.changesHere, facts.changes, where)}</small>{/if}
        </span>
      </button>
    {:else}
      <button
        type="button"
        class="put quiet"
        data-tour="main"
        aria-disabled={mine === undefined ? 'true' : undefined}
        aria-label={squeeze >= 2 ? quietWords : undefined}
        title={squeeze >= 2 ? quietWords : undefined}
        onclick={() => mine === undefined || onmain('waiting')}
      >
        <Icon name={mine?.kind === 'waiting' ? 'paper-plane-tilt' : mine?.kind === 'asked' ? 'chat-circle-text' : 'check'} />
        <span class="what"><b>{quietWords}</b></span>
      </button>
    {/if}
  </div>
</Dock>

{#if open !== undefined}
  <button type="button" class="dim dim-2" tabindex="-1" aria-label={text(words.shell.close)} onclick={close}></button>
  <div class="pop" style:left="{left}px" style:top="{top}px" style:max-height="calc(100dvh - {top}px - 8px)">
    {#if open === 'game'}
      <GameMenu name={gameName} {who} items={gameRows} onpick={pickGame} onclose={close} />
    {:else if open === 'editors'}
      <EditorMenu items={editorRows} onpick={pickEditor} onclose={close} />
    {:else}
      <PartMenu items={partRows} onpick={pickPart} onclose={close} />
    {/if}
  </div>
{/if}

{#if note !== undefined}
  <div class="notes">
    <Note floats words={note} button={text(words.shell.gotIt)} onpress={() => (note = undefined)} />
  </div>
{/if}

<style>
  .bar {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 4px;
    min-width: 0;
    height: var(--bar);
    padding: 0 6px;
  }
  .fill {
    flex: 1;
  }
  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 44px;
    min-height: 44px;
    padding: 0 10px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
  /* A button is as wide as its words; the bar squeezes the names that have dots for it (the game's and the part's). */
  button:not(.game, .part) {
    flex: none;
  }
  button:not(.dim):hover,
  button[aria-expanded='true'] {
    background: var(--hover);
  }
  button[aria-disabled='true'] {
    color: var(--quiet);
    cursor: default;
  }
  button[aria-disabled='true']:hover {
    background: transparent;
  }
  .name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* The part's name may be cut, but its button never goes below a finger's width with a few letters showing. */
  .part {
    min-width: 88px;
    flex: 0 1 auto;
  }
  .logo {
    width: 20px;
    height: 20px;
    border-radius: 6px;
    background: var(--accent);
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 10px;
    border-radius: 10px;
    white-space: nowrap;
  }
  .chip[aria-pressed='true'] {
    background: var(--picked);
  }
  .bad {
    color: var(--problem-words);
  }
  .put {
    min-height: 48px;
    border-radius: 12px;
    background: var(--accent);
    color: var(--on-accent);
    font-weight: 600;
  }
  .put:hover {
    background: var(--accent);
  }
  .put.quiet {
    min-height: 44px;
    background: transparent;
    color: var(--quiet);
  }
  .put.quiet:hover {
    background: var(--hover);
  }
  .put .what {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    line-height: 1.15;
  }
  .put small {
    font-size: 13px;
    font-weight: 500;
  }
  /* Nothing in the bar wraps: what has no room lets go of its words instead (see `fit`). */
  .put b,
  .put small {
    white-space: nowrap;
  }
  .bar:not([data-squeeze='0']) .long,
  .bar[data-squeeze='2'] .put.quiet .what,
  .bar[data-squeeze='3'] .put .what {
    display: none;
  }
  :global(.look[data-size='phone-sideways']) .put {
    min-height: 44px;
  }
  /* An upright phone has no room for the words of a count (1 problem, 1 to check): the icon and the number stay, and the
     button's spoken name says it all. */
  .short {
    display: none;
  }

  :global(.look[data-size='phone']) .chip .full {
    display: none;
  }
  :global(.look[data-size='phone']) .chip .short {
    display: inline;
  }
  /* An upright phone has no room for the second line, or for the words beside the icons. */
  :global(.look[data-size='phone']) .long {
    display: none;
  }
  /* Words beside an icon in the bar's chips (Find, No internet) show only where the bar is wide; the icon and its spoken
     name carry them elsewhere. */
  .wordy {
    display: none;
  }
  :global(.look[data-size='wide']) .wordy {
    display: inline;
  }
  .dim {
    position: fixed;
    inset: 0;
    z-index: 50;
    min-width: 0;
    min-height: 0;
    padding: 0;
    border-radius: 0;
  }
  /* As tall as the room under its button, less a margin: the menu in it scrolls (see `Menu`). */
  .pop {
    position: fixed;
    z-index: 51;
    display: flex;
    flex-direction: column;
    width: 300px;
    max-width: calc(100vw - 16px);
  }
  .notes {
    position: fixed;
    z-index: 52;
    top: calc(var(--bar) + 24px);
    left: 50%;
    transform: translateX(-50%);
    max-width: calc(100vw - 16px);
  }
</style>
