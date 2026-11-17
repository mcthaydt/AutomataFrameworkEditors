<script lang="ts">
  // The pages that still take the whole screen: what waits, and one waiting change.
  import type { Api } from '../api/api.ts'
  import type { OpenGame } from '../game/game.ts'
  import { type Sheet, Waiting, WaitingChange } from '../team/team.ts'

  interface Props {
    sheet: Extract<Sheet, { kind: 'waiting' | 'change' }>
    api: Api
    game: OpenGame['ref']
    onsignedout: () => void
    /** Back to the level. */
    onclose: () => void
    /** Back to the list of what waits. */
    onwaiting: () => void
  }
  let { sheet, api, game, onsignedout, onclose, onwaiting }: Props = $props()
</script>

<div class="sheet">
  {#if sheet.kind === 'waiting'}
    <Waiting {api} {game} {onsignedout} onback={onclose} />
  {:else}
    {#key sheet.number}
      <WaitingChange {api} {game} number={sheet.number} {onsignedout} onback={onwaiting} onhome={onclose} />
    {/key}
  {/if}
</div>

<style>
  .sheet {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    overflow: auto;
  }
</style>
