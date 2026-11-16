<script lang="ts">
  // The game's menu: the game's name and who you are in it, then what belongs to the whole game.
  import { Menu, type MenuItem } from '../ui/ui.ts'

  interface Props {
    name: string
    /** Who the person is and what they may do, as one line ("Sam · you can change everything"). */
    who: string
    items: readonly MenuItem[]
    onpick: (id: string) => void
    onclose: () => void
  }
  let { name, who, items, onpick, onclose }: Props = $props()
</script>

<Menu {items} {onpick} {onclose}>
  {#snippet head()}
    <b class="name">{name}</b>
    <small class="who">{who}</small>
  {/snippet}
</Menu>

<style>
  .name {
    display: block;
  }
  .who {
    color: var(--quiet);
  }
</style>
