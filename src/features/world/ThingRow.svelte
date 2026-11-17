<script lang="ts">
  import { nameOf } from '../words/words.ts'

  // One row of the list of what is in the level: what it is, and which character it is.
  interface Props {
    thing: { readonly id: string; readonly character: string }
    picked: boolean
    /** Said under the name instead of the character, when there is something to say ("Locked until you close the game"). */
    note?: string | undefined
    /** What it is called when that is not the id's name ('Ground'). */
    label?: string | undefined
    onpick: () => void
  }
  let { thing, picked, note, label, onpick }: Props = $props()
</script>

<button type="button" class="thing-row" data-row={thing.id} aria-pressed={picked} onclick={onpick}>
  <span class="what">{label ?? nameOf(thing.id)}</span>
  <small>{note ?? nameOf(thing.character)}</small>
</button>

<style>
  .thing-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    height: 100%;
    padding: 0 12px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--words);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .thing-row:hover {
    background: var(--hover);
  }
  .thing-row[aria-pressed='true'] {
    background: var(--picked);
    color: var(--bright);
  }
  small {
    color: var(--quiet);
  }
</style>
