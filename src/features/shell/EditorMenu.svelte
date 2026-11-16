<script lang="ts">
  // The six editors, each with what it is for. The one the person is in is ticked.
  import { Menu, type MenuItem } from '../ui/ui.ts'

  interface Props {
    items: readonly MenuItem[]
    onpick: (id: string) => void
    onclose: () => void
  }
  let { items, onpick, onclose }: Props = $props()
</script>

<Menu {items} {onpick} {onclose} />
