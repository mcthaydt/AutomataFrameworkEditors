<script lang="ts">
  // A stand-in for the World screen: it holds the game's changes with one history, and what is picked, as World does,
  // so the map on screen can be tested alone in a real browser.
  import type { GameContent } from '@automataframework/framework/headless'
  import { untrack } from 'svelte'
  import { change, type Edits, undo as stepBack } from '#src/features/game/game.ts'
  import MapPart from '#src/features/map/MapPart.svelte'

  interface Props {
    content: GameContent
    start: Edits
    went?: (level: string) => void
  }
  let { content, start, went }: Props = $props()

  let edits = $state.raw<Edits>(untrack(() => start))
  let picked = $state.raw<string | undefined>()

  export const now = (): Edits['now'] => edits.now
  export const steps = (): number => edits.past.length
  export const pickedNow = (): string | undefined => picked
  export const undo = (): void => void (edits = stepBack(edits))
</script>

<MapPart
  {content}
  pictures={[]}
  working={edits.now}
  lang="en"
  {picked}
  onpick={(level) => (picked = level)}
  ongo={(level) => went?.(level)}
  onchange={(next) => (edits = change(edits, next))}
  onundo={undo}
/>
