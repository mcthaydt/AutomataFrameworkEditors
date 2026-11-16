<script lang="ts">
  // The list at the side: the things in the open level (with the tray of things to add), or, on the map, its levels.
  import type { Character, Level } from '@automataframework/framework/headless'
  import { countsOf, Tray } from '../levels/levels.ts'
  import { ListPanel } from '../shell/shell.ts'
  import { type Lang, type Row, wordsIn } from '../words/words.ts'
  import ThingRow from './ThingRow.svelte'

  interface Props {
    lang: Lang
    mode: 'rail' | 'beside' | 'over'
    tab: 'list' | 'add'
    rowHeight: number
    inset: boolean
    mirror: boolean
    onopen: (tab: 'list' | 'add') => void
    onhide: () => void
    /** The map's levels, and the one that starts the game and the one that is picked there. */
    levels: readonly string[] | undefined
    start: string
    pickedLevel: string | undefined
    onpicklevel: (id: string) => void
    /** The open level, and what is picked and held still in it. */
    level: Level | undefined
    things: Level['things']
    picked: readonly string[]
    locked: ReadonlySet<string>
    onpick: (ids: readonly string[]) => void
    characters: Readonly<Record<string, Character>>
    placing: string | undefined
    onchoose: (id: string | undefined) => void
  }
  let {
    lang,
    mode,
    tab,
    rowHeight,
    inset,
    mirror,
    onopen,
    onhide,
    levels,
    start,
    pickedLevel,
    onpicklevel,
    level,
    things,
    picked,
    locked,
    onpick,
    characters,
    placing,
    onchoose,
  }: Props = $props()

  const words = $derived(wordsIn(lang))
  const text = (row: Row): string => (typeof row === 'function' ? row() : row)
</script>

{#snippet levelRow(at: number)}
  {@const id = levels?.[at]}
  {#if id !== undefined}
    <ThingRow
      thing={{ id, character: '' }}
      picked={pickedLevel === id}
      note={id === start ? text(words.map.startWord) : undefined}
      onpick={() => onpicklevel(id)}
    />
  {/if}
{/snippet}
{#snippet thingRow(at: number)}
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
{#snippet tray()}
  <Tray
    {lang}
    {characters}
    counts={level === undefined ? {} : countsOf(level)}
    chosen={placing}
    {onchoose}
  />
{/snippet}

<ListPanel
  {lang}
  {mode}
  tab={levels !== undefined || tab !== 'add' ? 'list' : 'add'}
  name={text(levels !== undefined ? words.map.listLevels : words.panels.listIn)}
  count={levels?.length ?? things.length}
  {rowHeight}
  {inset}
  {mirror}
  {onopen}
  {onhide}
  row={levels !== undefined ? levelRow : thingRow}
  add={levels !== undefined ? undefined : tray}
/>
