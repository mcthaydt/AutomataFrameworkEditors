<script lang="ts">
  // A stand-in for the World screen: it holds the level, its history and what is picked, as World does, so the level on
  // screen can be tested alone in a real browser.
  import type { GameContent, Level } from '@automataframework/framework/headless'
  import { untrack } from 'svelte'
  import type { Pointers } from '#src/features/device/device.ts'
  import { type Clip, type Edge, LevelPart } from '#src/features/levels/levels.ts'
  import { SHOW, type Show } from '#src/features/levels/show.ts'
  import type { Tool } from '#src/features/shell/shell.ts'
  import type { OpenPicture } from '#src/features/wire/wire.ts'

  interface Props {
    content: GameContent
    pictures: readonly OpenPicture[]
    start: Level
    tool?: Tool
    onmap?: (() => void) | undefined
    edges?: readonly Edge[]
    ongo?: ((level: string) => void) | undefined
    /** A Pencil has been seen, so a finger slides the view. */
    pen?: boolean
    fingerDraws?: boolean
    edgesFor?: ((next: Level) => readonly Edge[]) | undefined
  }
  let {
    content, pictures, start, tool = 'pick', onmap, edges = [], ongo, pen = false, fingerDraws = false, edgesFor,
  }: Props = $props()

  let level = $state.raw<Level>(untrack(() => start))
  let past = $state.raw<readonly Level[]>([])
  let picked = $state.raw<readonly string[]>([])
  let locked = $state.raw<ReadonlySet<string>>(new Set())
  let hidden = $state.raw<ReadonlySet<string>>(new Set())
  let placing = $state.raw<string | undefined>()
  let clip = $state.raw<Clip | undefined>()
  let grabbing = false
  let pointers = $state.raw<Pointers>({ last: 'touch', penSeen: untrack(() => pen), hovering: false })
  let show = $state.raw<Show>(SHOW)
  let letter = $state<string | undefined>()
  let held = $state.raw<ReadonlySet<string>>(new Set())
  let onTool = $state<Tool>(untrack(() => tool))

  export const now = (): Level => level
  export const pastNow = (): number => past.length
  export const letterNow = (): string | undefined => letter
  export const setShow = (next: Partial<Show>): void => void (show = { ...show, ...next })
  export const setLetter = (next: string | undefined): void => void (letter = next)
  export const setHeld = (ids: readonly string[]): void => void (held = new Set(ids))
  export const setTool = (next: Tool): void => void (onTool = next)
  export const setPointers = (next: Pointers): void => void (pointers = next)
  export const pickedNow = (): readonly string[] => picked
  export function undo(): void {
    const back = past.at(-1)
    if (back === undefined) return
    past = past.slice(0, -1)
    level = back
  }
</script>

<LevelPart
  {content}
  {pictures}
  {level}
  levelId={level.id}
  lang="en"
  tool={onTool}
  {picked}
  {locked}
  {hidden}
  {placing}
  {clip}
  {pointers}
  {fingerDraws}
  {show}
  brush={{ letter, held }}
  onbrush={(next) => (letter = next)}
  {edgesFor}
  onpick={(ids) => (picked = ids)}
  onplacing={(id) => (placing = id)}
  ongrab={() => {
    grabbing = true
    past = [...past, level]
  }}
  onedit={(next) => {
    if (!grabbing) past = [...past, level]
    level = next
  }}
  ondrop={(gaveUp) => {
    grabbing = false
    if (gaveUp) undo()
  }}
  onlock={(id, on) => {
    const next = new Set(locked)
    if (on) next.add(id)
    else next.delete(id)
    locked = next
  }}
  onhide={(id, on) => {
    const next = new Set(hidden)
    if (on) next.add(id)
    else next.delete(id)
    hidden = next
  }}
  onclip={(next) => (clip = next)}
  onundo={undo}
  {onmap}
  {edges}
  {ongo}
/>
