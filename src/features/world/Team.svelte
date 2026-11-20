<script lang="ts">
  // The team's sheets, over the level: who can change the game, and what changed in it. They open from the address, so
  // a link keeps working, and close back to the level.
  import type { Api } from '../api/api.ts'
  import type { OpenGame } from '../game/game.ts'
  import { History, People, type Sheet } from '../team/team.ts'
  import type { Lang } from '../words/words.ts'

  interface Props {
    sheet: Extract<Sheet, { kind: 'people' | 'history' }>
    lang: Lang
    api: Api
    game: OpenGame
    onsignedout: () => void
    onclose: () => void
    /** "Show me" in what changed: the level or the map a change touched. */
    onshow: (opening: { level: string } | { map: true }) => void
    /** "Ask the owner" in who can change it: opens a note to them. */
    onask?: ((owner: string) => void) | undefined
  }
  let { sheet, lang, api, game, onsignedout, onclose, onshow, onask }: Props = $props()
</script>

{#if sheet.kind === 'people'}
  <People {lang} {api} {game} {onsignedout} {onclose} {onask} />
{:else}
  <History {lang} {api} {game} {onsignedout} {onclose} {onshow} />
{/if}
