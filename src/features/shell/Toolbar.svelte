<script lang="ts">
  // The five tools every editor shares, as icons (the Owner, 2026-11-17: icons over words), each with its name spoken and
  // as a tooltip, and its key under it on a computer; a tool with no job in this editor is not drawn. Down the left edge on an iPad held sideways and a phone on its side, along the bottom elsewhere. On an
  // upright phone, where the top bar has no room, it also holds Undo and Redo.
  import { Dock, Icon, type IconName } from '../ui/ui.ts'
  import { type Lang, type Row, wordsIn } from '../words/words.ts'
  import { KEYS } from './keys.ts'
  import { TOOLS, type Tool, type Workspace } from './workspace.ts'

  interface Props {
    workspace: Workspace
    lang: Lang
    tool: Tool
    side: 'left' | 'bottom'
    /** Show each tool's key beside its word (a computer has keys). */
    keys: boolean
    /** An upright phone: Undo and Redo are drawn here, since the top bar has no room for them. */
    undoHere: boolean
    canUndo: boolean
    canRedo: boolean
    mirror?: boolean
    onpick: (tool: Tool) => void
    onundo: () => void
    onredo: () => void
    /** The list is shut and not drawn as a rail (a small screen): this button opens it. Left out: not drawn. */
    onlist?: (() => void) | undefined
    /** Show opens a menu of what the level shows; the button is pressed while it is open. Left out: not drawn. */
    onshow?: (() => void) | undefined
    showOpen?: boolean
    /** A phone on its side: the column is two buttons wide, so all seven fit between the top bar and the bottom. */
    twoColumns?: boolean
  }
  let {
    workspace,
    lang,
    tool,
    side,
    keys,
    undoHere,
    canUndo,
    canRedo,
    mirror = false,
    onpick,
    onundo,
    onredo,
    onlist,
    onshow,
    showOpen = false,
    twoColumns = false,
  }: Props = $props()

  const words = $derived(wordsIn(lang))
  const ICON: Readonly<Record<Tool, IconName>> = {
    pick: 'cursor',
    place: 'plus-circle',
    paint: 'paint-brush',
    erase: 'eraser',
    join: 'link',
  }
  const NAME = {
    pick: 'toolPick',
    place: 'toolPlace',
    paint: 'toolPaint',
    erase: 'toolErase',
    join: 'toolJoin',
  } as const
  const text = (row: Row): string => (typeof row === 'string' ? row : row())
  const shown = $derived(TOOLS.filter((one) => workspace.tools.includes(one)))
  const keyOf = (one: Tool): string => KEYS.find((k) => k.id === `tool:${one}`)?.key ?? ''
</script>

<Dock label={text(words.panels.toolbarLabel)} side={mirror && side === 'left' ? 'right' : side} fit={!undoHere}>
  <div class="tools" class:column={side === 'left'} class:rows={undoHere} class:pair={twoColumns}>
  {#each shown as one (one)}
    <button
      type="button"
      class="tool"
      class:on={one === tool}
      aria-pressed={one === tool}
      aria-label={text(words.panels[NAME[one]])}
      title={text(words.panels[NAME[one]])}
      onclick={() => onpick(one)}
    >
      <Icon name={ICON[one]} size={24} />
      {#if keys}<kbd>{keyOf(one)}</kbd>{/if}
    </button>
  {/each}
  {#if undoHere}
    <i class="break"></i>
  {:else if onlist || onshow}
    <i class="rule"></i>
  {/if}
  {#if onlist}
    <button type="button" class="tool plain" aria-label={text(words.panels.listLabel)} title={text(words.panels.listLabel)} onclick={onlist}>
      <Icon name="list" size={24} />
    </button>
  {/if}
  {#if undoHere}
    <button type="button" class="tool plain" aria-label={text(words.shell.undo)} title={text(words.shell.undo)} aria-disabled={canUndo ? undefined : 'true'} onclick={() => { if (canUndo) onundo() }}>
      <Icon name="arrow-counter-clockwise" size={24} />
    </button>
    <button type="button" class="tool plain" aria-label={text(words.shell.redo)} title={text(words.shell.redo)} aria-disabled={canRedo ? undefined : 'true'} onclick={() => { if (canRedo) onredo() }}>
      <Icon name="arrow-clockwise" size={24} />
    </button>
  {/if}
  {#if onshow}
    <button type="button" class="tool plain" class:on={showOpen} aria-pressed={showOpen} aria-label={text(words.ground.showTitle)} title={text(words.ground.showTitle)} onclick={onshow}>
      <Icon name="eye" size={24} />
    </button>
  {/if}
</div>
</Dock>

<style>
  .tools {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 4px;
  }
  .column {
    flex-direction: column;
    align-items: stretch;
  }
  .pair {
    display: grid;
    grid-template-columns: repeat(2, auto);
  }
  .pair .rule {
    display: none;
  }
  .tool {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-width: 52px;
    min-height: 52px;
    padding: 4px 8px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: 12px;
    cursor: pointer;
  }
  .tool:hover {
    background: var(--hover);
  }
  .tool.on {
    background: var(--picked);
    color: var(--bright);
    box-shadow: inset 0 0 0 2px var(--accent);
  }
  .tool[aria-disabled='true'] {
    color: var(--quiet);
    cursor: default;
  }
  kbd {
    font: 500 11px var(--measure);
    color: var(--quiet);
  }
  .rule {
    align-self: stretch;
    width: 1px;
    margin: 4px;
    background: var(--g-edge);
  }
  .column .rule {
    width: auto;
    height: 1px;
    margin: 4px 0;
  }
  /* An upright phone has two rows: the tools, then the list, Undo, Redo and Show. */
  .rows {
    flex-wrap: wrap;
  }
  .break {
    flex-basis: 100%;
    height: 0;
  }
  @media (max-width: 440px) {
    .tools:not(.column) {
      gap: 1px;
      padding: 4px 1px;
    }
    .tools:not(.column) .tool {
      flex: 1 1 auto;
      min-width: 44px;
      padding: 4px 3px;
      font-size: 11px;
    }
  }
  /* A phone on its side has little height: the column is packed to 44 pixel buttons so it fits between the bars. */
  @media (max-height: 480px) {
    .column {
      gap: 0;
    }
    .column .tool {
      min-height: 44px;
      padding: 2px 8px;
    }
    .column .rule {
      margin: 2px 0;
    }
  }
</style>
