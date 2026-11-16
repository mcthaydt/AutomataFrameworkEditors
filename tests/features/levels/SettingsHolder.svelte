<script lang="ts">
  // A stand-in for the settings panel: it holds the level and its history as World does, so a picked thing's settings can
  // be tested alone in a real browser.
  import type { GameContent, Level } from '@automataframework/framework/headless'
  import { untrack } from 'svelte'
  import { ThingSettings } from '#src/features/levels/levels.ts'

  interface Props {
    content: GameContent
    start: Level
    ids: readonly string[]
    levelId?: string
    ongo?: (level: string) => void
  }
  let { content, start, ids, levelId = start.id, ongo = () => {} }: Props = $props()

  let level = $state.raw<Level>(untrack(() => start))
  let past = $state.raw<readonly Level[]>([])
  let grabbing = false

  export const now = (): Level => level
  export const steps = (): number => past.length
  export function undo(): void {
    const back = past.at(-1)
    if (back === undefined) return
    past = past.slice(0, -1)
    level = back
  }
</script>

<ThingSettings
  lang="en"
  {level}
  {levelId}
  characters={content.characters}
  {ids}
  levels={content.levels}
  {ongo}
  hand={{
    grab: () => {
      grabbing = true
      past = [...past, level]
    },
    edit: (next) => {
      if (!grabbing) past = [...past, level]
      level = next
    },
    drop: (gaveUp) => {
      grabbing = false
      if (gaveUp) undo()
    },
  }}
/>
