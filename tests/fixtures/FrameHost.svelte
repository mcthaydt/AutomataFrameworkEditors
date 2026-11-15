<script lang="ts">
  import Cluster from '#src/features/suite/Cluster.svelte'
  import Frame from '#src/features/suite/Frame.svelte'
  import { WORDS } from '#src/features/words/words.svelte.ts'

  // The frame with a plain cluster and an empty page in it: the pill, the menu and the Coming soon card, as the level
  // screen puts them, without a game behind. `told` hears what was pressed.
  interface Props {
    told: (what: string) => void
  }
  let { told }: Props = $props()
</script>

<Frame
  game="Crate Game"
  level="Level 1"
  onhome={() => told('home')}
  menu={() => [{ id: 'game', label: WORDS.openGamePage, icon: 'open', onpress: () => told('home') }]}
>
  {#snippet cluster(shape)}
    <Cluster
      {shape}
      visitor={true}
      login={undefined}
      saveDisabled={false}
      saveKind="primary"
      onsave={() => told('save')}
      onexport={() => told('export')}
      onsignin={() => told('sign-in')}
      onsignout={() => told('sign-out')}
    />
  {/snippet}
  {#snippet children(shape)}
    <div data-page data-shape-of-page={shape}></div>
  {/snippet}
</Frame>
