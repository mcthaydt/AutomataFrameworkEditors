<script lang="ts">
  // Who is in the game: an initial on a colour made from each login, at most four and then "+2". One button the size of
  // a finger opens "Who can change it". Nobody in the game (or a visitor alone in the demo) draws nothing.
  import Face from './Face.svelte'

  interface Props {
    people: readonly { readonly login: string }[]
    /** What a screen reader calls it. */
    label: string
    onopen: () => void
  }
  let { people, label, onopen }: Props = $props()

  const MOST = 4
  const shown = $derived(people.slice(0, MOST))
  const extra = $derived(people.length - shown.length)
</script>

{#if people.length > 0}
  <button type="button" class="faces" aria-label={label} onclick={onopen}>
    {#each shown as person (person.login)}
      <span class="one"><Face login={person.login} /></span>
    {/each}
    {#if extra > 0}<span class="face rest" aria-hidden="true">+{extra}</span>{/if}
  </button>
{/if}

<style>
  .faces {
    display: inline-flex;
    align-items: center;
    min-width: 44px;
    min-height: 44px;
    padding: 0 6px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
  .one {
    display: inline-flex;
    margin-left: -6px;
  }
  .one:first-child {
    margin-left: 0;
  }
  .face {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    margin-left: -6px;
    border: 2px solid var(--panel);
    border-radius: 50%;
    font-size: 13px;
    font-weight: 600;
  }
  .face:first-child {
    margin-left: 0;
  }
  .rest {
    background: var(--raised);
    color: var(--words);
  }
</style>
