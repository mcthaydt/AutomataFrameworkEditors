<script lang="ts">
  // One icon, from `icons.ts`. It is a drawing, never the only way to tell what a button does (every button carries a
  // name for a screen reader), so it is hidden from one. It takes the colour and the size of the text around it.
  import { ICONS, type IconName } from './icons.ts'

  interface Props {
    name: IconName
    /** In points; the text's own height by default. */
    size?: number
  }
  let { name, size }: Props = $props()
</script>

<svg
  class="icon"
  viewBox="0 0 256 256"
  fill="currentColor"
  aria-hidden="true"
  focusable="false"
  width={size ?? '1.25em'}
  height={size ?? '1.25em'}
>
  {@html ICONS[name]}
</svg>

<style>
  .icon {
    flex: none;
    display: inline-block;
    vertical-align: middle;
  }
</style>
