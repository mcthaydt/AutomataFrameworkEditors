<script lang="ts">
  // The panels around the level: the tools, the list of what is in it (and the things to add), and the settings of what is
  // picked. While the level plays they stay where they are and go quiet (nothing in them can be touched); put away
  // (`away`), they are not drawn at all. They decide nothing: every press goes up as a call.
  import type { GameContent, Level } from '@automataframework/framework/headless'
  import type { SizeClass } from '../device/device.ts'
    import { type Docks, type Layout, SettingsPanel, type Tool, Toolbar } from '../shell/shell.ts'
  import { type Lang, nameOf } from '../words/words.ts'
  import Nudge from './Nudge.svelte'
  import { WORLD } from './world-workspace.ts'
  import WorldList from './WorldList.svelte'

  /** The map has no tools of its own: only what the shell adds (Undo and Redo on a phone, the list's button). */
  const NO_TOOLS = { ...WORLD, tools: [] }

  interface Props {
    lang: Lang
    lay: Layout
    device: 'ipad' | 'phone' | 'computer'
    size: SizeClass
    docks: Docks
    tool: Tool
    /** The character the Place tool is holding. */
    placing: string | undefined
    characters: GameContent['characters']
    level: Level | undefined
    picked: readonly string[]
    locked: ReadonlySet<string>
    rowHeight: number
    canUndo: boolean
    canRedo: boolean
    /** The level is playing: the panels are quiet. */
    quiet: boolean
    /** The panels are put away. */
    away: boolean
    ontool: (next: Tool) => void
    onundo: () => void
    onredo: () => void
    onopen: (tab: 'list' | 'add') => void
    ondocks: (next: Docks) => void
    onplacing: (id: string | undefined) => void
    onpick: (ids: readonly string[]) => void
    onnudge: (id: string, way: 'left' | 'right' | 'up' | 'down') => void
    /** On the map the list holds its levels: which start the game, which is picked. Else undefined. */
    levels: readonly string[] | undefined
    start: string
    pickedLevel: string | undefined
    onpicklevel: (id: string) => void
  }
  let {
    lang,
    lay,
    device,
    size,
    docks,
    tool,
    placing,
    characters,
    level,
    picked,
    locked,
    rowHeight,
    canUndo,
    canRedo,
    quiet,
    away,
    ontool,
    onundo,
    onredo,
    onopen,
    ondocks,
    onplacing,
    onpick,
    onnudge,
    levels,
    start,
    pickedLevel,
    onpicklevel,
  }: Props = $props()

  const things = $derived(level?.things ?? [])
  const placed = $derived(picked.length === 1 ? things.find((thing) => thing.id === picked[0]) : undefined)
</script>

{#if !away}
  <div class="panels" data-panels inert={quiet} class:quiet>
    {#if !levels || size === 'phone' || lay.list === 'hidden'}
    <Toolbar
      workspace={levels ? NO_TOOLS : WORLD}
      {lang}
      {tool}
      side={lay.toolbar}
      keys={device === 'computer'}
      undoHere={size === 'phone'}
      {canUndo}
      {canRedo}
      mirror={lay.mirror}
      onpick={ontool}
      {onundo}
      {onredo}
      onlist={lay.list === 'hidden' ? () => onopen('list') : undefined}
    />
    {/if}

    {#if lay.list !== 'hidden'}
      <WorldList
        {lang}
        mode={lay.list}
        tab={docks.list === 'add' ? 'add' : 'list'}
        {rowHeight}
        inset={lay.toolbar === 'left'}
        mirror={lay.mirror}
        {onopen}
        onhide={() => ondocks({ ...docks, list: 'closed' })}
        {levels}
        {start}
        {pickedLevel}
        {onpicklevel}
        {level}
        {things}
        {picked}
        {locked}
        {onpick}
        {characters}
        {placing}
        onchoose={(id) => {
          onplacing(id)
          if (id !== undefined) ontool('place')
        }}
      />
    {/if}

    {#if !levels && lay.settings !== 'none' && placed !== undefined}
      <SettingsPanel
        {lang}
        mode={lay.settings}
        name={nameOf(placed.id)}
        mirror={lay.mirror}
        onhide={() => ondocks({ ...docks, settings: 'hidden' })}
        onshow={() => ondocks({ ...docks, settings: 'shown' })}
      >
        <Nudge onnudge={(way) => onnudge(placed.id, way)} />
      </SettingsPanel>
    {/if}
  </div>
{/if}

<style>
  /* The panels float where they always do; this box only carries "quiet" over all of them. */
  .panels {
    display: contents;
  }
  .quiet :global(.dock),
  .quiet :global(aside.panel),
  .quiet :global(nav.rail) {
    opacity: 0.55;
  }
</style>
