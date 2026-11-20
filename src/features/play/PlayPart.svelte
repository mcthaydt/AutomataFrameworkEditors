<script lang="ts">
  // The level playing where it is drawn: the framework's game fills this box, and the play bar floats over it. It plays
  // what `edits` hold when it opens and changes nothing: no file, no history, nothing on the device. When the level
  // cannot be built it says nothing itself; it tells its screen what is wrong (`onproblem`) and the screen puts it in
  // words.
  import { onMount, untrack } from 'svelte'
  import type { Frames } from '@automataframework/framework'
  import { type Arrive, levelsOf, type Way } from '@automataframework/framework/headless'
  import type { Edits, OpenGame } from '../game/game.ts'
  import { Icon } from '../ui/ui.ts'
  import { type Lang, type Row, wordsIn } from '../words/words.ts'
  import { CannotPlay, play, type Playing } from './run.ts'
  import PlayBar from './PlayBar.svelte'
  import { spotOf } from './spot.ts'

  interface Props {
    game: OpenGame
    edits: Edits
    level: string
    lang: Lang
    /** The panels are put away. */
    big: boolean
    onbig: () => void
    /** The screen has something to say first: the game waits and goes on when it is said. */
    waiting: boolean
    /** The game is running. */
    onstarted: () => void
    /** The level could not be played: what is wrong, one sentence a line (none: the reason is not known). */
    onproblem: (lines: readonly string[]) => void
    /** How fast time passes when the play starts, and told when the person changes it: the room a door leads to is a new mount. */
    speed?: number
    onspeed?: (speed: number) => void
    /** Where the hero comes in at first: beside the door it came through. Left out: its own start. */
    arrive?: Arrive | undefined
    /** A hero went through a door: the level it leads to and the door to come out of. The screen opens it and plays on. */
    ondoor?: (way: Way) => void
    /** Only for tests: the frames the game is given. */
    frames?: Frames
  }
  let { game, edits, level, lang, big, onbig, waiting, onstarted, onproblem, arrive, ondoor, frames, speed: first = 1, onspeed }: Props = $props()

  const text = (row: Row): string => (typeof row === 'string' ? row : row())
  let holder: HTMLDivElement | undefined = $state()
  let playing = $state.raw<Playing | undefined>()
  let paused = $state(false)
  let speed = $state(untrack(() => first))
  let picking = $state(false)
  /** What can be gone back to and where the game is, read often: the game moves under the person's hand. */
  let strip = $state({ from: 0, to: 0, at: 0, hz: 60 })

  /** The tick the game is at; 0 before it has started. */
  export const tick = (): number => playing?.tick() ?? 0

  onMount(() => {
    let gone = false
    const mount = holder
    if (mount === undefined) return
    play(
      untrack(() => ({
        mount,
        game,
        edits,
        level,
        lang,
        ...(arrive === undefined ? {} : { arrive }),
        ...(ondoor === undefined ? {} : { ondoor }),
        ...(frames === undefined ? {} : { frames }),
      })),
    ).then(
      (started) => {
        if (gone) return started.stop()
        playing = started
        if (speed !== 1) started.setSpeed(speed)
        sync()
        onstarted()
      },
      (error: unknown) => {
        if (!gone) onproblem(error instanceof CannotPlay ? error.lines : [])
      },
    )
    let looking = 0
    const watch = (): void => {
      sync()
      looking = requestAnimationFrame(watch)
    }
    looking = requestAnimationFrame(watch)
    return () => {
      gone = true
      cancelAnimationFrame(looking)
      playing?.stop()
    }
  })

  /** Reads what the strip and the buttons say from the game. */
  function sync(): void {
    if (playing === undefined) return
    const kept = playing.kept()
    const at = playing.tick()
    if (strip.from !== kept.from || strip.to !== kept.to || strip.at !== at || strip.hz !== playing.hz)
      strip = { from: kept.from, to: kept.to, at, hz: playing.hz }
    if (paused !== playing.paused()) paused = playing.paused()
  }

  // Waits for the screen to be heard, then goes on, unless the person paused it themselves meanwhile. It holds still only
  // once the first picture is drawn, so what waits is a level, never an empty box.
  let held = false
  function drawn(cancelled: () => boolean): Promise<boolean> {
    return new Promise((done) => {
      const look = (): void => {
        if (cancelled()) return done(false)
        if (holder?.querySelector('canvas')?.style.visibility === 'hidden') return void requestAnimationFrame(look)
        done(true)
      }
      look()
    })
  }
  $effect(() => {
    const now = playing
    if (now === undefined) return
    if (waiting) {
      let cancelled = false
      void drawn(() => cancelled).then((ready) => {
        if (!ready || now.paused()) return
        now.pause()
        held = true
        paused = true
      })
      return () => {
        cancelled = true
      }
    }
    if (held) {
      held = false
      if (now.paused()) now.resume()
      paused = now.paused()
    }
  })

  function pause(): void {
    if (playing === undefined) return
    // The person has taken it over: what the screen was waiting for no longer decides.
    held = false
    if (playing.paused()) {
      scrub = undefined
      playing.resume()
    }
    else playing.pause()
    paused = playing.paused()
  }
  /** The game was running when "Play from here" began waiting for its tap, so it was held still, and goes on when that ends. */
  let heldForPick = false
  function pickSpot(): void {
    picking = !picking
    if (playing === undefined) return
    if (picking) {
      if (playing.paused()) return
      playing.pause()
      heldForPick = true
      paused = true
    } else endPick()
  }
  function endPick(): void {
    picking = false
    if (!heldForPick) return
    heldForPick = false
    if (playing?.paused() === true) playing.resume()
    paused = playing?.paused() ?? false
  }
  async function restart(how: () => Promise<void> | undefined): Promise<void> {
    endPick()
    scrub = undefined
    try {
      await how()
      paused = playing?.paused() ?? false
      sync()
    } catch (error) {
      onproblem(error instanceof CannotPlay ? error.lines : [])
    }
  }
  const again = (): Promise<void> => restart(() => playing?.again())
  /** The one step is only for a game held still. */
  function step(): void {
    playing?.step()
    sync()
  }
  const speeds = [1, 0.5, 0.25]
  function slower(): void {
    if (playing === undefined) return
    speed = speeds[(speeds.indexOf(speed) + 1) % speeds.length] ?? 1
    playing.setSpeed(speed)
    onspeed?.(speed)
  }
  /**
   * The range the strip showed when the person began to drag back. Going back cuts what lies after the tick (the game
   * can only go on from there), so the kept range shrinks under the finger; the strip keeps the range it began with
   * until the game goes on, so a drag half way, then another, lands where the finger is.
   */
  let scrub = $state<{ readonly from: number; readonly to: number } | undefined>()
  const shown = $derived(scrub === undefined ? strip : { ...strip, from: scrub.from, to: scrub.to })
  /** Dragging the strip holds the game and shows it as it was; no further than where it is now, since the rest is cut. */
  function back(tick: number): void {
    if (playing === undefined) return
    held = false
    if (!playing.paused()) playing.pause()
    const kept = playing.kept()
    scrub ??= { from: kept.from, to: kept.to }
    playing.backTo(Math.min(Math.max(tick, kept.from), kept.to))
    sync()
  }
  /** A tap while the strip waits for one: the hero starts there. */
  function tapped(event: PointerEvent): void {
    const target = holder
    if (playing === undefined || target === undefined) return
    const box = target.getBoundingClientRect()
    const spot = spotOf(
      { w: box.width, h: box.height },
      levelsOf(game.content, level).map((one) =>
        one.level === level ? { ...one, ...sizeOf(one.level) } : one,
      ),
      level,
      { x: event.clientX - box.left, y: event.clientY - box.top },
    )
    if (spot === undefined) return
    const now = playing
    void restart(() => now.from(spot))
  }
  /** The size of a level of the edited game, in tiles. */
  function sizeOf(id: string): { w: number; h: number } {
    const tiles = edits.now.levels[id]?.tiles ?? []
    return { w: tiles[0]?.length ?? 0, h: tiles.length }
  }
  // A level with a camera shows only part of itself, so a tap on it has no place.
  const canPick = $derived(edits.now.levels[level]?.view === undefined)

  /** A box too short to hold the bar with its strip and the level: the strip waits behind its own button. */
  let boxHeight = $state(0)
  const short = $derived(boxHeight > 0 && boxHeight < 320)
</script>

<div class="play" role="group" aria-label={text(wordsIn(lang).play.game)} data-play="box" bind:clientHeight={boxHeight}>
  <div class="game" bind:this={holder}></div>
  {#if playing !== undefined}
    <div class="bar">
      <PlayBar
        {lang}
        {paused}
        {big}
        {speed}
        strip={shown}
        {picking}
        {short}
        {canPick}
        onpause={pause}
        onstep={step}
        onspeed={slower}
        onagain={() => void again()}
        onpick={pickSpot}
        onback={back}
        {onbig}
      />
      {#if playing.doorsShut}
        <div class="note glass-2" role="status">
          <Icon name="door" size={22} /><span>{text(wordsIn(lang).play.noDoors)}</span>
        </div>
      {/if}
    </div>
    {#if picking}
      <div class="pick glass-2" role="status" data-play="pick-strip">
        <Icon name="map-pin" size={22} /><span>{text(wordsIn(lang).play.hereAbout)}</span>
        <button type="button" data-play="pick-cancel" onclick={endPick}>
          {text(wordsIn(lang).play.cancel)}
        </button>
      </div>
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="tap" data-play="tap" onpointerdown={tapped}></div>
    {/if}
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
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: flex-start;
  }
  .note,
  .pick {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 12px;
    color: var(--words);
  }
  .pick {
    position: absolute;
    z-index: 31;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    padding: 4px 4px 4px 16px;
    max-width: calc(100% - 16px);
  }
  .pick button {
    min-width: 44px;
    min-height: 44px;
    padding: 0 14px;
    border: 0;
    border-radius: 8px;
    background: var(--raised);
    color: var(--words);
    font: inherit;
    cursor: pointer;
  }
  /* The game under it takes no touch while it waits for the tap that says where to start. */
  .tap {
    position: absolute;
    inset: 0;
    z-index: 29;
    cursor: crosshair;
    touch-action: none;
  }
</style>
