<script lang="ts">
  // The pages that still take the whole screen: what waits, and one waiting change.
  import type { Api } from '../api/api.ts'
  import type { OpenGame } from '../game/game.ts'
  import { Check, type Sheet, Waiting } from '../team/team.ts'
  import type { Lang } from '../words/words.ts'

  interface Props {
    sheet: Extract<Sheet, { kind: 'waiting' | 'change' }>
    api: Api
    game: OpenGame['ref']
    lang: Lang
    size: string
    onsignedout: () => void
    /** Back to the level. */
    onclose: () => void
    /** Back to the list of what waits. */
    onwaiting: () => void
  }
  let { sheet, api, game, lang, size, onsignedout, onclose, onwaiting }: Props = $props()
</script>

<div class="sheet">
  {#if sheet.kind === 'waiting'}
    <Waiting {api} {game} {onsignedout} onback={onclose} />
  {:else}
    {#key sheet.number}
      <Check {api} {game} number={sheet.number} {lang} {size} {onsignedout} onback={onwaiting} onhome={onclose} />
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
