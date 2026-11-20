<script lang="ts">
  // What the person who made the changes is told when they come back: someone asked for a change (in their words), or
  // someone did not put them in. Their changes are put back on the screen when this device still has them. "Got it" puts the note away; for
  // a turned-down change it also lets the game forget it, so it is not told again.
  import type { Api } from '../api/api.ts'
  import type { OpenGame } from '../game/game.ts'
  import { Note } from '../ui/ui.ts'
  import { type Lang, type Row, wordsIn } from '../words/words.ts'

  interface Props {
    lang: Lang
    game: OpenGame
    api: Api
    /** Their changes are back on the screen (kept on this device); false when this device does not have them. */
    back: boolean
    onsignedout: () => void
  }
  let { lang, game, api, back, onsignedout }: Props = $props()

  const c = $derived(wordsIn(lang).check)
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row
  let gone = $state(false)
  const asked = $derived(game.mine?.asked)
  const down = $derived(game.turnedDown)

  async function clear(): Promise<void> {
    gone = true
    if (down === undefined) return
    const result = await api.clearTurnedDown(game.ref)
    if (!result.ok && result.problem === 'signed-out') onsignedout()
  }
</script>

{#if !gone && (asked !== undefined || down !== undefined)}
    {#if asked !== undefined}
      <Note
        words={`${text(c.askedTitle, asked.by)}: “${asked.words}” ${text(c.askedAbout)}`}
        button={text(c.gotIt)}
        onpress={() => void clear()}
      />
    {:else if down !== undefined}
      <Note
        words={`${text(c.downByTitle, down.by)}. ${text(back ? c.downByBack : c.downByAbout)}`}
        button={text(c.gotIt)}
        onpress={() => void clear()}
      />
    {/if}
{/if}


