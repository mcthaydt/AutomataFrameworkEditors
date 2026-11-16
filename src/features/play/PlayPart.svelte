<script lang="ts">
  // The level playing where it is drawn: the framework's game fills this box, and the play bar floats over it. It plays
  // what `edits` hold when it opens and changes nothing: no file, no history, nothing on the device. When the level
  // cannot be built it says nothing itself; it tells its screen what is wrong (`onproblem`) and the screen puts it in
  // words.
  import { onMount, untrack } from 'svelte'
  import type { Frames } from '@automataframework/framework'
  import type { Edits, OpenGame } from '../game/game.ts'
  import { type Lang, type Row, wordsIn } from '../words/words.ts'
  import { CannotPlay, play, type Playing } from './run.ts'
  import PlayBar from './PlayBar.svelte'

  interface Props {
    game: OpenGame
    edits: Edits
    level: string
    lang: Lang
    /** The panels are put away. */
    big: boolean
    onbig: () => void
    /** The level could not be played: what is wrong, one sentence a line (none: the reason is not known). */
    onproblem: (lines: readonly string[]) => void
    /** Only for tests: the frames the game is given. */
    frames?: Frames
  }
  let { game, edits, level, lang, big, onbig, onproblem, frames }: Props = $props()

  const text = (row: Row): string => (typeof row === 'string' ? row : row())
  let holder: HTMLDivElement | undefined = $state()
  let playing = $state.raw<Playing | undefined>()
  let paused = $state(false)

  /** The tick the game is at; 0 before it has started. */
  export const tick = (): number => playing?.tick() ?? 0

  onMount(() => {
    let gone = false
    const mount = holder
    if (mount === undefined) return
    play(
      untrack(() => ({ mount, game, edits, level, lang, ...(frames === undefined ? {} : { frames }) })),
    ).then(
      (started) => {
        if (gone) return started.stop()
        playing = started
      },
      (error: unknown) => {
        if (!gone) onproblem(error instanceof CannotPlay ? error.lines : [])
      },
    )
    return () => {
      gone = true
      playing?.stop()
    }
  })

  function pause(): void {
    if (playing === undefined) return
    if (playing.paused()) playing.resume()
    else playing.pause()
    paused = playing.paused()
  }
  async function again(): Promise<void> {
    try {
      await playing?.again()
      paused = playing?.paused() ?? false
    } catch (error) {
      onproblem(error instanceof CannotPlay ? error.lines : [])
    }
  }
</script>

<div class="play" role="group" aria-label={text(wordsIn(lang).play.game)} data-play="box">
  <div class="game" bind:this={holder}></div>
  {#if playing !== undefined}
    <div class="bar">
      <PlayBar {lang} {paused} {big} onpause={pause} onagain={() => void again()} onbig={onbig} />
    </div>
  {/if}
</div>

<style>
  .play {
    position: absolute;
    inset: 0 8px 8px;
    z-index: 5;
    /* The level under it is hidden and cannot be touched; the game is neither. */
    visibility: visible;
    pointer-events: auto;
    overflow: hidden;
    border-radius: var(--radius);
    background: var(--ground);
  }
  .game {
    position: absolute;
    inset: 0;
  }
  .bar {
    position: absolute;
    top: 8px;
    left: 8px;
    z-index: 30;
  }
</style>
