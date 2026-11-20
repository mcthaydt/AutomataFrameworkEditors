<script lang="ts">
  // The tour's card: it points at the one part of the screen the step is about (a ring, with the rest dimmed), asks the
  // person to do the thing, says so when they have, and always has a way out. It never stops a press: what it asks for
  // is done on the real screen, under it.
  import { onMount, untrack } from 'svelte'
  import { Action } from '../ui/ui.ts'
  import { type Lang, type Row, wordsIn } from '../words/words.ts'
  import type { Step, TourState } from './tour.ts'

  interface Props {
    lang: Lang
    now: TourState
    /** The steps this tour has, in order: "2 of 3" counts these. */
    steps: readonly Step[]
    /** What step 3 asks for, and the name of what it is done to ("How heavy", "Crate 1"). */
    three: { readonly asks: 'value' | 'arrows'; readonly name: string }
    /** What the step is about, as a selector for the page; undefined (or not on the page) shows no ring. */
    target: string | undefined
    onnext: () => void
    onskip: () => void
    onend: () => void
  }
  let { lang, now, steps, three, target, onnext, onskip, onend }: Props = $props()

  const words = $derived(wordsIn(lang))
  const text = (row: Row, ...parts: (string | number)[]): string =>
    typeof row === 'function' ? row(...parts) : row

  const step = $derived(now.step === 'done' || now.step === 'skipped' ? undefined : now.step)
  const at = $derived(step === undefined ? 0 : steps.indexOf(step) + 1)
  const card = $derived.by(() => {
    const w = words.first
    switch (step) {
      case 'tap-the-crate':
        return { title: w.tourPickTitle, body: w.tourPickBody, ask: w.tourPickDo }
      case 'tap-place':
        return { title: w.tourToolsTitle, body: w.tourToolsBody, ask: w.tourToolsDo }
      case 'drag-a-value':
        return {
          title: w.tourValueTitle,
          body: w.tourValueBody,
          ask: three.asks === 'value' ? w.tourValueDo : w.tourArrowsDo,
        }
      case 'play-then-put':
        return { title: w.tourPutTitle, body: w.tourPutBody, ask: w.tourPutDo }
      default:
        return { title: w.tourEndTitle, body: w.tourEndBody, ask: '' }
    }
  })
  const label = $derived(
    step === undefined ? text(words.first.tourEndTitle) : text(words.first.tourStepOf, at, steps.length),
  )

  // Where the ring goes: measured now and then, since a panel can open or the window turn while the card is up.
  let ring = $state<{ left: number; top: number; width: number; height: number } | undefined>(undefined)
  function measure(): void {
    const found = target === undefined ? null : document.querySelector(target)
    if (found === null) {
      if (ring !== undefined) ring = undefined
      return
    }
    const box = found.getBoundingClientRect()
    const next = { left: box.left - 4, top: box.top - 4, width: box.width + 8, height: box.height + 8 }
    if (
      ring === undefined ||
      ring.left !== next.left ||
      ring.top !== next.top ||
      ring.width !== next.width ||
      ring.height !== next.height
    ) {
      ring = next
    }
  }
  // The card sits clear of what the step is about: at the top when that is in the lower half, so it never covers it.
  const high = $derived(ring !== undefined && ring.top + ring.height / 2 > window.innerHeight / 2)
  $effect(() => {
    void target
    void now
    untrack(measure)
  })
  onMount(() => {
    const timer = setInterval(measure, 250)
    window.addEventListener('resize', measure)
    return () => {
      clearInterval(timer)
      window.removeEventListener('resize', measure)
    }
  })
</script>

{#if step !== undefined && ring !== undefined}
  <div
    class="ring dim-2-around"
    aria-hidden="true"
    style:left="{ring.left}px"
    style:top="{ring.top}px"
    style:width="{ring.width}px"
    style:height="{ring.height}px"
  ></div>
{:else}
  <div class="dim dim-2" aria-hidden="true"></div>
{/if}
<div class="coach glass-2" class:high role="dialog" aria-label={label}>
  <span class="n">{label}</span>
  <h3>{text(card.title)}</h3>
  <p>{text(card.body)}</p>
  {#if step === undefined}
    <div class="go"><Action kind="main" label={text(words.first.tourEnd)} onpress={onend} /></div>
  {:else}
    <p class="do" role="status">
      {now.did ? text(words.first.tourDid) : text(card.ask, three.name)}
    </p>
    <div class="go">
      <Action kind="plain" label={text(words.first.tourSkip)} onpress={onskip} />
      {#if now.did}<Action kind="main" label={text(words.first.tourNext)} onpress={onnext} />{/if}
    </div>
  {/if}
</div>

<style>
  .dim {
    position: fixed;
    inset: 0;
    z-index: 20;
    pointer-events: none;
  }
  /* A hole in the dimming: the shadow is what dims everything round the one part the step is about. */
  .ring {
    position: fixed;
    z-index: 20;
    border: 2px solid var(--accent);
    border-radius: 12px;
    pointer-events: none;
  }
  .coach {
    position: absolute;
    z-index: 25;
    left: 50%;
    bottom: calc(var(--tools-room, 0px) + 76px);
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: min(340px, calc(100% - 16px));
    padding: 16px;
    border-radius: 14px;
    color: var(--words);
    transform: translateX(-50%);
  }
  .coach.high {
    top: calc(var(--bar) + 12px);
    bottom: auto;
  }
  .n {
    color: var(--g-quiet);
    font-size: 13px;
  }
  h3 {
    margin: 0;
    font: 600 18px / 1.2 var(--title);
  }
  p {
    margin: 0;
  }
  .do {
    color: var(--accent);
    font-weight: 600;
  }
  .go {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 4px;
  }
  /* A phone on its side has no room under the level: the card sits to one side and says only what to do. */
  :global(.look[data-size='phone-sideways']) .coach {
    top: auto;
    right: 8px;
    bottom: 8px;
    left: auto;
    width: 280px;
    transform: none;
  }
  :global(.look[data-size='phone-sideways']) .coach p:not(.do) {
    display: none;
  }
</style>
