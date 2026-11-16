<script lang="ts">
  // Where a door leads: the level, where you come out (that level's start, or beside one of its doors) and the way to go
  // and look. It holds nothing: every change goes up as the whole new place, or none to take the way away.
  import type { ThingValue } from '@automataframework/framework/headless'
  import { Segment } from '../ui/ui.ts'
  import { type Lang, nameOf, type Row, wordsIn } from '../words/words.ts'

  interface Place {
    readonly level: string
    readonly thing?: string | undefined
  }
  interface Props {
    lang: Lang
    label: string
    value: ThingValue | undefined
    /** Every level but this one, and the doors in each. */
    ways: readonly { readonly level: string; readonly things: readonly string[] }[]
    onset: (to: Place | undefined) => void
    ongo: (level: string) => void
  }
  let { lang, label, value, ways, onset, ongo }: Props = $props()

  const words = $derived(wordsIn(lang))
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row
  const place = $derived(
    typeof value === 'object' && value !== null && !Array.isArray(value) && typeof (value as Place).level === 'string'
      ? (value as Place)
      : undefined,
  )
  const doors = $derived(ways.find((way) => way.level === place?.level)?.things ?? [])
  const out = $derived(place?.thing === undefined ? 'start' : 'door')
</script>

<div class="leads" data-value="leads-to">
  <label class="field">
    <span>{text(words.thing.leadsLevel)}</span>
    <select
      aria-label={label}
      value={place?.level ?? ''}
      onchange={(e) => {
        const level = e.currentTarget.value
        onset(level === '' ? undefined : { level })
      }}
    >
      <option value="">{text(words.thing.opensNothing)}</option>
      {#each ways as way (way.level)}
        <option value={way.level}>{nameOf(way.level)}</option>
      {/each}
    </select>
  </label>
  {#if place !== undefined}
    {#if doors.length > 0}
      <span class="head">{text(words.thing.leadsOut)}</span>
      <Segment
        label={text(words.thing.leadsOut)}
        options={[
          { id: 'start', words: text(words.thing.leadsStart) },
          { id: 'door', words: text(words.thing.leadsDoor) },
        ]}
        value={out}
        onchange={(id) => onset(id === 'start' ? { level: place.level } : { level: place.level, thing: doors[0] as string })}
      />
    {/if}
    {#if out === 'door'}
      <label class="field">
        <span>{text(words.thing.leadsWhich)}</span>
        <select
          value={place.thing ?? ''}
          onchange={(e) => onset({ level: place.level, thing: e.currentTarget.value })}
        >
          {#each doors as door (door)}
            <option value={door}>{nameOf(door)}</option>
          {/each}
        </select>
      </label>
    {/if}
    <button type="button" class="go" onclick={() => ongo(place.level)}>
      {text(words.thing.goTo, nameOf(place.level))}
    </button>
  {/if}
</div>

<style>
  .leads {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 2px;
    color: var(--quiet);
  }
  select,
  .go {
    min-height: 44px;
    padding: 0 10px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--raised);
    color: var(--words);
    font: inherit;
  }
  .go {
    cursor: pointer;
  }
  .head {
    color: var(--quiet);
  }
</style>
