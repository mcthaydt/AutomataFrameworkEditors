<script lang="ts">
  // The panels around the level: the tools, the list of what is in it (and the things to add), and the settings of what is
  // picked. While the level plays they stay where they are and go quiet (nothing in them can be touched); put away
  // (`away`), they are not drawn at all. They decide nothing: every press goes up as a call.
  import type { GameContent, Level } from '@automataframework/framework/headless'
  import type { Me, SizeClass } from '../device/device.ts'
  import type { Working } from '../game/game.ts'
  import { kindsOf, ShowMenu, type Show, ThingSettings } from '../levels/levels.ts'
  import { type Docks, type HoldButton, Hold, type Layout, SettingsPanel, type Tool, Toolbar } from '../shell/shell.ts'
  import { type Lang, nameOf, type Row, wordsIn } from '../words/words.ts'
  import { SECOND_COLUMN } from './insets.ts'
  import type { Look } from './look.svelte.ts'
  import Nudge from './Nudge.svelte'
  import { sayFor } from './said.ts'
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
    /** The level that is open, every level (for where a door may lead) and the hand on the history. */
    levelId: string
    ways: Working['levels']
    hand: { grab: () => void; edit: (next: Level) => void; drop: (gaveUp: boolean) => void }
    ongo: (level: string, door?: string) => void
    /** The game, for the words a thing's message stands for. */
    content: GameContent
    /** What the level shows and what Paint holds; `me` for the two choices about the drawing hand. */
    look: Look
    me: Me
    onme: (next: Me) => void
    /** Asks the level to come to the whole of it, or close up. */
    onnear: (near: Show['near']) => void
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
    levelId,
    ways,
    hand,
    ongo,
    content,
    look,
    me,
    onme,
    onnear,
  }: Props = $props()

  const HOLDS: Readonly<Partial<Record<Tool, readonly HoldButton[]>>> = {
    paint: [
      { id: 'box', icon: 'square', words: 'holdBox' },
      { id: 'fill', icon: 'paint-bucket', words: 'holdFill' },
      { id: 'erase', icon: 'eraser', words: 'holdErase' },
    ],
    erase: [{ id: 'box', icon: 'square', words: 'holdBox' }],
  }
  const holds = $derived(levels === undefined ? HOLDS[tool] : undefined)
  let showOpen = $state(false)
  /** A phone on its side draws the toolbar two buttons wide; the panels beside it move over by the second column. */
  const extra = $derived(size === 'phone-sideways' ? SECOND_COLUMN : 0)
  const things = $derived(level?.things ?? [])
  /** The things that are picked (a start has no settings), and the one when there is one. */
  const held = $derived(things.filter((thing) => picked.includes(thing.id)))
  const placed = $derived(held.length === 1 ? held[0] : undefined)
  const said = $derived(wordsIn(lang))
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row
</script>

{#if !away}
  <div class="panels" data-panels inert={quiet} class:quiet style:--bar-extra="{extra}px">
    {#if !levels || size === 'phone' || lay.list === 'hidden'}
    <Toolbar
      workspace={levels ? NO_TOOLS : WORLD}
      {lang}
      {tool}
      side={lay.toolbar}
      keys={device === 'computer'}
      undoHere={size === 'phone'}
      twoColumns={extra > 0}
      {canUndo}
      {canRedo}
      mirror={lay.mirror}
      onpick={ontool}
      {onundo}
      {onredo}
      onlist={lay.list === 'hidden' ? () => onopen('list') : undefined}
      onshow={levels ? undefined : () => (showOpen = !showOpen)}
      {showOpen}
    />
    {/if}

    {#if holds !== undefined}
      <Hold
        {lang}
        buttons={holds}
        touch={device !== 'computer' || navigator.maxTouchPoints > 0}
        open={docks.hold}
        mirror={lay.mirror}
        inset={(lay.toolbar === 'left' ? 84 + extra : 0) + (lay.list === 'rail' ? 68 : lay.list === 'beside' ? 288 : 0)}
        onhold={look.hold}
        ontoggle={() => ondocks({ ...docks, hold: !docks.hold })}
      />
    {/if}

    {#if showOpen && !levels}
      <div class="show" class:left={lay.toolbar === 'left'} class:mirror={lay.mirror}>
        <ShowMenu {lang} show={look.show} {me} onshow={look.showing} {onnear} {onme} onclose={() => (showOpen = false)} />
      </div>
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
        painting={tool === 'paint'}
        kinds={level === undefined ? 0 : kindsOf(level, content.tilesets).length}
        onground={() => ontool('paint')}
        onchoose={(id) => {
          onplacing(id)
          if (id !== undefined) ontool('place')
        }}
      />
    {/if}

    {#snippet arrows()}
      {#if placed !== undefined}<Nudge {lang} onnudge={(way) => onnudge(placed.id, way)} />{/if}
    {/snippet}
    {#if !levels && lay.settings !== 'none' && level !== undefined && held.length > 0}
      <SettingsPanel
        {lang}
        mode={lay.settings}
        name={placed === undefined ? text(said.thing.settingsMany, held.length) : nameOf(placed.id)}
        mirror={lay.mirror}
        onhide={() => ondocks({ ...docks, settings: 'hidden' })}
        onshow={() => ondocks({ ...docks, settings: 'shown' })}
        foot={placed === undefined ? undefined : arrows}
      >
        <ThingSettings
          {lang}
          {level}
          {levelId}
          {characters}
          ids={held.map((thing) => thing.id)}
          levels={ways}
          {hand}
          {ongo}
          says={(message) => sayFor(content, message)}
        />
      </SettingsPanel>
    {/if}
  </div>
{/if}

<style>
  /* The panels float where they always do; this box only carries "quiet" over all of them. */
  .panels {
    display: contents;
  }
  .show {
    position: absolute;
    z-index: 40;
    right: max(8px, env(safe-area-inset-right));
    bottom: calc(var(--tools-room, 0px) + max(8px, env(safe-area-inset-bottom)));
  }
  .show.left {
    right: auto;
    left: calc(max(8px, env(safe-area-inset-left)) + 84px + var(--bar-extra, 0px));
    bottom: max(8px, env(safe-area-inset-bottom));
  }
  .show.mirror {
    right: auto;
    left: max(8px, env(safe-area-inset-left));
  }
  .show.left.mirror {
    left: auto;
    right: calc(max(8px, env(safe-area-inset-right)) + 84px + var(--bar-extra, 0px));
  }
  .quiet :global(.dock),
  .quiet :global(aside.panel),
  .quiet :global(nav.rail) {
    opacity: 0.55;
  }
</style>
