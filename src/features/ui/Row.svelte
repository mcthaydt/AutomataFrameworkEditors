<script lang="ts">
  import Icon from './Icon.svelte'
  import type { IconName } from './icons.ts'

  // A row that goes somewhere: raised, with a words-coloured line round it, the name in the touch colour (it can be
  // touched), a quieter second line if there is one, and a caret at the far end that says "open". An icon before the
  // name is for the rows that are not a thing but a job (Share, the waiting changes). It is a link, so a keyboard, a
  // screen reader and "open in a new tab" all work.
  interface Props {
    href: string
    name: string
    /** The second, quieter line. */
    detail?: string | undefined
    icon?: IconName | undefined
  }
  let { href, name, detail = undefined, icon = undefined }: Props = $props()
</script>

<a class="row" {href}>
  {#if icon !== undefined}<Icon name={icon} />{/if}
  <span class="text">
    <span class="name">{name}</span>
    {#if detail !== undefined}<span class="detail">{detail}</span>{/if}
  </span>
  <Icon name="open" />
</a>

<style>
  .row {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    min-height: 56px;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--words);
    border-radius: var(--corner);
    background: var(--raised);
    color: var(--touch);
    text-decoration: none;
  }
  .text {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .name {
    font-weight: 600;
  }
  .detail {
    color: var(--quiet);
  }
</style>
