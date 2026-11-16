<script lang="ts">
  // Where to go next: the parts of this editor, every level, and on an upright phone the other editors and the game's
  // menu too, since the bar has no room for their buttons.
  import { Menu, type MenuItem } from '../ui/ui.ts'

  interface Props {
    items: readonly MenuItem[]
    onpick: (id: string) => void
    onclose: () => void
  }
  let { items, onpick, onclose }: Props = $props()
</script>

<Menu {items} {onpick} {onclose} />
