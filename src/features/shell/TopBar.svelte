<script lang="ts">
  // The top bar every editor has: the game's menu, the editor and the part, Undo and Redo, what is wrong, Find, Play,
  // and the one button that puts changes in. A control with nothing to do yet is not drawn; one that cannot act now says
  // so (`aria-disabled`), so a person is never left guessing. Menus open under the button that opened them.
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
  }: Props = $props()

  const words = $derived(wordsIn(lang))
  const w = $derived(words.bar)
  const m = $derived(words.menus)
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row
  const compact = $derived(size === 'phone')

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
    partItems({ workspace, part, compact, levels, level: place }, gameFacts, m),
  )

  const current = $derived(workspace.parts.find((one) => one.id === part))
  const partWords = $derived(text(current === undefined ? m.partLevels : m[current.words]))
  const partName = $derived(place === undefined ? partWords : `${partWords} · ${nameOf(place)}`)

  const statuses = $derived(statusOf(facts))
  const main = $derived(mainButton(level, signedIn, facts.changes))
  const where = $derived(
    text(device === 'ipad' ? w.onIpad : device === 'phone' ? w.onPhone : w.onComputer),
  )
  const offline = $derived(statuses.some((s) => s.kind === 'offline'))
  const problems = $derived(statuses.find((s) => s.kind === 'problems'))
  const toCheck = $derived(statuses.find((s) => s.kind === 'to-check'))
  const mine = $derived(statuses.find((s) => s.kind === 'waiting' || s.kind === 'more'))

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
    if (id.startsWith('editor:')) return pickEditor(id.slice('editor:'.length))
    if (id.startsWith('game:')) return pickGame(id.slice('game:'.length))
    close()
    onpart(id)
  }
</script>

<Dock label={text(w.topBar)} side="top" tight>
  <div class="bar" data-bar>
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
    <span class="fill"></span>
    {#if !compact}
      <button type="button" class="icon" aria-label={text(words.shell.undo)} aria-disabled={canUndo ? undefined : 'true'} onclick={() => {
          if (canUndo) onundo()
        }}>
        <Icon name="arrow-counter-clockwise" />
      </button>
      <button type="button" class="icon" aria-label={text(words.shell.redo)} aria-disabled={canRedo ? undefined : 'true'} onclick={() => {
          if (canRedo) onredo()
        }}>
        <Icon name="arrow-clockwise" />
      </button>
    {/if}
    {#if problems?.kind === 'problems'}
      {#if onproblems}
        <button type="button" class="chip bad" onclick={onproblems}>
          <Icon name="warning" /><span>{text(w.problems, problems.count)}</span>
        </button>
      {:else}
        <span class="chip bad"><Icon name="warning" /><span>{text(w.problems, problems.count)}</span></span>
      {/if}
    {/if}
    {#if toCheck?.kind === 'to-check'}
      {#if ontocheck}
        <button type="button" class="chip" onclick={ontocheck}>
          <Icon name="list-checks" /><span>{text(w.toCheck, toCheck.count)}</span>
        </button>
      {:else}
        <span class="chip"><Icon name="list-checks" /><span>{text(w.toCheck, toCheck.count)}</span></span>
      {/if}
    {/if}
    {#if offline}
      <span class="chip bad"><Icon name="cloud" /><span>{text(w.noInternet)}</span></span>
    {/if}
    {#if onfind}
      <button type="button" class="chip find" onclick={onfind}>
        <Icon name="magnifying-glass" /><span class="long">{text(w.find)}</span>
      </button>
    {/if}
    <Faces {people} label={text(m.whoCanChange)} onopen={onpeople} />
    {#if onplay}
      <button type="button" class="chip play" aria-pressed={playing} onclick={onplay}>
        <Icon name={playing ? 'stop' : 'play'} /><span>{text(playing ? w.stop : w.play)}</span>
      </button>
    {/if}
    {#if main !== undefined}
      <button
        type="button"
        class="put"
        data-tour="main"
        class:waiting={mine?.kind === 'more'}
        onclick={() => onmain(main)}
      >
        <Icon name={main === 'keep' ? 'download-simple' : main === 'send' ? 'paper-plane-tilt' : 'arrow-circle-up'} />
        <span class="what">
          <b>{text(
            mine?.kind === 'more'
              ? w.sendMore
              : main === 'put'
                ? w.putInGame
                : main === 'send'
                  ? w.sendToCheck
                  : w.keepCopy,
            ...(mine?.kind === 'more' ? [mine.count, mine.by] : []),
          )}</b>
          {#if mine?.kind !== 'more'}<small class="long">{text(w.changesHere, facts.changes, where)}</small>{/if}
        </span>
      </button>
    {:else if mine?.kind === 'waiting'}
      <button type="button" class="put quiet" data-tour="main" onclick={() => onmain('waiting')}>
        <Icon name="paper-plane-tilt" />
        <span class="what"><b>{text(w.waitingFor, mine.by)}</b></span>
      </button>
    {:else}
      <button type="button" class="put quiet" data-tour="main" aria-disabled="true">
        <Icon name="check" />
        <span class="what"><b>{text(w.upToDate)}</b></span>
      </button>
    {/if}
  </div>
</Dock>

{#if open !== undefined}
  <button type="button" class="dim" tabindex="-1" aria-label={text(words.shell.close)} onclick={close}></button>
  <div class="pop" style:left="{left}px" style:top="{top}px">
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
    <Note words={note} button={text(words.shell.gotIt)} onpress={() => (note = undefined)} />
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
  button:hover,
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
  .part {
    min-width: 0;
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
  .bad {
    color: var(--problem);
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
    font-size: 11px;
    font-weight: 500;
  }
  :global(.look[data-size='phone-sideways']) .put {
    min-height: 44px;
  }
  /* An upright phone has no room for the second line, or for the words beside the icons. */
  :global(.look[data-size='phone']) .long {
    display: none;
  }
  .dim {
    position: fixed;
    inset: 0;
    z-index: 20;
    min-width: 0;
    min-height: 0;
    padding: 0;
    border-radius: 0;
    background: var(--dim);
  }
  .dim:hover {
    background: var(--dim);
  }
  .pop {
    position: fixed;
    z-index: 21;
    width: 300px;
    max-width: calc(100vw - 16px);
    max-height: calc(100vh - 80px);
    overflow-y: auto;
  }
  .notes {
    position: fixed;
    z-index: 22;
    top: calc(var(--bar) + 24px);
    left: 50%;
    transform: translateX(-50%);
    max-width: calc(100vw - 16px);
  }
</style>
