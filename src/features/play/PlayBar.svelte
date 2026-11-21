<script lang="ts">
  // What a person can do while the level plays: hold it still (and go on), take one step, slow it down, start it again,
  // start it from a spot, go back through the last seconds, and make the game bigger by putting the panels away. Stop is
  // in the top bar and on Escape. A control that has nothing to do is not drawn: one step only while it is held still, and
  // the strip only once there is something kept to go back to.
  import { Icon, Slider, stack } from '../ui/ui.ts'
  import { type Lang, type Row, wordsIn } from '../words/words.ts'
  import { clock } from './spot.ts'

  interface Props {
    lang: Lang
    paused: boolean
    /** The panels are put away. */
    big: boolean
    /** How fast time passes: 1, 0.5 or 0.25. */
    speed: number
    /** The ticks that can be gone back to, where the game is, and how many make a second. */
    strip: { readonly from: number; readonly to: number; readonly at: number; readonly hz: number }
    /** Waiting for a tap on the level, to start from there. */
    picking: boolean
    /** The box is too short for the strip to stay open: it waits behind its own button. */
    short: boolean
    /** Starting from a spot is on offer (a level with a camera does not show its whole self, so a tap has no place). */
    canPick: boolean
    onpause: () => void
    onstep: () => void
    onspeed: () => void
    onagain: () => void
    onpick: () => void
    onback: (tick: number) => void
    onbig: () => void
  }
  let { lang, paused, big, speed, strip, picking, short, canPick, onpause, onstep, onspeed, onagain, onpick, onback, onbig }: Props = $props()

  let rewinding = $state(false)
  const words = $derived(wordsIn(lang).play)
  const text = (row: Row): string => (typeof row === 'string' ? row : row())
  const speedWord = $derived(text(speed === 1 ? words.speedNormal : speed === 0.5 ? words.speedSlow : words.speedSlower))
</script>

<!-- In a short box the strip, once unfolded, takes the buttons' row: the buttons fold away so the game stays in sight. -->
<div class="bar glass-1" class:folded={short && rewinding} role="toolbar" aria-label={text(words.playBar)} use:stack>
  <div class="row">
    <button type="button" class="act" data-play="pause" aria-label={text(paused ? words.goOn : words.pause)} title={text(paused ? words.goOn : words.pause)} onclick={onpause}>
      <Icon name={paused ? 'play' : 'pause'} size={22} />
    </button>
    {#if paused}
      <button
        type="button"
        class="act"
        data-play="step"
        aria-label={text(words.step)}
        title={text(words.stepAbout)}
        onclick={onstep}
      >
        <Icon name="skip-forward" size={22} />
      </button>
    {/if}
    <button
      type="button"
      class="act"
      data-play="speed"
      aria-label="{text(words.speedAbout)}: {speedWord}"
      title={text(words.speedAbout)}
      onclick={onspeed}
    >
      <Icon name="gauge" size={22} /><span class="word" class:state={speed !== 1}>{speedWord}</span>
    </button>
    <button type="button" class="act" data-play="again" aria-label={text(words.again)} title={text(words.again)} onclick={onagain}>
      <Icon name="skip-back" size={22} />
    </button>
    {#if canPick}
      <button
        type="button"
        class="act"
        class:on={picking}
        data-play="pick"
        aria-pressed={picking ? true : undefined}
        aria-label={text(words.here)}
        title={text(words.hereAbout)}
        onclick={onpick}
      >
        <Icon name="map-pin" size={22} /><span class="word">{text(words.here)}</span>
      </button>
    {/if}
    {#if short && strip.to > strip.from}
      <button
        type="button"
        class="act"
        class:on={rewinding}
        data-play="rewind"
        aria-pressed={rewinding}
        aria-label={text(words.back)}
        title={text(words.back)}
        onclick={() => (rewinding = !rewinding)}
      >
        <Icon name="clock-counter-clockwise" size={22} />
      </button>
    {/if}
    <button
      type="button"
      class="act"
      data-play="big"
      aria-label={text(big ? words.smaller : words.bigger)}
      title={text(big ? words.smallerAbout : words.biggerAbout)}
      onclick={onbig}
    >
      <Icon name={big ? 'arrows-in' : 'arrows-out'} size={22} />
    </button>
  </div>
  {#if strip.to > strip.from && (!short || rewinding)}
    <!-- The game cannot go on past where it was put back, so a drag that went on is put back to where the game is. -->
    <div class="strip" data-play="strip" oninput={(e) => ((e.target as HTMLInputElement).value = String(strip.at))}>
      <Slider
        value={strip.at}
        least={strip.from}
        most={strip.to}
        step={1}
        label={text(words.back)}
        format={(tick) => clock(tick, strip.hz)}
        onchange={onback}
      />
    </div>
  {/if}
</div>

<style>
  .bar {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: min(560px, calc(100vw - 32px));
    padding: 4px;
    border-radius: 14px;
    color: var(--words);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .act {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 48px;
    min-height: 48px;
    padding: 0 12px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: 14px;
    cursor: pointer;
  }
  .act:hover {
    background: var(--hover);
  }
  .act.on {
    background: var(--raised);
  }
  /* On a phone the six buttons share one line: each keeps its icon and its spoken name, and only a speed that is not the
     normal one keeps its word, so what is slowed is never a guess. */
  @media (max-width: 640px) {
    .word:not(.state) {
      display: none;
    }
    .act {
      padding: 0 10px;
    }
  }
  .strip {
    padding: 0 12px 4px;
  }
  .folded {
    flex-direction: row;
    align-items: center;
  }
  .folded .act:not([data-play='rewind']) {
    display: none;
  }
  .folded .strip {
    flex: 1;
    min-width: 200px;
    padding: 0 8px;
  }
  /* Folded, the row keeps the slider and the time: the rewind button beside it says what it is (design round 2, N2). */
  .folded .strip :global(.name) {
    display: none;
  }
  .folded .strip :global(.line) {
    justify-content: flex-end;
  }
</style>
