<script lang="ts">
  // The panels around the level: the tools, the list of what is in it (and the things to add), and the settings of what is
  // picked. While the level plays they stay where they are and go quiet (nothing in them can be touched); put away
  // (`away`), they are not drawn at all. They decide nothing: every press goes up as a call.
  import type { GameContent, Level } from '@automataframework/framework/headless'
  import type { SizeClass } from '../device/device.ts'
  import { countsOf, Tray } from '../levels/levels.ts'
  import { type Docks, type Layout, ListPanel, SettingsPanel, type Tool, Toolbar } from '../shell/shell.ts'
  import { type Lang, nameOf, type Row, wordsIn } from '../words/words.ts'
  import Nudge from './Nudge.svelte'
  import ThingRow from './ThingRow.svelte'
  import { WORLD } from './world-workspace.ts'

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
  }: Props = $props()

  const words = $derived(wordsIn(lang))
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row
  const things = $derived(level?.things ?? [])
  const placed = $derived(picked.length === 1 ? things.find((thing) => thing.id === picked[0]) : undefined)
</script>

{#if !away}
  <div class="panels" data-panels inert={quiet} class:quiet>
    <Toolbar
      workspace={WORLD}
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

    {#if lay.list !== 'hidden'}
      <ListPanel
        {lang}
        mode={lay.list}
        tab={docks.list === 'add' ? 'add' : 'list'}
        name={text(words.panels.listIn)}
        count={things.length}
        {rowHeight}
        inset={lay.toolbar === 'left'}
        mirror={lay.mirror}
        {onopen}
        onhide={() => ondocks({ ...docks, list: 'closed' })}
      >
        {#snippet row(at)}
          {@const thing = things[at]}
          {#if thing !== undefined}
            <ThingRow
              {thing}
              picked={picked.includes(thing.id)}
              note={locked.has(thing.id) ? text(words.levels.lockedNote) : undefined}
              onpick={() => onpick([thing.id])}
            />
          {/if}
        {/snippet}
        {#snippet add()}
          <Tray
            {lang}
            {characters}
            counts={level === undefined ? {} : countsOf(level)}
            chosen={placing}
            onchoose={(id) => {
              onplacing(id)
              if (id !== undefined) ontool('place')
            }}
          />
        {/snippet}
      </ListPanel>
    {/if}

    {#if lay.settings !== 'none' && placed !== undefined}
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
