<script lang="ts">
  // The sheets that open over the level, from the address: who can change it, what changed, what waits, and one waiting
  // change. None of them takes the screen: the top bar stays, and the level is under them.
  import type { Api } from '../api/api.ts'
  import type { OpenGame } from '../game/game.ts'
  import { Check, type Sheet, Waiting } from '../team/team.ts'
  import type { Lang } from '../words/words.ts'
  import Team from './Team.svelte'

  interface Props {
    sheet: Sheet
    api: Api
    game: OpenGame
    lang: Lang
    onsignedout: () => void
    /** Back to the level. */
    onclose: () => void
    /** Back to the list of what waits, or to the level when only one change waits. */
    onwaiting: () => void
    onshow: (opening: { level: string } | { map: true }) => void
    /** Ask someone, by name; undefined when the person is not signed in. */
    onask: ((who: string) => void) | undefined
  }
  let { sheet, api, game, lang, onsignedout, onclose, onwaiting, onshow, onask }: Props = $props()
</script>

{#if sheet.kind === 'waiting'}
  <Waiting {api} game={game.ref} {lang} {onsignedout} onback={onclose} />
{:else if sheet.kind === 'change'}
  {#key sheet.number}
    <Check {api} game={game.ref} number={sheet.number} {lang} {onsignedout} onback={onwaiting} onhome={onclose} />
  {/key}
{:else}
  <Team {sheet} {lang} {api} {game} {onsignedout} {onclose} {onshow} {onask} />
{/if}
