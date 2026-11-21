<script lang="ts">
  // The parts that float over the level: the bar beside what is picked, the pad of arrows, the tray of things to put
  // down, and the note that says what just happened. They are placed beside what is picked and never on it; what a press
  // does is decided by `LevelPart`, which gives each one's call in.
  import type { GameContent } from '@automataframework/framework/headless'
  import { Note } from '../ui/ui.ts'
  import type { Lang } from '../words/words.ts'
  import ActBar from './ActBar.svelte'
  import GroundTray from './GroundTray.svelte'
  import type { Kind } from './ground.ts'
  import { barPlace, padPlace } from './float.ts'
  import type { Rect } from './marks.ts'
  import MovePad from './MovePad.svelte'
  import type { Way } from './nudge.ts'
  import Tray from './Tray.svelte'

  interface Props {
    lang: Lang
    characters: GameContent['characters']
    counts: Readonly<Record<string, number>>
    /** The free part of the stage, beside any panel over it, and where it begins (px from the stage's left). */
    size: { w: number; h: number }
    from?: number
    tool: string
    readOnly: boolean
    paused: boolean
    /** What is picked, as one box on the stage. */
    pickedBox: Rect | undefined
    picked: readonly string[]
    placing: string | undefined
    pad: boolean
    note: { words: string; button?: string; press?: () => void } | undefined
    /** What the ground can be, and the letter of the one being painted. */
    kinds: readonly Kind[]
    letter: string
    onkind: (letter: string) => void
    onpad: () => void
    oncopy: () => void
    ondelete: () => void
    onmore: () => void
    onnudge: (way: Way) => void
    onchoose: (id: string | undefined) => void
    onnote: () => void
  }
  let {
    lang, characters, counts, size, from = 0, tool, readOnly, paused, pickedBox, picked, placing, pad, note,
    onpad, oncopy, ondelete, onmore, onnudge, onchoose, onnote, kinds, letter, onkind,
  }: Props = $props()

  let barWidth = $state(0)
  const local = $derived(pickedBox === undefined ? undefined : { ...pickedBox, x: pickedBox.x - from })
  const barAt = $derived(local === undefined ? undefined : barPlace(local, size, barWidth))
  const padAt = $derived(padPlace(local, size))
</script>

{#if !readOnly && !paused && pickedBox !== undefined && barAt !== undefined && tool === 'pick'}
  <div class="float" data-ui bind:clientWidth={barWidth} style:left="{barAt.x + from}px" style:top="{barAt.y}px">
    <ActBar {lang} moving={pad} onmove={onpad} {oncopy} {ondelete} {onmore} />
  </div>
{/if}
{#if pad && !readOnly && !paused && picked.length > 0}
  <div class="float" data-ui style:left="{padAt.x + from}px" style:top="{padAt.y}px">
    <MovePad {lang} {onnudge} ondone={onpad} />
  </div>
{/if}
{#if tool === 'place' && !readOnly}
  <div class="strip glass-1" data-ui>
    <Tray {lang} {characters} {counts} chosen={placing} {onchoose} />
  </div>
{/if}
{#if tool === 'paint' && !readOnly}
  <div class="strip glass-1" data-ui>
    <GroundTray {lang} {kinds} {letter} onchoose={onkind} />
  </div>
{/if}
{#if note !== undefined && !paused}
  <div class="notes" data-ui>
    <Note floats words={note.words} {...(note.button === undefined ? {} : { button: note.button })} onpress={onnote} />
  </div>
{/if}

<style>
  .float {
    position: absolute;
    z-index: 30;
    width: max-content; /* not dependent on where it sits */
  }
  .strip {
    position: absolute;
    left: calc(8px + var(--aside-left, 0px));
    right: calc(8px + var(--aside-right, 0px));
    bottom: 8px;
    z-index: 25;
    border-radius: 14px;
  }
  .notes {
    position: absolute;
    top: 8px;
    left: 50%;
    z-index: 35;
    transform: translateX(-50%);
    max-width: calc(100% - 16px);
  }
</style>
