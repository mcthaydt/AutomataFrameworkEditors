<script lang="ts">
  // One value of a thing and the control its kind has: a number is a slider with a pad on a tap, a switch a knob, a choice
  // a row of choices (or a list past four), some words the game's own words for a message and which message it is, and what a switch opens a list with "Nothing" first. A
  // value the character does not declare, and a path, are shown and never edited. Every number goes up held to its
  // declaration (`values.ts` holds it again), so the editor cannot make a file the game refuses.
  import type { ThingValue } from '@automataframework/framework/headless'
  import { Knob, NumberPad, Segment, Slider } from '../ui/ui.ts'
  import { type Lang, nameOf, type Row, wordsIn } from '../words/words.ts'
  import type { ValueRow } from './values.ts'

  interface Props {
    lang: Lang
    row: ValueRow
    /** Several picked things hold different ones. */
    mixed?: boolean
    /** What this value may open, and what it opens now (for a value that links things). */
    candidates?: readonly string[]
    linked?: readonly string[]
    /** How many it may open at most. */
    most?: number
    /** The game's words for a message, in its own language, when it has them. */
    says: (message: string) => string | undefined
    onset: (to: ThingValue | undefined) => void
    /** Open this thing (or none): the list of what a switch opens. */
    onopen: (id: string | undefined, on: boolean) => void
  }
  let { lang, row, mixed = false, candidates = [], linked = [], most = 1, says, onset, onopen }: Props = $props()

  const words = $derived(wordsIn(lang))
  const text = (one: Row, ...parts: (string | number)[]): string =>
    typeof one === 'function' ? one(...parts) : one
  const declaration = $derived(row.declaration)
  let pad = $state(false)

  const shown = (value: ThingValue | undefined): string =>
    value === undefined ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value)
</script>

<div class="value" data-value={row.id}>
  {#if declaration === undefined || declaration.type === 'path' || declaration.type === 'leads-to'}
    <span class="name">{declaration?.name ?? nameOf(row.id)}</span>
    <code class="read">{shown(row.value)}</code>
    <p class="about">{text(words.thing.shownOnly)}</p>
  {:else if declaration.type === 'number'}
    <Slider
      label={declaration.name}
      value={typeof row.value === 'number' ? row.value : declaration.default}
      least={declaration.least}
      most={declaration.most}
      step={declaration.step ?? 1}
      mixed={mixed ? text(words.thing.notTheSame) : undefined}
      onchange={onset}
      onnumber={() => (pad = !pad)}
    />
    {#if pad}
      <NumberPad
        {lang}
        value={typeof row.value === 'number' ? row.value : declaration.default}
        least={declaration.least}
        most={declaration.most}
        step={declaration.step ?? 1}
        onchange={onset}
        onclose={() => (pad = false)}
      />
    {/if}
  {:else if declaration.type === 'switch'}
    <div class="line">
      <span class="name">{declaration.name}</span>
      {#if mixed}<span class="mixed">{text(words.thing.notTheSame)}</span>{/if}
      <Knob on={row.value === true} label={declaration.name} onchange={onset} />
    </div>
  {:else if declaration.type === 'choice'}
    <span class="name">{declaration.name}{#if mixed} · {text(words.thing.notTheSame)}{/if}</span>
    {#if declaration.from.length <= 4}
      <Segment
        label={declaration.name}
        options={declaration.from.map((one) => ({ id: one.id, words: one.name }))}
        value={mixed ? '' : String(row.value)}
        onchange={onset}
      />
    {:else}
      <select aria-label={declaration.name} value={mixed ? '' : String(row.value)} onchange={(e) => onset(e.currentTarget.value)}>
        {#if mixed}<option value="" disabled>{text(words.thing.notTheSame)}</option>{/if}
        {#each declaration.from as one (one.id)}
          <option value={one.id}>{one.name}</option>
        {/each}
      </select>
    {/if}
  {:else if declaration.type === 'words'}
    <span class="name">{declaration.name}</span>
    {#if mixed}
      <span class="said">{text(words.thing.notTheSame)}</span>
    {:else if row.value === undefined || row.value === ''}
      <span class="said">{text(words.thing.opensNothing)}</span>
    {:else}
      <q class="said">{says(String(row.value)) ?? String(row.value)}</q>
      <small class="which">{text(words.thing.messageNamed, String(row.value))}</small>
    {/if}
  {:else}
    <span class="name">{declaration.name}</span>
    <div class="opens" role="group" aria-label={declaration.name}>
      <button type="button" aria-pressed={linked.length === 0} onclick={() => onopen(undefined, false)}>
        {text(words.thing.opensNothing)}
      </button>
      {#each candidates as id (id)}
        <button type="button" aria-pressed={linked.includes(id)} onclick={() => onopen(id, !linked.includes(id))}>
          {nameOf(id)}
        </button>
      {/each}
    </div>
    {#if most > 1}<span class="about">{linked.length} / {most}</span>{/if}
  {/if}
  {#if declaration?.about !== undefined && declaration.type !== 'path'}
    <p class="about">{declaration.about}</p>
  {/if}
</div>

<style>
  .value {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 4px 0;
  }
  .line {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .line .name {
    flex: 1;
  }
  .name,
  .about,
  .mixed {
    color: var(--quiet);
  }
  .about {
    margin: 0;
    font-size: 0.9em;
  }
  .said {
    margin: 0;
    overflow-wrap: anywhere;
  }
  .which {
    color: var(--quiet);
    overflow-wrap: anywhere;
  }
  .read {
    font-family: var(--measure);
    overflow-wrap: anywhere;
  }
  select {
    min-height: 44px;
    padding: 0 10px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--raised);
    color: var(--words);
    font: inherit;
  }
  .opens {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .opens button {
    min-height: 44px;
    padding: 0 12px;
    border: 0;
    border-radius: 8px;
    background: var(--raised);
    color: var(--quiet);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .opens button[aria-pressed='true'] {
    background: var(--picked);
    color: var(--bright);
  }
</style>
