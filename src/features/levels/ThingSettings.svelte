<script lang="ts">
  // Everything a picked thing holds, grouped as a person asks about it: what it does (the character's own values, each
  // with the control its kind has), the one line that says a change here is for this one only, how it looks, and where it
  // is. With several picked it shows only what they all declare, and says "Not the same" where they differ. It decides
  // nothing: every control makes one pure edit (`values.ts`) and gives the new level to whoever holds the history; a
  // slider that is being dragged is one step back, not many.
  import type { GameContent, Level, ThingValue } from '@automataframework/framework/headless'
  import type { Working } from '../game/game.ts'
  import { NumberPad, Segment, Slider } from '../ui/ui.ts'
  import { type Lang, nameOf, type Row, wordsIn } from '../words/words.ts'
  import { refusalWord } from './acts.ts'
  import type { Done } from './done.ts'
  import { type Draw, DRAWS, drawOf, setDraw } from './draw.ts'
  import LeadsTo from './LeadsTo.svelte'
  import ValueControl from './ValueControl.svelte'
  import {
    mayOpen,
    opens,
    putAt,
    rowsOf,
    type SharedRow,
    setValues,
    shared,
    unlink,
    type ValueRow,
    waysOut,
    whereIs,
  } from './values.ts'

  /** How many of a thing's values are shown before "N more settings". */
  const FEW = 4

  interface Props {
    lang: Lang
    level: Level
    levelId: string
    characters: GameContent['characters']
    /** The things that are picked. */
    ids: readonly string[]
    levels: Working['levels']
    /** The person's hand on the level: where a slider drag starts and ends, and where an edit goes. */
    hand: { grab: () => void; edit: (next: Level) => void; drop: (gaveUp: boolean) => void }
    ongo: (level: string, door?: string) => void
    /** The game's words for a message, in its own language. */
    says: (message: string) => string | undefined
  }
  let { lang, level, levelId, characters, ids, levels, hand, ongo, says }: Props = $props()

  const words = $derived(wordsIn(lang))
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row
  const things = $derived(ids.flatMap((id) => level.things.find((thing) => thing.id === id) ?? []))
  const one = $derived(things.length === 1 ? things[0] : undefined)
  const kinds = $derived(new Set(things.map((thing) => thing.character)))

  interface Line {
    readonly row: ValueRow
    readonly mixed: boolean
  }
  const lines = $derived.by((): readonly Line[] => {
    const lists = things.map((thing) => rowsOf(thing, characters[thing.character]))
    if (one !== undefined) return (lists[0] ?? []).map((row) => ({ row, mixed: false }))
    const first = lists[0] ?? []
    const edited = new Set(['number', 'switch', 'choice', 'words'])
    return shared(lists).flatMap((row: SharedRow): Line[] => {
      const found = first.find((one) => one.id === row.id)
      const real = 'mixed' in row ? found : row
      if (found === undefined || real?.declaration === undefined || !edited.has(real.declaration.type)) return []
      return [{ row: real, mixed: 'mixed' in row }]
    })
  })
  let more = $state(false)
  const shownLines = $derived(more ? lines : lines.slice(0, FEW))
  /** Only a character with values that start somewhere (a number, a switch, a choice, some words) has "starts like this". */
  const declared = $derived(
    lines.some((line) => ['number', 'switch', 'choice', 'words'].includes(line.row.declaration?.type ?? '')),
  )

  let said = $state.raw<string | undefined>()
  let timer: ReturnType<typeof setTimeout> | undefined
  function apply(done: Done): void {
    if (done.ok) {
      said = undefined
      hand.edit(done.value)
      return
    }
    const why = refusalWord(done.why)
    clearTimeout(timer)
    said = why === undefined ? undefined : text(wordsIn(lang).levels[why])
    timer = setTimeout(() => (said = undefined), 4000)
  }

  const set = (value: string, to: ThingValue | undefined): void =>
    apply(setValues(level, characters, ids as string[], value, to))
  const linkedOf = (value: string): readonly string[] => {
    const given = one?.values?.[value]
    return typeof given === 'string' ? [given] : Array.isArray(given) ? (given as string[]) : []
  }
  function open(value: string, to: string | undefined, on: boolean): void {
    if (one === undefined) return
    apply(to !== undefined && !on ? unlink(level, one.id, value, to) : opens(level, characters, one.id, value, to))
  }

  /** How the picked things are drawn: the one way they all are, or undefined where they differ. */
  const drawn = $derived.by((): Draw | undefined => {
    const all = new Set(things.map(drawOf))
    return all.size === 1 ? [...all][0] : undefined
  })
  const drawWords: Readonly<Record<Draw, { name: Row; about: Row }>> = $derived({
    behind: { name: words.thing.drawBehind, about: words.thing.drawBehindAbout },
    'with-hero': { name: words.thing.drawWith, about: words.thing.drawWithAbout },
    'in-front': { name: words.thing.drawFront, about: words.thing.drawFrontAbout },
  })

  const where = $derived(one === undefined ? undefined : whereIs(level, characters, one))
  let pad = $state<'x' | 'y' | undefined>()
  const put = (axis: 'x' | 'y', edge: number): void => {
    if (one !== undefined) apply(putAt(level, characters, one.id, axis, edge))
  }
</script>

<div
  class="settings"
  onpointerdowncapture={(e) => {
    if ((e.target as HTMLElement).closest('input[type="range"]') !== null) hand.grab()
  }}
  onpointerupcapture={() => hand.drop(false)}
  onpointercancelcapture={() => hand.drop(true)}
>
  {#if said !== undefined}<p class="said" role="status">{said}</p>{/if}

  <section data-group="does">
    <h3>{text(words.thing.groupDoes)}</h3>
    {#each shownLines as line (line.row.id)}
      {#if one !== undefined && line.row.declaration?.type === 'leads-to'}
        <LeadsTo
          {lang}
          label={line.row.declaration.name}
          value={line.row.value}
          ways={waysOut(levels, characters, levelId)}
          onset={(to) => set(line.row.id, to)}
          {ongo}
        />
      {:else}
        <ValueControl
          {lang}
          row={line.row}
          mixed={line.mixed}
          candidates={one !== undefined && line.row.declaration?.type === 'thing'
            ? [...new Set([...mayOpen(level, characters, one.id, line.row.id), ...linkedOf(line.row.id)])]
            : []}
          linked={linkedOf(line.row.id)}
          {says}
          most={line.row.declaration?.type === 'thing' ? (line.row.declaration.most ?? 1) : 1}
          onset={(to) => set(line.row.id, to)}
          onopen={(to, on) => open(line.row.id, to, on)}
        />
      {/if}
    {/each}
    {#if lines.length > FEW}
      <button type="button" class="more" aria-expanded={more} onclick={() => (more = !more)}>
        {more ? text(words.thing.fewerSettings) : text(words.thing.moreSettings, lines.length - FEW)}
      </button>
    {/if}
    {#if declared && kinds.size === 1}
      <p class="note">{text(words.thing.defaultsNote, nameOf([...kinds][0] as string))}</p>
    {/if}
  </section>

  {#if things.length > 0}
    <section data-group="look">
      <h3>{text(words.thing.groupLook)}</h3>
      {#if one !== undefined}
        <p class="line"><span>{text(words.thing.looksLike)}</span> <b>{nameOf(one.character)}</b></p>
      {/if}
      <!-- Its name over the choices, as sketched: three bare words would say nothing of what they choose. -->
      <span class="label">{text(words.thing.drawn)}</span>
      <div class="draw">
        <Segment
          label={text(words.thing.drawn)}
          options={DRAWS.map((id) => ({ id, words: text(drawWords[id].name) }))}
          value={drawn ?? ''}
          onchange={(id) => apply(setDraw(level, ids, id as Draw))}
        />
      </div>
      <p class="note about" data-draw-about>
        {drawn === undefined ? text(words.thing.notTheSame) : text(drawWords[drawn].about)}
      </p>
    </section>
  {/if}
  {#if one !== undefined && where !== undefined}
    <section data-group="where">
      <h3>{text(words.thing.groupWhere)}</h3>
      {#each [{ axis: 'x', label: words.thing.fromLeft, now: where.left, most: where.leftMost }, { axis: 'y', label: words.thing.fromTop, now: where.top, most: where.topMost }] as const as item (item.axis)}
        <Slider
          label="{text(item.label)} ({text(words.thing.inTiles)})"
          value={item.now}
          least={0}
          most={item.most}
          step={0.5}
          onchange={(edge) => put(item.axis, edge)}
          onnumber={() => (pad = pad === item.axis ? undefined : item.axis)}
        />
        {#if pad === item.axis}
          <NumberPad
            {lang}
            value={item.now}
            least={0}
            most={item.most}
            step={0.5}
            onchange={(edge) => put(item.axis, edge)}
            onclose={() => (pad = undefined)}
          />
        {/if}
      {/each}
    </section>
    <details class="file">
      <summary>{text(words.thing.fileText)}</summary>
      <pre>{JSON.stringify(one, null, 2)}</pre>
    </details>
  {/if}
</div>

<style>
  .settings {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  section {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  h3 {
    margin: 4px 0 0;
    font: 600 0.85em var(--label);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--quiet);
  }
  .line {
    display: flex;
    justify-content: space-between;
    margin: 0;
  }
  .line span,
  .note {
    color: var(--quiet);
  }
  /* Three choices side by side in a narrow panel: less side room in each, so a short word stays on one line. */
  .draw :global(button) {
    padding: 0 4px;
  }
  .note {
    margin: 0;
    font-size: 0.9em;
  }
  .label {
    margin-bottom: 0;
    color: var(--quiet);
    font-size: 0.9em;
  }
  /* Under its choices with a clear gap, so it reads as their helper and not as part of the row. */
  .about {
    margin-top: 4px;
    line-height: 1.2;
  }
  .said {
    margin: 0;
    padding: 6px 10px;
    border-radius: 8px;
    background: var(--raised);
  }
  .more,
  summary {
    min-height: 44px;
    border: 0;
    border-radius: 8px;
    background: var(--raised);
    color: var(--words);
    font: inherit;
    cursor: pointer;
  }
  summary {
    display: flex;
    align-items: center;
    padding: 0 12px;
  }
  pre {
    margin: 4px 0 0;
    max-height: 200px;
    overflow: auto;
    font: 0.8em var(--measure);
    white-space: pre-wrap;
  }
</style>
