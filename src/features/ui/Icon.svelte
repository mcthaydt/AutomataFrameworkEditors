<script lang="ts">
  import { ICONS, type IconName } from './icons.ts'

  // One icon, drawn as decoration: it has its words beside it or under it, and a screen reader hears those. The SVG
  // text comes only from `ICONS`, constants in this repo, never from anything a person typed.
  interface Props {
    name: IconName
  }
  let { name }: Props = $props()
</script>

<span class="icon" aria-hidden="true">{@html ICONS[name]}</span>

<style>
  .icon {
    display: inline-flex;
    flex: none;
    width: 1.25em;
    height: 1.25em;
  }
  .icon :global(svg) {
    width: 100%;
    height: 100%;
  }
</style>
